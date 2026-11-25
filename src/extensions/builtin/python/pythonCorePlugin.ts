import { PythonEnvironment, PythonSettings } from './types';

export const DEFAULT_PYTHON_SETTINGS: PythonSettings = {
  enabled: true,
  autoSelectVenv: true,
};

/**
 * Discovers virtual environments and interpreters in given workspace paths.
 */
export function detectVirtualEnvironments(candidatePaths: string[]): PythonEnvironment[] {
  const envs: PythonEnvironment[] = [];
  const seenPaths = new Set<string>();

  for (const p of candidatePaths) {
    if (!p) continue;
    const clean = p.replace(/\\/g, '/');
    const parts = clean.split('/');
    const folderName = parts[parts.length - 1] || parts[parts.length - 2];

    if (['.venv', 'venv', 'env', '.env'].includes(folderName)) {
      if (!seenPaths.has(clean)) {
        seenPaths.add(clean);
        envs.push({
          path: clean,
          name: `Python (${folderName})`,
          type: 'venv',
          isDefault: folderName === '.venv',
        });
      }
    } else if (clean.includes('conda') || clean.includes('miniconda') || clean.includes('anaconda')) {
      if (!seenPaths.has(clean)) {
        seenPaths.add(clean);
        envs.push({
          path: clean,
          name: `Conda (${folderName})`,
          type: 'conda',
        });
      }
    } else if (clean.includes('.pyenv')) {
      if (!seenPaths.has(clean)) {
        seenPaths.add(clean);
        envs.push({
          path: clean,
          name: `pyenv (${folderName})`,
          type: 'pyenv',
        });
      }
    }
  }

  return envs;
}

/**
 * Builds a cross-platform executable CLI command for running Python scripts.
 */
export function buildPythonExecutionCommand(
  pythonPath: string,
  scriptPath: string,
  args: string[] = []
): string {
  const isWin = pythonPath.includes('\\') || pythonPath.endsWith('.exe');
  const cleanPy = pythonPath.includes(' ') ? `"${pythonPath}"` : pythonPath;
  const cleanScript = scriptPath.includes(' ') ? `"${scriptPath}"` : scriptPath;
  const formattedArgs = args.map((a) => (a.includes(' ') ? `"${a}"` : a));

  return [cleanPy, cleanScript, ...formattedArgs].join(' ');
}

/**
 * Parses pytest test discovery outputs into individual test descriptors.
 */
export function parsePythonTestDiscovery(stdout: string): Array<{ name: string; file: string; line: number }> {
  if (!stdout) return [];
  const tests: Array<{ name: string; file: string; line: number }> = [];
  const lines = stdout.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('=')) continue;

    // Pattern: tests/test_math.py::test_addition
    // or: test_file.py:42: test_something
    const colonMatch = trimmed.match(/^([^:]+)::([a-zA-Z0-9_]+(?:::)?.*)$/);
    if (colonMatch) {
      tests.push({
        file: colonMatch[1],
        name: colonMatch[2],
        line: 1,
      });
      continue;
    }

    const lineNumMatch = trimmed.match(/^([^:]+):(\d+):\s*([a-zA-Z0-9_]+)$/);
    if (lineNumMatch) {
      tests.push({
        file: lineNumMatch[1],
        line: parseInt(lineNumMatch[2], 10),
        name: lineNumMatch[3],
      });
    }
  }

  return tests;
}
