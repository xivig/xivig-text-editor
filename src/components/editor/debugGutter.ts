import { gutter, GutterMarker, EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { Extension, RangeSet, RangeSetBuilder } from '@codemirror/state';
import { useDebugStore, SourceBreakpoint } from '../../stores/debugStore';

class BreakpointMarker extends GutterMarker {
  constructor(public bp?: SourceBreakpoint) {
    super();
  }

  toDOM(): HTMLElement {
    const dot = document.createElement('div');
    dot.className = 'cm-debug-breakpoint-marker';
    dot.style.width = '10px';
    dot.style.height = '10px';
    dot.style.margin = '0 auto';
    dot.style.borderRadius = '50%';
    dot.style.cursor = 'pointer';

    if (this.bp?.condition) {
      dot.style.backgroundColor = '#f59e0b'; // Amber for conditional
      dot.title = `Condition: ${this.bp.condition}`;
    } else if (this.bp?.logMessage) {
      dot.style.backgroundColor = '#a855f7'; // Purple for logpoint
      dot.style.borderRadius = '2px';
      dot.title = `Log: ${this.bp.logMessage}`;
    } else {
      dot.style.backgroundColor = '#ef4444'; // Red for standard
      dot.title = 'Breakpoint';
    }

    return dot;
  }
}

const standardBpMarker = new BreakpointMarker();

export function createDebugGutterExtension(filePath?: string): Extension {
  if (!filePath) return [];
  const normPath = filePath.replace(/\\/g, '/');

  return [
    gutter({
      class: 'cm-debug-breakpoint-gutter',
      markers(view) {
        const bpList = useDebugStore.getState().breakpoints[normPath] || [];
        if (bpList.length === 0) return RangeSet.empty;

        const builder = new RangeSetBuilder<GutterMarker>();
        const sorted = bpList
          .filter((b) => b.line <= view.state.doc.lines)
          .sort((a, b) => a.line - b.line);

        for (const b of sorted) {
          const line = view.state.doc.line(b.line);
          builder.add(line.from, line.from, new BreakpointMarker(b));
        }
        return builder.finish();
      },
      domEventHandlers: {
        mousedown(view, line) {
          const lineNo = view.state.doc.lineAt(line.from).number;
          useDebugStore.getState().toggleBreakpoint(filePath, lineNo);
          return true;
        },
      },
      initialSpacer: () => standardBpMarker,
    }),
    createPausedLineExtension(normPath),
  ];
}

function createPausedLineExtension(activeFilePath: string): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.none;

      constructor(view: EditorView) {
        this.updateDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.updateDecorations(update.view);
        }
      }

      updateDecorations(view: EditorView) {
        const { sessionState, activeFrame } = useDebugStore.getState();
        if (sessionState !== 'paused' || !activeFrame || !activeFrame.source?.path) {
          this.decorations = Decoration.none;
          return;
        }

        const framePath = activeFrame.source.path.replace(/\\/g, '/');
        if (framePath !== activeFilePath || activeFrame.line > view.state.doc.lines) {
          this.decorations = Decoration.none;
          return;
        }

        const line = view.state.doc.line(activeFrame.line);
        const builder = new RangeSetBuilder<Decoration>();
        builder.add(
          line.from,
          line.from,
          Decoration.line({
            attributes: {
              style: 'background-color: rgba(245, 158, 11, 0.2); border-left: 3px solid #f59e0b;',
            },
          })
        );

        this.decorations = builder.finish();
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}
