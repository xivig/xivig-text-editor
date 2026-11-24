import fs from 'node:fs';
import path from 'node:path';

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
 * Simple glob matcher for EditorConfig patterns like:
 * '*', '*.{js,ts}', '[Mm]akefile', 'src/**\/*.py'
 */
function matchEditorConfigGlob(pattern: string, relativePath: string): boolean {
  const normRel = relativePath.replace(/\\/g, '/');
  const normPattern = pattern.replace(/\\/g, '/');

  // Convert editorconfig glob into RegExp
  let regexStr = '^';
  let i = 0;
  while (i < normPattern.length) {
    const c = normPattern[i];
    if (c === '*') {
      if (normPattern[i + 1] === '*') {
        regexStr += '.*';
        i += 2;
        continue;
      } else {
        regexStr += '[^/]*';
        i++;
        continue;
      }
    } else if (c === '?') {
      regexStr += '[^/]';
      i++;
      continue;
    } else if (c === '{') {
      const closing = normPattern.indexOf('}', i);
      if (closing !== -1) {
        const parts = normPattern.slice(i + 1, closing).split(',');
        regexStr += `(${parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`;
        i = closing + 1;
        continue;
      }
    } else if ('()+^$|[]\\'.includes(c)) {
      regexStr += '\\' + c;
      i++;
      continue;
    }
    regexStr += c;
    i++;
  }
  regexStr += '$';

  try {
    const re = new RegExp(regexStr);
    return re.test(normRel) || re.test(path.basename(normRel));
  } catch {
    return false;
  }
}

/**
 * Searches up parent directories from filePath until root or a file with `root = true` is found.
 */
export function resolveEditorConfig(filePath: string, workspaceRoot?: string): EditorConfigRules {
  const rules: EditorConfigRules = {};
  if (!filePath) return rules;

  const resolvedTarget = path.resolve(filePath);
  let currentDir = path.dirname(resolvedTarget);
  const configs: Array<{ dir: string; content: string }> = [];

  while (true) {
    const candidate = path.join(currentDir, '.editorconfig');
    if (fs.existsSync(candidate)) {
      try {
        const text = fs.readFileSync(candidate, 'utf8');
        configs.push({ dir: currentDir, content: text });
        if (/^\s*root\s*=\s*true/im.test(text)) {
          break;
        }
      } catch {
        // ignore read error
      }
    }

    if (workspaceRoot && path.resolve(currentDir) === path.resolve(workspaceRoot)) {
      break;
    }
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }

  // Apply configurations from root-most down to closest
  for (let idx = configs.length - 1; idx >= 0; idx--) {
    const { dir, content } = configs[idx];
    const rel = path.relative(dir, resolvedTarget).replace(/\\/g, '/');
    parseAndApplyEditorConfigSection(content, rel, rules);
  }

  return rules;
}

function parseAndApplyEditorConfigSection(content: string, relativePath: string, outRules: EditorConfigRules) {
  const lines = content.split('\n');
  let currentSectionApplies = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;

    if (line.startsWith('[') && line.endsWith(']')) {
      const globPattern = line.slice(1, -1).trim();
      currentSectionApplies = matchEditorConfigGlob(globPattern, relativePath);
      continue;
    }

    if (currentSectionApplies || line.toLowerCase().startsWith('root')) {
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim().toLowerCase();
      const val = line.slice(eqIdx + 1).trim().toLowerCase();

      switch (key) {
        case 'indent_style':
          if (val === 'tab' || val === 'space') outRules.indent_style = val;
          break;
        case 'indent_size':
          if (val === 'tab') {
            outRules.indent_size = outRules.tab_width || 4;
          } else {
            const num = parseInt(val, 10);
            if (!isNaN(num)) outRules.indent_size = num;
          }
          break;
        case 'tab_width': {
          const num = parseInt(val, 10);
          if (!isNaN(num)) outRules.tab_width = num;
          break;
        }
        case 'end_of_line':
          if (val === 'lf' || val === 'crlf' || val === 'cr') outRules.end_of_line = val;
          break;
        case 'trim_trailing_whitespace':
          outRules.trim_trailing_whitespace = val === 'true';
          break;
        case 'insert_final_newline':
          outRules.insert_final_newline = val === 'true';
          break;
        case 'charset':
          outRules.charset = val;
          break;
      }
    }
  }
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
