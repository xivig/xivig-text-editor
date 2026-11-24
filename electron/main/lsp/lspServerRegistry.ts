import { LanguageServerProfile } from './types';

/**
 * Built-in default language server configurations for major programming languages.
 */
export const DEFAULT_LANGUAGE_SERVERS: LanguageServerProfile[] = [
  // 1. TypeScript & JavaScript
  {
    id: 'typescript',
    name: 'TypeScript / JavaScript Language Server',
    languages: ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
    fileExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
    command: process.platform === 'win32' ? 'typescript-language-server.cmd' : 'typescript-language-server',
    args: ['--stdio'],
    enabled: true,
    autoStart: true,
    status: 'stopped',
    installGuide: 'npm install -g typescript-language-server typescript',
  },

  // 2. Python (Pyright)
  {
    id: 'pyright',
    name: 'Pyright Language Server',
    languages: ['python'],
    fileExtensions: ['.py', '.pyi'],
    command: process.platform === 'win32' ? 'pyright-langserver.cmd' : 'pyright-langserver',
    args: ['--stdio'],
    enabled: true,
    autoStart: true,
    status: 'stopped',
    installGuide: 'npm install -g pyright  (or pip install pyright)',
  },

  // 3. PHP & Laravel (Intelephense)
  {
    id: 'intelephense',
    name: 'Intelephense (PHP / Laravel)',
    languages: ['php', 'blade'],
    fileExtensions: ['.php', '.blade.php'],
    command: process.platform === 'win32' ? 'intelephense.cmd' : 'intelephense',
    args: ['--stdio'],
    enabled: true,
    autoStart: true,
    status: 'stopped',
    installGuide: 'npm install -g intelephense',
  },

  // 4. HTML
  {
    id: 'html',
    name: 'VS Code HTML Language Server',
    languages: ['html', 'htm'],
    fileExtensions: ['.html', '.htm'],
    command: process.platform === 'win32' ? 'vscode-html-language-server.cmd' : 'vscode-html-language-server',
    args: ['--stdio'],
    enabled: true,
    autoStart: true,
    status: 'stopped',
    installGuide: 'npm install -g vscode-langservers-extracted',
  },

  // 5. CSS
  {
    id: 'css',
    name: 'VS Code CSS Language Server',
    languages: ['css', 'scss', 'less'],
    fileExtensions: ['.css', '.scss', '.less'],
    command: process.platform === 'win32' ? 'vscode-css-language-server.cmd' : 'vscode-css-language-server',
    args: ['--stdio'],
    enabled: true,
    autoStart: true,
    status: 'stopped',
    installGuide: 'npm install -g vscode-langservers-extracted',
  },

  // 6. JSON
  {
    id: 'json',
    name: 'VS Code JSON Language Server',
    languages: ['json', 'jsonc'],
    fileExtensions: ['.json', '.jsonc'],
    command: process.platform === 'win32' ? 'vscode-json-language-server.cmd' : 'vscode-json-language-server',
    args: ['--stdio'],
    enabled: true,
    autoStart: true,
    status: 'stopped',
    installGuide: 'npm install -g vscode-langservers-extracted',
  },

  // 7. C / C++ (clangd)
  {
    id: 'clangd',
    name: 'clangd (C/C++)',
    languages: ['c', 'cpp', 'h', 'hpp'],
    fileExtensions: ['.c', '.cpp', '.cc', '.cxx', '.h', '.hpp'],
    command: 'clangd',
    args: ['--background-index', '--clang-tidy'],
    enabled: true,
    autoStart: false,
    status: 'stopped',
    installGuide: 'Install LLVM / Clang (https://clangd.llvm.org/installation.html)',
  },

  // 8. Rust (rust-analyzer)
  {
    id: 'rust-analyzer',
    name: 'rust-analyzer',
    languages: ['rust'],
    fileExtensions: ['.rs'],
    command: 'rust-analyzer',
    args: [],
    enabled: true,
    autoStart: false,
    status: 'stopped',
    installGuide: 'rustup component add rust-analyzer',
  },

  // 9. Go (gopls)
  {
    id: 'gopls',
    name: 'gopls (Go)',
    languages: ['go'],
    fileExtensions: ['.go'],
    command: 'gopls',
    args: [],
    enabled: true,
    autoStart: false,
    status: 'stopped',
    installGuide: 'go install golang.org/x/tools/gopls@latest',
  },

  // 10. Java (JDTLS)
  {
    id: 'jdtls',
    name: 'Eclipse JDT Language Server',
    languages: ['java'],
    fileExtensions: ['.java'],
    command: 'jdtls',
    args: [],
    enabled: false,
    autoStart: false,
    status: 'stopped',
    installGuide: 'https://github.com/eclipse-jdtls/eclipse.jdt.ls',
  },

  // 11. Markdown (Marksman)
  {
    id: 'marksman',
    name: 'Marksman (Markdown)',
    languages: ['markdown'],
    fileExtensions: ['.md', '.markdown'],
    command: 'marksman',
    args: ['server'],
    enabled: true,
    autoStart: false,
    status: 'stopped',
    installGuide: 'https://github.com/artempyanykh/marksman/releases',
  },

  // 12. YAML
  {
    id: 'yaml',
    name: 'YAML Language Server',
    languages: ['yaml'],
    fileExtensions: ['.yaml', '.yml'],
    command: process.platform === 'win32' ? 'yaml-language-server.cmd' : 'yaml-language-server',
    args: ['--stdio'],
    enabled: true,
    autoStart: false,
    status: 'stopped',
    installGuide: 'npm install -g yaml-language-server',
  },

  // 13. SQL
  {
    id: 'sql',
    name: 'SQL Language Server',
    languages: ['sql'],
    fileExtensions: ['.sql'],
    command: process.platform === 'win32' ? 'sql-language-server.cmd' : 'sql-language-server',
    args: ['up', '--method', 'stdio'],
    enabled: true,
    autoStart: false,
    status: 'stopped',
    installGuide: 'npm install -g sql-language-server',
  },
];

/**
 * Normalizes language and file extension to find matching language server configuration.
 */
export function findServerProfileForFile(
  servers: LanguageServerProfile[],
  fileNameOrPath: string,
  languageId?: string
): LanguageServerProfile | undefined {
  const lowerName = (fileNameOrPath || '').toLowerCase();
  const lowerLang = (languageId || '').toLowerCase();

  return servers.find((s) => {
    if (!s.enabled) return false;

    // Check language ID match
    if (lowerLang && s.languages.some((l) => l.toLowerCase() === lowerLang)) {
      return true;
    }

    // Check file extension match
    if (s.fileExtensions.some((ext) => lowerName.endsWith(ext.toLowerCase()))) {
      return true;
    }

    return false;
  });
}
