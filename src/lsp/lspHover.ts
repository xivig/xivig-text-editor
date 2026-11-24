import { hoverTooltip, Tooltip } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { LspClient } from './lspClient';
import { offsetToPosition, rangeToOffsets } from './lspUtils';

export function createLspHoverExtension(filePath: string, languageId: string): Extension {
  if (!filePath || filePath.startsWith('untitled')) return [];

  return hoverTooltip(async (view, pos, side): Promise<Tooltip | null> => {
    const position = offsetToPosition(view.state.doc, pos);
    const hover = await LspClient.getHover(filePath, position, languageId);

    if (!hover || !hover.contents) return null;

    let contentText = '';
    if (typeof hover.contents === 'string') {
      contentText = hover.contents;
    } else if (Array.isArray(hover.contents)) {
      contentText = hover.contents
        .map((c: any) => (typeof c === 'string' ? c : c.value || ''))
        .join('\n\n');
    } else if (hover.contents.value) {
      contentText = hover.contents.value;
    }

    if (!contentText.trim()) return null;

    let rangeStart = pos;
    let rangeEnd = pos;
    if (hover.range) {
      const offsets = rangeToOffsets(view.state.doc, hover.range);
      rangeStart = offsets.from;
      rangeEnd = offsets.to;
    }

    return {
      pos: rangeStart,
      end: rangeEnd > rangeStart ? rangeEnd : undefined,
      above: true,
      arrow: true,
      create: () => {
        const dom = document.createElement('div');
        dom.className = 'cm-lsp-hover-tooltip';
        dom.style.padding = '8px 12px';
        dom.style.maxWidth = '480px';
        dom.style.fontSize = '12px';
        dom.style.lineHeight = '1.5';
        dom.style.backgroundColor = 'var(--xivig-surface, #1d2028)';
        dom.style.color = 'var(--xivig-text, #e5e7eb)';
        dom.style.border = '1px solid var(--xivig-border, #2c313d)';
        dom.style.borderRadius = '6px';
        dom.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
        dom.style.whiteSpace = 'pre-wrap';
        dom.style.fontFamily = 'var(--xivig-font-mono, monospace)';

        dom.textContent = contentText;
        return { dom };
      },
    };
  });
}
