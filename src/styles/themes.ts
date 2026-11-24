export type ThemeId =
  | 'xivig-dark'
  | 'monokai'
  | 'dracula'
  | 'one-dark'
  | 'solarized-light'
  | 'nord'
  | 'tokyo-night'
  | 'cyberpunk'
  | 'github-dark'
  | 'synthwave'
  | (string & {});

export interface ThemeColors {
  id: ThemeId;
  name: string;
  isDark: boolean;
  colors: {
    bg: string;
    surface: string;
    surfaceHover: string;
    sidebar: string;
    activityBar: string;
    tabActive: string;
    tabInactive: string;
    editor: string;
    statusbar: string;
    accent: string;
    accentHover: string;
    text: string;
    textMuted: string;
    textDim: string;
    border: string;
    borderSubtle: string;
    selection: string;
  };
}

export const themes: Record<ThemeId, ThemeColors> = {
  'xivig-dark': {
    id: 'xivig-dark',
    name: 'Xivig Dark (Default)',
    isDark: true,
    colors: {
      bg: '#17191f',
      surface: '#1d2028',
      surfaceHover: '#262a35',
      sidebar: '#191b22',
      activityBar: '#13151a',
      tabActive: '#17191f',
      tabInactive: '#1b1e26',
      editor: '#17191f',
      statusbar: '#13151a',
      accent: '#6c8cff',
      accentHover: '#5879f5',
      text: '#e5e7eb',
      textMuted: '#9299a8',
      textDim: '#646b7a',
      border: '#2c313d',
      borderSubtle: '#21252f',
      selection: 'rgba(108, 140, 255, 0.25)',
    },
  },
  'monokai': {
    id: 'monokai',
    name: 'Monokai Pro (Sublime Classic)',
    isDark: true,
    colors: {
      bg: '#272822',
      surface: '#1e1f1c',
      surfaceHover: '#3e3d32',
      sidebar: '#1e1f1c',
      activityBar: '#141412',
      tabActive: '#272822',
      tabInactive: '#1e1f1c',
      editor: '#272822',
      statusbar: '#1e1f1c',
      accent: '#e6db74',
      accentHover: '#f8f8f2',
      text: '#f8f8f2',
      textMuted: '#90908a',
      textDim: '#75715e',
      border: '#3e3d32',
      borderSubtle: '#2f302b',
      selection: 'rgba(73, 72, 62, 0.75)',
    },
  },
  'dracula': {
    id: 'dracula',
    name: 'Dracula (Official)',
    isDark: true,
    colors: {
      bg: '#282a36',
      surface: '#21222c',
      surfaceHover: '#343746',
      sidebar: '#21222c',
      activityBar: '#191a21',
      tabActive: '#282a36',
      tabInactive: '#21222c',
      editor: '#282a36',
      statusbar: '#191a21',
      accent: '#bd93f9',
      accentHover: '#ff79c6',
      text: '#f8f8f2',
      textMuted: '#9a9bb8',
      textDim: '#6272a4',
      border: '#44475a',
      borderSubtle: '#343746',
      selection: 'rgba(68, 71, 90, 0.65)',
    },
  },
  'one-dark': {
    id: 'one-dark',
    name: 'One Dark Pro',
    isDark: true,
    colors: {
      bg: '#282c34',
      surface: '#21252b',
      surfaceHover: '#2c313a',
      sidebar: '#21252b',
      activityBar: '#1b1d23',
      tabActive: '#282c34',
      tabInactive: '#21252b',
      editor: '#282c34',
      statusbar: '#1b1d23',
      accent: '#61afef',
      accentHover: '#528bff',
      text: '#abb2bf',
      textMuted: '#5c6370',
      textDim: '#4b5263',
      border: '#181a1f',
      borderSubtle: '#21252b',
      selection: 'rgba(62, 68, 81, 0.7)',
    },
  },
  'solarized-light': {
    id: 'solarized-light',
    name: 'Solarized Light',
    isDark: false,
    colors: {
      bg: '#fdf6e3',
      surface: '#eee8d5',
      surfaceHover: '#e0d8c3',
      sidebar: '#eee8d5',
      activityBar: '#e4dcce',
      tabActive: '#fdf6e3',
      tabInactive: '#eee8d5',
      editor: '#fdf6e3',
      statusbar: '#e4dcce',
      accent: '#268bd2',
      accentHover: '#2aa198',
      text: '#073642',
      textMuted: '#657b83',
      textDim: '#93a1a1',
      border: '#d3cfc5',
      borderSubtle: '#e8e2d2',
      selection: 'rgba(38, 139, 210, 0.22)',
    },
  },
  'nord': {
    id: 'nord',
    name: 'Nord Theme',
    isDark: true,
    colors: {
      bg: '#2e3440',
      surface: '#242933',
      surfaceHover: '#3b4252',
      sidebar: '#242933',
      activityBar: '#1f232a',
      tabActive: '#2e3440',
      tabInactive: '#242933',
      editor: '#2e3440',
      statusbar: '#1f232a',
      accent: '#88c0d0',
      accentHover: '#81a1c1',
      text: '#eceff4',
      textMuted: '#d8dee9',
      textDim: '#4c566a',
      border: '#3b4252',
      borderSubtle: '#2e3440',
      selection: 'rgba(136, 192, 208, 0.25)',
    },
  },
  'tokyo-night': {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    isDark: true,
    colors: {
      bg: '#1a1b26',
      surface: '#16161e',
      surfaceHover: '#292e42',
      sidebar: '#16161e',
      activityBar: '#13141c',
      tabActive: '#1a1b26',
      tabInactive: '#16161e',
      editor: '#1a1b26',
      statusbar: '#13141c',
      accent: '#7aa2f7',
      accentHover: '#bb9af7',
      text: '#c0caf5',
      textMuted: '#9aa5ce',
      textDim: '#565f89',
      border: '#292e42',
      borderSubtle: '#1f2335',
      selection: 'rgba(122, 162, 247, 0.25)',
    },
  },
  'cyberpunk': {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    isDark: true,
    colors: {
      bg: '#0d0f18',
      surface: '#121526',
      surfaceHover: '#1c223c',
      sidebar: '#0a0c14',
      activityBar: '#07080d',
      tabActive: '#0d0f18',
      tabInactive: '#121526',
      editor: '#0d0f18',
      statusbar: '#07080d',
      accent: '#fee801',
      accentHover: '#00f0ff',
      text: '#e5e7eb',
      textMuted: '#9ca3af',
      textDim: '#ff003c',
      border: '#2a3356',
      borderSubtle: '#1c223c',
      selection: 'rgba(254, 232, 1, 0.28)',
    },
  },
  'github-dark': {
    id: 'github-dark',
    name: 'GitHub Dark',
    isDark: true,
    colors: {
      bg: '#0d1117',
      surface: '#161b22',
      surfaceHover: '#21262d',
      sidebar: '#161b22',
      activityBar: '#090d12',
      tabActive: '#0d1117',
      tabInactive: '#161b22',
      editor: '#0d1117',
      statusbar: '#090d12',
      accent: '#58a6ff',
      accentHover: '#1f6feb',
      text: '#c9d1d9',
      textMuted: '#8b949e',
      textDim: '#6e7681',
      border: '#30363d',
      borderSubtle: '#21262d',
      selection: 'rgba(88, 166, 255, 0.25)',
    },
  },
  'synthwave': {
    id: 'synthwave',
    name: "SynthWave '84",
    isDark: true,
    colors: {
      bg: '#262335',
      surface: '#201d2d',
      surfaceHover: '#342f49',
      sidebar: '#201d2d',
      activityBar: '#181522',
      tabActive: '#262335',
      tabInactive: '#201d2d',
      editor: '#262335',
      statusbar: '#181522',
      accent: '#ff7edb',
      accentHover: '#fede5d',
      text: '#f8f8f2',
      textMuted: '#b6b1cc',
      textDim: '#847b9b',
      border: '#463f63',
      borderSubtle: '#342f49',
      selection: 'rgba(255, 126, 219, 0.28)',
    },
  },
};

export function registerCustomTheme(customTheme: ThemeColors): void {
  themes[customTheme.id] = customTheme;
}

export function applyThemeToCssVariables(themeId: ThemeId): void {
  const theme = themes[themeId] || themes['xivig-dark'];
  const root = document.documentElement;

  root.style.setProperty('--xivig-bg', theme.colors.bg);
  root.style.setProperty('--xivig-surface', theme.colors.surface);
  root.style.setProperty('--xivig-surface-hover', theme.colors.surfaceHover);
  root.style.setProperty('--xivig-sidebar', theme.colors.sidebar);
  root.style.setProperty('--xivig-activity-bar', theme.colors.activityBar);
  root.style.setProperty('--xivig-tab-active', theme.colors.tabActive);
  root.style.setProperty('--xivig-tab-inactive', theme.colors.tabInactive);
  root.style.setProperty('--xivig-editor', theme.colors.editor);
  root.style.setProperty('--xivig-statusbar', theme.colors.statusbar);
  root.style.setProperty('--xivig-accent', theme.colors.accent);
  root.style.setProperty('--xivig-accent-hover', theme.colors.accentHover);
  root.style.setProperty('--xivig-accent-active', theme.colors.selection);
  root.style.setProperty('--xivig-text', theme.colors.text);
  root.style.setProperty('--xivig-text-muted', theme.colors.textMuted);
  root.style.setProperty('--xivig-text-dim', theme.colors.textDim);
  root.style.setProperty('--xivig-border', theme.colors.border);
  root.style.setProperty('--xivig-border-subtle', theme.colors.borderSubtle);
  root.style.setProperty('--xivig-selection', theme.colors.selection);

  root.style.colorScheme = theme.isDark ? 'dark' : 'light';
  root.setAttribute('data-theme', theme.id);
}
