import { create } from 'zustand';
import { ThemeId } from '../styles/themes';
import { useSettingsStore } from './settingsStore';

export type ExtensionCategory = 'All' | 'Themes' | 'Languages' | 'Productivity' | 'Formatters';

export interface ExtensionPackage {
  id: string;
  name: string;
  publisher: string;
  version: string;
  category: 'Themes' | 'Languages' | 'Productivity' | 'Formatters';
  description: string;
  iconBg: string;
  iconSymbol: string;
  downloads: string;
  rating: number;
  tags: string[];
  themeId?: ThemeId;
  readme: string;
}

const MARKETPLACE_EXTENSIONS: ExtensionPackage[] = [
  // --- THEMES ---
  {
    id: 'xivig-theme-nord',
    name: 'Nord Theme',
    publisher: 'Arctic Ice Studio',
    version: '1.4.0',
    category: 'Themes',
    description: 'An arctic, north-bluish clean and elegant dark color palette.',
    iconBg: '#2e3440',
    iconSymbol: '❄️',
    downloads: '215k',
    rating: 4.9,
    tags: ['theme', 'nord', 'dark', 'minimal'],
    themeId: 'nord',
    readme: `# Nord Theme for Xivig Editor
An arctic, north-bluish palette created for clean, distraction-free coding and reading.
- Focused on eye comfort and high readability.
- Consistent syntax highlighting across JavaScript, TypeScript, Python, Rust, and CSS.`,
  },
  {
    id: 'xivig-theme-tokyo-night',
    name: 'Tokyo Night',
    publisher: 'enkia',
    version: '2.1.2',
    category: 'Themes',
    description: 'A clean Visual Studio Code inspired dark theme that celebrates the lights of Downtown Tokyo at night.',
    iconBg: '#1a1b26',
    iconSymbol: '🗼',
    downloads: '380k',
    rating: 5.0,
    tags: ['theme', 'tokyo-night', 'indigo', 'modern'],
    themeId: 'tokyo-night',
    readme: `# Tokyo Night Theme
A dark theme with deep indigo tones, neon blue/purple accents, and crisp contrast.
- Signature neon accents
- Beautiful statusbar and editor styling`,
  },
  {
    id: 'xivig-theme-cyberpunk',
    name: 'Cyberpunk 2077',
    publisher: 'NightCity',
    version: '1.2.0',
    category: 'Themes',
    description: 'High-contrast neon yellow and midnight blue aesthetic inspired by Night City.',
    iconBg: '#0d0f18',
    iconSymbol: '⚡',
    downloads: '142k',
    rating: 4.8,
    tags: ['theme', 'cyberpunk', 'neon', 'high-contrast'],
    themeId: 'cyberpunk',
    readme: `# Cyberpunk 2077 Theme
Vibrant neon yellow, cyan, and deep obsidian black for futuristic aesthetics.`,
  },
  {
    id: 'xivig-theme-github-dark',
    name: 'GitHub Dark',
    publisher: 'GitHub',
    version: '3.0.1',
    category: 'Themes',
    description: 'The official GitHub Dark High Contrast theme tuned for desktop editors.',
    iconBg: '#0d1117',
    iconSymbol: '🐙',
    downloads: '520k',
    rating: 4.9,
    tags: ['theme', 'github', 'official', 'dark'],
    themeId: 'github-dark',
    readme: `# GitHub Dark
The official dark theme from GitHub. Crisp lines, balanced muted slates, and electric blue accents.`,
  },
  {
    id: 'xivig-theme-synthwave',
    name: "SynthWave '84",
    publisher: 'RobbOwen',
    version: '2.0.4',
    category: 'Themes',
    description: 'Retro 80s neon synthwave aesthetic featuring hot pink and warm neon yellow.',
    iconBg: '#262335',
    iconSymbol: '🌆',
    downloads: '188k',
    rating: 4.9,
    tags: ['theme', 'synthwave', 'retro', '80s'],
    themeId: 'synthwave',
    readme: `# SynthWave '84
A neon-soaked retro 80s theme that transports your code editor straight into a synth soundtrack.`,
  },

  // --- LANGUAGES ---
  {
    id: 'xivig-lang-python',
    name: 'Python Pro Toolpack',
    publisher: 'Xivig Community',
    version: '1.3.0',
    category: 'Languages',
    description: 'Advanced Python intelligence, docstring generators, PEP 8 templates, and virtualenv runner.',
    iconBg: '#3776ab',
    iconSymbol: '🐍',
    downloads: '310k',
    rating: 4.9,
    tags: ['python', 'snippets', 'pep8', 'tools'],
    readme: `# Python Pro Toolpack
Supercharge Python development with fast execution, built-in docstring snippets, and virtualenv support.`,
  },
  {
    id: 'xivig-lang-rust',
    name: 'Rust Cargo Suite',
    publisher: 'Rustaceans',
    version: '1.1.5',
    category: 'Languages',
    description: 'Rich snippets for Rust structs, traits, matches, and 1-click Cargo check/run shortcuts.',
    iconBg: '#e43717',
    iconSymbol: '🦀',
    downloads: '165k',
    rating: 4.9,
    tags: ['rust', 'cargo', 'systems', 'snippets'],
    readme: `# Rust Cargo Suite
Includes cargo shortcuts, snippet completions for idioms, match exhaustiveness templates, and fast builds.`,
  },
  {
    id: 'xivig-lang-sql',
    name: 'SQL & Database Studio',
    publisher: 'DataCraft',
    version: '1.0.8',
    category: 'Languages',
    description: 'SQL syntax highlighter, table template snippets, and query execution helper.',
    iconBg: '#336791',
    iconSymbol: '🗄️',
    downloads: '95k',
    rating: 4.7,
    tags: ['sql', 'database', 'postgres', 'mysql'],
    readme: `# SQL & Database Studio
Full dialect support (PostgreSQL, MySQL, SQLite), join shortcuts, and formatting.`,
  },
  {
    id: 'xivig-lang-go',
    name: 'Go Lang Tools',
    publisher: 'Golang Team',
    version: '1.2.0',
    category: 'Languages',
    description: 'Go language snippets, struct tag generators, goroutine templates, and error handling idioms.',
    iconBg: '#00add8',
    iconSymbol: '🐹',
    downloads: '120k',
    rating: 4.8,
    tags: ['go', 'golang', 'tools', 'snippets'],
    readme: `# Go Lang Tools
Productivity booster for Go developers with quick snippet expansions and test generators.`,
  },

  // --- PRODUCTIVITY & FORMATTERS ---
  {
    id: 'xivig-tool-prettier',
    name: 'Prettier Formatter',
    publisher: 'Prettier',
    version: '3.2.0',
    category: 'Formatters',
    description: 'Opinionated code formatter for JavaScript, TypeScript, CSS, HTML, Markdown, and JSON.',
    iconBg: '#ea5e5e',
    iconSymbol: '✨',
    downloads: '640k',
    rating: 5.0,
    tags: ['formatter', 'prettier', 'javascript', 'css'],
    readme: `# Prettier Formatter
Formats code cleanly and consistently according to standard community style rules.`,
  },
  {
    id: 'xivig-tool-todo',
    name: 'TODO Highlight',
    publisher: 'Wayou',
    version: '1.0.4',
    category: 'Productivity',
    description: 'Highlights TODO:, FIXME:, NOTE:, and BUG: annotations with bright colorful badges.',
    iconBg: '#ff9800',
    iconSymbol: '📝',
    downloads: '275k',
    rating: 4.8,
    tags: ['todo', 'fixme', 'comments', 'productivity'],
    readme: `# TODO Highlight
Never forget a TODO comment again! Highlights annotations in source code with vibrant warning badges.`,
  },
  {
    id: 'xivig-tool-rainbow',
    name: 'Rainbow Brackets & Indent',
    publisher: '2gua',
    version: '2.1.0',
    category: 'Productivity',
    description: 'Colorizes matching brackets and indentation depths with rainbow cycles for readability.',
    iconBg: '#9c27b0',
    iconSymbol: '🌈',
    downloads: '410k',
    rating: 4.9,
    tags: ['rainbow', 'brackets', 'indent', 'visual'],
    readme: `# Rainbow Brackets & Indent
Makes complex nested code blocks instantly readable by coloring pairs in cyclical rainbow tints.`,
  },
];

interface ExtensionState {
  marketplace: ExtensionPackage[];
  installedIds: string[];
  enabledIds: string[];
  selectedExtension: ExtensionPackage | null;

  installExtension: (id: string) => Promise<void>;
  uninstallExtension: (id: string) => Promise<void>;
  toggleEnableExtension: (id: string) => Promise<void>;
  selectExtension: (pkg: ExtensionPackage | null) => void;
  loadInstalledExtensions: () => Promise<void>;
}

export const useExtensionStore = create<ExtensionState>((set, get) => ({
  marketplace: MARKETPLACE_EXTENSIONS,
  installedIds: ['xivig-theme-nord', 'xivig-tool-todo'],
  enabledIds: ['xivig-theme-nord', 'xivig-tool-todo'],
  selectedExtension: null,

  selectExtension: (pkg) => set({ selectedExtension: pkg }),

  installExtension: async (id) => {
    const pkg = get().marketplace.find((m) => m.id === id);
    if (!pkg) return;

    const newInstalled = Array.from(new Set([...get().installedIds, id]));
    const newEnabled = Array.from(new Set([...get().enabledIds, id]));
    set({ installedIds: newInstalled, enabledIds: newEnabled });

    // If it's a theme, automatically prompt or activate it!
    if (pkg.themeId) {
      useSettingsStore.getState().updateSettings({ theme: pkg.themeId });
    }

    // Persist to database
    if (window.xivig?.setSetting) {
      window.xivig.setSetting('installed_extensions', JSON.stringify(newInstalled));
      window.xivig.setSetting('enabled_extensions', JSON.stringify(newEnabled));
    }
  },

  uninstallExtension: async (id) => {
    const pkg = get().marketplace.find((m) => m.id === id);
    const newInstalled = get().installedIds.filter((item) => item !== id);
    const newEnabled = get().enabledIds.filter((item) => item !== id);
    set({ installedIds: newInstalled, enabledIds: newEnabled });

    // If active theme was this uninstalled theme, switch back to xivig-dark
    if (pkg?.themeId && useSettingsStore.getState().settings.theme === pkg.themeId) {
      useSettingsStore.getState().updateSettings({ theme: 'xivig-dark' });
    }

    if (window.xivig?.setSetting) {
      window.xivig.setSetting('installed_extensions', JSON.stringify(newInstalled));
      window.xivig.setSetting('enabled_extensions', JSON.stringify(newEnabled));
    }
  },

  toggleEnableExtension: async (id) => {
    const isEnabled = get().enabledIds.includes(id);
    const newEnabled = isEnabled
      ? get().enabledIds.filter((item) => item !== id)
      : [...get().enabledIds, id];

    set({ enabledIds: newEnabled });

    const pkg = get().marketplace.find((m) => m.id === id);
    if (pkg?.themeId) {
      if (!isEnabled) {
        useSettingsStore.getState().updateSettings({ theme: pkg.themeId });
      } else if (useSettingsStore.getState().settings.theme === pkg.themeId) {
        useSettingsStore.getState().updateSettings({ theme: 'xivig-dark' });
      }
    }

    if (window.xivig?.setSetting) {
      window.xivig.setSetting('enabled_extensions', JSON.stringify(newEnabled));
    }
  },

  loadInstalledExtensions: async () => {
    if (window.xivig?.getSetting) {
      const savedInstalled = await window.xivig.getSetting('installed_extensions');
      const savedEnabled = await window.xivig.getSetting('enabled_extensions');
      if (savedInstalled) {
        try {
          const parsed = JSON.parse(savedInstalled);
          if (Array.isArray(parsed)) {
            set({ installedIds: parsed });
          }
        } catch {}
      }
      if (savedEnabled) {
        try {
          const parsed = JSON.parse(savedEnabled);
          if (Array.isArray(parsed)) {
            set({ enabledIds: parsed });
          }
        } catch {}
      }
    }
  },
}));
