import { BuiltinExtensionModule, ExtensionContext } from '../../api/types';
import manifestJson from './xivig-extension.json';
import { DEFAULT_LARAVEL_SETTINGS, LaravelSettings } from './settings';
import { getAllLaravelSnippets } from './snippets/index';
import { Extension as CodeMirrorExtension } from '@codemirror/state';
import { Completion } from '@codemirror/autocomplete';

export class LaravelExtension implements BuiltinExtensionModule {
  manifest = manifestJson as any;
  private settings: LaravelSettings = { ...DEFAULT_LARAVEL_SETTINGS };

  activate(context: ExtensionContext) {
    this.settings.enabled = context.getSetting('laravel.enabled', true);
    this.settings.enableBlade = context.getSetting('laravel.enableBlade', true);
    this.settings.enableRouting = context.getSetting('laravel.enableRouting', true);
    this.settings.enableEloquent = context.getSetting('laravel.enableEloquent', true);
    this.settings.enableMigrations = context.getSetting('laravel.enableMigrations', true);
  }

  deactivate() {
    this.settings = { ...DEFAULT_LARAVEL_SETTINGS, enabled: false };
  }

  updateSettings(newSettings: Partial<LaravelSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): LaravelSettings {
    return { ...this.settings };
  }

  getSnippets(languageName?: string): Completion[] {
    if (!this.settings.enabled) {
      return [];
    }

    const lang = (languageName || '').toLowerCase();
    const isApplicable =
      lang.includes('php') ||
      lang.includes('blade') ||
      lang.includes('html') ||
      lang.endsWith('.php') ||
      lang.endsWith('.html') ||
      lang.endsWith('.htm') ||
      lang === '' ||
      lang === 'text';

    if (!isApplicable) {
      return [];
    }

    return getAllLaravelSnippets(this.settings, languageName);
  }

  getCodeMirrorExtensions(): CodeMirrorExtension[] {
    return [];
  }
}

export const laravelExtension = new LaravelExtension();
