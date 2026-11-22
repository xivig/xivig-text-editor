import { Extension } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';

export function getLanguageExtension(filenameOrLang: string): Extension {
  const lower = filenameOrLang.toLowerCase();

  if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) {
    return javascript();
  }
  if (lower.endsWith('.jsx')) {
    return javascript({ jsx: true });
  }
  if (lower.endsWith('.ts') || lower.endsWith('.mts') || lower.endsWith('.cts')) {
    return javascript({ typescript: true });
  }
  if (lower.endsWith('.tsx')) {
    return javascript({ jsx: true, typescript: true });
  }
  if (lower.endsWith('.html') || lower.endsWith('.htm')) {
    return html();
  }
  if (lower.endsWith('.css') || lower.endsWith('.scss') || lower.endsWith('.less')) {
    return css();
  }
  if (lower.endsWith('.json')) {
    return json();
  }
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) {
    return markdown();
  }
  if (lower.endsWith('.py')) {
    return python();
  }
  if (lower.endsWith('.rs')) {
    return rust();
  }

  // Fallbacks by language name
  switch (lower) {
    case 'javascript':
    case 'typescript':
      return javascript();
    case 'html':
      return html();
    case 'css':
      return css();
    case 'json':
      return json();
    case 'markdown':
      return markdown();
    case 'python':
      return python();
    case 'rust':
      return rust();
    default:
      return [];
  }
}

export function detectLanguageName(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'JavaScript';
    case 'ts':
    case 'mts':
      return 'TypeScript';
    case 'jsx':
      return 'JavaScript (JSX)';
    case 'tsx':
      return 'TypeScript (TSX)';
    case 'html':
      return 'HTML';
    case 'css':
      return 'CSS';
    case 'json':
      return 'JSON';
    case 'md':
      return 'Markdown';
    case 'py':
      return 'Python';
    case 'rs':
      return 'Rust';
    default:
      return 'Plain Text';
  }
}
