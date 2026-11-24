// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { bootstrap5Extension } from '../extensions/builtin/bootstrap5-fontawesome/index';
import { BUILTIN_EXTENSIONS } from '../extensions/builtin/index';
import { extensionManager } from '../extensions/runtime/extensionManager';
import { useExtensionStore } from '../stores/extensionStore';
import { useSettingsStore, defaultSettings } from '../stores/settingsStore';
import { getCustomSnippetSource } from '../components/editor/snippets';
import { bootstrap5Snippets } from '../extensions/builtin/bootstrap5-fontawesome/snippets/bootstrap5Snippets';
import { fontAwesomeSnippets } from '../extensions/builtin/bootstrap5-fontawesome/snippets/fontAwesomeSnippets';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';

describe('Bootstrap 5 & Font Awesome Snippets Extension', () => {
  beforeEach(async () => {
    // Reset settings store
    useSettingsStore.setState({
      settings: { ...defaultSettings },
    });

    // Ensure extension is activated
    await extensionManager.activateExtension('xivig-tool-bootstrap5');
    bootstrap5Extension.updateSettings({
      enabled: true,
      enableBootstrap: true,
      enableFontAwesome: true,
    });
  });

  describe('Extension Manifest & Registration', () => {
    it('declares a valid manifest according to Xivig extension specifications', () => {
      const manifest = bootstrap5Extension.manifest;
      expect(manifest.id).toBe('xivig-tool-bootstrap5');
      expect(manifest.name).toBe('Bootstrap 5 & Font Awesome Snippets');
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.publisher).toBe('xivig');
      expect(manifest.categories).toContain('Productivity');
      expect(manifest.activationEvents).toContain('onEditorCreated');
      expect(manifest.contributes?.settings?.length).toBeGreaterThanOrEqual(3);
    });

    it('is registered in BUILTIN_EXTENSIONS under primary and aliased IDs', () => {
      expect(BUILTIN_EXTENSIONS['xivig-tool-bootstrap5']).toBe(bootstrap5Extension);
      expect(BUILTIN_EXTENSIONS['xivig.bootstrap5-fontawesome-snippets']).toBe(bootstrap5Extension);
    });

    it('is listed in marketplace extensions with complete metadata and readme', () => {
      const marketplace = useExtensionStore.getState().marketplace;
      const pkg = marketplace.find((m) => m.id === 'xivig-tool-bootstrap5');
      expect(pkg).toBeDefined();
      expect(pkg?.name).toBe('Bootstrap 5 & Font Awesome Snippets');
      expect(pkg?.category).toBe('Productivity');
      expect(pkg?.iconBg).toBe('#7952b3');
      expect(pkg?.tags).toContain('bootstrap5');
      expect(pkg?.tags).toContain('fontawesome');
      expect(pkg?.readme).toContain('b5-$');
      expect(pkg?.readme).toContain('fa-icon');
    });
  });

  describe('Snippet Catalog Completeness', () => {
    it('contains essential Bootstrap 5 starter and CDN snippets', () => {
      const labels = bootstrap5Snippets.map((s) => s.label);
      expect(labels).toContain('b5-$');
      expect(labels).toContain('b5-cdn-css');
      expect(labels).toContain('b5-cdn-js');

      const starter = bootstrap5Snippets.find((s) => s.label === 'b5-$');
      expect(starter?.detail).toContain('Starter Template');
      expect(starter?.type).toBe('snippet');
    });

    it('contains comprehensive Bootstrap 5 grid and layout snippets', () => {
      const labels = bootstrap5Snippets.map((s) => s.label);
      expect(labels).toContain('b5-grid');
      expect(labels).toContain('b5-container');
      expect(labels).toContain('b5-row');
      expect(labels).toContain('b5-col');
      expect(labels).toContain('b5-row-cols');
    });

    it('contains key Bootstrap 5 UI components', () => {
      const labels = bootstrap5Snippets.map((s) => s.label);
      expect(labels).toContain('b5-navbar');
      expect(labels).toContain('b5-nav');
      expect(labels).toContain('b5-card');
      expect(labels).toContain('b5-card-header-footer');
      expect(labels).toContain('b5-btn');
      expect(labels).toContain('b5-btn-outline');
      expect(labels).toContain('b5-btn-group');
      expect(labels).toContain('b5-badge');
      expect(labels).toContain('b5-alert');
      expect(labels).toContain('b5-modal');
      expect(labels).toContain('b5-accordion');
      expect(labels).toContain('b5-carousel');
      expect(labels).toContain('b5-dropdown');
      expect(labels).toContain('b5-offcanvas');
      expect(labels).toContain('b5-table');
      expect(labels).toContain('b5-pagination');
      expect(labels).toContain('b5-progress');
      expect(labels).toContain('b5-spinner');
    });

    it('contains comprehensive Bootstrap 5 form snippets', () => {
      const labels = bootstrap5Snippets.map((s) => s.label);
      expect(labels).toContain('b5-form-input');
      expect(labels).toContain('b5-form-floating');
      expect(labels).toContain('b5-form-select');
      expect(labels).toContain('b5-form-check');
      expect(labels).toContain('b5-form-switch');
      expect(labels).toContain('b5-input-group');
    });

    it('contains Font Awesome 6 CDN, helper, and popular icon snippets', () => {
      const labels = fontAwesomeSnippets.map((s) => s.label);
      expect(labels).toContain('fa-$');
      expect(labels).toContain('fa-icon');
      expect(labels).toContain('fa-icon-regular');
      expect(labels).toContain('fa-icon-brands');
      expect(labels).toContain('fa-btn');
      expect(labels).toContain('fa-spin');
      expect(labels).toContain('fa-stack');

      // Popular icons
      expect(labels).toContain('fa-house');
      expect(labels).toContain('fa-user');
      expect(labels).toContain('fa-search');
      expect(labels).toContain('fa-gear');
      expect(labels).toContain('fa-envelope');
      expect(labels).toContain('fa-check');
      expect(labels).toContain('fa-xmark');
      expect(labels).toContain('fa-trash');
      expect(labels).toContain('fa-github');
      expect(labels).toContain('fa-twitter');
    });
  });

  describe('Extension Settings & Filtering', () => {
    it('returns all snippets when both Bootstrap 5 and Font Awesome are enabled', () => {
      bootstrap5Extension.updateSettings({
        enabled: true,
        enableBootstrap: true,
        enableFontAwesome: true,
      });

      const snippets = bootstrap5Extension.getSnippets('html');
      expect(snippets.length).toBe(bootstrap5Snippets.length + fontAwesomeSnippets.length);
    });

    it('filters out Bootstrap snippets when enableBootstrap is false', () => {
      bootstrap5Extension.updateSettings({
        enabled: true,
        enableBootstrap: false,
        enableFontAwesome: true,
      });

      const snippets = bootstrap5Extension.getSnippets('html');
      expect(snippets.length).toBe(fontAwesomeSnippets.length);
      const labels = snippets.map((s) => s.label);
      expect(labels).not.toContain('b5-card');
      expect(labels).toContain('fa-icon');
    });

    it('filters out Font Awesome snippets when enableFontAwesome is false', () => {
      bootstrap5Extension.updateSettings({
        enabled: true,
        enableBootstrap: true,
        enableFontAwesome: false,
      });

      const snippets = bootstrap5Extension.getSnippets('html');
      expect(snippets.length).toBe(bootstrap5Snippets.length);
      const labels = snippets.map((s) => s.label);
      expect(labels).toContain('b5-card');
      expect(labels).not.toContain('fa-icon');
    });

    it('returns empty array when extension is disabled', () => {
      bootstrap5Extension.updateSettings({
        enabled: false,
      });

      expect(bootstrap5Extension.getSnippets('html')).toEqual([]);
    });

    it('returns empty array for non-web language scopes (e.g. python, rust)', () => {
      expect(bootstrap5Extension.getSnippets('python')).toEqual([]);
      expect(bootstrap5Extension.getSnippets('rust')).toEqual([]);
      expect(bootstrap5Extension.getSnippets('c++')).toEqual([]);
    });

    it('supports modern web and template languages (vue, php, tsx, jsx, blade)', () => {
      expect(bootstrap5Extension.getSnippets('php').length).toBeGreaterThan(0);
      expect(bootstrap5Extension.getSnippets('vue').length).toBeGreaterThan(0);
      expect(bootstrap5Extension.getSnippets('typescriptreact').length).toBeGreaterThan(0);
      expect(bootstrap5Extension.getSnippets('javascriptreact').length).toBeGreaterThan(0);
      expect(bootstrap5Extension.getSnippets('index.blade.php').length).toBeGreaterThan(0);
    });
  });

  describe('CodeMirror Autocompletion Engine Integration', () => {
    it('integrates snippets into getCustomSnippetSource for HTML files', () => {
      const source = getCustomSnippetSource('html');
      const doc = '<!DOCTYPE html>\n<html>\n<body>\nb5-';
      const state = EditorState.create({ doc });
      const context = new CompletionContext(state, doc.length, false);

      const result = source(context);
      expect(result).toBeDefined();
      expect(result).not.toBeNull();

      const labels = result?.options.map((o) => o.label) || [];
      expect(labels).toContain('b5-card');
      expect(labels).toContain('b5-navbar');
      expect(labels).toContain('fa-icon');
    });

    it('matches b5-$ and hyphenated triggers correctly with matchBefore', () => {
      const source = getCustomSnippetSource('html');
      const doc = 'b5-$';
      const state = EditorState.create({ doc });
      const context = new CompletionContext(state, doc.length, false);

      const result = source(context);
      expect(result).toBeDefined();
      expect(result?.from).toBe(0);

      const labels = result?.options.map((o) => o.label) || [];
      expect(labels).toContain('b5-$');
    });

    it('matches fa- triggers in PHP documents', () => {
      const source = getCustomSnippetSource('php');
      const doc = '<?php\nfa-';
      const state = EditorState.create({ doc });
      const context = new CompletionContext(state, doc.length, false);

      const result = source(context);
      expect(result).toBeDefined();

      const labels = result?.options.map((o) => o.label) || [];
      expect(labels).toContain('fa-icon');
      expect(labels).toContain('fa-user');
    });

    it('removes snippets when extension is deactivated without editor restart', async () => {
      await extensionManager.deactivateExtension('xivig-tool-bootstrap5');

      const source = getCustomSnippetSource('html');
      const doc = 'b5-';
      const state = EditorState.create({ doc });
      const context = new CompletionContext(state, doc.length, false);

      const result = source(context);
      const labels = result?.options.map((o) => o.label) || [];
      expect(labels).not.toContain('b5-card');
      expect(labels).not.toContain('fa-icon');
    });
  });
});
