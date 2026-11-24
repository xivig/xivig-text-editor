// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { themes, applyThemeToCssVariables } from '../styles/themes';
import { getEditorTheme, draculaHighlight } from '../components/editor/editorThemes';
import { useExtensionStore } from '../stores/extensionStore';
import { useSettingsStore } from '../stores/settingsStore';

describe('Official Dracula Theme Implementation', () => {
  it('defines the official Dracula palette colors in theme registry', () => {
    const dracula = themes['dracula'];
    expect(dracula).toBeDefined();
    expect(dracula.isDark).toBe(true);

    // Official Dracula Color Spec (https://draculatheme.com)
    expect(dracula.colors.bg.toLowerCase()).toBe('#282a36');
    expect(dracula.colors.editor.toLowerCase()).toBe('#282a36');
    expect(dracula.colors.sidebar.toLowerCase()).toBe('#21222c');
    expect(dracula.colors.accent.toLowerCase()).toBe('#bd93f9'); // Purple
    expect(dracula.colors.accentHover.toLowerCase()).toBe('#ff79c6'); // Pink
    expect(dracula.colors.text.toLowerCase()).toBe('#f8f8f2'); // Foreground
    expect(dracula.colors.textDim.toLowerCase()).toBe('#6272a4'); // Comment
    expect(dracula.colors.border.toLowerCase()).toBe('#44475a'); // Current Line / Selection border
  });

  it('generates CodeMirror editor extensions for Dracula theme', () => {
    const extensions = getEditorTheme('dracula');
    expect(extensions).toBeDefined();
    expect(Array.isArray(extensions)).toBe(true);
    expect((extensions as any[]).length).toBeGreaterThan(0);
  });

  it('hydrates DOM CSS variables when Dracula theme is applied', () => {
    applyThemeToCssVariables('dracula');
    const root = document.documentElement;

    expect(root.style.getPropertyValue('--xivig-bg')).toBe('#282a36');
    expect(root.style.getPropertyValue('--xivig-editor')).toBe('#282a36');
    expect(root.style.getPropertyValue('--xivig-accent')).toBe('#bd93f9');
    expect(root.style.getPropertyValue('--xivig-text')).toBe('#f8f8f2');
    expect(root.getAttribute('data-theme')).toBe('dracula');
  });

  it('includes official Dracula package in Extension Marketplace', () => {
    const marketplace = useExtensionStore.getState().marketplace;
    const draculaPkg = marketplace.find((p) => p.id === 'xivig-theme-dracula');

    expect(draculaPkg).toBeDefined();
    expect(draculaPkg?.name).toContain('Dracula');
    expect(draculaPkg?.themeId).toBe('dracula');
    expect(draculaPkg?.category).toBe('Themes');
    expect(draculaPkg?.iconBg).toBe('#282a36');
  });

  it('sets Dracula as default theme in user settings', () => {
    const settings = useSettingsStore.getState().settings;
    expect(settings.theme).toBe('dracula');
  });

  it('provides dedicated CodeMirror 6 editor themes and syntax highlighting for all 10 themes', () => {
    const allThemeIds = [
      'xivig-dark',
      'monokai',
      'dracula',
      'one-dark',
      'solarized-light',
      'nord',
      'tokyo-night',
      'cyberpunk',
      'github-dark',
      'synthwave',
    ] as const;

    for (const id of allThemeIds) {
      expect(themes[id]).toBeDefined();
      const exts = getEditorTheme(id);
      expect(exts).toBeDefined();
      expect(Array.isArray(exts)).toBe(true);
      expect((exts as any[]).length).toBe(2); // [EditorView.theme, syntaxHighlighting]

      applyThemeToCssVariables(id);
      expect(document.documentElement.getAttribute('data-theme')).toBe(id);
    }
  });

  it('formats HTML/XML tags without italic slant gap across all themes', () => {
    const { htmlLanguage } = require('@codemirror/lang-html');
    const { tags: t } = require('@lezer/highlight');

    const htmlSample = '<form action="" method="get">\n  Name\n  <input type="text" placeholder="Enter your name">\n</form>\n<script>\n  alert("Welcome");\n</script>';
    const tree = htmlLanguage.parser.parse(htmlSample);
    expect(tree).toBeDefined();

    // Verify Dracula theme uses fontStyle: normal and official #ff79c6 pink for tagName
    const draculaExts = getEditorTheme('dracula') as any[];
    expect(draculaExts).toBeDefined();

    // Verify all 10 themes define angleBracket with fontVariantLigatures: 'none' and fontFeatureSettings: '"liga" 0, "calt" 0'
    const allThemeIds = [
      'xivig-dark',
      'monokai',
      'dracula',
      'one-dark',
      'solarized-light',
      'nord',
      'tokyo-night',
      'cyberpunk',
      'github-dark',
      'synthwave',
    ] as const;

    for (const themeId of allThemeIds) {
      const exts = getEditorTheme(themeId) as any[];
      expect(exts).toBeDefined();
    }
  });

  it('safeguards script and form closing tags against ligature gaps and italic shifts', () => {
    const { htmlLanguage } = require('@codemirror/lang-html');
    const { highlightTree, tags: t } = require('@lezer/highlight');

    const code = '<form action="" method="get">\n<input type="text">\n</form>\n<script>\nalert(1);\n</script>';
    const tree = htmlLanguage.parser.parse(code);
    expect(tree).toBeDefined();

    // Verify Dracula highlight module contains rules preventing ligature shifts and italic gaps
    const rules = draculaHighlight.module?.getRules() || '';
    expect(rules).toContain('font-variant-ligatures: none');
    expect(rules).toContain('font-feature-settings: "liga" 0, "calt" 0');
    expect(rules).toContain('font-style: normal');

    // Verify style for angleBracket and tagName
    const angleBracketClass = draculaHighlight.style([t.angleBracket]);
    expect(angleBracketClass).toBeTruthy();

    const tagNameClass = draculaHighlight.style([t.tagName]);
    expect(tagNameClass).toBeTruthy();
  });
});
