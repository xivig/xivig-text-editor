import { EditorView } from '@codemirror/view';
import { LspClient } from './lspClient';
import { applyLspTextEdits } from './lspUtils';

export async function formatDocumentWithLsp(
  view: EditorView,
  filePath: string,
  tabSize = 2,
  insertSpaces = true,
  languageId?: string
): Promise<boolean> {
  if (!filePath || filePath.startsWith('untitled')) return false;

  const edits = await LspClient.formatDocument(
    filePath,
    {
      tabSize,
      insertSpaces,
      trimTrailingWhitespace: true,
      insertFinalNewline: true,
      trimFinalNewlines: true,
    },
    languageId
  );

  if (edits && edits.length > 0) {
    applyLspTextEdits(view, edits);
    return true;
  }
  return false;
}
