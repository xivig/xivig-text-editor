import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { Range } from '@codemirror/state';
import { RAINBOW_COLORS } from './settings';

export interface IndentGuidesConfig {
  tabSize?: number;
}

/**
 * Creates vertical rainbow indent guide decorations for visible lines in the editor.
 */
export function createIndentGuideDecorations(
  view: EditorView,
  tabSize: number = 4
): DecorationSet {
  const doc = view.state.doc;
  if (doc.length === 0) {
    return Decoration.none;
  }

  const ranges: Range<Decoration>[] = [];
  const activeLineNo = doc.lineAt(view.state.selection.main.head).number;

  // Viewport bounds
  const fromLine = doc.lineAt(view.viewport.from);
  const toLine = doc.lineAt(view.viewport.to);

  for (let lineNo = fromLine.number; lineNo <= toLine.number; lineNo++) {
    const line = doc.line(lineNo);
    const text = line.text;

    if (text.length === 0) continue;

    // Determine leading whitespace length
    let indentEnd = 0;
    while (
      indentEnd < text.length &&
      (text[indentEnd] === ' ' || text[indentEnd] === '\t')
    ) {
      indentEnd++;
    }

    if (indentEnd === 0) continue;

    const isActiveLine = lineNo === activeLineNo;
    let visualCol = 0;

    for (let charIdx = 0; charIdx < indentEnd; charIdx++) {
      const ch = text[charIdx];

      if (ch === '\t') {
        const depth = Math.floor(visualCol / tabSize);
        const color = RAINBOW_COLORS[depth % RAINBOW_COLORS.length];
        const activeClass = isActiveLine ? ' xivig-indent-guide-active' : '';

        const deco = Decoration.mark({
          class: `xivig-indent-guide xivig-indent-guide-${color}${activeClass}`,
        });
        ranges.push(deco.range(line.from + charIdx, line.from + charIdx + 1));

        visualCol += tabSize - (visualCol % tabSize);
      } else if (ch === ' ') {
        if (visualCol % tabSize === 0) {
          const depth = Math.floor(visualCol / tabSize);
          const color = RAINBOW_COLORS[depth % RAINBOW_COLORS.length];
          const activeClass = isActiveLine ? ' xivig-indent-guide-active' : '';

          // Span up to tabSize spaces or until indentEnd
          const chunkEnd = Math.min(charIdx + tabSize, indentEnd);
          const deco = Decoration.mark({
            class: `xivig-indent-guide xivig-indent-guide-${color}${activeClass}`,
          });

          ranges.push(deco.range(line.from + charIdx, line.from + chunkEnd));

          const spanLen = chunkEnd - charIdx;
          visualCol += spanLen;
          charIdx = chunkEnd - 1; // loop will increment by 1
        } else {
          visualCol++;
        }
      }
    }
  }

  if (ranges.length === 0) {
    return Decoration.none;
  }

  ranges.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(ranges, true);
}

/**
 * Creates the CodeMirror ViewPlugin for rainbow indent guides.
 */
export function createIndentGuidesPlugin(tabSize: number = 4) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      currentTabSize: number;

      constructor(view: EditorView) {
        this.currentTabSize = tabSize;
        this.decorations = createIndentGuideDecorations(view, this.currentTabSize);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.selectionSet
        ) {
          this.decorations = createIndentGuideDecorations(update.view, this.currentTabSize);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}
