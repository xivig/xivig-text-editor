import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { ScrapedCssSelector, HtmlCssSupportSettings } from './types';
import { calculateCssSpecificity } from './cssClassIntellisensePlugin';

export const DEFAULT_HTML_CSS_SUPPORT_SETTINGS: HtmlCssSupportSettings = {
  enabled: true,
  scanCssFiles: true,
  scanHtmlFiles: true,
  maxSuggestions: 50,
  includeIdSelectors: true,
  fileExtensions: ['.css', '.scss', '.less', '.html', '.htm', '.jsx', '.tsx', '.vue', '.blade.php'],
};

/**
 * In-memory index of scraped CSS classes and IDs across workspace files.
 */
export class CssSelectorCatalog {
  private classes = new Map<string, ScrapedCssSelector>();
  private ids = new Map<string, ScrapedCssSelector>();

  public clear(): void {
    this.classes.clear();
    this.ids.clear();
  }

  public addClass(selector: ScrapedCssSelector): void {
    const existing = this.classes.get(selector.name);
    if (!existing || (!existing.ruleBody && selector.ruleBody)) {
      this.classes.set(selector.name, selector);
    }
  }

  public addId(selector: ScrapedCssSelector): void {
    const existing = this.ids.get(selector.name);
    if (!existing || (!existing.ruleBody && selector.ruleBody)) {
      this.ids.set(selector.name, selector);
    }
  }

  public getClasses(prefix = ''): ScrapedCssSelector[] {
    const norm = prefix.toLowerCase();
    const results: ScrapedCssSelector[] = [];
    for (const [name, item] of this.classes) {
      if (!norm || name.toLowerCase().includes(norm)) {
        results.push(item);
      }
    }
    return results;
  }

  public getIds(prefix = ''): ScrapedCssSelector[] {
    const norm = prefix.toLowerCase();
    const results: ScrapedCssSelector[] = [];
    for (const [name, item] of this.ids) {
      if (!norm || name.toLowerCase().includes(norm)) {
        results.push(item);
      }
    }
    return results;
  }

  public getAllClassNames(): string[] {
    return Array.from(this.classes.keys());
  }

  public getAllIdNames(): string[] {
    return Array.from(this.ids.keys());
  }

  public get size(): { classes: number; ids: number } {
    return {
      classes: this.classes.size,
      ids: this.ids.size,
    };
  }

  /**
   * Scrapes classes and IDs from CSS/SCSS text.
   */
  public indexCssDocument(content: string, filePath = 'style.css'): void {
    if (!content) return;

    // Remove comments
    const stripped = content.replace(/\/\*[\s\S]*?\*\//g, '');
    const lines = content.split('\n');

    // Match rules: selector { body }
    const ruleRegex = /([^{}]+)\{([^}]*)\}/g;
    let match: RegExpExecArray | null;

    while ((match = ruleRegex.exec(stripped)) !== null) {
      const rawSelectors = match[1].trim();
      const ruleBody = match[2].trim();
      const matchIndex = match.index;

      // Calculate 1-based line number
      let accumulated = 0;
      let line = 1;
      let col = 1;
      for (let i = 0; i < lines.length; i++) {
        const lineLen = lines[i].length + 1;
        if (accumulated + lineLen > matchIndex) {
          line = i + 1;
          col = matchIndex - accumulated + 1;
          break;
        }
        accumulated += lineLen;
      }

      // Split comma-separated selectors: e.g. "div.btn, .btn-primary, #nav"
      const subSelectors = rawSelectors.split(',');
      for (const sub of subSelectors) {
        const cleanSub = sub.trim();
        if (!cleanSub) continue;

        const spec = calculateCssSpecificity(cleanSub);

        // Find classes: .className
        const classMatches = cleanSub.match(/\.([a-zA-Z0-9_-]+)/g);
        if (classMatches) {
          for (const cm of classMatches) {
            const className = cm.slice(1);
            this.addClass({
              name: className,
              rawSelector: cleanSub,
              type: 'class',
              file: filePath,
              line,
              column: col,
              ruleBody: ruleBody ? `{ ${ruleBody} }` : undefined,
              specificity: spec,
            });
          }
        }

        // Find IDs: #idName
        const idMatches = cleanSub.match(/#([a-zA-Z0-9_-]+)/g);
        if (idMatches) {
          for (const im of idMatches) {
            const idName = im.slice(1);
            this.addId({
              name: idName,
              rawSelector: cleanSub,
              type: 'id',
              file: filePath,
              line,
              column: col,
              ruleBody: ruleBody ? `{ ${ruleBody} }` : undefined,
              specificity: spec,
            });
          }
        }
      }
    }
  }

  /**
   * Scrapes classes and IDs from HTML/JSX text.
   */
  public indexHtmlDocument(content: string, filePath = 'index.html'): void {
    if (!content) return;

    // 1. Scrape class="..." and className="..."
    const classAttrRegex = /(?:class|className)\s*=\s*["']([^"']+)["']/g;
    let match: RegExpExecArray | null;

    while ((match = classAttrRegex.exec(content)) !== null) {
      const tokens = match[1].split(/\s+/).filter(Boolean);
      for (const t of tokens) {
        if (/^[a-zA-Z0-9_-]+$/.test(t)) {
          this.addClass({
            name: t,
            rawSelector: `.${t}`,
            type: 'class',
            file: filePath,
          });
        }
      }
    }

    // 2. Scrape id="..."
    const idAttrRegex = /id\s*=\s*["']([^"']+)["']/g;
    while ((match = idAttrRegex.exec(content)) !== null) {
      const idVal = match[1].trim();
      if (/^[a-zA-Z0-9_-]+$/.test(idVal)) {
        this.addId({
          name: idVal,
          rawSelector: `#${idVal}`,
          type: 'id',
          file: filePath,
        });
      }
    }
  }
}

/**
 * Shared singleton catalog
 */
export const sharedCssCatalog = new CssSelectorCatalog();

/**
 * CodeMirror 6 autocompletion source for HTML class and ID attributes.
 */
export function createHtmlCssCompletionSource(catalog: CssSelectorCatalog = sharedCssCatalog) {
  return (context: CompletionContext): CompletionResult | null => {
    const line = context.state.doc.lineAt(context.pos);
    const textBefore = line.text.slice(0, context.pos - line.from);

    // Detect if inside class="..." or className="..."
    const classMatch = textBefore.match(/(?:class|className)\s*=\s*["']([^"']*)$/);
    if (classMatch) {
      const fullValue = classMatch[1];
      const currentTokenMatch = fullValue.match(/([a-zA-Z0-9_-]*)$/);
      const token = currentTokenMatch ? currentTokenMatch[1] : '';
      const from = context.pos - token.length;

      const candidates = catalog.getClasses(token);
      if (candidates.length === 0) return null;

      return {
        from,
        options: candidates.slice(0, 50).map((c) => ({
          label: c.name,
          type: 'class',
          detail: c.file ? `(CSS: ${c.file.split(/[/\\]/).pop()})` : 'class',
          info: c.ruleBody ? `${c.rawSelector} ${c.ruleBody}` : `Class: .${c.name}`,
          boost: 1,
        })),
      };
    }

    // Detect if inside id="..."
    const idMatch = textBefore.match(/id\s*=\s*["']([^"']*)$/);
    if (idMatch) {
      const fullValue = idMatch[1];
      const currentTokenMatch = fullValue.match(/([a-zA-Z0-9_-]*)$/);
      const token = currentTokenMatch ? currentTokenMatch[1] : '';
      const from = context.pos - token.length;

      const candidates = catalog.getIds(token);
      if (candidates.length === 0) return null;

      return {
        from,
        options: candidates.slice(0, 30).map((i) => ({
          label: i.name,
          type: 'constant',
          detail: i.file ? `(ID: ${i.file.split(/[/\\]/).pop()})` : 'id',
          info: i.ruleBody ? `${i.rawSelector} ${i.ruleBody}` : `ID: #${i.name}`,
          boost: 2,
        })),
      };
    }

    return null;
  };
}
