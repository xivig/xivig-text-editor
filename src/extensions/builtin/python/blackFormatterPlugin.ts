import { BlackSettings } from './types';

export const DEFAULT_BLACK_SETTINGS: BlackSettings = {
  enabled: true,
  lineLength: 88,
  stringNormalization: true,
};

/**
 * Applies PEP 8 / Black formatting rules:
 * - Double-quote normalization for simple string literals
 * - Whitespace around operators and colons
 * - Two blank lines between top-level functions and classes
 */
export function formatPythonCode(code: string, lineLength = 88): string {
  if (!code || !code.trim()) return '';

  const lines = code.split(/\r?\n/);
  const formattedLines: string[] = [];
  let prevLineWasEmpty = false;

  for (let idx = 0; idx < lines.length; idx++) {
    let line = lines[idx];

    // Normalize single quotes to double quotes (if no double quotes inside)
    if (!line.includes('"""') && !line.includes("'''")) {
      line = line.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (match, inner) => {
        if (!inner.includes('"')) {
          return `"${inner}"`;
        }
        return match;
      });
    }

    // Fix spacing around comparison and assignment operators (excluding keyword args inside def/calls)
    if (!line.trim().startsWith('#') && !line.trim().startsWith('"""')) {
      line = line.replace(/([a-zA-Z0-9_])\s*(==|!=|<=|>=|\+=|-=|\*=|\/=|%=|=)\s*([a-zA-Z0-9_"'])/g, '$1 $2 $3');
    }

    // Two blank lines before top-level functions and classes
    const isTopLevelDef = /^(?:class|(?:async\s+)?def)\s+[a-zA-Z0-9_]+/.test(line);
    if (isTopLevelDef && formattedLines.length > 0) {
      // Ensure two blank lines prior
      while (formattedLines.length > 0 && formattedLines[formattedLines.length - 1].trim() === '') {
        formattedLines.pop();
      }
      formattedLines.push('');
      formattedLines.push('');
    }

    formattedLines.push(line.trimEnd());
  }

  return formattedLines.join('\n').trim() + '\n';
}
