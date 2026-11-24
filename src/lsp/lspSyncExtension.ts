import { ViewPlugin, ViewUpdate, EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { LspClient } from './lspClient';

export function createLspSyncExtension(filePath: string, languageId: string): Extension {
  if (!filePath || filePath.startsWith('untitled')) {
    return [];
  }

  const uri = LspClient.pathToUri(filePath);

  return ViewPlugin.fromClass(
    class {
      private version = 1;
      private changeTimeout: NodeJS.Timeout | null = null;

      constructor(view: EditorView) {
        // Open document in LSP
        LspClient.openDocument(
          {
            uri,
            languageId,
            version: this.version,
            text: view.state.doc.toString(),
          },
          filePath
        );
      }

      update(update: ViewUpdate) {
        if (update.docChanged) {
          this.version++;
          if (this.changeTimeout) {
            clearTimeout(this.changeTimeout);
          }

          // Debounce textDocument/didChange slightly (150ms) to avoid flooding on fast typing
          this.changeTimeout = setTimeout(() => {
            const currentText = update.view.state.doc.toString();
            LspClient.changeDocument(uri, currentText, filePath, languageId);
          }, 150);
        }
      }

      destroy() {
        if (this.changeTimeout) {
          clearTimeout(this.changeTimeout);
        }
        LspClient.closeDocument(uri, filePath, languageId);
      }
    }
  );
}
