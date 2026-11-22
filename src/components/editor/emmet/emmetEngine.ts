import { EditorView } from '@codemirror/view';
import { CompletionContext, CompletionResult, snippet } from '@codemirror/autocomplete';
import { expandHtmlAbbreviation } from './emmetHtml';
import { expandCssAbbreviation } from './emmetCss';

export type EmmetSyntax = 'html' | 'css' | 'jsx';

/**
 * Detect Emmet syntax mode from document name or language string.
 */
export function detectEmmetSyntax(docNameOrLang?: string | null): EmmetSyntax {
  if (!docNameOrLang) return 'html';
  const lower = docNameOrLang.toLowerCase();

  if (
    lower.endsWith('.css') ||
    lower.endsWith('.scss') ||
    lower.endsWith('.sass') ||
    lower.endsWith('.less') ||
    lower === 'css' ||
    lower === 'scss' ||
    lower === 'sass' ||
    lower === 'less'
  ) {
    return 'css';
  }

  if (
    lower.endsWith('.jsx') ||
    lower.endsWith('.tsx') ||
    lower === 'jsx' ||
    lower === 'tsx'
  ) {
    return 'jsx';
  }

  // Default to HTML for html, vue, svelte, php, xml, and general text
  return 'html';
}

/**
 * Scan backwards from cursor on current line to find an Emmet abbreviation candidate.
 */
export function getAbbreviationAtCursor(
  lineText: string,
  col: number
): { abbr: string; fromCol: number; toCol: number } | null {
  if (col <= 0 || col > lineText.length) return null;

  let i = col - 1;
  let inCurlyBraces = 0;
  let inSquareBrackets = 0;
  let inQuotes = false;
  let quoteChar = '';

  // Scan backwards
  while (i >= 0) {
    const ch = lineText[i];

    if (inQuotes) {
      if (ch === quoteChar) {
        inQuotes = false;
      }
      i--;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inQuotes = true;
      quoteChar = ch;
      i--;
      continue;
    }

    if (ch === '}') {
      inCurlyBraces++;
      i--;
      continue;
    }
    if (ch === '{') {
      if (inCurlyBraces > 0) inCurlyBraces--;
      i--;
      continue;
    }

    if (ch === ']') {
      inSquareBrackets++;
      i--;
      continue;
    }
    if (ch === '[') {
      if (inSquareBrackets > 0) inSquareBrackets--;
      i--;
      continue;
    }

    // If inside text or attributes, spaces are allowed
    if (inCurlyBraces > 0 || inSquareBrackets > 0) {
      i--;
      continue;
    }

    // Delimiters that terminate an abbreviation
    if (/\s/.test(ch) || ch === '<' || ch === ';' || ch === '`') {
      break;
    }

    // Allowed Emmet characters
    if (/[a-zA-Z0-9_#.:>+^*()$-=!"'/]/.test(ch)) {
      i--;
    } else {
      break;
    }
  }

  const fromCol = i + 1;
  const toCol = col;
  const abbr = lineText.slice(fromCol, toCol).trim();

  if (!abbr || abbr.length < 1) return null;

  return { abbr, fromCol, toCol };
}

/**
 * Expands an Emmet abbreviation into snippet-formatted code.
 */
export function expandEmmet(
  abbr: string,
  syntax: EmmetSyntax,
  indentSpaces = 2
): string | null {
  if (!abbr) return null;

  if (syntax === 'css') {
    return expandCssAbbreviation(abbr);
  }

  // HTML or JSX
  const htmlRes = expandHtmlAbbreviation(abbr, indentSpaces, syntax === 'jsx');
  if (htmlRes) return htmlRes;

  // Fallback to CSS check if in HTML (e.g. inside style attributes)
  return expandCssAbbreviation(abbr);
}

/**
 * CodeMirror command to expand Emmet abbreviation at cursor.
 * Returns true if an abbreviation was expanded, false otherwise.
 */
export function expandEmmetCommand(view: EditorView, syntax: EmmetSyntax = 'html'): boolean {
  const state = view.state;
  const sel = state.selection.main;
  if (!sel.empty) return false;

  const line = state.doc.lineAt(sel.head);
  const colInLine = sel.head - line.from;
  const found = getAbbreviationAtCursor(line.text, colInLine);

  if (!found) return false;

  const expanded = expandEmmet(found.abbr, syntax);
  if (!expanded) return false;

  const from = line.from + found.fromCol;
  const to = line.from + found.toCol;

  // Apply snippet expansion via CodeMirror native snippet engine
  try {
    snippet(expanded)(view, null, from, to);
    return true;
  } catch (err) {
    // Fallback to simple replace
    view.dispatch({
      changes: { from, to, insert: expanded.replace(/\$\{[0-9]+(:[^}]*)?\}/g, '') },
    });
    return true;
  }
}

/**
 * Autocompletion source that offers live Emmet suggestions as the user types.
 */
export function createEmmetCompletionSource(getSyntax: () => EmmetSyntax) {
  return (context: CompletionContext): CompletionResult | null => {
    const line = context.state.doc.lineAt(context.pos);
    const colInLine = context.pos - line.from;
    const found = getAbbreviationAtCursor(line.text, colInLine);

    if (!found || found.abbr.length < 1) return null;

    // Avoid triggering on simple numbers or single random chars
    if (/^[0-9]+$/.test(found.abbr)) return null;

    const syntax = getSyntax();
    const expanded = expandEmmet(found.abbr, syntax);
    if (!expanded) return null;

    const cleanPreview = expanded.replace(/\$\{[0-9]+(:([^}]*))?\}/g, '$2');

    return {
      from: line.from + found.fromCol,
      to: line.from + found.toCol,
      options: [
        {
          label: found.abbr,
          type: 'snippet',
          detail: '⚡ Emmet Abbreviation',
          info: () => {
            const dom = document.createElement('pre');
            dom.style.fontSize = '11.5px';
            dom.style.margin = '0';
            dom.style.padding = '8px';
            dom.style.fontFamily = 'var(--xivig-font-mono)';
            dom.style.color = 'var(--xivig-text)';
            dom.style.backgroundColor = 'var(--xivig-surface)';
            dom.style.borderRadius = '4px';
            dom.style.maxHeight = '200px';
            dom.style.overflow = 'auto';
            dom.textContent = cleanPreview;
            return dom;
          },
          apply: (view, completion, from, to) => {
            snippet(expanded)(view, completion, from, to);
          },
          boost: 99,
        },
      ],
    };
  };
}

/**
 * Wraps selected lines with an Emmet abbreviation.
 */
export function wrapSelectionWithEmmet(
  view: EditorView,
  abbr: string,
  syntax: EmmetSyntax = 'html'
): boolean {
  const state = view.state;
  const sel = state.selection.main;
  if (sel.empty) return false;

  const selectedText = state.sliceDoc(sel.from, sel.to);
  const expanded = expandEmmet(abbr, syntax);
  if (!expanded) return false;

  // Insert the selected text into the deepest placeholder or between tags
  let wrapped: string;
  if (expanded.includes('${1}')) {
    wrapped = expanded.replace('${1}', selectedText);
  } else {
    // If multiline selection and wrapper is e.g. ul>li, indent the content
    const indented = selectedText
      .split('\n')
      .map((l) => '  ' + l)
      .join('\n');
    wrapped = expanded.replace(/><\//, `>\n${indented}\n</`);
  }

  // Remove any remaining snippet placeholders
  const cleanWrapped = wrapped.replace(/\$\{[0-9]+(:([^}]*))?\}/g, '$2');

  view.dispatch({
    changes: { from: sel.from, to: sel.to, insert: cleanWrapped },
  });

  return true;
}
