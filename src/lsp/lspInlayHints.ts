import { ViewPlugin, ViewUpdate, EditorView, Decoration, DecorationSet, WidgetType } from '@codemirror/view';
import { Extension, RangeSetBuilder } from '@codemirror/state';
import { LspClient } from './lspClient';
import { positionToOffset, offsetToPosition } from './lspUtils';
import { InlayHint, InlayHintKind } from './types';

class InlayHintWidget extends WidgetType {
  constructor(private label: string, private kind?: InlayHintKind) {
    super();
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-lsp-inlay-hint';
    span.style.fontSize = '0.85em';
    span.style.opacity = '0.65';
    span.style.color = 'var(--xivig-text-dim, #646b7a)';
    span.style.userSelect = 'none';
    span.style.pointerEvents = 'none';
    span.style.fontStyle = 'italic';
    span.style.padding = '0 2px';

    if (this.kind === InlayHintKind.Parameter) {
      span.textContent = `${this.label}:`;
    } else if (this.kind === InlayHintKind.Type) {
      span.textContent = `: ${this.label}`;
    } else {
      span.textContent = this.label;
    }

    return span;
  }
}

export function createLspInlayHintsExtension(filePath: string, languageId: string): Extension {
  if (!filePath || filePath.startsWith('untitled')) return [];

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.none;
      private timer: NodeJS.Timeout | null = null;

      constructor(view: EditorView) {
        this.fetchHints(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          if (this.timer) clearTimeout(this.timer);
          this.timer = setTimeout(() => this.fetchHints(update.view), 300);
        }
      }

      async fetchHints(view: EditorView) {
        const startPos = offsetToPosition(view.state.doc, view.viewport.from);
        const endPos = offsetToPosition(view.state.doc, view.viewport.to);

        const hints = await LspClient.getInlayHints(
          filePath,
          { start: startPos, end: endPos },
          languageId
        );

        if (!hints || hints.length === 0) {
          this.decorations = Decoration.none;
          return;
        }

        const builder = new RangeSetBuilder<Decoration>();
        const sorted = [...hints].sort((a, b) => {
          if (a.position.line !== b.position.line) return a.position.line - b.position.line;
          return a.position.character - b.position.character;
        });

        for (const hint of sorted) {
          const offset = positionToOffset(view.state.doc, hint.position);
          if (offset >= 0 && offset <= view.state.doc.length) {
            builder.add(
              offset,
              offset,
              Decoration.widget({
                widget: new InlayHintWidget(hint.label, hint.kind),
                side: 1,
              })
            );
          }
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
