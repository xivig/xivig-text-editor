import { create } from 'zustand';

export interface CustomThemeColors {
  name: string;
  isDark: boolean;
  background: string;
  foreground: string;
  surface: string;
  border: string;
  accent: string;
  // Syntax tokens
  syntaxKeyword: string;
  syntaxFunction: string;
  syntaxString: string;
  syntaxNumber: string;
  syntaxComment: string;
  syntaxType: string;
  syntaxVariable: string;
}

export const DEFAULT_CUSTOM_THEME: CustomThemeColors = {
  name: 'My Custom Theme',
  isDark: true,
  background: '#12141a',
  foreground: '#e5e7eb',
  surface: '#1d2028',
  border: '#2c313d',
  accent: '#6c8cff',
  syntaxKeyword: '#c792ea',
  syntaxFunction: '#82aaff',
  syntaxString: '#c3e88d',
  syntaxNumber: '#f78c6c',
  syntaxComment: '#637777',
  syntaxType: '#ffcb6b',
  syntaxVariable: '#eeffff',
};

interface ThemeCustomizerState {
  customTheme: CustomThemeColors;
  savedThemes: CustomThemeColors[];
  isCustomThemeActive: boolean;

  setThemeColor: <K extends keyof CustomThemeColors>(key: K, value: CustomThemeColors[K]) => void;
  saveCurrentTheme: () => void;
  loadTheme: (theme: CustomThemeColors) => void;
  deleteSavedTheme: (name: string) => void;
  exportThemeJson: () => string;
  importThemeJson: (jsonStr: string) => boolean;
  applyTheme: () => void;
  resetToDefault: () => void;
}

export const useThemeCustomizerStore = create<ThemeCustomizerState>((set, get) => ({
  customTheme: { ...DEFAULT_CUSTOM_THEME },
  savedThemes: [
    { ...DEFAULT_CUSTOM_THEME },
    {
      name: 'Emerald Forest',
      isDark: true,
      background: '#0d1a14',
      foreground: '#e2f5ec',
      surface: '#152b21',
      border: '#244737',
      accent: '#35b779',
      syntaxKeyword: '#50fa7b',
      syntaxFunction: '#80ffea',
      syntaxString: '#f1fa8c',
      syntaxNumber: '#ffb86c',
      syntaxComment: '#5c786a',
      syntaxType: '#8be9fd',
      syntaxVariable: '#e2f5ec',
    },
    {
      name: 'High Contrast Dark',
      isDark: true,
      background: '#000000',
      foreground: '#ffffff',
      surface: '#111111',
      border: '#ffffff',
      accent: '#ffff00',
      syntaxKeyword: '#00ffff',
      syntaxFunction: '#ff00ff',
      syntaxString: '#00ff00',
      syntaxNumber: '#ffff00',
      syntaxComment: '#888888',
      syntaxType: '#ffaa00',
      syntaxVariable: '#ffffff',
    },
  ],
  isCustomThemeActive: false,

  setThemeColor: (key, value) => {
    set((state) => ({
      customTheme: { ...state.customTheme, [key]: value },
    }));
  },

  saveCurrentTheme: () => {
    const { customTheme, savedThemes } = get();
    const existingIndex = savedThemes.findIndex((t) => t.name === customTheme.name);
    if (existingIndex >= 0) {
      const updated = [...savedThemes];
      updated[existingIndex] = { ...customTheme };
      set({ savedThemes: updated });
    } else {
      set({ savedThemes: [...savedThemes, { ...customTheme }] });
    }
  },

  loadTheme: (theme) => {
    set({ customTheme: { ...theme }, isCustomThemeActive: true });
    get().applyTheme();
  },

  deleteSavedTheme: (name) => {
    set((state) => ({
      savedThemes: state.savedThemes.filter((t) => t.name !== name),
    }));
  },

  exportThemeJson: () => {
    return JSON.stringify(get().customTheme, null, 2);
  },

  importThemeJson: (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.name && parsed.background && parsed.foreground) {
        set({
          customTheme: { ...DEFAULT_CUSTOM_THEME, ...parsed },
          isCustomThemeActive: true,
        });
        get().applyTheme();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  applyTheme: () => {
    const { customTheme } = get();
    const root = document.documentElement;
    root.style.setProperty('--xivig-bg', customTheme.background);
    root.style.setProperty('--xivig-text', customTheme.foreground);
    root.style.setProperty('--xivig-surface', customTheme.surface);
    root.style.setProperty('--xivig-border', customTheme.border);
    root.style.setProperty('--xivig-accent', customTheme.accent);
    set({ isCustomThemeActive: true });
  },

  resetToDefault: () => {
    set({ customTheme: { ...DEFAULT_CUSTOM_THEME }, isCustomThemeActive: false });
    const root = document.documentElement;
    root.style.removeProperty('--xivig-bg');
    root.style.removeProperty('--xivig-text');
    root.style.removeProperty('--xivig-surface');
    root.style.removeProperty('--xivig-border');
    root.style.removeProperty('--xivig-accent');
  },
}));
