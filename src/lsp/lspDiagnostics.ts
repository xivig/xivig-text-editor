import { linter, Diagnostic as CmDiagnostic } from '@codemirror/lint';
import { Extension } from '@codemirror/state';
import { useLspStore } from './lspStore';
import { LspClient } from './lspClient';
import { rangeToOffsets } from './lspUtils';
import { DiagnosticSeverity } from './types';

export function createLspDiagnosticsLinter(filePath: string): Extension {
  if (!filePath || filePath.startsWith('untitled')) return [];

  const uri = LspClient.pathToUri(filePath);

  return linter((view): CmDiagnostic[] => {
    const diagnostics = useLspStore.getState().diagnosticsByUri[uri] || [];
    if (diagnostics.length === 0) return [];

    const doc = view.state.doc;
    const cmDiagnostics: CmDiagnostic[] = [];

    for (const d of diagnostics) {
      const { from, to } = rangeToOffsets(doc, d.range);
      let severity: 'error' | 'warning' | 'info' | 'hint' = 'error';

      if (d.severity === DiagnosticSeverity.Warning) {
        severity = 'warning';
      } else if (d.severity === DiagnosticSeverity.Information) {
        severity = 'info';
      } else if (d.severity === DiagnosticSeverity.Hint) {
        severity = 'hint';
      }

      cmDiagnostics.push({
        from: Math.min(from, doc.length),
        to: Math.min(Math.max(from, to), doc.length),
        severity,
        message: d.source ? `[${d.source}] ${d.message}` : d.message,
      });
    }

    return cmDiagnostics;
  });
}
