import { CodeRunnerSettings } from './types';

export const DEFAULT_CODE_RUNNER_EXECUTORS: Record<string, string> = {
  c: 'gcc "$fileName" -o "$fileNameWithoutExt" && "./$fileNameWithoutExt"',
  cpp: 'g++ -std=c++20 "$fileName" -o "$fileNameWithoutExt" && "./$fileNameWithoutExt"',
  py: 'python -u "$fileName"',
  js: 'node "$fileName"',
  ts: 'ts-node "$fileName"',
  java: 'java "$fileName"',
  rs: 'rustc "$fileName" && "./$fileNameWithoutExt"',
  go: 'go run "$fileName"',
  sh: 'bash "$fileName"',
  rb: 'ruby "$fileName"',
  php: 'php "$fileName"',
};

export const DEFAULT_CODE_RUNNER_SETTINGS: CodeRunnerSettings = {
  enabled: true,
  clearPreviousOutput: true,
  saveFileBeforeRun: true,
  executorMap: DEFAULT_CODE_RUNNER_EXECUTORS,
};

/**
 * Resolves the runner execution command for a given file path based on its extension.
 */
export function resolveCodeRunnerCommand(
  filePath: string,
  customMap: Record<string, string> = {}
): { command: string; extension: string } | null {
  if (!filePath) return null;

  const clean = filePath.replace(/\\/g, '/');
  const dotIdx = clean.lastIndexOf('.');
  if (dotIdx === -1) return null;

  const ext = clean.slice(dotIdx + 1).toLowerCase();
  const template = customMap[ext] || DEFAULT_CODE_RUNNER_EXECUTORS[ext];
  if (!template) return null;

  const slashIdx = clean.lastIndexOf('/');
  const fileName = slashIdx !== -1 ? clean.slice(slashIdx + 1) : clean;
  const dir = slashIdx !== -1 ? clean.slice(0, slashIdx) : '.';
  const fileExtIdx = fileName.lastIndexOf('.');
  const fileNameWithoutExt = fileExtIdx !== -1 ? fileName.slice(0, fileExtIdx) : fileName;

  const command = template
    .replace(/\$fullFileName/g, clean)
    .replace(/\$fileNameWithoutExt/g, fileNameWithoutExt)
    .replace(/\$fileName/g, fileName)
    .replace(/\$dir/g, dir);

  return {
    command,
    extension: ext,
  };
}
