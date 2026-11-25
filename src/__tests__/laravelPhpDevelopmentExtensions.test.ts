import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';

import {
  // PHP Intelephense
  extractPhpSymbols,
  phpIntelephenseExtensionModule,

  // Laravel Extension Pack
  getLaravelPackMeta,
  laravelExtensionPackModule,

  // Laravel Blade Snippets
  searchBladeSnippets,
  createBladeDirectivesCompletionSource,
  laravelBladeSnippetsExtensionModule,

  // Laravel Artisan
  searchArtisanCommands,
  buildArtisanCommand,
  laravelArtisanExtensionModule,

  // Laravel Extra Intellisense
  createLaravelExtraCompletionSource,
  laravelExtraIntellisenseExtensionModule,

  // Laravel Goto Controller
  resolveControllerAction,
  computeControllerFilePath,
  laravelGotoControllerExtensionModule,

  // PHP Namespace Resolver
  resolvePhpNamespaceFromPath,
  insertUseStatement,
  phpNamespaceResolverExtensionModule,

  // PHP DocBlocker
  generatePhpDocBlock,
  phpDocBlockerExtensionModule,

  // Composer
  buildComposerCommand,
  searchPackagistPackages,
  composerExtensionModule,
} from '../extensions/builtin/laravel-php';

describe('Category 7: Laravel & PHP Development Extensions', () => {
  // --------------------------------------------------------------------------
  // 1. PHP Intelephense
  // --------------------------------------------------------------------------
  describe('PHP Intelephense Extension', () => {
    it('scans and extracts PHP symbols (classes, interfaces, methods, functions)', () => {
      const phpCode = `
<?php
namespace App\\Services;

interface PaymentInterface {
  public function pay(float $amount): bool;
}

class StripeService implements PaymentInterface {
  public function pay(float $amount): bool {
    return true;
  }

  private function logTransaction(): void {}
}
      `.trim();

      const symbols = extractPhpSymbols(phpCode);
      expect(symbols.some((s) => s.name === 'PaymentInterface' && s.kind === 'interface')).toBe(true);
      expect(symbols.some((s) => s.name === 'StripeService' && s.kind === 'class')).toBe(true);
      expect(symbols.some((s) => s.name === 'pay' && s.kind === 'method' && s.visibility === 'public')).toBe(true);
      expect(symbols.some((s) => s.name === 'logTransaction' && s.visibility === 'private')).toBe(true);
    });

    it('manifests with proper metadata', () => {
      expect(phpIntelephenseExtensionModule.manifest.id).toBe('xivig.intelephense');
      expect(phpIntelephenseExtensionModule.manifest.categories).toContain('Languages');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Laravel Extension Pack
  // --------------------------------------------------------------------------
  describe('Laravel Extension Pack', () => {
    it('returns bundled Laravel extensions catalog', () => {
      const meta = getLaravelPackMeta();
      expect(meta.length).toBeGreaterThanOrEqual(8);
      expect(meta.some((m) => m.id === 'xivig.blade-snippets')).toBe(true);
      expect(meta.some((m) => m.id === 'xivig.laravel-artisan')).toBe(true);
      expect(meta.some((m) => m.id === 'xivig.laravel-goto-controller')).toBe(true);
    });

    it('manifests with proper metadata', () => {
      expect(laravelExtensionPackModule.manifest.id).toBe('xivig.laravel-extension-pack');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Laravel Blade Snippets
  // --------------------------------------------------------------------------
  describe('Laravel Blade Snippets Extension', () => {
    it('searches and finds core Blade directives', () => {
      const section = searchBladeSnippets('@section');
      expect(section.length).toBe(1);
      expect(section[0].template).toContain('@section');
      expect(section[0].template).toContain('@endsection');

      const directives = searchBladeSnippets('@');
      expect(directives.some((d) => d.prefix === '@extends')).toBe(true);
      expect(directives.some((d) => d.prefix === '@yield')).toBe(true);
      expect(directives.some((d) => d.prefix === '@can')).toBe(true);
      expect(directives.some((d) => d.prefix === '@livewire')).toBe(true);
      expect(directives.some((d) => d.prefix === '@csrf')).toBe(true);
    });

    it('provides CodeMirror autocompletions when typing @ directive', () => {
      const source = createBladeDirectivesCompletionSource();
      const doc = '@sec';
      const state = EditorState.create({ doc });
      const ctx = new CompletionContext(state, doc.length, false);
      const res = source(ctx);

      expect(res).not.toBeNull();
      expect(res?.options.some((o) => o.label === '@section')).toBe(true);
    });

    it('returns snippets for Blade and PHP files via module getSnippets', () => {
      const snippets = laravelBladeSnippetsExtensionModule.getSnippets?.('blade');
      expect(snippets).toBeDefined();
      expect(snippets?.length).toBeGreaterThanOrEqual(10);
      expect(snippets?.some((s) => s.label === '@error')).toBe(true);
    });

    it('manifests with proper metadata', () => {
      expect(laravelBladeSnippetsExtensionModule.manifest.id).toBe('xivig.blade-snippets');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Laravel Artisan
  // --------------------------------------------------------------------------
  describe('Laravel Artisan Extension', () => {
    it('searches and finds Artisan commands across categories', () => {
      const makeCommands = searchArtisanCommands('make:');
      expect(makeCommands.length).toBeGreaterThanOrEqual(5);
      expect(makeCommands.some((c) => c.command === 'make:controller')).toBe(true);
      expect(makeCommands.some((c) => c.command === 'make:model')).toBe(true);

      const dbCommands = searchArtisanCommands('db:');
      expect(dbCommands.some((c) => c.command === 'db:seed')).toBe(true);
    });

    it('builds shell command strings with arguments and options', () => {
      const cmd = buildArtisanCommand('make:controller', ['UserController', '--resource']);
      expect(cmd).toBe('php artisan make:controller UserController --resource');

      const migrateCmd = buildArtisanCommand('migrate:fresh', ['--seed', '--force']);
      expect(migrateCmd).toBe('php artisan migrate:fresh --seed --force');
    });

    it('manifests with proper metadata', () => {
      expect(laravelArtisanExtensionModule.manifest.id).toBe('xivig.laravel-artisan');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Laravel Extra Intellisense
  // --------------------------------------------------------------------------
  describe('Laravel Extra Intellisense Extension', () => {
    it('provides autocompletions for route, view, config, and env helpers', () => {
      const source = createLaravelExtraCompletionSource();

      // 1. route('...')
      const routeDoc = "route('users.";
      const routeState = EditorState.create({ doc: routeDoc });
      const routeCtx = new CompletionContext(routeState, routeDoc.length, false);
      const routeRes = source(routeCtx);
      expect(routeRes).not.toBeNull();
      expect(routeRes?.options.some((o) => o.label === 'users.index')).toBe(true);

      // 2. view('...')
      const viewDoc = "view('layouts.";
      const viewState = EditorState.create({ doc: viewDoc });
      const viewCtx = new CompletionContext(viewState, viewDoc.length, false);
      const viewRes = source(viewCtx);
      expect(viewRes).not.toBeNull();
      expect(viewRes?.options.some((o) => o.label === 'layouts.app')).toBe(true);

      // 3. config('...')
      const configDoc = "config('app.";
      const configState = EditorState.create({ doc: configDoc });
      const configCtx = new CompletionContext(configState, configDoc.length, false);
      const configRes = source(configCtx);
      expect(configRes).not.toBeNull();
      expect(configRes?.options.some((o) => o.label === 'app.name')).toBe(true);

      // 4. env('...')
      const envDoc = "env('APP_";
      const envState = EditorState.create({ doc: envDoc });
      const envCtx = new CompletionContext(envState, envDoc.length, false);
      const envRes = source(envCtx);
      expect(envRes).not.toBeNull();
      expect(envRes?.options.some((o) => o.label === 'APP_NAME')).toBe(true);
    });

    it('manifests with proper metadata', () => {
      expect(laravelExtraIntellisenseExtensionModule.manifest.id).toBe('xivig.laravel-extra-intellisense');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Laravel Goto Controller
  // --------------------------------------------------------------------------
  describe('Laravel Goto Controller Extension', () => {
    it('resolves tuple and string route actions to controller and method', () => {
      const tupleLine = "Route::get('/users', [UserController::class, 'index']);";
      const tupleRes = resolveControllerAction(tupleLine);
      expect(tupleRes).toEqual({
        controllerClass: 'UserController',
        method: 'index',
      });

      const stringLine = "Route::post('/login', 'AuthController@authenticate');";
      const stringRes = resolveControllerAction(stringLine);
      expect(stringRes).toEqual({
        controllerClass: 'AuthController',
        method: 'authenticate',
      });
    });

    it('computes expected controller relative file path', () => {
      const loc = computeControllerFilePath('UserController');
      expect(loc.possibleFilePaths).toContain('app/Http/Controllers/UserController.php');

      const apiLoc = computeControllerFilePath('Api\\V1\\OrderController');
      expect(apiLoc.possibleFilePaths).toContain('app/Http/Controllers/Api/V1/OrderController.php');
    });

    it('manifests with proper metadata', () => {
      expect(laravelGotoControllerExtensionModule.manifest.id).toBe('xivig.laravel-goto-controller');
    });
  });

  // --------------------------------------------------------------------------
  // 7. PHP Namespace Resolver
  // --------------------------------------------------------------------------
  describe('PHP Namespace Resolver Extension', () => {
    it('resolves PSR-4 namespace from relative project file paths', () => {
      const res = resolvePhpNamespaceFromPath('app/Http/Controllers/Api/OrderController.php');
      expect(res).not.toBeNull();
      expect(res?.namespace).toBe('App\\Http\\Controllers\\Api');
      expect(res?.className).toBe('OrderController');
      expect(res?.fullQualifiedClass).toBe('App\\Http\\Controllers\\Api\\OrderController');
    });

    it('injects use statement into PHP code cleanly', () => {
      const phpCode = `
<?php
namespace App\\Http\\Controllers;

class UserController extends Controller {}
      `.trim();

      const updated = insertUseStatement(phpCode, 'App\\Models\\User');
      expect(updated).toContain('use App\\Models\\User;');
      expect(updated.indexOf('use App\\Models\\User;')).toBeLessThan(updated.indexOf('class UserController'));
    });

    it('manifests with proper metadata', () => {
      expect(phpNamespaceResolverExtensionModule.manifest.id).toBe('xivig.php-namespace-resolver');
    });
  });

  // --------------------------------------------------------------------------
  // 8. PHP DocBlocker
  // --------------------------------------------------------------------------
  describe('PHP DocBlocker Extension', () => {
    it('generates structured PHPDoc block with typed params and return type', () => {
      const signature = 'public function findUser(int $id, ?string $token = null): ?User';
      const doc = generatePhpDocBlock(signature);

      expect(doc).not.toBeNull();
      expect(doc?.params.length).toBe(2);
      expect(doc?.params[0]).toEqual({ type: 'int', name: '$id' });
      expect(doc?.params[1]).toEqual({ type: 'string|null', name: '$token' });
      expect(doc?.returnType).toBe('User|null');

      expect(doc?.formatted).toContain('* @param int $id');
      expect(doc?.formatted).toContain('* @param string|null $token');
      expect(doc?.formatted).toContain('* @return User|null');
    });

    it('manifests with proper metadata', () => {
      expect(phpDocBlockerExtensionModule.manifest.id).toBe('xivig.php-docblocker');
    });
  });

  // --------------------------------------------------------------------------
  // 9. Composer
  // --------------------------------------------------------------------------
  describe('Composer Extension', () => {
    it('builds composer command strings with packages and flags', () => {
      const requireCmd = buildComposerCommand('require', ['spatie/laravel-permission'], ['--dev']);
      expect(requireCmd).toBe('composer require spatie/laravel-permission --dev');

      const dumpCmd = buildComposerCommand('dump-autoload');
      expect(dumpCmd).toBe('composer dump-autoload');
    });

    it('searches popular Packagist PHP libraries', () => {
      const matches = searchPackagistPackages('spatie');
      expect(matches.length).toBeGreaterThanOrEqual(2);
      expect(matches).toContain('spatie/laravel-permission');
    });

    it('manifests with proper metadata', () => {
      expect(composerExtensionModule.manifest.id).toBe('xivig.composer');
    });
  });
});
