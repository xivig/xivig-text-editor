import { RuffDiagnostic, RuffSettings } from './types';

export const DEFAULT_RUFF_SETTINGS: RuffSettings = {
  enabled: true,
  fixAllOnSave: true,
  select: ['E', 'F', 'B'],
};

/**
 * Ultra-fast AST-like regex scanner executing core Ruff linting rules:
 * - E722: Bare except
 * - B006: Mutable default argument
 * - E711: Comparison to None
 * - F401: Unused import detection
 */
export function lintPythonCode(code: string): RuffDiagnostic[] {
  if (!code || !code.trim()) return [];

  const diagnostics: RuffDiagnostic[] = [];
  const lines = code.split(/\r?\n/);
  const importedModules: Array<{ name: string; line: number }> = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();
    const lineNum = idx + 1;

    if (!trimmed || trimmed.startsWith('#')) continue;

    // Track imports
    if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
      const impMatch = trimmed.match(/^(?:from\s+[a-zA-Z0-9_.]+\s+import|import)\s+([a-zA-Z0-9_, ]+)/);
      if (impMatch) {
        const names = impMatch[1].split(',').map((n) => n.trim().split(/\s+as\s+/).pop()!.trim());
        for (const n of names) {
          if (n && n !== '*') {
            importedModules.push({ name: n, line: lineNum });
          }
        }
      }
      continue;
    }

    // E722: Bare except
    if (/^except\s*:/.test(trimmed)) {
      diagnostics.push({
        code: 'E722',
        message: 'Do not use bare `except:`, specify exception class (e.g. `except Exception:`)',
        lineNumber: lineNum,
        severity: 'error',
      });
    }

    // B006: Mutable default argument: def func(a=[]) or def func(b={})
    const mutableMatch = trimmed.match(/def\s+[a-zA-Z0-9_]+\s*\([^)]*?=\s*(\[\]|\{\})\s*[,)]/);
    if (mutableMatch) {
      diagnostics.push({
        code: 'B006',
        message: 'Do not use mutable data structures for argument defaults. Use `None` and initialize inside function.',
        lineNumber: lineNum,
        severity: 'warning',
      });
    }

    // E711: Comparison to None should be 'cond is None'
    if (/[=!]=\s*None\b/.test(trimmed)) {
      diagnostics.push({
        code: 'E711',
        message: "Comparison to `None` should be `cond is None` or `cond is not None`",
        lineNumber: lineNum,
        severity: 'warning',
      });
    }
  }

  // F401: Unused import check
  const nonImportBody = lines
    .filter((l) => !l.trim().startsWith('import ') && !l.trim().startsWith('from ') && !l.trim().startsWith('#'))
    .join('\n');

  for (const imp of importedModules) {
    const wordRegex = new RegExp(`\\b${imp.name}\\b`);
    if (!wordRegex.test(nonImportBody)) {
      diagnostics.push({
        code: 'F401',
        message: `'${imp.name}' imported but unused`,
        lineNumber: imp.line,
        severity: 'warning',
      });
    }
  }

  return diagnostics;
}
