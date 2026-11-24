import {
  Decoration,
  DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { BetterCommentsSettings } from './types';

export const DEFAULT_BETTER_COMMENTS_SETTINGS: BetterCommentsSettings = {
  enabled: true,
  highlightAlerts: true,
  highlightQueries: true,
  highlightHighlights: true,
  highlightTodos: true,
  highlightStrikethrough: true,
};

const alertDeco = Decoration.mark({
  attributes: { style: 'color: #ff5555 !important; font-weight: bold;' },
});

const queryDeco = Decoration.mark({
  attributes: { style: 'color: #8be9fd !important; font-style: italic;' },
});

const highlightDeco = Decoration.mark({
  attributes: { style: 'color: #50fa7b !important; font-weight: 600;' },
});

const todoDeco = Decoration.mark({
  attributes: {
    style:
      'color: #ffb86c !important; font-weight: bold; background-color: rgba(255, 184, 108, 0.15); padding: 1px 4px; border-radius: 3px;',
  },
});

const strikeDeco = Decoration.mark({
  attributes: { style: 'color: #6272a4 !important; text-decoration: line-through;' },
});

export function createBetterCommentsPlugin(
  settings: BetterCommentsSettings = DEFAULT_BETTER_COMMENTS_SETTINGS
) {
  const decorator = new MatchDecorator({
    // Match line comments: // ! ... or // ? ... or // * ... or // TODO ... or // // ...
    regexp: /\/\/\s*([!?*]|\/{1,2}|TODO\b|FIXME\b)([^\n]*)/gi,
    decoration: (match) => {
      if (!settings.enabled) return null;
      const prefix = match[1].toUpperCase();

      if (prefix === '!' && settings.highlightAlerts) return alertDeco;
      if (prefix === '?' && settings.highlightQueries) return queryDeco;
      if (prefix === '*' && settings.highlightHighlights) return highlightDeco;
      if ((prefix === 'TODO' || prefix === 'FIXME') && settings.highlightTodos) return todoDeco;
      if (prefix.startsWith('/') && settings.highlightStrikethrough) return strikeDeco;

      return null;
    },
  });

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = decorator.createDeco(view);
      }

      update(update: ViewUpdate) {
        this.decorations = decorator.updateDeco(update, this.decorations);
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}
