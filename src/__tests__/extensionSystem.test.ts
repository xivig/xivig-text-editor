import { describe, it, expect, beforeEach } from 'vitest';
import { isEngineCompatible, validateExtensionManifest } from '../extensions/api/manifest';
import { ExtensionManager } from '../extensions/runtime/extensionManager';
import { rainbowBracketsExtension } from '../extensions/builtin/rainbow-brackets/index';

describe('Extension Architecture and Runtime System', () => {
  it('validates extension manifest correctly', () => {
    const validManifest = {
      id: 'xivig.rainbow-brackets',
      name: 'Rainbow Brackets & Indent',
      publisher: 'xivig',
      version: '1.0.0',
      description: 'Color matching brackets and indentation guides.',
      categories: ['Productivity' as const],
      engines: { xivig: '>=1.2.0 <2.0.0' },
      activationEvents: ['onEditorCreated'],
    };

    const res = validateExtensionManifest(validManifest);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);

    const invalidManifest = {
      id: '',
      version: 'invalid_ver',
      engines: {},
    };
    const invalidRes = validateExtensionManifest(invalidManifest);
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.errors.length).toBeGreaterThan(0);
  });

  it('checks engine semver compatibility ranges properly', () => {
    expect(isEngineCompatible('>=1.2.0 <2.0.0', '1.2.0')).toBe(true);
    expect(isEngineCompatible('>=1.2.0 <2.0.0', '1.5.0')).toBe(true);
    expect(isEngineCompatible('>=1.2.0 <2.0.0', '1.1.0')).toBe(false);
    expect(isEngineCompatible('>=1.2.0 <2.0.0', '2.0.0')).toBe(false);
    expect(isEngineCompatible('*', '1.2.0')).toBe(true);
    expect(isEngineCompatible('^1.0.0', '1.2.0')).toBe(true);
    expect(isEngineCompatible('^1.0.0', '2.0.0')).toBe(false);
  });

  it('manages extension lifecycle: activate, deactivate, and returns CodeMirror extensions', async () => {
    const manager = new ExtensionManager();

    // Initially installed
    const states = manager.getAllExtensionStates();
    expect(states.some((s) => s.id === 'xivig-tool-rainbow')).toBe(true);

    // Activate extension
    const activated = await manager.activateExtension('xivig-tool-rainbow');
    expect(activated).toBe(true);
    expect(manager.isExtensionActive('xivig-tool-rainbow')).toBe(true);

    // CodeMirror extensions should be returned when enabled
    const exts = manager.getActiveCodeMirrorExtensions();
    expect(exts.length).toBeGreaterThan(0);

    // Update settings via manager
    manager.setSetting('rainbow.enabled', false);
    const extsAfterDisable = manager.getActiveCodeMirrorExtensions();
    expect(extsAfterDisable.length).toBe(0);

    manager.setSetting('rainbow.enabled', true);
    expect(manager.getActiveCodeMirrorExtensions().length).toBeGreaterThan(0);

    // Deactivate extension
    await manager.deactivateExtension('xivig-tool-rainbow');
    expect(manager.isExtensionActive('xivig-tool-rainbow')).toBe(false);
    expect(manager.getActiveCodeMirrorExtensions().length).toBe(0);
  });

  it('notifies listeners when extension state or settings change', async () => {
    const manager = new ExtensionManager();
    let changeCount = 0;

    const unsubscribe = manager.subscribe(() => {
      changeCount++;
    });

    await manager.activateExtension('xivig-tool-rainbow');
    expect(changeCount).toBeGreaterThan(0);

    const prevCount = changeCount;
    manager.setSetting('rainbow.tabSize', 2);
    expect(changeCount).toBeGreaterThan(prevCount);

    unsubscribe();
    manager.setSetting('rainbow.tabSize', 4);
    expect(changeCount).toBe(prevCount + 1); // Unsubscribed, no more increments
  });
});
