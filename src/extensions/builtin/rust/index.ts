import { BuiltinExtensionModule } from '../../api/types';

export * from './types';
export * from './rustAnalyzerPlugin';
export * from './evenBetterTomlPlugin';
export * from './codeLldbPlugin';
export * from './cratesPlugin';

// 1. rust-analyzer
export const rustAnalyzerExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.rust-analyzer',
    name: 'rust-analyzer',
    publisher: 'rust-lang',
    version: '0.3.2185',
    description: 'Modular compiler frontend and language server for the Rust language with full symbol parsing.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#000000',
    iconSymbol: '🦀',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. Even Better TOML
export const evenBetterTomlExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.even-better-toml',
    name: 'Even Better TOML',
    publisher: 'tamasfe',
    version: '0.19.2',
    description: 'Fully-featured TOML support with Cargo.toml package validation, dependency tables, and completions.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#9c4221',
    iconSymbol: '📑',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. CodeLLDB
export const codeLldbExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.codelldb',
    name: 'CodeLLDB',
    publisher: 'Vadim Chugunov',
    version: '1.10.0',
    description: 'Native debugger for Rust, C, and C++ powered by LLDB with panic breakpoint interceptors.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#2a5599',
    iconSymbol: '🔍',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. Crates
export const cratesExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.crates',
    name: 'crates',
    publisher: 'Seray Uzgur',
    version: '0.6.5',
    description: 'Manage Cargo.toml dependencies, inspect crate updates, and view latest versions from crates.io.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#d34524',
    iconSymbol: '📦',
  },
  activate: () => {},
  deactivate: () => {},
};
