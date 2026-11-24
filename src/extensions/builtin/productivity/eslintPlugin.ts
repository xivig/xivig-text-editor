import { Diagnostic, linter } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { ESLintSettings } from './types';

export const DEFAULT_ESLINT_SETTINGS: ESLintSettings = {
  enabled: true,
  runOnType: true,
  noUnusedVars: true,
  noUndef: true,
  eqeqeq: true,
  noDebugger: true,
  preferConst: true,
  noExtraSemi: true,
};

export function lintJavaScriptCode(
  code: string,
  settings: ESLintSettings = DEFAULT_ESLINT_SETTINGS
): Diagnostic[] {
  if (!settings.enabled) return [];

  const diagnostics: Diagnostic[] = [];
  const lines = code.split('\n');

  let pos = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStart = pos;

    // Check no-debugger
    if (settings.noDebugger) {
      const match = /\bdebugger\b/.exec(line);
      if (match) {
        diagnostics.push({
          from: lineStart + match.index,
          to: lineStart + match.index + match[0].length,
          severity: 'error',
          source: 'eslint(no-debugger)',
          message: 'Unexpected "debugger" statement.',
          actions: [
            {
              name: 'Remove debugger',
              apply(view, from, to) {
                view.dispatch({ changes: { from, to, insert: '' } });
              },
            },
          ],
        });
      }
    }

    // Check eqeqeq (== and !=)
    if (settings.eqeqeq) {
      const eqMatch = /([^=!<>])(==|!=)([^=])/.exec(line);
      if (eqMatch && !line.trim().startsWith('//')) {
        const op = eqMatch[2];
        const opIndex = eqMatch.index + eqMatch[1].length;
        const replacement = op === '==' ? '===' : '!==';
        diagnostics.push({
          from: lineStart + opIndex,
          to: lineStart + opIndex + op.length,
          severity: 'warning',
          source: 'eslint(eqeqeq)',
          message: `Expected "${replacement}" and instead saw "${op}".`,
          actions: [
            {
              name: `Replace with "${replacement}"`,
              apply(view, from, to) {
                view.dispatch({ changes: { from, to, insert: replacement } });
              },
            },
          ],
        });
      }
    }

    // Check no-var
    const varMatch = /\bvar\s+([a-zA-Z_$][0-9a-zA-Z_$]*)/.exec(line);
    if (varMatch && !line.trim().startsWith('//')) {
      const varIndex = varMatch.index;
      diagnostics.push({
        from: lineStart + varIndex,
        to: lineStart + varIndex + 3,
        severity: 'warning',
        source: 'eslint(no-var)',
        message: 'Unexpected "var", use "let" or "const" instead.',
        actions: [
          {
            name: 'Replace with "const"',
            apply(view, from, to) {
              view.dispatch({ changes: { from, to, insert: 'const' } });
            },
          },
          {
            name: 'Replace with "let"',
            apply(view, from, to) {
              view.dispatch({ changes: { from, to, insert: 'let' } });
            },
          },
        ],
      });
    }

    // Check no-extra-semi (;;)
    if (settings.noExtraSemi) {
      const semiMatch = /;;\s*$/.exec(line);
      if (semiMatch && !line.trim().startsWith('//')) {
        const semiIndex = semiMatch.index;
        diagnostics.push({
          from: lineStart + semiIndex + 1,
          to: lineStart + semiIndex + 2,
          severity: 'warning',
          source: 'eslint(no-extra-semi)',
          message: 'Unnecessary semicolon.',
          actions: [
            {
              name: 'Remove extra semicolon',
              apply(view, from, to) {
                view.dispatch({ changes: { from, to, insert: '' } });
              },
            },
          ],
        });
      }
    }

    // Check no-unused-vars in current file
    if (settings.noUnusedVars) {
      const declMatch = /(?:const|let|var)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=/.exec(line);
      if (declMatch && !line.trim().startsWith('//')) {
        const varName = declMatch[1];
        // Count occurrences of varName in whole code
        const wordRegex = new RegExp(`\\b${varName}\\b`, 'g');
        const count = (code.match(wordRegex) || []).length;
        if (count === 1) {
          const varStart = lineStart + declMatch.index + declMatch[0].indexOf(varName);
          diagnostics.push({
            from: varStart,
            to: varStart + varName.length,
            severity: 'warning',
            source: 'eslint(no-unused-vars)',
            message: `'${varName}' is defined but never used.`,
          });
        }
      }
    }

    pos += line.length + 1; // +1 for newline
  }

  return diagnostics;
}

export function createESLintPlugin(settings: ESLintSettings = DEFAULT_ESLINT_SETTINGS) {
  return linter((view: EditorView) => {
    const docText = view.state.doc.toString();
    return lintJavaScriptCode(docText, settings);
  });
}
