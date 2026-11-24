import { BuiltinExtensionModule, ExtensionContext } from '../../api/types';
import manifestJson from './xivig-extension.json';
import { DEFAULT_PHP_SETTINGS, PhpIntelligenceSettings } from './settings';
import { getAllPhpCompletions } from './snippets/index';
import { PHP_DOCS, PhpDocItem } from './docs/phpDocs';
import { Extension as CodeMirrorExtension } from '@codemirror/state';
import { Completion } from '@codemirror/autocomplete';

export class PhpIntelligenceExtension implements BuiltinExtensionModule {
  manifest = manifestJson as any;
  private settings: PhpIntelligenceSettings = { ...DEFAULT_PHP_SETTINGS };

  activate(context: ExtensionContext) {
    this.settings.enabled = context.getSetting('php.enabled', true);
    this.settings.enablePhpStormTemplates = context.getSetting('php.enablePhpStormTemplates', true);
    this.settings.enableCoreCompletions = context.getSetting('php.enableCoreCompletions', true);
    this.settings.enableHoverDocs = context.getSetting('php.enableHoverDocs', true);
  }

  deactivate() {
    this.settings = { ...DEFAULT_PHP_SETTINGS, enabled: false };
  }

  updateSettings(newSettings: Partial<PhpIntelligenceSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): PhpIntelligenceSettings {
    return { ...this.settings };
  }

  getSnippets(languageName?: string): Completion[] {
    if (!this.settings.enabled) {
      return [];
    }

    const lang = (languageName || '').toLowerCase();
    const isPhp =
      lang.includes('php') ||
      lang.includes('blade') ||
      lang.endsWith('.php') ||
      lang.endsWith('.blade.php') ||
      lang === '' ||
      lang === 'text';

    if (!isPhp) {
      return [];
    }

    return getAllPhpCompletions(this.settings);
  }

  getHoverDoc(word: string): PhpDocItem | undefined {
    if (!this.settings.enabled || !this.settings.enableHoverDocs) {
      return undefined;
    }
    return PHP_DOCS[word];
  }

  getCodeMirrorExtensions(): CodeMirrorExtension[] {
    return [];
  }
}

export const phpIntelligenceExtension = new PhpIntelligenceExtension();
export { PHP_DOCS };
