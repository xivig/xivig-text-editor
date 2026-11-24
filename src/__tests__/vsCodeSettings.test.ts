import { describe, it, expect, beforeEach } from 'vitest';
import { SETTINGS_REGISTRY, SettingDefinition } from '../components/settings/SettingsView';
import { useSettingsStore, defaultSettings, UserSettings } from '../stores/settingsStore';

describe('VS Code-Style Settings Engine & Registry', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: { ...defaultSettings },
    });
  });

  it('defines a comprehensive registry of settings matching VS Code conventions', () => {
    expect(SETTINGS_REGISTRY.length).toBeGreaterThan(15);

    // Key settings from VS Code screenshot
    const requiredSettingIds = [
      'editor.fontSize',
      'editor.formatOnSave',
      'files.autoSave',
      'editor.defaultFormatter',
      'editor.fontFamily',
      'editor.wordWrap',
      'editor.tabSize',
      'editor.lineNumbers',
      'workbench.colorTheme',
      'rainbowBrackets.enabled',
    ];

    for (const reqId of requiredSettingIds) {
      const found = SETTINGS_REGISTRY.find((s) => s.id === reqId);
      expect(found, `Missing setting: ${reqId}`).toBeDefined();
      expect(found?.title).toContain(': ');
      expect(found?.description.length).toBeGreaterThan(10);
      expect(typeof found?.getValue).toBe('function');
      expect(typeof found?.setValue).toBe('function');
    }
  });

  it('correctly reads default setting values from the store', () => {
    const state = useSettingsStore.getState().settings;

    const fontSizeDef = SETTINGS_REGISTRY.find((s) => s.id === 'editor.fontSize');
    expect(fontSizeDef?.getValue(state)).toBe(14);

    const fontFamilyDef = SETTINGS_REGISTRY.find((s) => s.id === 'editor.fontFamily');
    expect(fontFamilyDef?.getValue(state)).toContain('Fira Code');

    const themeDef = SETTINGS_REGISTRY.find((s) => s.id === 'workbench.colorTheme');
    expect(themeDef?.getValue(state)).toBe('dracula');

    const autoSaveDef = SETTINGS_REGISTRY.find((s) => s.id === 'files.autoSave');
    expect(autoSaveDef?.getValue(state)).toBe('afterDelay');
  });

  it('updates store values when setting setValue is executed', () => {
    const update = useSettingsStore.getState().updateSettings;

    // Change font size to 18
    const fontSizeDef = SETTINGS_REGISTRY.find((s) => s.id === 'editor.fontSize')!;
    fontSizeDef.setValue(18, update);
    expect(useSettingsStore.getState().settings.fontSize).toBe(18);

    // Change word wrap to on
    const wordWrapDef = SETTINGS_REGISTRY.find((s) => s.id === 'editor.wordWrap')!;
    wordWrapDef.setValue('on', update);
    expect(useSettingsStore.getState().settings.wordWrap).toBe(true);

    // Change theme to monokai
    const themeDef = SETTINGS_REGISTRY.find((s) => s.id === 'workbench.colorTheme')!;
    themeDef.setValue('monokai', update);
    expect(useSettingsStore.getState().settings.theme).toBe('monokai');
  });

  it('supports keyword search filtering across id, title, and description', () => {
    const filterByQuery = (q: string) => {
      const lower = q.toLowerCase();
      return SETTINGS_REGISTRY.filter(
        (def) =>
          def.id.toLowerCase().includes(lower) ||
          def.title.toLowerCase().includes(lower) ||
          def.description.toLowerCase().includes(lower)
      );
    };

    const fontMatches = filterByQuery('font');
    expect(fontMatches.length).toBeGreaterThanOrEqual(3);
    expect(fontMatches.some((s) => s.id === 'editor.fontSize')).toBe(true);
    expect(fontMatches.some((s) => s.id === 'editor.fontFamily')).toBe(true);
    expect(fontMatches.some((s) => s.id === 'editor.fontLigatures')).toBe(true);

    const saveMatches = filterByQuery('save');
    expect(saveMatches.length).toBeGreaterThanOrEqual(3);
    expect(saveMatches.some((s) => s.id === 'editor.formatOnSave')).toBe(true);
    expect(saveMatches.some((s) => s.id === 'files.autoSave')).toBe(true);
  });

  it('serializes settings to settings.json format and deserializes back faithfully', () => {
    const store = useSettingsStore.getState();

    // Generate JSON
    const jsonObject: Record<string, any> = {};
    for (const def of SETTINGS_REGISTRY) {
      jsonObject[def.id] = def.getValue(store.settings);
    }
    const jsonString = JSON.stringify(jsonObject, null, 2);
    expect(jsonString).toContain('"editor.fontSize": 14');
    expect(jsonString).toContain('"workbench.colorTheme": "dracula"');

    // Mutate and apply back
    const parsed = JSON.parse(jsonString);
    parsed['editor.fontSize'] = 20;
    parsed['workbench.colorTheme'] = 'nord';

    const partial: Partial<UserSettings> = {};
    for (const def of SETTINGS_REGISTRY) {
      if (parsed[def.id] !== undefined) {
        def.setValue(parsed[def.id], (p) => Object.assign(partial, p));
      }
    }
    store.updateSettings(partial);

    expect(useSettingsStore.getState().settings.fontSize).toBe(20);
    expect(useSettingsStore.getState().settings.theme).toBe('nord');
  });

  it('resets a modified setting value back to its default', () => {
    const store = useSettingsStore.getState();

    // Modify tabSize
    store.updateSettings({ tabSize: 8 });
    expect(useSettingsStore.getState().settings.tabSize).toBe(8);

    // Reset tabSize
    store.resetToDefault('tabSize');
    expect(useSettingsStore.getState().settings.tabSize).toBe(defaultSettings.tabSize);
  });
});
