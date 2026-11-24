import { Tooltip, showTooltip, EditorView } from '@codemirror/view';
import { StateField, StateEffect, Extension } from '@codemirror/state';
import { LspClient } from './lspClient';
import { offsetToPosition } from './lspUtils';

const setSignatureTooltip = StateEffect.define<Tooltip | null>();

const signatureTooltipField = StateField.define<Tooltip | null>({
  create: () => null,
  update(tooltip, tr) {
    for (const e of tr.effects) {
      if (e.is(setSignatureTooltip)) return e.value;
    }
    return tr.docChanged || tr.selection ? null : tooltip;
  },
  provide: (f) => showTooltip.from(f, (val) => val),
});

export function createLspSignatureHelpExtension(filePath: string, languageId: string): Extension {
  if (!filePath || filePath.startsWith('untitled')) return [];

  const domListener = EditorView.domEventHandlers({
    keyup: (event, view) => {
      if (event.key === '(' || event.key === ',' || (event.ctrlKey && event.shiftKey && event.key === 'Space')) {
        const pos = view.state.selection.main.head;
        const position = offsetToPosition(view.state.doc, pos);

        LspClient.getSignatureHelp(filePath, position, languageId).then((help) => {
          if (!help || !help.signatures || help.signatures.length === 0) {
            view.dispatch({ effects: setSignatureTooltip.of(null) });
            return;
          }

          const activeSigIndex = help.activeSignature ?? 0;
          const sig = help.signatures[activeSigIndex] || help.signatures[0];
          const activeParamIndex = help.activeParameter ?? sig.activeParameter ?? 0;

          const tooltip: Tooltip = {
            pos,
            above: true,
            arrow: true,
            create: () => {
              const dom = document.createElement('div');
              dom.className = 'cm-lsp-signature-tooltip';
              dom.style.padding = '6px 10px';
              dom.style.fontSize = '12px';
              dom.style.backgroundColor = 'var(--xivig-surface, #1d2028)';
              dom.style.color = 'var(--xivig-text, #e5e7eb)';
              dom.style.border = '1px solid var(--xivig-accent, #6c8cff)';
              dom.style.borderRadius = '4px';
              dom.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
              dom.style.fontFamily = 'var(--xivig-font-mono, monospace)';

              const labelEl = document.createElement('div');
              labelEl.style.fontWeight = '600';
              labelEl.textContent = sig.label;
              dom.appendChild(labelEl);

              if (sig.parameters && sig.parameters[activeParamIndex]) {
                const param = sig.parameters[activeParamIndex];
                const paramLabel = typeof param.label === 'string'
                  ? param.label
                  : sig.label.substring(param.label[0], param.label[1]);

                const paramEl = document.createElement('div');
                paramEl.style.fontSize = '11px';
                paramEl.style.color = 'var(--xivig-accent, #6c8cff)';
                paramEl.style.marginTop = '4px';
                paramEl.textContent = `Parameter: ${paramLabel}`;
                dom.appendChild(paramEl);
              }

              return { dom };
            },
          };

          view.dispatch({ effects: setSignatureTooltip.of(tooltip) });
        }).catch(() => {
          view.dispatch({ effects: setSignatureTooltip.of(null) });
        });
      }
    },
  });

  return [signatureTooltipField, domListener];
}
