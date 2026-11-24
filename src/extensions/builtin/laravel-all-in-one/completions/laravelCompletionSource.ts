import { CompletionContext, CompletionResult, Completion } from '@codemirror/autocomplete';
import { FACADE_COMPLETIONS, LARAVEL_FACADE_NAMES } from './facadeCompletions';
import { ELOQUENT_QUERY_COMPLETIONS, BLUEPRINT_COLUMN_COMPLETIONS } from './eloquentCompletions';
import { LARAVEL_HELPER_COMPLETIONS } from './helperCompletions';
import { ALL_BLADE_DIRECTIVES } from './bladeCompletions';
import { laravelExtension } from '../index';
import { useEditorStore } from '../../../../stores/editorStore';

/**
 * Intelligent CodeMirror autocompletion source for Laravel development:
 * - Facades & static methods on "::" (e.g. Route::get, Auth::user, DB::table)
 * - Schema Blueprint column methods on "$table->"
 * - Eloquent & Query Builder fluent methods on "->"
 * - Blade directives on "@" (e.g. @extends, @section, @if, @csrf)
 * - Laravel global helpers (view, route, redirect, response, config, asset, auth, etc.)
 */
export function laravelCompletionSource(context: CompletionContext): CompletionResult | null {
  const settings = laravelExtension.getSettings();
  if (!settings.enabled) return null;

  const activeDoc = useEditorStore.getState().getActiveDocument();
  const filename = (activeDoc?.name || '').toLowerCase();
  const language = (activeDoc?.language || '').toLowerCase();

  const isBlade = filename.endsWith('.blade.php') || filename.endsWith('.blade') || language === 'blade';
  const isPhp = filename.endsWith('.php') || filename.endsWith('.phtml') || language === 'php';
  const isHtml = filename.endsWith('.html') || filename.endsWith('.htm') || language === 'html';

  // Only run in PHP, Blade, or HTML context
  if (!isBlade && !isPhp && !isHtml && filename !== '' && language !== '') {
    return null;
  }

  // 1. Facade static method trigger: e.g. Route:: or Route::get or Auth::user
  const facadeMatch = context.matchBefore(/[A-Z]\w*::\w*/);
  if (facadeMatch) {
    const text = facadeMatch.text;
    const splitIndex = text.indexOf('::');
    const facadeName = text.slice(0, splitIndex);
    const query = text.slice(splitIndex + 2);
    const from = facadeMatch.from + splitIndex + 2;

    const facadeMethods = FACADE_COMPLETIONS[facadeName];
    if (facadeMethods) {
      return {
        from,
        options: facadeMethods,
        validFor: /^\w*$/,
      };
    }

    // Default for Eloquent Models (e.g. User::where, Post::find, etc.)
    return {
      from,
      options: ELOQUENT_QUERY_COMPLETIONS,
      validFor: /^\w*$/,
    };
  }

  // 2. Schema Blueprint migration trigger: e.g. $table->string or $table->
  const blueprintMatch = context.matchBefore(/\$table->\w*/);
  if (blueprintMatch && settings.enableMigrations) {
    const from = blueprintMatch.from + '$table->'.length;
    return {
      from,
      options: BLUEPRINT_COLUMN_COMPLETIONS,
      validFor: /^\w*$/,
    };
  }

  // 3. Fluent arrow method trigger: e.g. $user->where or ->paginate or $query->
  const arrowMatch = context.matchBefore(/->\w*/);
  if (arrowMatch && (settings.enableEloquent || settings.enableRouting)) {
    const from = arrowMatch.from + '->'.length;
    return {
      from,
      options: ELOQUENT_QUERY_COMPLETIONS,
      validFor: /^\w*$/,
    };
  }

  // 4. Blade @ directives trigger: e.g. @extends, @if, @csrf
  const bladeMatch = context.matchBefore(/@\w*/);
  if (bladeMatch && settings.enableBlade && (isBlade || isHtml || isPhp || (filename === '' && language === ''))) {
    return {
      from: bladeMatch.from,
      options: ALL_BLADE_DIRECTIVES,
      validFor: /^@\w*$/,
    };
  }

  // 5. Global helper / Facade name suggestions when typing words
  const wordMatch = context.matchBefore(/[@\w$]+/);
  if (wordMatch && (context.explicit || wordMatch.text.length >= 2)) {
    const options: Completion[] = [];

    // Add helpers in PHP and Blade
    if (isPhp || isBlade || isHtml) {
      options.push(...LARAVEL_HELPER_COMPLETIONS);
      options.push(...LARAVEL_FACADE_NAMES);
      if (settings.enableBlade && (isBlade || isHtml)) {
        options.push(...ALL_BLADE_DIRECTIVES);
      }
    }

    if (options.length > 0) {
      return {
        from: wordMatch.from,
        options,
        validFor: /^[@\w$]+$/,
      };
    }
  }

  return null;
}
