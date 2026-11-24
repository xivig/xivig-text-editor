import { EditorView } from '@codemirror/view';
import { LspClient } from './lspClient';
import { offsetToPosition, applyLspTextEdits } from './lspUtils';
import { useLspStore } from './lspStore';
import { CodeAction, TextEdit } from './types';

export async function requestLspCodeActions(
  view: EditorView,
  filePath: string,
  languageId?: string
): Promise<CodeAction[]> {
  if (!filePath || filePath.startsWith('untitled')) return [];

  const pos = view.state.selection.main.head;
  const lspPos = offsetToPosition(view.state.doc, pos);
  const uri = LspClient.pathToUri(filePath);
  const allDiagnostics = useLspStore.getState().diagnosticsByUri[uri] || [];

  // Filter diagnostics on the current line
  const lineDiagnostics = allDiagnostics.filter(
    (d) => d.range.start.line <= lspPos.line && d.range.end.line >= lspPos.line
  );

  const actions = await LspClient.getCodeActions(
    filePath,
    { start: lspPos, end: lspPos },
    lineDiagnostics,
    languageId
  );

  return actions || [];
}

export function executeLspCodeAction(view: EditorView, action: CodeAction): boolean {
  if (action.edit?.changes) {
    for (const [, edits] of Object.entries(action.edit.changes)) {
      applyLspTextEdits(view, edits as TextEdit[]);
    }
    return true;
  }
  return false;
}

export async function organizeImports(
  view: EditorView,
  filePath: string,
  languageId?: string
): Promise<boolean> {
  const actions = await requestLspCodeActions(view, filePath, languageId);
  const organizeAction = actions.find(
    (a) => a.kind === 'source.organizeImports' || a.title.toLowerCase().includes('organize import')
  );

  if (organizeAction) {
    return executeLspCodeAction(view, organizeAction);
  }
  return false;
}
