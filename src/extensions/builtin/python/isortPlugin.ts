import { IsortSettings } from './types';

export const DEFAULT_ISORT_SETTINGS: IsortSettings = {
  enabled: true,
  combineAsImports: true,
  linesBetweenSections: 1,
};

const PYTHON_STDLIB = new Set([
  'os', 'sys', 'json', 'math', 're', 'datetime', 'pathlib', 'typing',
  'collections', 'itertools', 'functools', 'subprocess', 'threading',
  'time', 'urllib', 'http', 'logging', 'shutil', 'tempfile', 'hashlib',
  'unittest', 'abc', 'copy', 'enum', 'io', 'random', 'string', 'struct',
  'traceback', 'warnings', 'weakref', 'zipfile', 'tarfile', 'sqlite3',
  'socket', 'select', 'asyncio', 'concurrent', 'multiprocessing', 'contextlib',
]);

/**
 * Categorizes and sorts Python imports into 4 standard isort tiers:
 * 1. __future__
 * 2. Standard Library
 * 3. Third Party
 * 4. Local / First Party
 */
export function sortPythonImports(code: string): string {
  if (!code || !code.trim()) return '';

  const lines = code.split(/\r?\n/);
  const futureImports: string[] = [];
  const stdlibImports: string[] = [];
  const thirdPartyImports: string[] = [];
  const localImports: string[] = [];
  const nonImportLines: string[] = [];

  let inHeader = true;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();

    if (inHeader && (trimmed.startsWith('import ') || trimmed.startsWith('from '))) {
      // Determine module name
      let moduleName = '';
      if (trimmed.startsWith('import ')) {
        moduleName = trimmed.replace('import ', '').split(/\s|,/)[0].trim();
      } else if (trimmed.startsWith('from ')) {
        moduleName = trimmed.replace('from ', '').split(/\s/)[0].trim();
      }

      if (moduleName === '__future__') {
        futureImports.push(trimmed);
      } else if (moduleName.startsWith('.')) {
        localImports.push(trimmed);
      } else if (PYTHON_STDLIB.has(moduleName.split('.')[0])) {
        stdlibImports.push(trimmed);
      } else {
        thirdPartyImports.push(trimmed);
      }
    } else {
      if (inHeader && trimmed && !trimmed.startsWith('#')) {
        inHeader = false;
      }
      nonImportLines.push(line);
    }
  }

  // Sort each group alphabetically
  futureImports.sort();
  stdlibImports.sort();
  thirdPartyImports.sort();
  localImports.sort();

  const sections: string[] = [];
  if (futureImports.length > 0) sections.push(futureImports.join('\n'));
  if (stdlibImports.length > 0) sections.push(stdlibImports.join('\n'));
  if (thirdPartyImports.length > 0) sections.push(thirdPartyImports.join('\n'));
  if (localImports.length > 0) sections.push(localImports.join('\n'));

  const importBlock = sections.join('\n\n');
  const rest = nonImportLines.join('\n').replace(/^\n+/, '');

  if (importBlock) {
    return `${importBlock}\n\n${rest}`;
  }

  return code;
}
