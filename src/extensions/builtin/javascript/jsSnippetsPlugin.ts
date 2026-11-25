import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { JsSnippetItem, JsSnippetsSettings } from './types';

export const DEFAULT_JS_SNIPPETS_SETTINGS: JsSnippetsSettings = {
  enabled: true,
  showDescriptions: true,
};

export const JS_ES6_SNIPPETS: JsSnippetItem[] = [
  // Console logging
  {
    prefix: 'clg',
    label: 'clg',
    detail: 'console.log(var)',
    template: "console.log('$1', $1);",
    description: 'Log variable with label to console',
  },
  {
    prefix: 'clo',
    label: 'clo',
    detail: 'console.log(JSON.stringify(var, null, 2))',
    template: "console.log('$1', JSON.stringify($1, null, 2));",
    description: 'Pretty-print formatted object to console',
  },
  {
    prefix: 'clw',
    label: 'clw',
    detail: 'console.warn(var)',
    template: "console.warn('$1', $1);",
    description: 'Log warning to console',
  },
  {
    prefix: 'cle',
    label: 'cle',
    detail: 'console.error(var)',
    template: "console.error('$1', $1);",
    description: 'Log error to console',
  },

  // Functions & Lambdas
  {
    prefix: 'fn',
    label: 'fn',
    detail: 'const name = (params) => { ... }',
    template: 'const $1 = ($2) => {\n  $0\n};',
    description: 'Arrow function declaration assigned to constant',
  },
  {
    prefix: 'afn',
    label: 'afn',
    detail: '(params) => { ... }',
    template: '($1) => {\n  $0\n}',
    description: 'Inline anonymous arrow function',
  },
  {
    prefix: 'asyncfn',
    label: 'asyncfn',
    detail: 'async (params) => { ... }',
    template: 'async ($1) => {\n  $0\n}',
    description: 'Async arrow function',
  },
  {
    prefix: 'prom',
    label: 'prom',
    detail: 'new Promise((resolve, reject) => { ... })',
    template: 'new Promise((resolve, reject) => {\n  $0\n});',
    description: 'Promise wrapper constructor',
  },

  // Imports & Exports
  {
    prefix: 'im',
    label: 'im',
    detail: "import module from 'path'",
    template: "import $1 from '$2';",
    description: 'ES6 default import statement',
  },
  {
    prefix: 'imd',
    label: 'imd',
    detail: "import { member } from 'path'",
    template: "import { $1 } from '$2';",
    description: 'ES6 destructuring import statement',
  },
  {
    prefix: 'exp',
    label: 'exp',
    detail: 'export const name = value',
    template: 'export const $1 = $2;',
    description: 'Named export constant',
  },
  {
    prefix: 'expd',
    label: 'expd',
    detail: 'export default name',
    template: 'export default $1;',
    description: 'Default export statement',
  },
  {
    prefix: 'req',
    label: 'req',
    detail: "const module = require('path')",
    template: "const $1 = require('$2');",
    description: 'CommonJS require statement',
  },

  // Control Flow & Error Handling
  {
    prefix: 'trycatch',
    label: 'trycatch',
    detail: 'try { ... } catch (error) { ... }',
    template: 'try {\n  $1\n} catch (error) {\n  console.error(error);\n}',
    description: 'Try-catch block with error logging',
  },

  // Array Higher-Order Methods
  {
    prefix: 'fe',
    label: 'fe',
    detail: 'items.forEach((item) => { ... })',
    template: '$1.forEach(($2) => {\n  $0\n});',
    description: 'Array forEach loop',
  },
  {
    prefix: 'map',
    label: 'map',
    detail: 'items.map((item) => ...)',
    template: '$1.map(($2) => $0);',
    description: 'Array map transformation',
  },
  {
    prefix: 'filter',
    label: 'filter',
    detail: 'items.filter((item) => ...)',
    template: '$1.filter(($2) => $0);',
    description: 'Array filter predicate',
  },
  {
    prefix: 'reduce',
    label: 'reduce',
    detail: 'items.reduce((acc, curr) => { ... }, init)',
    template: '$1.reduce((acc, curr) => {\n  $0\n  return acc;\n}, $2);',
    description: 'Array reduce accumulator',
  },

  // Timers
  {
    prefix: 'setto',
    label: 'setto',
    detail: 'setTimeout(() => { ... }, 1000)',
    template: 'setTimeout(() => {\n  $0\n}, $1);',
    description: 'Set timeout delay timer',
  },
  {
    prefix: 'setint',
    label: 'setint',
    detail: 'setInterval(() => { ... }, 1000)',
    template: 'setInterval(() => {\n  $0\n}, $1);',
    description: 'Set recurring interval timer',
  },

  // Testing (Jest/Vitest/Mocha)
  {
    prefix: 'desc',
    label: 'desc',
    detail: "describe('suite', () => { ... })",
    template: "describe('$1', () => {\n  $0\n});",
    description: 'Test suite describe block',
  },
  {
    prefix: 'it',
    label: 'it',
    detail: "it('behavior', () => { ... })",
    template: "it('$1', () => {\n  $0\n});",
    description: 'Test specification it block',
  },
  {
    prefix: 'test',
    label: 'test',
    detail: "test('description', () => { ... })",
    template: "test('$1', () => {\n  $0\n});",
    description: 'Test case test block',
  },
];

export function getJsSnippets(): JsSnippetItem[] {
  return JS_ES6_SNIPPETS;
}

export function searchJsSnippets(prefix = ''): JsSnippetItem[] {
  const norm = prefix.toLowerCase();
  if (!norm) return JS_ES6_SNIPPETS;
  return JS_ES6_SNIPPETS.filter((s) => s.prefix.toLowerCase().startsWith(norm) || s.label.toLowerCase().includes(norm));
}

/**
 * CodeMirror 6 autocompletion source for ES6 JavaScript & TypeScript snippets.
 */
export function createJsSnippetsCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z0-9_-]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const matches = searchJsSnippets(word.text);
    if (matches.length === 0) return null;

    return {
      from: word.from,
      options: matches.map((s) => ({
        label: s.label,
        type: 'snippet',
        detail: s.detail,
        info: s.description,
        apply: s.template.replace(/\$[0-9]/g, ''),
        boost: 4,
      })),
    };
  };
}
