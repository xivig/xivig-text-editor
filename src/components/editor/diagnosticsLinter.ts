import { linter, lintGutter, Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Extension } from '@codemirror/state';
import { useDiagnosticsStore, DiagnosticItem } from '../../stores/diagnosticsStore';

export function createDiagnosticsLinter(docId: string, docPath: string | null, docName: string): Extension[] {
  const customLinter = linter((view: EditorView) => {
    const doc = view.state.doc;
    const text = doc.toString();
    const diagnostics: Diagnostic[] = [];
    const ext = docName.split('.').pop()?.toLowerCase() || '';

    // 1. JSON Parser validation
    if (ext === 'json') {
      try {
        JSON.parse(text);
      } catch (err: any) {
        let pos = 0;
        const msg: string = err.message || 'JSON Syntax Error';

        // Check for "at position X" in error message
        const posMatch = msg.match(/at position (\d+)/i);
        if (posMatch) {
          pos = Math.min(doc.length, parseInt(posMatch[1], 10));
        } else {
          // Check for line/col format
          const lineMatch = msg.match(/line (\d+) column (\d+)/i);
          if (lineMatch) {
            const lineNum = parseInt(lineMatch[1], 10);
            const colNum = parseInt(lineMatch[2], 10);
            if (lineNum <= doc.lines) {
              const line = doc.line(lineNum);
              pos = Math.min(doc.length, line.from + Math.max(0, colNum - 1));
            }
          }
        }

        const from = Math.max(0, Math.min(doc.length, pos));
        const to = Math.min(doc.length, from + 1);

        diagnostics.push({
          from,
          to,
          severity: 'error',
          source: 'json',
          message: msg,
        });
      }
    }

    // 2. Syntax Tree Error Node Analysis (Lezer error nodes)
    try {
      const tree = syntaxTree(view.state);
      tree.iterate({
        enter: (node) => {
          if (node.type.isError || node.name === '⚠') {
            const from = Math.max(0, node.from);
            const to = Math.max(from + 1, Math.min(doc.length, node.to));
            const badSlice = text.slice(from, to) || 'token';

            diagnostics.push({
              from,
              to,
              severity: 'error',
              source: ext || 'syntax',
              message: `Syntax error: Unexpected ${badSlice === '\n' ? 'newline' : `token '${badSlice}'`}`,
            });

            // Cap at 25 syntax tree errors to avoid overloading view
            if (diagnostics.length >= 25) return false;
          }
        },
      });
    } catch {
      // ignore syntax tree traversal errors
    }

    // 3. Unclosed String / Template Literal Quick Check
    if (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx') {
      for (let i = 1; i <= Math.min(doc.lines, 2000); i++) {
        const line = doc.line(i);
        const lineText = line.text;

        // Check for unterminated single/double quotes (if odd number of unescaped quotes)
        const dqCount = (lineText.match(/(?<!\\)"/g) || []).length;
        const sqCount = (lineText.match(/(?<!\\)'/g) || []).length;

        // Ignore comment lines
        const trimmed = lineText.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }

        if (dqCount % 2 !== 0 && !lineText.includes('`')) {
          diagnostics.push({
            from: line.from,
            to: line.to,
            severity: 'warning',
            source: 'syntax',
            message: `Possible unterminated string literal on line ${i}`,
          });
        } else if (sqCount % 2 !== 0 && !lineText.includes('`')) {
          diagnostics.push({
            from: line.from,
            to: line.to,
            severity: 'warning',
            source: 'syntax',
            message: `Possible unterminated single-quote string on line ${i}`,
          });
        }
      }
    }

    // Convert to centralized diagnostics store items
    const storeItems: DiagnosticItem[] = diagnostics.map((d, index) => {
      const lineObj = doc.lineAt(d.from);
      return {
        id: `${docId}-${index}-${d.from}`,
        docId,
        filePath: docPath || docName,
        fileName: docName,
        line: lineObj.number,
        col: d.from - lineObj.from + 1,
        from: d.from,
        to: d.to,
        message: d.message,
        severity: d.severity as 'error' | 'warning' | 'info',
        source: d.source || 'linter',
      };
    });

    // Update global store asynchronously
    setTimeout(() => {
      useDiagnosticsStore.getState().setDiagnostics(docId, storeItems);
    }, 10);

    return diagnostics;
  }, { delay: 350 });

  return [lintGutter(), customLinter];
}
