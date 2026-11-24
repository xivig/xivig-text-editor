import { EditorConfigSettings } from './types';

export const DEFAULT_EDITORCONFIG_SETTINGS: EditorConfigSettings = {
  enabled: true,
  respectRootConfig: true,
  defaultIndentStyle: 'space',
  defaultIndentSize: 2,
  trimTrailingWhitespace: true,
  insertFinalNewline: true,
};

export interface EditorConfigRules {
  indentStyle?: 'space' | 'tab';
  indentSize?: number;
  endOfLine?: 'lf' | 'crlf';
  trimTrailingWhitespace?: boolean;
  insertFinalNewline?: boolean;
  maxLineLength?: number;
}

export function parseEditorConfig(content: string, targetFilename = ''): EditorConfigRules {
  const lines = content.split('\n');
  let currentSectionMatches = true; // default matches all until first section
  const rules: EditorConfigRules = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;

    // Check section header: e.g. [*] or [*.ts]
    if (line.startsWith('[') && line.endsWith(']')) {
      const section = line.slice(1, -1).trim();
      if (section === '*') {
        currentSectionMatches = true;
      } else if (targetFilename) {
        // Simple glob match: *.ext or *
        const ext = targetFilename.split('.').pop() || '';
        if (section.includes(ext) || section === '*') {
          currentSectionMatches = true;
        } else {
          currentSectionMatches = false;
        }
      } else {
        currentSectionMatches = true;
      }
      continue;
    }

    if (!currentSectionMatches) continue;

    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;

    const key = line.slice(0, eqIdx).trim().toLowerCase();
    const val = line.slice(eqIdx + 1).trim().toLowerCase();

    if (key === 'indent_style') {
      rules.indentStyle = val === 'tab' ? 'tab' : 'space';
    } else if (key === 'indent_size') {
      const num = parseInt(val, 10);
      if (!isNaN(num)) rules.indentSize = num;
    } else if (key === 'end_of_line') {
      rules.endOfLine = val === 'crlf' ? 'crlf' : 'lf';
    } else if (key === 'trim_trailing_whitespace') {
      rules.trimTrailingWhitespace = val === 'true';
    } else if (key === 'insert_final_newline') {
      rules.insertFinalNewline = val === 'true';
    } else if (key === 'max_line_length') {
      const num = parseInt(val, 10);
      if (!isNaN(num)) rules.maxLineLength = num;
    }
  }

  return rules;
}

export function applyEditorConfigTransform(
  text: string,
  rules: EditorConfigRules
): string {
  let result = text;

  // Trim trailing whitespace
  if (rules.trimTrailingWhitespace) {
    result = result
      .split('\n')
      .map((line) => line.replace(/[ \t]+$/, ''))
      .join('\n');
  }

  // End of line normalization
  if (rules.endOfLine === 'crlf') {
    result = result.replace(/\r?\n/g, '\r\n');
  } else if (rules.endOfLine === 'lf') {
    result = result.replace(/\r\n/g, '\n');
  }

  // Insert final newline
  if (rules.insertFinalNewline && !result.endsWith('\n')) {
    result += (rules.endOfLine === 'crlf' ? '\r\n' : '\n');
  }

  return result;
}
