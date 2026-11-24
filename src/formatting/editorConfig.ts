export interface EditorConfigRules {
  indent_style?: 'tab' | 'space';
  indent_size?: number;
  tab_width?: number;
  end_of_line?: 'lf' | 'crlf' | 'cr';
  trim_trailing_whitespace?: boolean;
  insert_final_newline?: boolean;
  charset?: string;
}

/**
 * Enforces EditorConfig whitespace and newline constraints on text.
 */
export function applyEditorConfigToText(text: string, rules: EditorConfigRules): string {
  let result = text;

  // 1. Trim trailing whitespace per line
  if (rules.trim_trailing_whitespace) {
    result = result
      .split('\n')
      .map((line) => line.replace(/[ \t\r]+$/, ''))
      .join('\n');
  }

  // 2. End of line normalization
  if (rules.end_of_line) {
    const eolStr = rules.end_of_line === 'crlf' ? '\r\n' : rules.end_of_line === 'cr' ? '\r' : '\n';
    result = result.replace(/\r\n|\r|\n/g, '\n').replace(/\n/g, eolStr);
  }

  // 3. Insert final newline
  if (rules.insert_final_newline) {
    const eol = rules.end_of_line === 'crlf' ? '\r\n' : '\n';
    if (!result.endsWith('\n') && !result.endsWith('\r')) {
      result += eol;
    }
  }

  return result;
}
