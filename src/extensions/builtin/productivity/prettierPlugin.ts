import jsBeautify from 'js-beautify';
import { PrettierSettings } from './types';

export const DEFAULT_PRETTIER_SETTINGS: PrettierSettings = {
  enabled: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
};

export function formatWithPrettier(
  code: string,
  language: string,
  settings: PrettierSettings = DEFAULT_PRETTIER_SETTINGS
): string {
  if (!settings.enabled || !code.trim()) {
    return code;
  }

  const lang = (language || '').toLowerCase();
  const indentChar = settings.useTabs ? '\t' : ' ';
  const indentSize = settings.tabWidth || 2;

  // JSON formatting
  if (lang.includes('json')) {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, settings.useTabs ? '\t' : indentSize) + '\n';
    } catch {
      // If parsing fails, fall back to js_beautify
    }
  }

  // HTML / XML formatting
  if (lang.includes('html') || lang.includes('xml') || lang.includes('svg')) {
    return jsBeautify.html(code, {
      indent_size: indentSize,
      indent_char: indentChar,
      wrap_line_length: settings.printWidth,
      end_with_newline: true,
    });
  }

  // CSS / SCSS / LESS formatting
  if (lang.includes('css') || lang.includes('scss') || lang.includes('less')) {
    return jsBeautify.css(code, {
      indent_size: indentSize,
      indent_char: indentChar,
      end_with_newline: true,
    });
  }

  // JS / TS / JSX / TSX formatting
  let formatted = jsBeautify.js(code, {
    indent_size: indentSize,
    indent_char: indentChar,
    wrap_line_length: settings.printWidth,
    end_with_newline: true,
    space_in_paren: false,
    space_in_empty_paren: false,
    jslint_happy: false,
    space_after_anon_function: true,
  });

  // Apply Prettier-style quote and semicolon normalization
  if (settings.singleQuote) {
    // Convert double quotes to single quotes where safe
    formatted = formatted.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, inner) => {
      if (inner.includes("'") && !inner.includes('"')) {
        return match; // preserve if single quote is inside
      }
      return `'${inner.replace(/\\"/g, '"').replace(/'/g, "\\'")}'`;
    });
  }

  if (!settings.semi) {
    // Strip trailing semicolons from statements (not inside for loops)
    formatted = formatted.replace(/;\s*$/gm, '');
  }

  return formatted;
}
