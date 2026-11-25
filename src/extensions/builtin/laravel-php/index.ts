import { BuiltinExtensionModule } from '../../api/types';
import { DEFAULT_PHP_INTELEPHENSE_SETTINGS } from './phpIntelephensePlugin';
import { LARAVEL_PACK_EXTENSIONS } from './laravelExtensionPackPlugin';
import {
  BLADE_SNIPPETS,
  createBladeDirectivesCompletionSource,
} from './laravelBladeSnippetsPlugin';
import { DEFAULT_LARAVEL_ARTISAN_SETTINGS, ARTISAN_COMMANDS } from './laravelArtisanPlugin';
import {
  DEFAULT_EXTRA_INTELLISENSE_SETTINGS,
  createLaravelExtraCompletionSource,
} from './laravelExtraIntellisensePlugin';
import { DEFAULT_PHP_NAMESPACE_SETTINGS } from './phpNamespaceResolverPlugin';
import { DEFAULT_COMPOSER_SETTINGS } from './composerPlugin';

export * from './types';
export * from './phpIntelephensePlugin';
export * from './laravelExtensionPackPlugin';
export * from './laravelBladeSnippetsPlugin';
export * from './laravelArtisanPlugin';
export * from './laravelExtraIntellisensePlugin';
export * from './laravelGotoControllerPlugin';
export * from './phpNamespaceResolverPlugin';
export * from './phpDocBlockerPlugin';
export * from './composerPlugin';

// 1. PHP Intelephense
export const phpIntelephenseExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.intelephense',
    name: 'PHP Intelephense',
    publisher: 'Ben Mewburn',
    version: '1.12.5',
    description: 'PHP code intelligence with detailed symbol indexing, diagnostics, and type inference.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#474a8a',
    iconSymbol: '🐘',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. Laravel Extension Pack
export const laravelExtensionPackModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.laravel-extension-pack',
    name: 'Laravel Extension Pack',
    publisher: 'Winnie Lin',
    version: '1.4.0',
    description: 'All essential Laravel developer tools bundled for rapid modern web engineering in Xivig.',
    categories: ['Productivity', 'Languages'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#ff2d20',
    iconSymbol: '⚡',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. Laravel Blade Snippets
export const laravelBladeSnippetsExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.blade-snippets',
    name: 'Laravel Blade Snippets',
    publisher: 'Winnie Lin',
    version: '1.4.1',
    description: 'Blade layout tags, conditional directives, sections, components, and Livewire helpers.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#f05340',
    iconSymbol: '🔪',
  },
  activate: () => {},
  deactivate: () => {},
  getSnippets: (language?: string) => {
    const lang = (language || '').toLowerCase();
    if (lang.includes('blade') || lang.includes('html') || lang.includes('php')) {
      return BLADE_SNIPPETS.map((s) => ({
        label: s.label,
        detail: s.detail,
        template: s.template,
      }));
    }
    return [];
  },
};

// 4. Laravel Artisan
export const laravelArtisanExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.laravel-artisan',
    name: 'Laravel Artisan',
    publisher: 'Ryan Chandler',
    version: '0.0.30',
    description: 'Interactive execution runner and code scaffold palette for Laravel Artisan commands.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#ff2d20',
    iconSymbol: '🛠️',
  },
  activate: () => {},
  deactivate: () => {},
};

// 5. Laravel Extra Intellisense
export const laravelExtraIntellisenseExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.laravel-extra-intellisense',
    name: 'Laravel Extra Intellisense',
    publisher: 'amiralizadeh9480',
    version: '0.6.4',
    description: 'Autocompletion for routes, views, configs, translations, and env variables.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#e3342f',
    iconSymbol: '💡',
  },
  activate: () => {},
  deactivate: () => {},
};

// 6. Laravel Goto Controller
export const laravelGotoControllerExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.laravel-goto-controller',
    name: 'Laravel Goto Controller',
    publisher: 'codingyu',
    version: '0.0.12',
    description: 'Navigate directly from route definitions to controller classes and methods.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#3490dc',
    iconSymbol: '🎯',
  },
  activate: () => {},
  deactivate: () => {},
};

// 7. PHP Namespace Resolver
export const phpNamespaceResolverExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.php-namespace-resolver',
    name: 'PHP Namespace Resolver',
    publisher: 'Mehedi Hassan',
    version: '1.1.9',
    description: 'Automates PSR-4 namespace calculation, class imports, and use-statement insertion.',
    categories: ['Productivity', 'Languages'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#6c5ce7',
    iconSymbol: '🏷️',
  },
  activate: () => {},
  deactivate: () => {},
};

// 8. PHP DocBlocker
export const phpDocBlockerExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.php-docblocker',
    name: 'PHP DocBlocker',
    publisher: 'Neil Brayfield',
    version: '3.0.0',
    description: 'Generates structured PHPDoc comment blocks from method signatures with types.',
    categories: ['Productivity', 'Languages'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#2d3436',
    iconSymbol: '📝',
  },
  activate: () => {},
  deactivate: () => {},
};

// 9. Composer
export const composerExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.composer',
    name: 'Composer',
    publisher: 'Heiko Peters',
    version: '0.5.4',
    description: 'Run Composer commands, manage dependencies, and dump autoloads directly from Xivig.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#885630',
    iconSymbol: '🎻',
  },
  activate: () => {},
  deactivate: () => {},
};
