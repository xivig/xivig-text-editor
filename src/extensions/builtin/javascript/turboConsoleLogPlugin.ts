import { TurboConsoleLogSettings } from './types';

export const DEFAULT_TURBO_CONSOLE_LOG_SETTINGS: TurboConsoleLogSettings = {
  enabled: true,
  wrapWithEmoji: true,
  emoji: '🚀',
  includeLineNumber: true,
  includeFileName: true,
  quoteChar: "'",
};

/**
 * Creates a formatted Turbo Console Log statement.
 * Example output: console.log('🚀 ~ file: App.tsx:42 ~ count:', count);
 */
export function createTurboLogStatement(
  variableName: string,
  fileName = 'index.ts',
  lineNumber = 1,
  settings: TurboConsoleLogSettings = DEFAULT_TURBO_CONSOLE_LOG_SETTINGS
): string {
  const cleanVar = variableName.trim();
  if (!cleanVar) {
    return 'console.log();';
  }

  const baseFileName = fileName.split(/[/\\]/).pop() || fileName;
  const quote = settings.quoteChar || "'";

  const parts: string[] = [];
  if (settings.wrapWithEmoji && settings.emoji) {
    parts.push(settings.emoji);
  }
  if (settings.includeFileName && settings.includeLineNumber) {
    parts.push(`file: ${baseFileName}:${lineNumber}`);
  } else if (settings.includeFileName) {
    parts.push(`file: ${baseFileName}`);
  } else if (settings.includeLineNumber) {
    parts.push(`line: ${lineNumber}`);
  }
  parts.push(cleanVar);

  const prefix = parts.join(' ~ ');
  return `console.log(${quote}${prefix}:${quote}, ${cleanVar});`;
}

/**
 * Comments out all Turbo Console Log statements in a document.
 */
export function commentAllTurboLogs(code: string, emoji = '🚀'): string {
  const escapedEmoji = emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^(\\s*)(console\\.log\\(['"\`].*?${escapedEmoji}.*?\\);)`, 'gm');
  return code.replace(regex, '$1// $2');
}

/**
 * Uncomments previously commented Turbo Console Log statements.
 */
export function uncommentAllTurboLogs(code: string, emoji = '🚀'): string {
  const escapedEmoji = emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^(\\s*)//\\s*(console\\.log\\(['"\`].*?${escapedEmoji}.*?\\);)`, 'gm');
  return code.replace(regex, '$1$2');
}

/**
 * Deletes all Turbo Console Log statements in a document.
 */
export function deleteAllTurboLogs(code: string, emoji = '🚀'): string {
  const escapedEmoji = emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^\\s*(?://\\s*)?console\\.log\\(['"\`].*?${escapedEmoji}.*?\\);?\\r?\\n?`, 'gm');
  return code.replace(regex, '').trimEnd() + '\n';
}
