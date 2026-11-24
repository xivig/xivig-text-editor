import { create } from 'zustand';

export interface FormatterItem {
  id: string;
  name: string;
  languages: string[];
  command: string;
  isAvailable: boolean;
  type: 'formatter' | 'linter';
}

interface FormatState {
  formatters: FormatterItem[];
  defaultFormatterByLanguage: Record<string, string>;
  formatOnSave: boolean;
  formatOnPaste: boolean;
  lintOnSave: boolean;
  organizeImportsOnSave: boolean;
  isLoading: boolean;

  // Actions
  loadFormatters: () => Promise<void>;
  setDefaultFormatter: (language: string, formatterId: string) => void;
  setFormatOnSave: (enabled: boolean) => void;
  setFormatOnPaste: (enabled: boolean) => void;
  setLintOnSave: (enabled: boolean) => void;
  setOrganizeImportsOnSave: (enabled: boolean) => void;
  getConflictingFormatters: (language: string) => FormatterItem[];
}

export const useFormatStore = create<FormatState>((set, get) => ({
  formatters: [],
  defaultFormatterByLanguage: {
    javascript: 'prettier',
    typescript: 'prettier',
    javascriptreact: 'prettier',
    typescriptreact: 'prettier',
    html: 'prettier',
    css: 'prettier',
    json: 'prettier',
    yaml: 'prettier',
    markdown: 'prettier',
    python: 'ruff',
    php: 'pint',
    c: 'clang-format',
    cpp: 'clang-format',
    rust: 'rustfmt',
    go: 'gofmt',
  },
  formatOnSave: true,
  formatOnPaste: false,
  lintOnSave: false,
  organizeImportsOnSave: false,
  isLoading: false,

  loadFormatters: async () => {
    set({ isLoading: true });
    try {
      if (window.xivig?.formatter?.listAvailable) {
        const list = await window.xivig.formatter.listAvailable();
        set({ formatters: list || [], isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setDefaultFormatter: (language: string, formatterId: string) => {
    set((state) => ({
      defaultFormatterByLanguage: {
        ...state.defaultFormatterByLanguage,
        [language.toLowerCase()]: formatterId,
      },
    }));
  },

  setFormatOnSave: (enabled: boolean) => set({ formatOnSave: enabled }),
  setFormatOnPaste: (enabled: boolean) => set({ formatOnPaste: enabled }),
  setLintOnSave: (enabled: boolean) => set({ lintOnSave: enabled }),
  setOrganizeImportsOnSave: (enabled: boolean) => set({ organizeImportsOnSave: enabled }),

  getConflictingFormatters: (language: string) => {
    const l = language.toLowerCase();
    const available = get().formatters.filter(
      (f) => f.isAvailable && f.type === 'formatter' && f.languages.includes(l)
    );
    return available.length > 1 ? available : [];
  },
}));
