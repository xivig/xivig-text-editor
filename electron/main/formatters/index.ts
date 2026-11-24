import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { resolveEditorConfig, applyEditorConfigToText, EditorConfigRules } from './editorConfig';

export interface FormatterInfo {
  id: string;
  name: string;
  languages: string[];
  command: string;
  isAvailable: boolean;
  type: 'formatter' | 'linter';
}

export interface FormatOptions {
  formatterId?: string;
  filePath?: string;
  workspaceRoot?: string;
  language?: string;
  range?: { startLine: number; endLine: number };
  indentSize?: number;
  useTabs?: boolean;
}

export interface FormatResult {
  success: boolean;
  formattedText?: string;
  error?: string;
  usedFormatter?: string;
  editorConfigApplied?: boolean;
}

/**
 * Searches for a command executable in workspace local bin folders first, then PATH.
 */
export function findExecutable(cmd: string, workspaceRoot?: string): string | null {
  const isWin = process.platform === 'win32';
  const extensions = isWin ? ['.cmd', '.exe', '.bat', ''] : [''];

  if (workspaceRoot) {
    // Check node_modules/.bin
    const nodeBin = path.join(workspaceRoot, 'node_modules', '.bin');
    for (const ext of extensions) {
      const candidate = path.join(nodeBin, `${cmd}${ext}`);
      if (fs.existsSync(candidate)) return candidate;
    }

    // Check vendor/bin (for PHP Pint, PHP CS Fixer, etc.)
    const vendorBin = path.join(workspaceRoot, 'vendor', 'bin');
    for (const ext of extensions) {
      const candidate = path.join(vendorBin, `${cmd}${ext}`);
      if (fs.existsSync(candidate)) return candidate;
    }
  }

  // Check system PATH
  const pathDirs = (process.env.PATH || '').split(path.delimiter);
  for (const dir of pathDirs) {
    for (const ext of extensions) {
      const candidate = path.join(dir, `${cmd}${ext}`);
      if (fs.existsSync(candidate)) return candidate;
    }
  }

  return null;
}

/**
 * Executes a CLI formatter with text piped through stdin.
 */
function runStdinFormatter(
  execPath: string,
  args: string[],
  input: string,
  cwd?: string
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    let proc;
    try {
      const isWin = process.platform === 'win32';
      const isCmd = isWin && execPath.endsWith('.cmd');
      if (isCmd) {
        proc = spawn('cmd.exe', ['/d', '/s', '/c', execPath, ...args], {
          cwd: cwd || process.cwd(),
          shell: false,
          env: { ...process.env },
        });
      } else {
        proc = spawn(execPath, args, {
          cwd: cwd || process.cwd(),
          shell: false,
          env: { ...process.env },
        });
      }
    } catch (err) {
      return reject(err);
    }

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => reject(err));

    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 0 });
    });

    try {
      proc.stdin?.write(input);
      proc.stdin?.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Returns registry of supported formatters and linters with availability status.
 */
export function getSupportedFormatters(workspaceRoot?: string): FormatterInfo[] {
  const definitions: Array<{ id: string; name: string; cmd: string; langs: string[]; type: 'formatter' | 'linter' }> = [
    { id: 'prettier', name: 'Prettier', cmd: 'prettier', langs: ['javascript', 'typescript', 'html', 'css', 'json', 'yaml', 'markdown'], type: 'formatter' },
    { id: 'eslint', name: 'ESLint', cmd: 'eslint', langs: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'], type: 'linter' },
    { id: 'stylelint', name: 'Stylelint', cmd: 'stylelint', langs: ['css', 'scss', 'less'], type: 'linter' },
    { id: 'php-cs-fixer', name: 'PHP-CS-Fixer', cmd: 'php-cs-fixer', langs: ['php'], type: 'formatter' },
    { id: 'phpcbf', name: 'PHP_CodeSniffer (phpcbf)', cmd: 'phpcbf', langs: ['php'], type: 'formatter' },
    { id: 'pint', name: 'Laravel Pint', cmd: 'pint', langs: ['php'], type: 'formatter' },
    { id: 'ruff', name: 'Ruff (Python)', cmd: 'ruff', langs: ['python'], type: 'formatter' },
    { id: 'black', name: 'Black (Python)', cmd: 'black', langs: ['python'], type: 'formatter' },
    { id: 'clang-format', name: 'clang-format (C/C++)', cmd: 'clang-format', langs: ['c', 'cpp', 'java', 'json'], type: 'formatter' },
    { id: 'rustfmt', name: 'rustfmt (Rust)', cmd: 'rustfmt', langs: ['rust'], type: 'formatter' },
    { id: 'gofmt', name: 'gofmt (Go)', cmd: 'gofmt', langs: ['go'], type: 'formatter' },
  ];

  return definitions.map((d) => {
    const foundPath = findExecutable(d.cmd, workspaceRoot);
    return {
      id: d.id,
      name: d.name,
      languages: d.langs,
      command: d.cmd,
      isAvailable: Boolean(foundPath),
      type: d.type,
    };
  });
}

/**
 * Primary formatting engine: runs appropriate tool with EditorConfig post-enforcement.
 */
export async function formatSourceCode(
  text: string,
  options: FormatOptions
): Promise<FormatResult> {
  const { filePath, workspaceRoot, language, formatterId } = options;
  let formatted = text;
  let usedFormatter = 'none';

  // 1. Resolve .editorconfig rules if file path is available
  const editorRules: EditorConfigRules = filePath
    ? resolveEditorConfig(filePath, workspaceRoot)
    : {};

  // 2. Select and run external formatter
  const targetFormatter = formatterId || getDefaultFormatterForLanguage(language);

  if (targetFormatter) {
    const execPath = findExecutable(getExecutableName(targetFormatter), workspaceRoot);
    if (execPath) {
      try {
        const args = buildFormatterArgs(targetFormatter, filePath, editorRules);
        const { stdout, code } = await runStdinFormatter(execPath, args, text, workspaceRoot);
        if (code === 0 && stdout.length > 0) {
          formatted = stdout;
          usedFormatter = targetFormatter;
        }
      } catch (err: any) {
        console.warn(`[Formatters] ${targetFormatter} execution failed:`, err);
      }
    }
  }

  // 3. Enforce EditorConfig constraints (indent, eol, trailing whitespace, final newline)
  if (Object.keys(editorRules).length > 0) {
    formatted = applyEditorConfigToText(formatted, editorRules);
  }

  return {
    success: true,
    formattedText: formatted,
    usedFormatter,
    editorConfigApplied: Object.keys(editorRules).length > 0,
  };
}

/**
 * Runs a linter in fix mode (e.g. ESLint --fix, Ruff check --fix).
 */
export async function lintAndFixCode(
  text: string,
  linterId: string,
  filePath?: string,
  workspaceRoot?: string
): Promise<{ success: boolean; fixedText?: string; error?: string }> {
  const execCmd = linterId === 'ruff' ? 'ruff' : linterId === 'stylelint' ? 'stylelint' : 'eslint';
  const execPath = findExecutable(execCmd, workspaceRoot);

  if (!execPath) {
    return { success: false, error: `Linter ${execCmd} is not installed or not on PATH.` };
  }

  try {
    let args: string[] = [];
    if (linterId === 'eslint') {
      args = ['--fix-dry-run', '--stdin', '--stdin-filename', filePath || 'temp.js', '--format', 'json'];
    } else if (linterId === 'ruff') {
      args = ['check', '--fix', '-', '--stdin-filename', filePath || 'temp.py'];
    } else if (linterId === 'stylelint') {
      args = ['--fix', '--stdin-filename', filePath || 'temp.css'];
    }

    const { stdout, code } = await runStdinFormatter(execPath, args, text, workspaceRoot);
    if (code === 0 && stdout) {
      return { success: true, fixedText: stdout };
    }
    return { success: false, error: `Linter finished with code ${code}` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

function getExecutableName(formatterId: string): string {
  switch (formatterId) {
    case 'prettier': return 'prettier';
    case 'eslint': return 'eslint';
    case 'stylelint': return 'stylelint';
    case 'php-cs-fixer': return 'php-cs-fixer';
    case 'phpcbf': return 'phpcbf';
    case 'pint': return 'pint';
    case 'ruff': return 'ruff';
    case 'black': return 'black';
    case 'clang-format': return 'clang-format';
    case 'rustfmt': return 'rustfmt';
    case 'gofmt': return 'gofmt';
    default: return formatterId;
  }
}

function getDefaultFormatterForLanguage(language?: string): string | null {
  if (!language) return null;
  const l = language.toLowerCase();

  if (['javascript', 'typescript', 'json', 'html', 'css', 'yaml', 'markdown'].includes(l)) return 'prettier';
  if (l === 'python') return 'ruff';
  if (l === 'php') return 'pint';
  if (['c', 'cpp'].includes(l)) return 'clang-format';
  if (l === 'rust') return 'rustfmt';
  if (l === 'go') return 'gofmt';

  return null;
}

function buildFormatterArgs(formatterId: string, filePath?: string, rules?: EditorConfigRules): string[] {
  switch (formatterId) {
    case 'prettier': {
      const args = ['--stdin-filepath', filePath || 'temp.js'];
      if (rules?.tab_width) args.push('--tab-width', String(rules.tab_width));
      if (rules?.indent_style === 'tab') args.push('--use-tabs');
      return args;
    }
    case 'ruff':
      return ['format', '-', '--stdin-filename', filePath || 'temp.py'];
    case 'black':
      return ['-', '--fast', '--quiet'];
    case 'clang-format':
      return [filePath ? `--assume-filename=${filePath}` : ''];
    case 'rustfmt':
      return ['--emit', 'stdout'];
    case 'gofmt':
      return [];
    case 'phpcbf':
      return [filePath ? `--stdin-path=${filePath}` : '-'];
    case 'pint':
      return ['--test'];
    default:
      return [];
  }
}
