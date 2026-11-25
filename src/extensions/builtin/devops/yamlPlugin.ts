import { YamlValidationResult, YamlSettings } from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export const DEFAULT_YAML_SETTINGS: YamlSettings = {
  enabled: true,
  indentSize: 2,
  prohibitTabs: true,
};

/**
 * Validates YAML formatting, indentation consistency, and tab prohibition.
 */
export function validateYamlIndentation(yamlContent: string): YamlValidationResult {
  const errors: Array<{ line: number; message: string }> = [];
  if (!yamlContent || !yamlContent.trim()) {
    return { valid: true, errors: [] };
  }

  const lines = yamlContent.split(/\r?\n/);

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const lineNum = idx + 1;

    // 1. Prohibit tabs for indentation in YAML
    if (/^\t+/.test(line)) {
      errors.push({
        line: lineNum,
        message: 'Tabs are strictly forbidden for indentation in YAML. Use spaces instead.',
      });
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // 2. Colon spacing check: key:value without space after colon (except in URLs)
    const colonMatch = trimmed.match(/^([a-zA-Z0-9_-]+):([^\s/].*)$/);
    if (colonMatch && !colonMatch[2].startsWith('/')) {
      errors.push({
        line: lineNum,
        message: `Missing space after colon in '${colonMatch[1]}:${colonMatch[2]}'`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Autocompletion for YAML keywords and boolean/null literals.
 */
export function createYamlCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z_-]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const literals = ['true', 'false', 'null', 'yes', 'no', 'on', 'off'];
    const norm = word.text.toLowerCase();
    const matches = literals.filter((l) => l.startsWith(norm));
    if (matches.length === 0) return null;

    return {
      from: word.from,
      options: matches.map((l) => ({
        label: l,
        type: 'keyword',
        detail: 'YAML Literal',
        boost: 2,
      })),
    };
  };
}
