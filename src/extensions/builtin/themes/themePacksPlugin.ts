import type { ThemeDefinition } from './types';

// 1. One Dark Pro
export const oneDarkProTheme: ThemeDefinition = {
  id: 'one-dark-pro',
  name: 'One Dark Pro',
  type: 'dark',
  workbench: {
    bg: '#282c34',
    surface: '#21252b',
    sidebar: '#21252b',
    activityBar: '#1e2227',
    editor: '#282c34',
    statusbar: '#21252b',
    accent: '#61afef',
    text: '#abb2bf',
    textMuted: '#5c6370',
    border: '#181a1f',
    selection: '#3e4451',
  },
  tokens: {
    keywords: '#c678dd',
    functions: '#61afef',
    strings: '#98c379',
    numbers: '#d19a66',
    types: '#e5c07b',
    comments: '#5c6370',
    variables: '#e06c75',
    constants: '#d19a66',
  },
};

// 2. Catppuccin Mocha (Dark) & Latte (Light)
export const catppuccinMochaTheme: ThemeDefinition = {
  id: 'catppuccin-mocha',
  name: 'Catppuccin Mocha',
  type: 'dark',
  workbench: {
    bg: '#1e1e2e',
    surface: '#181825',
    sidebar: '#181825',
    activityBar: '#11111b',
    editor: '#1e1e2e',
    statusbar: '#11111b',
    accent: '#cba6f7',
    text: '#cdd6f4',
    textMuted: '#6c7086',
    border: '#313244',
    selection: '#45475a',
  },
  tokens: {
    keywords: '#cba6f7',
    functions: '#89b4fa',
    strings: '#a6e3a1',
    numbers: '#fab387',
    types: '#f9e2af',
    comments: '#6c7086',
    variables: '#f38ba8',
    constants: '#fab387',
  },
};

export const catppuccinLatteTheme: ThemeDefinition = {
  id: 'catppuccin-latte',
  name: 'Catppuccin Latte',
  type: 'light',
  workbench: {
    bg: '#eff1f5',
    surface: '#e6e9ef',
    sidebar: '#e6e9ef',
    activityBar: '#dce0e8',
    editor: '#eff1f5',
    statusbar: '#dce0e8',
    accent: '#8839ef',
    text: '#4c4f69',
    textMuted: '#9ca0b0',
    border: '#ccd0da',
    selection: '#acb0be',
  },
  tokens: {
    keywords: '#8839ef',
    functions: '#1e66f5',
    strings: '#40a02b',
    numbers: '#fe640b',
    types: '#df8e1d',
    comments: '#9ca0b0',
    variables: '#d20f39',
    constants: '#fe640b',
  },
};

// 3. Tokyo Night
export const tokyoNightTheme: ThemeDefinition = {
  id: 'tokyo-night',
  name: 'Tokyo Night',
  type: 'dark',
  workbench: {
    bg: '#1a1b26',
    surface: '#16161e',
    sidebar: '#16161e',
    activityBar: '#13141c',
    editor: '#1a1b26',
    statusbar: '#13141c',
    accent: '#7aa2f7',
    text: '#c0caf5',
    textMuted: '#565f89',
    border: '#292e42',
    selection: '#33467c',
  },
  tokens: {
    keywords: '#bb9af7',
    functions: '#7aa2f7',
    strings: '#9ece6a',
    numbers: '#ff9e64',
    types: '#2ac3de',
    comments: '#565f89',
    variables: '#f7768e',
    constants: '#ff9e64',
  },
};

// 4. GitHub Dark & GitHub Light
export const githubDarkTheme: ThemeDefinition = {
  id: 'github-dark-default',
  name: 'GitHub Dark',
  type: 'dark',
  workbench: {
    bg: '#0d1117',
    surface: '#010409',
    sidebar: '#010409',
    activityBar: '#010409',
    editor: '#0d1117',
    statusbar: '#010409',
    accent: '#58a6ff',
    text: '#e6edf3',
    textMuted: '#8b949e',
    border: '#30363d',
    selection: '#1f6feb44',
  },
  tokens: {
    keywords: '#ff7b72',
    functions: '#d2a8ff',
    strings: '#a5d6ff',
    numbers: '#79c0ff',
    types: '#ffa657',
    comments: '#8b949e',
    variables: '#e6edf3',
    constants: '#79c0ff',
  },
};

export const githubLightTheme: ThemeDefinition = {
  id: 'github-light-default',
  name: 'GitHub Light',
  type: 'light',
  workbench: {
    bg: '#ffffff',
    surface: '#f6f8fa',
    sidebar: '#f6f8fa',
    activityBar: '#ffffff',
    editor: '#ffffff',
    statusbar: '#f6f8fa',
    accent: '#0969da',
    text: '#1f2328',
    textMuted: '#656d76',
    border: '#d0d7de',
    selection: '#0969da22',
  },
  tokens: {
    keywords: '#cf222e',
    functions: '#8250df',
    strings: '#0a3069',
    numbers: '#0550ae',
    types: '#953800',
    comments: '#6e7781',
    variables: '#24292f',
    constants: '#0550ae',
  },
};

// 5. Ayu Dark
export const ayuDarkTheme: ThemeDefinition = {
  id: 'ayu-dark',
  name: 'Ayu Dark',
  type: 'dark',
  workbench: {
    bg: '#0a0e14',
    surface: '#05070a',
    sidebar: '#05070a',
    activityBar: '#05070a',
    editor: '#0a0e14',
    statusbar: '#05070a',
    accent: '#e6b450',
    text: '#b3b1ad',
    textMuted: '#4d5566',
    border: '#1b222d',
    selection: '#273747',
  },
  tokens: {
    keywords: '#ff7733',
    functions: '#ffb454',
    strings: '#c2d94c',
    numbers: '#e6b450',
    types: '#39bae6',
    comments: '#4d5566',
    variables: '#f07178',
    constants: '#ffee99',
  },
};

// 6. Night Owl
export const nightOwlTheme: ThemeDefinition = {
  id: 'night-owl',
  name: 'Night Owl',
  type: 'dark',
  workbench: {
    bg: '#011627',
    surface: '#01111d',
    sidebar: '#01111d',
    activityBar: '#010e17',
    editor: '#011627',
    statusbar: '#010e17',
    accent: '#82aaff',
    text: '#d6deeb',
    textMuted: '#5f7e97',
    border: '#0b2942',
    selection: '#1d3b53',
  },
  tokens: {
    keywords: '#c792ea',
    functions: '#82aaff',
    strings: '#ecc48d',
    numbers: '#f78c6c',
    types: '#addb67',
    comments: '#5f7e97',
    variables: '#d6deeb',
    constants: '#82aaff',
  },
};

export const REGISTERED_THEMES: ThemeDefinition[] = [
  oneDarkProTheme,
  catppuccinMochaTheme,
  catppuccinLatteTheme,
  tokyoNightTheme,
  githubDarkTheme,
  githubLightTheme,
  ayuDarkTheme,
  nightOwlTheme,
];

export function findThemeById(id: string): ThemeDefinition | undefined {
  return REGISTERED_THEMES.find((t) => t.id === id);
}
