import { Completion } from '@codemirror/autocomplete';
import { phpstormSnippets } from './phpstormSnippets';
import { phpCoreCompletions } from './phpCoreCompletions';
import { PhpIntelligenceSettings } from '../settings';

export { phpstormSnippets, phpCoreCompletions };

export function getAllPhpCompletions(settings: PhpIntelligenceSettings): Completion[] {
  if (!settings.enabled) return [];
  const list: Completion[] = [];

  if (settings.enablePhpStormTemplates) {
    list.push(...phpstormSnippets);
  }

  if (settings.enableCoreCompletions) {
    list.push(...phpCoreCompletions);
  }

  return list;
}
