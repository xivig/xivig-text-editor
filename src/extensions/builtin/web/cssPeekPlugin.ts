import { CssPeekResult, CssPeekSettings } from './types';

export const DEFAULT_CSS_PEEK_SETTINGS: CssPeekSettings = {
  enabled: true,
  enableHoverPeek: true,
  maxMatchCount: 10,
};

export interface CssDocumentReference {
  path: string;
  content: string;
}

/**
 * Searches CSS document contents to find rule definitions for a specific class or ID selector.
 */
export function findCssSelectorDefinitions(
  selectorName: string,
  type: 'class' | 'id',
  cssDocuments: CssDocumentReference[]
): CssPeekResult[] {
  if (!selectorName.trim() || cssDocuments.length === 0) {
    return [];
  }

  const results: CssPeekResult[] = [];
  const cleanName = selectorName.replace(/^[.#]/, '');
  const prefix = type === 'class' ? '\\.' : '#';

  // Match: .selectorName or #selectorName not immediately followed by other word characters
  const selectorPattern = new RegExp(`${prefix}${cleanName}(?=[^a-zA-Z0-9_-]|$)`);

  for (const doc of cssDocuments) {
    if (!doc.content) continue;

    const lines = doc.content.split('\n');

    // Rule regex matching selector and rule body
    const ruleRegex = /([^{}]+)\{([^}]*)\}/g;
    let match: RegExpExecArray | null;

    while ((match = ruleRegex.exec(doc.content)) !== null) {
      const rawSelectors = match[1];
      const body = match[2];

      if (selectorPattern.test(rawSelectors)) {
        const matchIndex = match.index;

        // Calculate line and column
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

        const formattedBlock = `${rawSelectors.trim()} {\n  ${body
          .trim()
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)
          .join(';\n  ')};\n}`;

        results.push({
          selector: rawSelectors.trim(),
          type,
          file: doc.path,
          line,
          column: col,
          cssBlock: formattedBlock,
        });

        if (results.length >= DEFAULT_CSS_PEEK_SETTINGS.maxMatchCount) {
          return results;
        }
      }
    }
  }

  return results;
}

/**
 * Formats a peek result into a clean markdown or code display string.
 */
export function formatCssPeekPreview(result: CssPeekResult): string {
  const filename = result.file.split(/[/\\]/).pop() || result.file;
  return `### ${result.selector}\n*${filename}:${result.line}:${result.column}*\n\`\`\`css\n${result.cssBlock}\n\`\`\``;
}
