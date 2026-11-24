import { ViewPlugin, ViewUpdate, EditorView, Decoration, DecorationSet, WidgetType } from '@codemirror/view';
import { Extension, RangeSetBuilder } from '@codemirror/state';
import { LspClient } from './lspClient';
import { positionToOffset } from './lspUtils';
import { CodeLens } from './types';

class CodeLensWidget extends WidgetType {
  constructor(private title: string, private onClick?: () => void) {
    super();
  }

  toDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'cm-lsp-codelens';
    div.style.fontSize = '11px';
    div.style.color = 'var(--xivig-accent, #6c8cff)';
    div.style.cursor = 'pointer';
    div.style.padding = '1px 0 2px 2px';
    div.style.lineHeight = '1';
    div.style.userSelect = 'none';
    div.textContent = this.title;

    if (this.onClick) {
      div.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onClick?.();
      };
    }

    return div;
  }
}

export function createLspCodeLensExtension(filePath: string, languageId: string): Extension {
  if (!filePath || filePath.startsWith('untitled')) return [];

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.none;
      private timer: NodeJS.Timeout | null = null;

      constructor(view: EditorView) {
        this.fetchLenses(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          if (this.timer) clearTimeout(this.timer);
          this.timer = setTimeout(() => this.fetchLenses(update.view), 400);
        }
      }

      async fetchLenses(view: EditorView) {
        const lenses = await LspClient.getCodeLenses(filePath, languageId);
        if (!lenses || lenses.length === 0) {
          this.decorations = Decoration.none;
          return;
        }

        const builder = new RangeSetBuilder<Decoration>();
        for (const lens of lenses) {
          if (!lens.command?.title) continue;
          const offset = positionToOffset(view.state.doc, lens.range.start);
          const line = view.state.doc.lineAt(offset);

          builder.add(
            line.from,
            line.from,
            Decoration.widget({
              widget: new CodeLensWidget(lens.command.title),
              block: true,
              side: -1,
            })
          );
        }

        this.decorations = builder.finish();
        view.requestMeasure();
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
