import { BuiltinExtensionModule } from '../../api/types';
import {
  DEFAULT_JS_SNIPPETS_SETTINGS,
  createJsSnippetsCompletionSource,
  JS_ES6_SNIPPETS,
} from './jsSnippetsPlugin';
import { DEFAULT_TYPESCRIPT_HERO_SETTINGS } from './typeScriptHeroPlugin';
import {
  DEFAULT_NPM_INTELLISENSE_SETTINGS,
  createNpmIntellisenseCompletionSource,
} from './npmIntellisensePlugin';
import { DEFAULT_IMPORT_COST_SETTINGS } from './importCostPlugin';
import { DEFAULT_TURBO_CONSOLE_LOG_SETTINGS } from './turboConsoleLogPlugin';
import { DEFAULT_JEST_SETTINGS } from './jestPlugin';
import { DEFAULT_VITEST_EXPLORER_SETTINGS } from './vitestExplorerPlugin';

export * from './types';
export * from './jsSnippetsPlugin';
export * from './typeScriptHeroPlugin';
export * from './npmIntellisensePlugin';
export * from './importCostPlugin';
export * from './turboConsoleLogPlugin';
export * from './jestPlugin';
export * from './vitestExplorerPlugin';

// 1. JavaScript (ES6) Code Snippets
export const jsSnippetsExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.js-snippets',
    name: 'JavaScript (ES6) code snippets',
    publisher: 'charalampos karypidis',
    version: '1.8.0',
    description: 'Code snippets for JavaScript in ES6 syntax (supporting both JavaScript and TypeScript).',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#f7df1e',
    iconSymbol: '⚡',
  },
  activate: () => {},
  deactivate: () => {},
  getSnippets: (language?: string) => {
    const lang = (language || '').toLowerCase();
    if (
      lang.includes('javascript') ||
      lang.includes('typescript') ||
      lang.endsWith('.js') ||
      lang.endsWith('.ts') ||
      lang.endsWith('.jsx') ||
      lang.endsWith('.tsx')
    ) {
      return JS_ES6_SNIPPETS.map((s) => ({
        label: s.label,
        detail: s.detail,
        template: s.template,
      }));
    }
    return [];
  },
};

// 2. TypeScript Hero
export const typeScriptHeroExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.typescript-hero',
    name: 'TypeScript Hero',
    publisher: 'buehler',
    version: '3.0.0',
    description: 'Automates import sorting, organizing, specifier deduplication, and TypeScript export outlines.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#3178c6',
    iconSymbol: '🦸',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. npm Intellisense
export const npmIntellisenseExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.npm-intellisense',
    name: 'npm Intellisense',
    publisher: 'Christian Kohler',
    version: '1.4.5',
    description: 'Autocompletes npm modules in import and require statements from package.json and node_modules.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#cb3837',
    iconSymbol: '📦',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. Import Cost
export const importCostExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.import-cost',
    name: 'Import Cost',
    publisher: 'Wix',
    version: '3.3.0',
    description: 'Displays the size of imported npm packages inline inside the editor with gzip breakdown.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#2b5c8f',
    iconSymbol: '⚖️',
  },
  activate: () => {},
  deactivate: () => {},
};

// 5. Turbo Console Log
export const turboConsoleLogExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.turbo-console-log',
    name: 'Turbo Console Log',
    publisher: 'Chakroun Anas',
    version: '2.9.2',
    description: 'Automates creating meaningful console.log messages with file name, line numbers, and cleanup actions.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#ff6f00',
    iconSymbol: '🚀',
  },
  activate: () => {},
  deactivate: () => {},
};

// 6. Jest
export const jestExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.jest',
    name: 'Jest',
    publisher: 'Orta',
    version: '6.4.0',
    description: 'The optimal flow for Jest test suites with test case discovery, runner commands, and snapshots.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#c21325',
    iconSymbol: '🃏',
  },
  activate: () => {},
  deactivate: () => {},
};

// 7. Vitest Explorer
export const vitestExplorerExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.vitest-explorer',
    name: 'Vitest Explorer',
    publisher: 'Zixuan Chen',
    version: '1.2.1',
    description: 'First-class Vitest explorer with hierarchical test tree navigation, watch runner, and status reporting.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#729b1b',
    iconSymbol: '⚡',
  },
  activate: () => {},
  deactivate: () => {},
};
