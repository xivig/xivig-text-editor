import { BuiltinExtensionModule } from '../../api/types';

export * from './types';
export * from './pythonCorePlugin';
export * from './pylancePlugin';
export * from './jupyterPlugin';
export * from './blackFormatterPlugin';
export * from './isortPlugin';
export * from './ruffLinterPlugin';

// 1. Python
export const pythonExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.python',
    name: 'Python',
    publisher: 'Microsoft',
    version: '2024.18.0',
    description: 'Python language support with virtual environment discovery, pytest runner, and execution helpers.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#3776ab',
    iconSymbol: '🐍',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. Pylance
export const pylanceExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.pylance',
    name: 'Pylance',
    publisher: 'Microsoft',
    version: '2024.10.1',
    description: 'High-performance Python language server with docstring hovers, symbol indexing, and auto-imports.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#ffbc03',
    iconSymbol: '⚡',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. Jupyter
export const jupyterExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.jupyter',
    name: 'Jupyter',
    publisher: 'Microsoft',
    version: '2024.9.0',
    description: 'Jupyter notebook (.ipynb) support with cell parsers, markdown extractors, and interactive script conversion.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#f37726',
    iconSymbol: '🪐',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. Black Formatter
export const blackFormatterExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.black-formatter',
    name: 'Black Formatter',
    publisher: 'Microsoft',
    version: '2024.4.0',
    description: 'The uncompromising Python code formatter enforcing PEP 8 standard indentation and quote normalization.',
    categories: ['Formatters', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#000000',
    iconSymbol: '🖤',
  },
  activate: () => {},
  deactivate: () => {},
};

// 5. isort
export const isortExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.isort',
    name: 'isort',
    publisher: 'Microsoft',
    version: '2024.1.0',
    description: 'Python import sorter separating standard library, third-party, and local modules into PEP 8 sections.',
    categories: ['Formatters', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#1b4a68',
    iconSymbol: '🔤',
  },
  activate: () => {},
  deactivate: () => {},
};

// 6. Ruff
export const ruffExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.ruff',
    name: 'Ruff',
    publisher: 'Astral Software',
    version: '2024.44.0',
    description: 'An extremely fast Python linter detecting unused imports, bare excepts, and mutable default arguments.',
    categories: ['Linters', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#d83a56',
    iconSymbol: '⚡',
  },
  activate: () => {},
  deactivate: () => {},
};
