import { describe, it, expect } from 'vitest';
import {
  resolveMaterialIcon,
  resolveMaterialFolderIcon,
  materialIconTheme,
} from '../extensions/builtin/themes/materialIconPlugin';
import {
  resolveVsCodeIcon,
  resolveVsCodeFolderIcon,
  vscodeIconsTheme,
} from '../extensions/builtin/themes/vscodeIconsPlugin';
import {
  oneDarkProTheme,
  catppuccinMochaTheme,
  catppuccinLatteTheme,
  tokyoNightTheme,
  githubDarkTheme,
  githubLightTheme,
  ayuDarkTheme,
  nightOwlTheme,
  findThemeById,
  REGISTERED_THEMES,
} from '../extensions/builtin/themes/themePacksPlugin';

describe('Themes & UI Extension Suite (Category 18)', () => {
  describe('Material Icon Theme', () => {
    it('resolves file icons for prominent configuration and manifest files', () => {
      expect(resolveMaterialIcon('package.json').id).toBe('npm');
      expect(resolveMaterialIcon('tsconfig.json').id).toBe('tsconfig');
      expect(resolveMaterialIcon('.gitignore').id).toBe('git');
      expect(resolveMaterialIcon('Dockerfile').id).toBe('docker');
      expect(resolveMaterialIcon('.env').id).toBe('env');
    });

    it('resolves icons based on file extensions', () => {
      expect(resolveMaterialIcon('App.tsx').id).toBe('react-ts');
      expect(resolveMaterialIcon('main.rs').id).toBe('rust');
      expect(resolveMaterialIcon('script.py').id).toBe('python');
      expect(resolveMaterialIcon('MainActivity.kt').id).toBe('kotlin');
      expect(resolveMaterialIcon('schema.sql').id).toBe('sql');
      expect(resolveMaterialIcon('unknown.xyz').id).toBe('file');
    });

    it('resolves folder icons with open and closed state indications', () => {
      const srcClosed = resolveMaterialFolderIcon('src', false);
      const srcOpen = resolveMaterialFolderIcon('src', true);

      expect(srcClosed.id).toBe('folder-src');
      expect(srcOpen.id).toBe('folder-src');
      expect(srcClosed.glyph).toBe('📁');
      expect(srcOpen.glyph).toBe('📂');

      expect(resolveMaterialFolderIcon('components').id).toBe('folder-components');
      expect(resolveMaterialFolderIcon('__tests__').id).toBe('folder-test');
      expect(resolveMaterialFolderIcon('node_modules').id).toBe('folder-node');
      expect(resolveMaterialFolderIcon('arbitrary-dir').id).toBe('folder');
    });
  });

  describe('VSCode Icons', () => {
    it('resolves classic VSCode icons for files and folders', () => {
      expect(resolveVsCodeIcon('index.ts').id).toBe('vscode-ts');
      expect(resolveVsCodeIcon('package.json').id).toBe('vscode-npm');
      expect(resolveVsCodeIcon('dockerfile').id).toBe('vscode-docker');

      expect(resolveVsCodeFolderIcon('src', false).id).toBe('vscode-folder-src');
      expect(resolveVsCodeFolderIcon('src', true).glyph).toBe('📂');
    });
  });

  describe('Theme Packs', () => {
    it('verifies One Dark Pro workbench and syntax token colors', () => {
      expect(oneDarkProTheme.workbench.bg).toBe('#282c34');
      expect(oneDarkProTheme.tokens.functions).toBe('#61afef');
      expect(oneDarkProTheme.tokens.keywords).toBe('#c678dd');
      expect(oneDarkProTheme.tokens.strings).toBe('#98c379');
    });

    it('verifies Catppuccin Mocha and Latte palettes', () => {
      expect(catppuccinMochaTheme.type).toBe('dark');
      expect(catppuccinMochaTheme.workbench.bg).toBe('#1e1e2e');
      expect(catppuccinMochaTheme.tokens.keywords).toBe('#cba6f7');

      expect(catppuccinLatteTheme.type).toBe('light');
      expect(catppuccinLatteTheme.workbench.bg).toBe('#eff1f5');
      expect(catppuccinLatteTheme.tokens.functions).toBe('#1e66f5');
    });

    it('verifies Tokyo Night cyberpunk midnight palette', () => {
      expect(tokyoNightTheme.workbench.bg).toBe('#1a1b26');
      expect(tokyoNightTheme.tokens.keywords).toBe('#bb9af7');
      expect(tokyoNightTheme.tokens.functions).toBe('#7aa2f7');
      expect(tokyoNightTheme.tokens.strings).toBe('#9ece6a');
    });

    it('verifies GitHub Dark and Light Primer themes', () => {
      expect(githubDarkTheme.workbench.bg).toBe('#0d1117');
      expect(githubDarkTheme.workbench.accent).toBe('#58a6ff');

      expect(githubLightTheme.type).toBe('light');
      expect(githubLightTheme.workbench.bg).toBe('#ffffff');
      expect(githubLightTheme.tokens.keywords).toBe('#cf222e');
    });

    it('verifies Ayu and Night Owl themes', () => {
      expect(ayuDarkTheme.workbench.bg).toBe('#0a0e14');
      expect(ayuDarkTheme.workbench.accent).toBe('#e6b450');

      expect(nightOwlTheme.workbench.bg).toBe('#011627');
      expect(nightOwlTheme.tokens.types).toBe('#addb67');
      expect(nightOwlTheme.workbench.text).toBe('#d6deeb');
    });

    it('looks up registered themes by ID', () => {
      expect(findThemeById('one-dark-pro')).toBe(oneDarkProTheme);
      expect(findThemeById('catppuccin-mocha')).toBe(catppuccinMochaTheme);
      expect(findThemeById('night-owl')).toBe(nightOwlTheme);
      expect(findThemeById('non-existent')).toBeUndefined();
      expect(REGISTERED_THEMES.length).toBeGreaterThanOrEqual(8);
    });
  });
});
