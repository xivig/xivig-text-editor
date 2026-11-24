import { BuiltinExtensionModule, ExtensionContext } from '../../api/types';
import manifestJson from './xivig-extension.json';
import { DEFAULT_BOOTSTRAP5_SETTINGS, Bootstrap5Settings } from './settings';
import { getAllBootstrapFontAwesomeSnippets } from './snippets/index';
import { Extension as CodeMirrorExtension } from '@codemirror/state';
import { Completion } from '@codemirror/autocomplete';

export class Bootstrap5FontAwesomeExtension implements BuiltinExtensionModule {
  manifest = manifestJson as any;
  private settings: Bootstrap5Settings = { ...DEFAULT_BOOTSTRAP5_SETTINGS };

  activate(context: ExtensionContext) {
    this.settings.enabled = context.getSetting('bootstrap5.enabled', true);
    this.settings.enableBootstrap = context.getSetting('bootstrap5.enableBootstrap', true);
    this.settings.enableFontAwesome = context.getSetting('bootstrap5.enableFontAwesome', true);
  }

  deactivate() {
    this.settings = { ...DEFAULT_BOOTSTRAP5_SETTINGS, enabled: false };
  }

  updateSettings(newSettings: Partial<Bootstrap5Settings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): Bootstrap5Settings {
    return { ...this.settings };
  }

  /**
   * Returns completions for active document languages or triggers.
   */
  getSnippets(languageName?: string): Completion[] {
    if (!this.settings.enabled) {
      return [];
    }

    const lang = (languageName || '').toLowerCase();
    const isWebLanguage =
      lang.includes('html') ||
      lang.includes('php') ||
      lang.includes('vue') ||
      lang.includes('javascript') ||
      lang.includes('typescript') ||
      lang.includes('react') ||
      lang.includes('jsx') ||
      lang.includes('tsx') ||
      lang.includes('blade') ||
      lang.includes('svelte') ||
      lang.includes('markdown') ||
      lang.endsWith('.html') ||
      lang.endsWith('.htm') ||
      lang.endsWith('.php') ||
      lang.endsWith('.vue') ||
      lang.endsWith('.jsx') ||
      lang.endsWith('.tsx') ||
      lang.endsWith('.js') ||
      lang.endsWith('.ts') ||
      lang.endsWith('.md') ||
      lang === '' ||
      lang === 'text';

    if (!isWebLanguage) {
      return [];
    }

    return getAllBootstrapFontAwesomeSnippets(this.settings);
  }

  getCodeMirrorExtensions(): CodeMirrorExtension[] {
    // Currently snippets are provided via getSnippets() into the autocompletion engine
    return [];
  }
}

export const bootstrap5Extension = new Bootstrap5FontAwesomeExtension();
