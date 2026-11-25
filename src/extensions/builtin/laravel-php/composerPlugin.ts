import { ComposerSettings } from './types';

export const DEFAULT_COMPOSER_SETTINGS: ComposerSettings = {
  enabled: true,
  composerBinary: 'composer',
  autoDumpAutoload: true,
};

export const POPULAR_PACKAGIST_PACKAGES = [
  'laravel/framework',
  'guzzlehttp/guzzle',
  'spatie/laravel-permission',
  'spatie/laravel-backup',
  'spatie/laravel-activitylog',
  'livewire/livewire',
  'inertiajs/inertia-laravel',
  'barryvdh/laravel-debugbar',
  'barryvdh/laravel-ide-helper',
  'pestphp/pest',
  'phpunit/phpunit',
  'mockery/mockery',
  'doctrine/dbal',
  'fakerphp/faker',
  'nunomaduro/collision',
];

export function searchPackagistPackages(query = ''): string[] {
  const norm = query.toLowerCase();
  if (!norm) return POPULAR_PACKAGIST_PACKAGES;
  return POPULAR_PACKAGIST_PACKAGES.filter((p) => p.toLowerCase().includes(norm));
}

/**
 * Builds a Composer shell command line string.
 */
export function buildComposerCommand(
  action: 'install' | 'update' | 'require' | 'remove' | 'dump-autoload',
  packages: string[] = [],
  flags: string[] = [],
  settings: ComposerSettings = DEFAULT_COMPOSER_SETTINGS
): string {
  const binary = settings.composerBinary || 'composer';
  const parts = [binary, action, ...packages, ...flags];
  return parts.filter(Boolean).join(' ');
}
