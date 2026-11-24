import { BuiltinExtensionModule, ExtensionContext } from '../../api/types';
import manifestJson from './xivig-extension.json';
import { rainbowBracketsPlugin } from './rainbowBrackets';
import { createIndentGuidesPlugin } from './indentGuides';
import { DEFAULT_RAINBOW_SETTINGS, RainbowBracketsSettings } from './settings';
import { Extension as CodeMirrorExtension } from '@codemirror/state';

export class RainbowBracketsExtension implements BuiltinExtensionModule {
  manifest = manifestJson as any;
  private settings: RainbowBracketsSettings = { ...DEFAULT_RAINBOW_SETTINGS };

  activate(context: ExtensionContext) {
    this.settings.enabled = context.getSetting('rainbow.enabled', true);
    this.settings.brackets = context.getSetting('rainbow.brackets', true);
    this.settings.indentGuides = context.getSetting('rainbow.indentGuides', false);
    this.settings.tabSize = context.getSetting('rainbow.tabSize', 4);
  }

  deactivate() {
    this.settings = { ...DEFAULT_RAINBOW_SETTINGS, enabled: false };
  }

  updateSettings(newSettings: Partial<RainbowBracketsSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): RainbowBracketsSettings {
    return { ...this.settings };
  }

  getCodeMirrorExtensions(): CodeMirrorExtension[] {
    if (!this.settings.enabled) {
      return [];
    }

    const exts: CodeMirrorExtension[] = [];

    if (this.settings.brackets) {
      exts.push(rainbowBracketsPlugin);
    }

    if (this.settings.indentGuides) {
      exts.push(createIndentGuidesPlugin(this.settings.tabSize || 4));
    }

    return exts;
  }
}

export const rainbowBracketsExtension = new RainbowBracketsExtension();
