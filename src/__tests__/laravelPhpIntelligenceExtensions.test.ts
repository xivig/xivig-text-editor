// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { laravelExtension } from '../extensions/builtin/laravel-all-in-one/index';
import { phpIntelligenceExtension } from '../extensions/builtin/php-intelligence/index';
import { BUILTIN_EXTENSIONS } from '../extensions/builtin/index';
import { extensionManager } from '../extensions/runtime/extensionManager';
import { useExtensionStore } from '../stores/extensionStore';
import { useSettingsStore, defaultSettings } from '../stores/settingsStore';
import { getCustomSnippetSource } from '../components/editor/snippets';
import { bladeSnippets } from '../extensions/builtin/laravel-all-in-one/snippets/bladeSnippets';
import { laravelSnippets } from '../extensions/builtin/laravel-all-in-one/snippets/laravelSnippets';
import { phpstormSnippets } from '../extensions/builtin/php-intelligence/snippets/phpstormSnippets';
import { phpCoreCompletions } from '../extensions/builtin/php-intelligence/snippets/phpCoreCompletions';
import { PHP_DOCS } from '../extensions/builtin/php-intelligence/docs/phpDocs';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';

describe('Laravel All in One & PHP Intelligence Extensions', () => {
  beforeEach(async () => {
    // Reset store settings
    useSettingsStore.setState({
      settings: { ...defaultSettings },
    });

    // Ensure extensions are activated
    await extensionManager.activateExtension('xivig-tool-laravel');
    await extensionManager.activateExtension('xivig-tool-php');

    laravelExtension.updateSettings({
      enabled: true,
      enableBlade: true,
      enableRouting: true,
      enableEloquent: true,
      enableMigrations: true,
    });

    phpIntelligenceExtension.updateSettings({
      enabled: true,
      enablePhpStormTemplates: true,
      enableCoreCompletions: true,
      enableHoverDocs: true,
    });
  });

  describe('Extension Manifests & Builtin Registration', () => {
    it('declares valid Laravel manifest and registers in BUILTIN_EXTENSIONS', () => {
      const manifest = laravelExtension.manifest;
      expect(manifest.id).toBe('xivig-tool-laravel');
      expect(manifest.name).toBe('Laravel All in One');
      expect(manifest.publisher).toBe('xivig');
      expect(manifest.categories).toContain('Productivity');

      expect(BUILTIN_EXTENSIONS['xivig-tool-laravel']).toBe(laravelExtension);
      expect(BUILTIN_EXTENSIONS['xivig.laravel-all-in-one']).toBe(laravelExtension);
    });

    it('declares valid PHP Intelligence manifest and registers in BUILTIN_EXTENSIONS', () => {
      const manifest = phpIntelligenceExtension.manifest;
      expect(manifest.id).toBe('xivig-tool-php');
      expect(manifest.name).toBe('PHP Intelligence & PhpStorm Snippets');
      expect(manifest.categories).toContain('Languages');

      expect(BUILTIN_EXTENSIONS['xivig-tool-php']).toBe(phpIntelligenceExtension);
      expect(BUILTIN_EXTENSIONS['xivig.php-intelligence']).toBe(phpIntelligenceExtension);
    });

    it('both extensions are listed in marketplace store with rich metadata', () => {
      const marketplace = useExtensionStore.getState().marketplace;

      const laravelPkg = marketplace.find((m) => m.id === 'xivig-tool-laravel');
      expect(laravelPkg).toBeDefined();
      expect(laravelPkg?.tags).toContain('laravel');
      expect(laravelPkg?.tags).toContain('blade');

      const phpPkg = marketplace.find((m) => m.id === 'xivig-tool-php');
      expect(phpPkg).toBeDefined();
      expect(phpPkg?.tags).toContain('phpstorm');
      expect(phpPkg?.tags).toContain('intelephense');
    });
  });

  describe('Laravel & Blade Snippet Catalog', () => {
    it('contains all essential Blade directives', () => {
      const labels = bladeSnippets.map((s) => s.label);
      expect(labels).toContain('@extends');
      expect(labels).toContain('@section');
      expect(labels).toContain('@yield');
      expect(labels).toContain('@include');
      expect(labels).toContain('@if');
      expect(labels).toContain('@ifelse');
      expect(labels).toContain('@foreach');
      expect(labels).toContain('@forelse');
      expect(labels).toContain('@csrf');
      expect(labels).toContain('@method');
      expect(labels).toContain('@error');
      expect(labels).toContain('@vite');
      expect(labels).toContain('@livewire');
      expect(labels).toContain('@props');
      expect(labels).toContain('@auth');
      expect(labels).toContain('@guest');
      expect(labels).toContain('@dd');
    });

    it('contains full Laravel backend routing, Eloquent, and migration snippets', () => {
      const labels = laravelSnippets.map((s) => s.label);
      expect(labels).toContain('route-get');
      expect(labels).toContain('route-post');
      expect(labels).toContain('route-resource');
      expect(labels).toContain('route-api-resource');
      expect(labels).toContain('eloquent-has-many');
      expect(labels).toContain('eloquent-belongs-to');
      expect(labels).toContain('eloquent-has-one');
      expect(labels).toContain('eloquent-casts');
      expect(labels).toContain('migration-create');
      expect(labels).toContain('migration-table');
      expect(labels).toContain('col-foreign-id');
      expect(labels).toContain('response-json');
      expect(labels).toContain('dd');
    });
  });

  describe('PhpStorm Live Templates & PHP Intelligence Catalog', () => {
    it('contains authentic PhpStorm live templates', () => {
      const labels = phpstormSnippets.map((s) => s.label);
      expect(labels).toContain('pubf');
      expect(labels).toContain('prof');
      expect(labels).toContain('prif');
      expect(labels).toContain('pubsf');
      expect(labels).toContain('con');
      expect(labels).toContain('cl');
      expect(labels).toContain('intf');
      expect(labels).toContain('trait');
      expect(labels).toContain('enum');
      expect(labels).toContain('fore');
      expect(labels).toContain('forek');
      expect(labels).toContain('eco');
      expect(labels).toContain('ech');
      expect(labels).toContain('try');
      expect(labels).toContain('thr');
      expect(labels).toContain('getter');
      expect(labels).toContain('setter');
      expect(labels).toContain('match');
      expect(labels).toContain('strict');
      expect(labels).toContain('docf');
    });

    it('contains core PHP standard library functions, superglobals, and constants', () => {
      const labels = phpCoreCompletions.map((s) => s.label);
      expect(labels).toContain('array_map');
      expect(labels).toContain('array_filter');
      expect(labels).toContain('strlen');
      expect(labels).toContain('str_replace');
      expect(labels).toContain('str_contains');
      expect(labels).toContain('explode');
      expect(labels).toContain('implode');
      expect(labels).toContain('json_encode');
      expect(labels).toContain('json_decode');
      expect(labels).toContain('$_GET');
      expect(labels).toContain('$_POST');
      expect(labels).toContain('$_SERVER');
      expect(labels).toContain('DateTime');
      expect(labels).toContain('PDO');
      expect(labels).toContain('PHP_EOL');
    });

    it('provides comprehensive PHP hover documentation in PHP_DOCS', () => {
      expect(PHP_DOCS['array_map']).toBeDefined();
      expect(PHP_DOCS['array_map'].signature).toContain('callable|null $callback');
      expect(PHP_DOCS['array_map'].parameters?.length).toBeGreaterThan(0);

      expect(PHP_DOCS['strlen']).toBeDefined();
      expect(PHP_DOCS['str_replace']).toBeDefined();
      expect(PHP_DOCS['str_contains']).toBeDefined();
      expect(PHP_DOCS['json_encode']).toBeDefined();
      expect(PHP_DOCS['route']).toBeDefined();
    });
  });

  describe('CodeMirror Autocompletion Integration', () => {
    it('autocompletes Blade @-prefixed directives in blade and html files', () => {
      const source = getCustomSnippetSource('blade');
      const doc = '@ext';
      const state = EditorState.create({ doc });
      const context = new CompletionContext(state, doc.length, false);

      const result = source(context);
      expect(result).toBeDefined();
      expect(result?.from).toBe(0);

      const labels = result?.options.map((o) => o.label) || [];
      expect(labels).toContain('@extends');
      expect(labels).toContain('@section');
    });

    it('autocompletes PhpStorm live templates and PHP functions in PHP files', () => {
      const source = getCustomSnippetSource('php');
      const doc = '<?php\npub';
      const state = EditorState.create({ doc });
      const context = new CompletionContext(state, doc.length, false);

      const result = source(context);
      expect(result).toBeDefined();

      const labels = result?.options.map((o) => o.label) || [];
      expect(labels).toContain('pubf');
      expect(labels).toContain('pubsf');
      expect(labels).toContain('array_map');
      expect(labels).toContain('route-get');
    });

    it('dynamically disables snippets when extensions are deactivated', async () => {
      await extensionManager.deactivateExtension('xivig-tool-laravel');
      await extensionManager.deactivateExtension('xivig-tool-php');

      const source = getCustomSnippetSource('php');
      const doc = '<?php\npubf';
      const state = EditorState.create({ doc });
      const context = new CompletionContext(state, doc.length, false);

      const result = source(context);
      const labels = result?.options.map((o) => o.label) || [];
      expect(labels).not.toContain('pubf');
      expect(labels).not.toContain('route-get');
    });
  });
});
