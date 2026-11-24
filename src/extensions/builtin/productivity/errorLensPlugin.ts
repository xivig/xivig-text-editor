import { forEachDiagnostic, Diagnostic } from '@codemirror/lint';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { Range } from '@codemirror/state';
import { ErrorLensSettings } from './types';

export const DEFAULT_ERROR_LENS_SETTINGS: ErrorLensSettings = {
  enabled: true,
  displayMode: 'end-of-line',
  errorColor: '#ff5555',
  warningColor: '#ffb86c',
  infoColor: '#8be9fd',
  hintColor: '#50fa7b',
  prefix: '● ',
};

class ErrorLensWidget extends WidgetType {
  constructor(
    readonly message: string,
    readonly severity: string,
    readonly source?: string
  ) {
    super();
  }

  eq(other: ErrorLensWidget) {
    return (
      this.message === other.message &&
      this.severity === other.severity &&
      this.source === other.source
    );
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = `cm-error-lens cm-error-lens-${this.severity}`;

    let color = '#ff5555';
    let bg = 'rgba(255, 85, 85, 0.12)';
    let border = 'rgba(255, 85, 85, 0.3)';

    if (this.severity === 'warning') {
      color = '#ffb86c';
      bg = 'rgba(255, 184, 108, 0.12)';
      border = 'rgba(255, 184, 108, 0.3)';
    } else if (this.severity === 'info') {
      color = '#8be9fd';
      bg = 'rgba(139, 233, 253, 0.12)';
      border = 'rgba(139, 233, 253, 0.3)';
    } else if (this.severity === 'hint') {
      color = '#50fa7b';
      bg = 'rgba(80, 250, 123, 0.12)';
      border = 'rgba(80, 250, 123, 0.3)';
    }

    span.style.marginLeft = '18px';
    span.style.padding = '1px 6px';
    span.style.borderRadius = '3px';
    span.style.fontSize = '0.85em';
    span.style.fontWeight = '500';
    span.style.fontFamily = 'var(--xivig-font-code, monospace)';
    span.style.color = color;
    span.style.backgroundColor = bg;
    span.style.border = `1px solid ${border}`;
    span.style.pointerEvents = 'none';
    span.style.userSelect = 'none';
    span.style.display = 'inline-block';
    span.style.verticalAlign = 'middle';

    const sourceText = this.source ? ` (${this.source})` : '';
    span.textContent = `● ${this.message}${sourceText}`;

    return span;
  }

  ignoreEvent() {
    return true;
  }
}

function buildErrorLensDecorations(view: EditorView, settings: ErrorLensSettings): DecorationSet {
  if (!settings.enabled) return Decoration.none;

  const widgets: Range<Decoration>[] = [];
  const processedLines = new Set<number>();

  try {
    forEachDiagnostic(view.state, (diag: Diagnostic, from: number) => {
      const line = view.state.doc.lineAt(from);
      if (processedLines.has(line.number)) return; // Show highest-priority or first diagnostic on each line
      processedLines.add(line.number);

      const deco = Decoration.widget({
        side: 1,
        widget: new ErrorLensWidget(diag.message, diag.severity || 'error', diag.source),
      });

      widgets.push(deco.range(line.to));
    });
  } catch (err) {
    // If diagnostics are not initialized yet, silently return
    return Decoration.none;
  }

  return Decoration.set(widgets, true);
}

export function createErrorLensPlugin(settings: ErrorLensSettings = DEFAULT_ERROR_LENS_SETTINGS) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildErrorLensDecorations(view, settings);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || update.transactions.some((tr) => tr.effects.length > 0)) {
          this.decorations = buildErrorLensDecorations(update.view, settings);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}
