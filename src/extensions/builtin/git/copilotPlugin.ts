import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
  KeyBinding,
  keymap,
} from '@codemirror/view';
import { Extension, Prec } from '@codemirror/state';
import { CopilotCompletion, CopilotSettings } from './types';

export const DEFAULT_COPILOT_SETTINGS: CopilotSettings = {
  enabled: true,
  autoTrigger: true,
  triggerDelayMs: 250,
  model: 'gpt-4o',
  temperature: 0.2,
  ghostTextColor: 'rgba(156, 163, 175, 0.45)',
};

class GhostTextWidget extends WidgetType {
  constructor(readonly text: string, readonly color: string) {
    super();
  }

  eq(other: GhostTextWidget) {
    return this.text === other.text && this.color === other.color;
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-copilot-ghost-text';
    span.style.color = this.color;
    span.style.fontStyle = 'italic';
    span.style.pointerEvents = 'none';
    span.style.userSelect = 'none';
    span.style.fontFamily = 'var(--xivig-font-code, monospace)';
    span.textContent = this.text;
    return span;
  }

  ignoreEvent() {
    return true;
  }
}

// Active ghost suggestion state
let currentSuggestion: CopilotCompletion | null = null;
let suggestionChangeListeners: (() => void)[] = [];

export function setCopilotSuggestion(suggestion: CopilotCompletion | null) {
  currentSuggestion = suggestion;
  for (const listener of suggestionChangeListeners) {
    listener();
  }
}

export function getCopilotSuggestion(): CopilotCompletion | null {
  return currentSuggestion;
}

export function subscribeToCopilotSuggestions(listener: () => void): () => void {
  suggestionChangeListeners.push(listener);
  return () => {
    suggestionChangeListeners = suggestionChangeListeners.filter((l) => l !== listener);
  };
}

/**
 * Accepts the currently active Copilot ghost-text suggestion.
 */
export function acceptCopilotSuggestion(view: EditorView): boolean {
  if (!currentSuggestion || !currentSuggestion.text) return false;

  const pos = view.state.selection.main.head;
  const insertText = currentSuggestion.text;

  view.dispatch({
    changes: { from: pos, insert: insertText },
    selection: { anchor: pos + insertText.length },
  });

  setCopilotSuggestion(null);
  return true;
}

/**
 * Dismisses the active Copilot suggestion without modifying the document.
 */
export function dismissCopilotSuggestion(): boolean {
  if (currentSuggestion) {
    setCopilotSuggestion(null);
    return true;
  }
  return false;
}

function buildGhostDecorations(view: EditorView, settings: CopilotSettings): DecorationSet {
  if (!settings.enabled || !currentSuggestion || !currentSuggestion.text) {
    return Decoration.none;
  }

  const cursorHead = view.state.selection.main.head;
  const widget = Decoration.widget({
    side: 1,
    widget: new GhostTextWidget(currentSuggestion.text, settings.ghostTextColor),
  });

  return Decoration.set([widget.range(cursorHead)]);
}

export function createCopilotPlugin(settings: CopilotSettings = DEFAULT_COPILOT_SETTINGS): Extension {
  const plugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      private unsubscribe: () => void;

      constructor(readonly view: EditorView) {
        this.decorations = buildGhostDecorations(view, settings);
        this.unsubscribe = subscribeToCopilotSuggestions(() => {
          this.decorations = buildGhostDecorations(this.view, settings);
          this.view.requestMeasure();
        });
      }

      update(update: ViewUpdate) {
        if (update.selectionSet || update.docChanged) {
          this.decorations = buildGhostDecorations(update.view, settings);
        }
      }

      destroy() {
        this.unsubscribe();
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );

  const copilotKeymap: KeyBinding[] = [
    {
      key: 'Tab',
      run: (view) => {
        return acceptCopilotSuggestion(view);
      },
    },
    {
      key: 'Escape',
      run: () => {
        return dismissCopilotSuggestion();
      },
    },
  ];

  return [plugin, Prec.highest(keymap.of(copilotKeymap))];
}
