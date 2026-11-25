/**
 * Laravel Extension Pack
 * Coordinates and bundles all essential Laravel and PHP tools into a unified extension suite.
 */

export interface LaravelPackExtensionMeta {
  id: string;
  name: string;
  description: string;
}

export const LARAVEL_PACK_EXTENSIONS: LaravelPackExtensionMeta[] = [
  { id: 'xivig.intelephense', name: 'PHP Intelephense', description: 'Advanced PHP language intelligence & diagnostics' },
  { id: 'xivig.blade-snippets', name: 'Laravel Blade Snippets', description: 'Syntax highlighting & directives for Blade templates' },
  { id: 'xivig.laravel-artisan', name: 'Laravel Artisan', description: 'Command runner for Artisan CLI' },
  { id: 'xivig.laravel-extra-intellisense', name: 'Laravel Extra Intellisense', description: 'Route, view, config, and env completions' },
  { id: 'xivig.laravel-goto-controller', name: 'Laravel Goto Controller', description: 'Navigate directly from route declarations to controllers' },
  { id: 'xivig.php-namespace-resolver', name: 'PHP Namespace Resolver', description: 'Automatic PSR-4 import and namespace management' },
  { id: 'xivig.php-docblocker', name: 'PHP DocBlocker', description: 'Smart PHPDoc generation for methods and classes' },
  { id: 'xivig.composer', name: 'Composer', description: 'Composer dependency manager integration' },
];

export function getLaravelPackMeta(): LaravelPackExtensionMeta[] {
  return LARAVEL_PACK_EXTENSIONS;
}
