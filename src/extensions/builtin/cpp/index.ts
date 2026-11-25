import { BuiltinExtensionModule } from '../../api/types';

export * from './types';
export * from './cppCorePlugin';
export * from './cmakeToolsPlugin';
export * from './codeRunnerPlugin';
export * from './clangdPlugin';

// 1. C/C++
export const cppExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.cpptools',
    name: 'C/C++',
    publisher: 'Microsoft',
    version: '1.22.11',
    description: 'C/C++ IntelliSense, debugging, compiler discovery, and compile_commands.json integration.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#00599c',
    iconSymbol: '🇨',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. CMake Tools
export const cmakeToolsExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.cmake-tools',
    name: 'CMake Tools',
    publisher: 'Microsoft',
    version: '1.19.45',
    description: 'Extended CMake support for Xivig: configure, build, and parse targets from CMakeLists.txt.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#064f8c',
    iconSymbol: '🛠️',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. Code Runner
export const codeRunnerExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.code-runner',
    name: 'Code Runner',
    publisher: 'Jun Han',
    version: '0.12.2',
    description: 'Run code snippet or code file for multiple languages: C, C++, Java, JS, Python, Rust, Go, and more.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#ff6600',
    iconSymbol: '▶️',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. clangd
export const clangdExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.vscode-clangd',
    name: 'clangd',
    publisher: 'LLVM',
    version: '0.1.30',
    description: 'C/C++ language server providing code completion, compile flags, navigation, and ClangFormat styling.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#2a5599',
    iconSymbol: '⚡',
  },
  activate: () => {},
  deactivate: () => {},
};
