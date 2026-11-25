import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { LaravelExtraIntellisenseSettings } from './types';

export const DEFAULT_EXTRA_INTELLISENSE_SETTINGS: LaravelExtraIntellisenseSettings = {
  enabled: true,
  routeCompletion: true,
  viewCompletion: true,
  configCompletion: true,
  envCompletion: true,
};

export const COMMON_LARAVEL_CONFIGS = [
  'app.name', 'app.env', 'app.debug', 'app.url', 'app.timezone', 'app.locale',
  'auth.defaults.guard', 'auth.providers.users.model',
  'database.default', 'database.connections.mysql.host', 'database.connections.mysql.database',
  'mail.default', 'mail.mailers.smtp.host', 'mail.from.address',
  'session.driver', 'session.lifetime',
  'cache.default', 'filesystems.default',
];

export const COMMON_LARAVEL_ENV_VARS = [
  'APP_NAME', 'APP_ENV', 'APP_KEY', 'APP_DEBUG', 'APP_URL',
  'LOG_CHANNEL', 'LOG_LEVEL',
  'DB_CONNECTION', 'DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD',
  'BROADCAST_DRIVER', 'CACHE_DRIVER', 'FILESYSTEM_DISK', 'QUEUE_CONNECTION', 'SESSION_DRIVER',
  'REDIS_HOST', 'REDIS_PASSWORD', 'REDIS_PORT',
  'MAIL_MAILER', 'MAIL_HOST', 'MAIL_PORT', 'MAIL_USERNAME', 'MAIL_PASSWORD', 'MAIL_FROM_ADDRESS',
];

export const COMMON_LARAVEL_VIEWS = [
  'layouts.app', 'layouts.guest', 'layouts.navigation',
  'welcome', 'dashboard', 'home',
  'auth.login', 'auth.register', 'auth.forgot-password', 'auth.reset-password',
  'profile.edit', 'profile.partials.update-profile-information-form',
];

export const COMMON_LARAVEL_ROUTES = [
  'home', 'dashboard', 'login', 'logout', 'register',
  'users.index', 'users.create', 'users.store', 'users.show', 'users.edit', 'users.update', 'users.destroy',
  'profile.edit', 'profile.update', 'profile.destroy',
  'password.request', 'password.email', 'password.reset',
];

/**
 * CodeMirror 6 autocompletion source for route('...'), view('...'), config('...'), env('...').
 */
export function createLaravelExtraCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const line = context.state.doc.lineAt(context.pos);
    const textBefore = line.text.slice(0, context.pos - line.from);

    // 1. route('...')
    const routeMatch = textBefore.match(/route\s*\(\s*['"]([^'"]*)$/);
    if (routeMatch) {
      const token = routeMatch[1];
      const from = context.pos - token.length;
      const matches = COMMON_LARAVEL_ROUTES.filter((r) => r.toLowerCase().includes(token.toLowerCase()));
      return {
        from,
        options: matches.map((r) => ({
          label: r,
          type: 'function',
          detail: 'Laravel Route',
          boost: 3,
        })),
      };
    }

    // 2. view('...')
    const viewMatch = textBefore.match(/view\s*\(\s*['"]([^'"]*)$/);
    if (viewMatch) {
      const token = viewMatch[1];
      const from = context.pos - token.length;
      const matches = COMMON_LARAVEL_VIEWS.filter((v) => v.toLowerCase().includes(token.toLowerCase()));
      return {
        from,
        options: matches.map((v) => ({
          label: v,
          type: 'constant',
          detail: 'Blade View',
          boost: 3,
        })),
      };
    }

    // 3. config('...')
    const configMatch = textBefore.match(/config\s*\(\s*['"]([^'"]*)$/);
    if (configMatch) {
      const token = configMatch[1];
      const from = context.pos - token.length;
      const matches = COMMON_LARAVEL_CONFIGS.filter((c) => c.toLowerCase().includes(token.toLowerCase()));
      return {
        from,
        options: matches.map((c) => ({
          label: c,
          type: 'property',
          detail: 'Config Key',
          boost: 3,
        })),
      };
    }

    // 4. env('...')
    const envMatch = textBefore.match(/env\s*\(\s*['"]([^'"]*)$/);
    if (envMatch) {
      const token = envMatch[1];
      const from = context.pos - token.length;
      const matches = COMMON_LARAVEL_ENV_VARS.filter((e) => e.toLowerCase().includes(token.toLowerCase()));
      return {
        from,
        options: matches.map((e) => ({
          label: e,
          type: 'variable',
          detail: '.env Variable',
          boost: 3,
        })),
      };
    }

    return null;
  };
}
