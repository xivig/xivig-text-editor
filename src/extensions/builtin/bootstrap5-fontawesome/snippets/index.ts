import { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { bootstrap5Snippets } from './bootstrap5Snippets';
import { fontAwesomeSnippets } from './fontAwesomeSnippets';
import { Bootstrap5Settings } from '../settings';

export { bootstrap5Snippets, fontAwesomeSnippets };

export function getAllBootstrapFontAwesomeSnippets(settings: Bootstrap5Settings): Completion[] {
  if (!settings.enabled) return [];
  const list: Completion[] = [];
  if (settings.enableBootstrap) {
    list.push(...bootstrap5Snippets);
  }
  if (settings.enableFontAwesome) {
    list.push(...fontAwesomeSnippets);
  }
  return list;
}

/**
 * CodeMirror 6 CompletionSource for Bootstrap 5 & Font Awesome snippets.
 * Matches identifiers including hyphens and dollar sign triggers (e.g. b5-$, b5-card, fa-$).
 */
export function createBootstrapSnippetSource(getSettings: () => Bootstrap5Settings) {
  return (context: CompletionContext): CompletionResult | null => {
    const settings = getSettings();
    if (!settings.enabled) return null;

    // Match word starting with b5 or fa or prefix
    const word = context.matchBefore(/[\w$-]+/);
    if (!word && !context.explicit) return null;

    const options = getAllBootstrapFontAwesomeSnippets(settings);
    if (options.length === 0) return null;

    return {
      from: word ? word.from : context.pos,
      options,
      validFor: /^[\w$-]*$/,
    };
  };
}
