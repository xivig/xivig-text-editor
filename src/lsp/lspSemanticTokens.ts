import { ViewPlugin, ViewUpdate, EditorView, Decoration, DecorationSet } from '@codemirror/view';
import { Extension, RangeSetBuilder } from '@codemirror/state';
import { LspClient } from './lspClient';

const TOKEN_TYPE_CLASSES: Record<number, string> = {
  0: 'cm-lsp-type',
  1: 'cm-lsp-class',
  2: 'cm-lsp-enum',
  3: 'cm-lsp-interface',
  4: 'cm-lsp-struct',
  5: 'cm-lsp-typeParameter',
  6: 'cm-lsp-parameter',
  7: 'cm-lsp-variable',
  8: 'cm-lsp-property',
  9: 'cm-lsp-enumMember',
  10: 'cm-lsp-event',
  11: 'cm-lsp-function',
  12: 'cm-lsp-method',
  13: 'cm-lsp-macro',
  14: 'cm-lsp-keyword',
  15: 'cm-lsp-modifier',
  16: 'cm-lsp-comment',
  17: 'cm-lsp-string',
  18: 'cm-lsp-number',
  19: 'cm-lsp-regexp',
  20: 'cm-lsp-operator',
  21: 'cm-lsp-decorator',
};

export function createLspSemanticTokensExtension(filePath: string, languageId: string): Extension {
  if (!filePath || filePath.startsWith('untitled')) return [];

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.none;
      private timer: NodeJS.Timeout | null = null;

      constructor(view: EditorView) {
        this.fetchTokens(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          if (this.timer) clearTimeout(this.timer);
          this.timer = setTimeout(() => this.fetchTokens(update.view), 500);
        }
      }

      async fetchTokens(view: EditorView) {
        const tokens = await LspClient.getSemanticTokens(filePath, languageId);
        if (!tokens || !tokens.data || tokens.data.length === 0) {
          this.decorations = Decoration.none;
          return;
        }

        const data = tokens.data;
        const builder = new RangeSetBuilder<Decoration>();
        let currentLine = 0;
        let currentChar = 0;

        for (let i = 0; i < data.length; i += 5) {
          const deltaLine = data[i];
          const deltaStartChar = data[i + 1];
          const length = data[i + 2];
          const tokenType = data[i + 3];

          if (deltaLine > 0) {
            currentLine += deltaLine;
            currentChar = deltaStartChar;
          } else {
            currentChar += deltaStartChar;
          }

          const lineNumber = currentLine + 1;
          if (lineNumber <= view.state.doc.lines) {
            const line = view.state.doc.line(lineNumber);
            const from = Math.min(line.from + currentChar, line.to);
            const to = Math.min(from + length, line.to);

            if (from < to) {
              const className = TOKEN_TYPE_CLASSES[tokenType] || 'cm-lsp-token';
              builder.add(
                from,
                to,
                Decoration.mark({ class: className })
              );
            }
          }
        }

        this.decorations = builder.finish();
      }

      destroy() {
        if (this.timer) clearTimeout(this.timer);
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}
