import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { htmlCompletions } from './htmlCompletions';
import { cssCompletions } from './cssCompletions';
import { jsCompletions } from './jsCompletions';
import { phpCompletions } from './phpCompletions';
import { laravelCompletionSource } from '../../../extensions/builtin/laravel-all-in-one/completions/laravelCompletionSource';
import { useEditorStore } from '../../../stores/editorStore';

export { htmlCompletions } from './htmlCompletions';
export { cssCompletions } from './cssCompletions';
export { jsCompletions } from './jsCompletions';
export { phpCompletions } from './phpCompletions';
export { laravelCompletionSource } from '../../../extensions/builtin/laravel-all-in-one/completions/laravelCompletionSource';

/**
 * Detects the sub-language context within a mixed document (e.g., <style> or <script> or <?php in HTML/Blade).
 */
export function detectContextLanguage(
  docText: string,
  pos: number,
  primaryLang: string
): 'html' | 'css' | 'js' | 'php' | 'other' {
  const textBefore = docText.slice(0, pos);

  // Check if inside <?php ... ?>
  const lastPhpOpen = textBefore.lastIndexOf('<?');
  const lastPhpClose = textBefore.lastIndexOf('?>');
  if (lastPhpOpen !== -1 && lastPhpOpen > lastPhpClose) {
    return 'php';
  }

  // Check if inside <style> ... </style> or style="..."
  const lastStyleOpen = textBefore.lastIndexOf('<style');
  const lastStyleClose = textBefore.lastIndexOf('</style>');
  if (lastStyleOpen !== -1 && lastStyleOpen > lastStyleClose) {
    return 'css';
  }

  // Check if inside <script> ... </script>
  const lastScriptOpen = textBefore.lastIndexOf('<script');
  const lastScriptClose = textBefore.lastIndexOf('</script>');
  if (lastScriptOpen !== -1 && lastScriptOpen > lastScriptClose) {
    return 'js';
  }

  // Check by primary file language
  const lower = primaryLang.toLowerCase();
  if (lower.includes('css') || lower.includes('scss') || lower.includes('less') || lower.endsWith('.css')) {
    return 'css';
  }
  if (
    lower.includes('javascript') || lower.includes('typescript') ||
    lower.endsWith('.js') || lower.endsWith('.ts') || lower.endsWith('.jsx') || lower.endsWith('.tsx') || lower.endsWith('.mjs')
  ) {
    return 'js';
  }
  if (lower.includes('php') || lower.endsWith('.php') || lower.endsWith('.phtml')) {
    return 'php';
  }
  if (
    lower.includes('html') || lower.includes('blade') || lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.blade.php')
  ) {
    return 'html';
  }

  return 'other';
}

/**
 * Master completion source providing intelligent autocomplete for:
 * - HTML (Tags, Attributes, Attribute Values, Void Tags)
 * - CSS (Properties, Property Values, Colors, Units, Pseudo-Classes, Pseudo-Elements, At-Rules)
 * - JavaScript / TypeScript (Keywords, Globals, Member Dot Completions on Console/Document/Math/Array/String/DOM)
 * - PHP (Keywords, Superglobals, 100+ Core Functions, Arrow Methods)
 * - Laravel (Route::, Auth::, DB::, Schema::, $table->, ->where, Blade directives @, Helpers)
 */
export function createLanguageCompletionSource(getLanguage: () => string) {
  return (context: CompletionContext): CompletionResult | null => {
    const activeDoc = useEditorStore.getState().getActiveDocument();
    const docName = activeDoc?.name || '';
    const rawLang = getLanguage() || activeDoc?.language || docName;
    const docText = context.state.doc.toString();
    const contextLang = detectContextLanguage(docText, context.pos, rawLang);
    const line = context.state.doc.lineAt(context.pos);
    const lineTextBefore = line.text.slice(0, context.pos - line.from);

    // 1. High-priority Laravel syntax triggers:
    // "Route::", "Auth::", "$table->", "@directive", or "->" in PHP/Blade/HTML
    if (
      contextLang === 'php' ||
      contextLang === 'html' ||
      rawLang.includes('blade') ||
      docName.endsWith('.blade.php')
    ) {
      if (
        /[A-Z]\w*::/.test(lineTextBefore) ||
        /\$table->/.test(lineTextBefore) ||
        /@\w*/.test(lineTextBefore)
      ) {
        const laravelRes = laravelCompletionSource(context);
        if (laravelRes && laravelRes.options.length > 0) return laravelRes;
      }
    }

    // 2. Route by active context language
    switch (contextLang) {
      case 'css': {
        const res = cssCompletions(context);
        if (res && res.options.length > 0) return res;
        break;
      }

      case 'js': {
        const res = jsCompletions(context);
        if (res && res.options.length > 0) return res;
        break;
      }

      case 'php': {
        // First try Laravel completion source (for facades, eloquent, helpers)
        const laravelRes = laravelCompletionSource(context);
        if (laravelRes && laravelRes.options.length > 0) return laravelRes;

        // Then native PHP completions
        const phpRes = phpCompletions(context);
        if (phpRes && phpRes.options.length > 0) return phpRes;

        // Also permit HTML tag completion if writing HTML inside PHP
        if (lineTextBefore.includes('<')) {
          const htmlRes = htmlCompletions(context);
          if (htmlRes && htmlRes.options.length > 0) return htmlRes;
        }
        break;
      }

      case 'html': {
        // If in Blade template, check for Blade directives or Laravel helpers
        if (rawLang.includes('blade') || docName.endsWith('.blade.php') || lineTextBefore.trim().startsWith('@')) {
          const laravelRes = laravelCompletionSource(context);
          if (laravelRes && laravelRes.options.length > 0) return laravelRes;
        }

        // Check if cursor is in an inline style="..." attribute
        if (/style\s*=\s*["'][^"']*$/.test(lineTextBefore)) {
          const cssRes = cssCompletions(context);
          if (cssRes && cssRes.options.length > 0) return cssRes;
        }

        // HTML completions
        const htmlRes = htmlCompletions(context);
        if (htmlRes && htmlRes.options.length > 0) return htmlRes;
        break;
      }

      default: {
        // For other languages or mixed formats, attempt relevant completion sources gracefully
        if (lineTextBefore.includes('->') || lineTextBefore.includes('::') || lineTextBefore.includes('@')) {
          const laravelRes = laravelCompletionSource(context);
          if (laravelRes && laravelRes.options.length > 0) return laravelRes;
        }
        if (lineTextBefore.includes('<')) {
          const htmlRes = htmlCompletions(context);
          if (htmlRes && htmlRes.options.length > 0) return htmlRes;
        }
        break;
      }
    }

    return null;
  };
}
