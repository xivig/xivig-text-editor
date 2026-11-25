import { ArtisanCommandItem, LaravelArtisanSettings } from './types';

export const DEFAULT_LARAVEL_ARTISAN_SETTINGS: LaravelArtisanSettings = {
  enabled: true,
  phpBinary: 'php',
  artisanPath: 'artisan',
};

export const ARTISAN_COMMANDS: ArtisanCommandItem[] = [
  // Make generators
  {
    command: 'make:controller',
    description: 'Create a new controller class',
    category: 'make',
    arguments: ['name'],
    options: ['--resource', '--api', '--invokable', '--model='],
  },
  {
    command: 'make:model',
    description: 'Create a new Eloquent model class',
    category: 'make',
    arguments: ['name'],
    options: ['--migration', '--controller', '--resource', '-mcr', '--factory', '--seed'],
  },
  {
    command: 'make:migration',
    description: 'Create a new migration file',
    category: 'make',
    arguments: ['name'],
    options: ['--create=', '--table='],
  },
  {
    command: 'make:seeder',
    description: 'Create a new seeder class',
    category: 'make',
    arguments: ['name'],
  },
  {
    command: 'make:middleware',
    description: 'Create a new middleware class',
    category: 'make',
    arguments: ['name'],
  },
  {
    command: 'make:request',
    description: 'Create a new form request class',
    category: 'make',
    arguments: ['name'],
  },
  {
    command: 'make:resource',
    description: 'Create a new API resource class',
    category: 'make',
    arguments: ['name'],
    options: ['--collection'],
  },
  {
    command: 'make:event',
    description: 'Create a new event class',
    category: 'make',
    arguments: ['name'],
  },
  {
    command: 'make:listener',
    description: 'Create a new event listener class',
    category: 'make',
    arguments: ['name'],
    options: ['--event='],
  },

  // Database & Migrations
  {
    command: 'migrate',
    description: 'Run the database migrations',
    category: 'migrate',
    options: ['--seed', '--step', '--force'],
  },
  {
    command: 'migrate:fresh',
    description: 'Drop all tables and re-run all migrations',
    category: 'migrate',
    options: ['--seed', '--force'],
  },
  {
    command: 'migrate:rollback',
    description: 'Rollback the last database migration batch',
    category: 'migrate',
    options: ['--step='],
  },
  {
    command: 'db:seed',
    description: 'Seed the database with records',
    category: 'db',
    options: ['--class='],
  },

  // Routes & Optimization
  {
    command: 'route:list',
    description: 'List all registered routes',
    category: 'route',
    options: ['--path=', '--method='],
  },
  {
    command: 'route:cache',
    description: 'Create a route cache file for faster route registration',
    category: 'route',
  },
  {
    command: 'cache:clear',
    description: 'Flush the application cache',
    category: 'cache',
  },
  {
    command: 'config:clear',
    description: 'Remove the configuration cache file',
    category: 'config',
  },
  {
    command: 'view:clear',
    description: 'Clear all compiled view files',
    category: 'cache',
  },
  {
    command: 'optimize:clear',
    description: 'Remove the cached bootstrap files',
    category: 'cache',
  },
  {
    command: 'queue:work',
    description: 'Start processing jobs on the queue as a daemon',
    category: 'queue',
    options: ['--tries=3', '--timeout=60'],
  },
];

export function searchArtisanCommands(query = ''): ArtisanCommandItem[] {
  const norm = query.toLowerCase();
  if (!norm) return ARTISAN_COMMANDS;
  return ARTISAN_COMMANDS.filter((c) => c.command.toLowerCase().includes(norm) || c.description.toLowerCase().includes(norm));
}

/**
 * Builds shell command string for invoking PHP artisan.
 */
export function buildArtisanCommand(
  subCommand: string,
  args: string[] = [],
  settings: LaravelArtisanSettings = DEFAULT_LARAVEL_ARTISAN_SETTINGS
): string {
  const php = settings.phpBinary || 'php';
  const artisan = settings.artisanPath || 'artisan';
  const parts = [php, artisan, subCommand, ...args];
  return parts.filter(Boolean).join(' ');
}
