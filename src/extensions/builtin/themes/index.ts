import { BuiltinExtensionModule } from '../../api/types';
import {
  resolveMaterialIcon,
  resolveMaterialFolderIcon,
  materialIconTheme,
} from './materialIconPlugin';
import {
  resolveVsCodeIcon,
  resolveVsCodeFolderIcon,
  vscodeIconsTheme,
} from './vscodeIconsPlugin';
import {
  REGISTERED_THEMES,
  findThemeById,
  oneDarkProTheme,
  catppuccinMochaTheme,
  catppuccinLatteTheme,
  tokyoNightTheme,
  githubDarkTheme,
  githubLightTheme,
  ayuDarkTheme,
  nightOwlTheme,
} from './themePacksPlugin';

export * from './types';
export * from './materialIconPlugin';
export * from './vscodeIconsPlugin';
export * from './themePacksPlugin';

// 1. Material Icon Theme
export const materialIconThemeExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.material-icon-theme',
    name: 'Material Icon Theme',
    publisher: 'Philipp Kief',
    version: '4.34.0',
    description: 'Material Design icons for files and folders across 100+ languages and frameworks.',
    categories: ['Themes', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#1e293b',
    iconSymbol: '🎨',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. VSCode Icons
export const vscodeIconsExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.vscode-icons',
    name: 'vscode-icons',
    publisher: 'VSCode Icons Team',
    version: '12.8.0',
    description: 'The classic official VS Code icon theme with rich file and folder icons.',
    categories: ['Themes', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#1e293b',
    iconSymbol: '📁',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. One Dark Pro
export const oneDarkProExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.one-dark-pro',
    name: 'One Dark Pro',
    publisher: 'binaryify',
    version: '3.18.0',
    description: "Atom's iconic One Dark theme for Xivig, with rich syntax highlight tokens.",
    categories: ['Themes'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#282c34',
    iconSymbol: '🌑',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. Catppuccin
export const catppuccinExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.catppuccin',
    name: 'Catppuccin for Xivig',
    publisher: 'Catppuccin',
    version: '3.14.0',
    description: 'Soothing pastel theme for the high-spirited coder (Mocha, Macchiato, Frappe, Latte).',
    categories: ['Themes'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#1e1e2e',
    iconSymbol: '☕',
  },
  activate: () => {},
  deactivate: () => {},
};

// 5. Tokyo Night
export const tokyoNightThemeExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.tokyo-night',
    name: 'Tokyo Night',
    publisher: 'enkia',
    version: '1.0.8',
    description: 'A clean, dark Xivig theme that celebrates the lights of Downtown Tokyo at night.',
    categories: ['Themes'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#1a1b26',
    iconSymbol: '🗼',
  },
  activate: () => {},
  deactivate: () => {},
};

// 6. GitHub Theme
export const githubThemeExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.github-theme',
    name: 'GitHub Theme',
    publisher: 'GitHub',
    version: '6.3.4',
    description: 'Official GitHub theme with Dark, Light, and Dimmed modes styled from Primer design system.',
    categories: ['Themes'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#0d1117',
    iconSymbol: '🐙',
  },
  activate: () => {},
  deactivate: () => {},
};

// 7. Ayu
export const ayuThemeExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.ayu',
    name: 'Ayu',
    publisher: 'teabyii',
    version: '1.0.5',
    description: 'A simple theme with bright colors and comes in three versions — dark, mirage and light.',
    categories: ['Themes'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#0a0e14',
    iconSymbol: '🌅',
  },
  activate: () => {},
  deactivate: () => {},
};

// 8. Night Owl
export const nightOwlExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.night-owl',
    name: 'Night Owl',
    publisher: 'sarah.drasner',
    version: '2.0.1',
    description: 'A Xivig theme for night owls tuned for accessibility and low-light coding.',
    categories: ['Themes'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#011627',
    iconSymbol: '🦉',
  },
  activate: () => {},
  deactivate: () => {},
};
