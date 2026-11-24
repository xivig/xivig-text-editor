// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { themes, applyThemeToCssVariables } from '../styles/themes';
import { getEditorTheme } from '../components/editor/editorThemes';
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
});
