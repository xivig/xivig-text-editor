import { create } from 'zustand';
import { ThemeId, applyThemeToCssVariables } from '../styles/themes';
import { extensionManager } from '../extensions/runtime/extensionManager';

export interface UserSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  theme: ThemeId;
  autoSave: boolean;
  fontLigatures: boolean;
  showWelcomeOnStartup: boolean;
  autoIndentOnSave: boolean;
  insertSpaces?: boolean;
  autoSaveDelay?: number;
  defaultFormatter?: string;
  cursorBlinking?: 'blink' | 'smooth' | 'solid';
  bracketMatching?: boolean;
  rainbowBrackets?: boolean;
  rainbowIndentGuides?: boolean;
  bootstrap5Enabled?: boolean;
  bootstrap5Components?: boolean;
  bootstrap5FontAwesome?: boolean;
  laravelEnabled?: boolean;
  phpIntelligenceEnabled?: boolean;
  terminalFontSize?: number;
  trimTrailingWhitespace?: boolean;
  insertFinalNewline?: boolean;
}

interface SettingsState {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  loadSettings: () => Promise<void>;
  resetToDefault: (key?: keyof UserSettings) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  toggleFontLigatures: () => void;
}

export const defaultSettings: UserSettings = {
  fontSize: 14,
  fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, Menlo, monospace",
  lineHeight: 1.6,
  tabSize: 2,
  insertSpaces: true,
  wordWrap: false,
  lineNumbers: true,
  minimap: true,
  theme: 'dracula',
  autoSave: true,
  autoSaveDelay: 1000,
  fontLigatures: true,
  showWelcomeOnStartup: true,
  autoIndentOnSave: true,
  defaultFormatter: 'js-beautify',
  cursorBlinking: 'smooth',
  bracketMatching: true,
  rainbowBrackets: true,
  rainbowIndentGuides: false,
  bootstrap5Enabled: true,
  bootstrap5Components: true,
  bootstrap5FontAwesome: true,
  laravelEnabled: true,
  phpIntelligenceEnabled: true,
  terminalFontSize: 13,
  trimTrailingWhitespace: false,
  insertFinalNewline: true,
};

function applySettingsToDOM(settings: UserSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--xivig-font-size-code', `${settings.fontSize}px`);
  root.style.setProperty('--xivig-font-mono', settings.fontFamily);
  root.style.setProperty('--xivig-line-height-code', `${settings.lineHeight}`);
  if (settings.fontLigatures !== false) {
    root.style.setProperty('--xivig-font-ligatures', 'contextual');
    root.style.setProperty('--xivig-font-features', '"liga" 1, "calt" 1');
  } else {
    root.style.setProperty('--xivig-font-ligatures', 'none');
    root.style.setProperty('--xivig-font-features', '"liga" 0, "calt" 0');
  }
  applyThemeToCssVariables(settings.theme);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,

  updateSettings: (partial) => {
    const updated = { ...get().settings, ...partial };
    set({ settings: updated });
    applySettingsToDOM(updated);

    // Sync extension settings
    if (partial.rainbowBrackets !== undefined) {
      extensionManager.setSetting('rainbow.brackets', partial.rainbowBrackets);
    }
    if (partial.rainbowIndentGuides !== undefined) {
      extensionManager.setSetting('rainbow.indentGuides', partial.rainbowIndentGuides);
    }
    if (partial.bootstrap5Enabled !== undefined) {
      extensionManager.setSetting('bootstrap5.enabled', partial.bootstrap5Enabled);
    }
    if (partial.bootstrap5Components !== undefined) {
      extensionManager.setSetting('bootstrap5.enableBootstrap', partial.bootstrap5Components);
    }
    if (partial.bootstrap5FontAwesome !== undefined) {
      extensionManager.setSetting('bootstrap5.enableFontAwesome', partial.bootstrap5FontAwesome);
    }
    if (partial.laravelEnabled !== undefined) {
      extensionManager.setSetting('laravel.enabled', partial.laravelEnabled);
    }
    if (partial.phpIntelligenceEnabled !== undefined) {
      extensionManager.setSetting('php.enabled', partial.phpIntelligenceEnabled);
    }

    if (typeof window !== 'undefined' && window.xivig?.setSetting) {
      window.xivig.setSetting('user_settings', JSON.stringify(updated));
    }
  },

  resetToDefault: (key) => {
    if (key) {
      get().updateSettings({ [key]: defaultSettings[key] });
    } else {
      get().updateSettings(defaultSettings);
    }
  },

  zoomIn: () => {
    const current = get().settings.fontSize;
    const next = Math.min(36, current + 1);
    get().updateSettings({ fontSize: next });
  },

  zoomOut: () => {
    const current = get().settings.fontSize;
    const next = Math.max(9, current - 1);
    get().updateSettings({ fontSize: next });
  },

  resetZoom: () => {
    get().updateSettings({ fontSize: defaultSettings.fontSize });
  },

  toggleFontLigatures: () => {
    const current = get().settings.fontLigatures !== false;
    get().updateSettings({ fontLigatures: !current });
  },

  loadSettings: async () => {
    if (!window.xivig?.getSetting) return;

    try {
      const raw = await window.xivig.getSetting('user_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged: UserSettings = { ...defaultSettings, ...parsed };
        if (parsed.theme === 'xivig-dark') {
          merged.theme = 'dracula';
        }
        set({ settings: merged });
        applySettingsToDOM(merged);
      } else {
        applySettingsToDOM(defaultSettings);
      }
    } catch (err) {
      console.error('[Xivig Settings] Failed to load settings:', err);
      applySettingsToDOM(defaultSettings);
    }
  },
}));

// Initial DOM variable hydration
applySettingsToDOM(defaultSettings);
