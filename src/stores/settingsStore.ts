import { create } from 'zustand';
import { ThemeId, applyThemeToCssVariables } from '../styles/themes';

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
}

interface SettingsState {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  loadSettings: () => Promise<void>;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

const defaultSettings: UserSettings = {
  fontSize: 14,
  fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, Menlo, monospace",
  lineHeight: 1.6,
  tabSize: 2,
  wordWrap: false,
  lineNumbers: true,
  minimap: true,
  theme: 'xivig-dark',
  autoSave: true,
};

function applySettingsToDOM(settings: UserSettings) {
  const root = document.documentElement;
  root.style.setProperty('--xivig-font-size-code', `${settings.fontSize}px`);
  root.style.setProperty('--xivig-font-mono', settings.fontFamily);
  root.style.setProperty('--xivig-line-height-code', `${settings.lineHeight}`);
  applyThemeToCssVariables(settings.theme);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,

  updateSettings: (partial) => {
    const updated = { ...get().settings, ...partial };
    set({ settings: updated });
    applySettingsToDOM(updated);

    if (window.xivig?.setSetting) {
      window.xivig.setSetting('user_settings', JSON.stringify(updated));
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

  loadSettings: async () => {
    if (!window.xivig?.getSetting) return;

    try {
      const raw = await window.xivig.getSetting('user_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged: UserSettings = { ...defaultSettings, ...parsed };
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
