import { Completion } from '@codemirror/autocomplete';
import { bladeSnippets } from './bladeSnippets';
import { laravelSnippets } from './laravelSnippets';
import { LaravelSettings } from '../settings';

export { bladeSnippets, laravelSnippets };

export function getAllLaravelSnippets(settings: LaravelSettings, languageName?: string): Completion[] {
  if (!settings.enabled) return [];
  const list: Completion[] = [];
  const lang = (languageName || '').toLowerCase();

  const isBladeOrHtml =
    lang.includes('blade') ||
    lang.includes('html') ||
    lang.endsWith('.blade.php') ||
    lang.endsWith('.html') ||
    lang.endsWith('.htm');

  const isPhp =
    lang.includes('php') ||
    lang.endsWith('.php');

  if (settings.enableBlade && (isBladeOrHtml || isPhp || lang === '')) {
    list.push(...bladeSnippets);
  }

  if ((settings.enableRouting || settings.enableEloquent || settings.enableMigrations) && (isPhp || isBladeOrHtml || lang === '')) {
    list.push(...laravelSnippets);
  }

  return list;
}
