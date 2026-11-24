import { Extension as CodeMirrorExtension } from '@codemirror/state';
import { BuiltinExtensionModule, ExtensionContext } from '../../api/types';
import { formatWithPrettier, DEFAULT_PRETTIER_SETTINGS } from './prettierPlugin';
import { createESLintPlugin, DEFAULT_ESLINT_SETTINGS } from './eslintPlugin';
import { parseEditorConfig, applyEditorConfigTransform, DEFAULT_EDITORCONFIG_SETTINGS } from './editorConfigPlugin';
import { createErrorLensPlugin, DEFAULT_ERROR_LENS_SETTINGS } from './errorLensPlugin';
import { createSpellCheckerPlugin, DEFAULT_SPELLCHECKER_SETTINGS } from './spellCheckerPlugin';
import { createPathCompletionSource, DEFAULT_PATH_INTELLISENSE_SETTINGS } from './pathIntellisensePlugin';
import { createAutoCloseTagExtension, DEFAULT_AUTOTAG_SETTINGS } from './autoTagPlugins';
import { createBetterCommentsPlugin, DEFAULT_BETTER_COMMENTS_SETTINGS } from './betterCommentsPlugin';
import { scanDocumentForTodos, DEFAULT_TODO_TREE_SETTINGS } from './todoTreePlugin';

export * from './types';
export * from './prettierPlugin';
export * from './eslintPlugin';
export * from './editorConfigPlugin';
export * from './errorLensPlugin';
export * from './spellCheckerPlugin';
export * from './pathIntellisensePlugin';
export * from './autoTagPlugins';
export * from './betterCommentsPlugin';
export * from './todoTreePlugin';

// 1. Prettier Extension Module
export const prettierExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.prettier',
    name: 'Prettier - Code Formatter',
    publisher: 'Prettier',
    version: '3.3.0',
    description: 'Opinionated code formatter supporting JavaScript, TypeScript, CSS, HTML, JSON, and Markdown.',
    categories: ['Formatters', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#ea5e5e',
    iconSymbol: '✨',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. ESLint Extension Module
export const eslintExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.eslint',
    name: 'ESLint',
    publisher: 'Dirk Baeumer',
    version: '2.4.4',
    description: 'Integrates ESLint JavaScript/TypeScript linting into Xivig with live error/warning diagnostics.',
    categories: ['Linters', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#4b32c3',
    iconSymbol: '🛡️',
  },
  activate: () => {},
  deactivate: () => {},
  getCodeMirrorExtensions: () => [createESLintPlugin(DEFAULT_ESLINT_SETTINGS)],
};

// 3. EditorConfig Extension Module
export const editorConfigExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.editorconfig',
    name: 'EditorConfig for Xivig',
    publisher: 'EditorConfig',
    version: '1.2.0',
    description: 'Enforces consistent coding styles between different editors and IDEs using .editorconfig.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#c97800',
    iconSymbol: '⚙️',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. Error Lens Extension Module
export const errorLensExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.error-lens',
    name: 'Error Lens',
    publisher: 'Alexander',
    version: '3.6.0',
    description: 'Supercharge language diagnostics by highlighting lines containing errors/warnings and rendering callouts inline.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#ea5455',
    iconSymbol: '🔍',
  },
  activate: () => {},
  deactivate: () => {},
  getCodeMirrorExtensions: () => [createErrorLensPlugin(DEFAULT_ERROR_LENS_SETTINGS)],
};

// 5. Code Spell Checker Extension Module
export const spellCheckerExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.code-spell-checker',
    name: 'Code Spell Checker',
    publisher: 'Street Side Software',
    version: '4.0.0',
    description: 'A basic spelling checker that detects typos in camelCase, snake_case, strings, and comments.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#15803d',
    iconSymbol: '🔤',
  },
  activate: () => {},
  deactivate: () => {},
  getCodeMirrorExtensions: () => [createSpellCheckerPlugin(DEFAULT_SPELLCHECKER_SETTINGS)],
};

// 6. Path Intellisense Extension Module
export const pathIntellisenseExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.path-intellisense',
    name: 'Path Intellisense',
    publisher: 'Christian Kohler',
    version: '2.9.0',
    description: 'Visual Studio Code autocompletion plugin that auto-completes filenames and directories.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#0284c7',
    iconSymbol: '📁',
  },
  activate: () => {},
  deactivate: () => {},
};

// 7. Auto Rename Tag Extension Module
export const autoRenameTagExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.auto-rename-tag',
    name: 'Auto Rename Tag',
    publisher: 'Jun Han',
    version: '1.4.0',
    description: 'Auto rename paired HTML/XML tag simultaneously when changing opening or closing tag.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#f97316',
    iconSymbol: '🏷️',
  },
  activate: () => {},
  deactivate: () => {},
};

// 8. Auto Close Tag Extension Module
export const autoCloseTagExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.auto-close-tag',
    name: 'Auto Close Tag',
    publisher: 'Jun Han',
    version: '0.5.15',
    description: 'Automatically add HTML/XML close tag, same as Visual Studio IDE or Sublime Text does.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#10b981',
    iconSymbol: '🔒',
  },
  activate: () => {},
  deactivate: () => {},
  getCodeMirrorExtensions: () => [createAutoCloseTagExtension(DEFAULT_AUTOTAG_SETTINGS)],
};

// 9. Better Comments Extension Module
export const betterCommentsExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.better-comments',
    name: 'Better Comments',
    publisher: 'Aaron Bond',
    version: '3.0.2',
    description: 'Improve code commenting by categorizing annotations into alerts, queries, todos, and highlights.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#8b5cf6',
    iconSymbol: '💬',
  },
  activate: () => {},
  deactivate: () => {},
  getCodeMirrorExtensions: () => [createBetterCommentsPlugin(DEFAULT_BETTER_COMMENTS_SETTINGS)],
};

// 10. Todo Tree Extension Module
export const todoTreeExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.todo-tree',
    name: 'Todo Tree',
    publisher: 'Gruntfuggly',
    version: '0.22.0',
    description: 'Quickly search workspace code for comment tags like TODO and FIXME, displaying them in an organized tree.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#f59e0b',
    iconSymbol: '🌲',
  },
  activate: () => {},
  deactivate: () => {},
};
