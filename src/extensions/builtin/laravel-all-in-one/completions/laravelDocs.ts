export interface LaravelDocItem {
  name: string;
  kind: 'method' | 'function' | 'class' | 'directive';
  signature: string;
  doc: string;
  returns?: string;
  parameters?: { name: string; type: string; doc?: string }[];
}

export const LARAVEL_DOCS: Record<string, LaravelDocItem> = {
  // --- FACADES ---
  'Route': {
    name: 'Route',
    kind: 'class',
    signature: 'class Route extends Facade',
    doc: 'Laravel Route facade providing routing API to register endpoints, controller actions, middleware groups, and named routes.',
  },
  'Auth': {
    name: 'Auth',
    kind: 'class',
    signature: 'class Auth extends Facade',
    doc: 'Laravel Auth facade providing user authentication, session guards, credential verification, and login/logout state management.',
  },
  'DB': {
    name: 'DB',
    kind: 'class',
    signature: 'class DB extends Facade',
    doc: 'Laravel DB facade providing fluent Query Builder, raw SQL execution, prepared transactions, and database connections.',
  },
  'Schema': {
    name: 'Schema',
    kind: 'class',
    signature: 'class Schema extends Facade',
    doc: 'Laravel Schema facade providing database-agnostic table creation, column modifications, and index management.',
  },
  'Storage': {
    name: 'Storage',
    kind: 'class',
    signature: 'class Storage extends Facade',
    doc: 'Laravel Storage facade providing unified filesystem abstraction across local disk, Amazon S3, and FTP.',
  },
  'Cache': {
    name: 'Cache',
    kind: 'class',
    signature: 'class Cache extends Facade',
    doc: 'Laravel Cache facade providing high-performance caching across Redis, Memcached, database, and array drivers.',
  },
  'Log': {
    name: 'Log',
    kind: 'class',
    signature: 'class Log extends Facade',
    doc: 'Laravel Log facade wrapping Monolog to write debug, informational, warning, and error logs.',
  },
  'Http': {
    name: 'Http',
    kind: 'class',
    signature: 'class Http extends Facade',
    doc: 'Laravel Http client facade wrapping Guzzle to make expressive outbound HTTP requests.',
  },
  'Str': {
    name: 'Str',
    kind: 'class',
    signature: 'class Str',
    doc: 'Laravel Str class containing expressive string manipulation, slugging, casing, and UUID generation helpers.',
  },
  'Arr': {
    name: 'Arr',
    kind: 'class',
    signature: 'class Arr',
    doc: 'Laravel Arr class containing array utilities supporting dot-notation, filtering, flattening, and plucking.',
  },

  // --- HELPERS ---
  'view': {
    name: 'view',
    kind: 'function',
    signature: 'view(string|null $view = null, array $data = [], array $mergeData = []): \\Illuminate\\View\\View|\\Illuminate\\Contracts\\View\\Factory',
    doc: 'Get the evaluated view contents for the given Blade template file.',
    parameters: [
      { name: '$view', type: 'string|null', doc: 'The name of the Blade template (e.g. "users.index")' },
      { name: '$data', type: 'array', doc: 'Array of data variables passed to the view' },
    ],
    returns: 'View|Factory',
  },
  'route': {
    name: 'route',
    kind: 'function',
    signature: 'route(string $name, mixed $parameters = [], bool $absolute = true): string',
    doc: 'Generate a URL for the given named route.',
    parameters: [
      { name: '$name', type: 'string', doc: 'The route name defined with ->name(...)' },
      { name: '$parameters', type: 'mixed', doc: 'Route URI parameters or query arguments' },
    ],
    returns: 'string',
  },
  'redirect': {
    name: 'redirect',
    kind: 'function',
    signature: 'redirect(string|null $to = null, int $status = 302, array $headers = [], bool|null $secure = null): \\Illuminate\\Http\\RedirectResponse|\\Illuminate\\Routing\\Redirector',
    doc: 'Get an instance of the redirector or create a redirect response to the given path.',
    returns: 'RedirectResponse|Redirector',
  },
  'response': {
    name: 'response',
    kind: 'function',
    signature: 'response(mixed $content = "", int $status = 200, array $headers = []): \\Illuminate\\Http\\Response|\\Illuminate\\Contracts\\Routing\\ResponseFactory',
    doc: 'Return an HTTP response instance or response factory for JSON, file downloads, or custom status codes.',
    returns: 'Response|ResponseFactory',
  },
  'request': {
    name: 'request',
    kind: 'function',
    signature: 'request(array|string|null $key = null, mixed $default = null): \\Illuminate\\Http\\Request|string|array|mixed',
    doc: 'Get an instance of the current HTTP request or an input parameter from query/body.',
    returns: 'Request|mixed',
  },
  'config': {
    name: 'config',
    kind: 'function',
    signature: 'config(array|string|null $key = null, mixed $default = null): mixed',
    doc: 'Get or set configuration values from config repository.',
    returns: 'mixed',
  },
  'asset': {
    name: 'asset',
    kind: 'function',
    signature: 'asset(string $path, bool|null $secure = null): string',
    doc: 'Generate a full asset URL for CSS, JavaScript, or images using the current scheme (HTTP/HTTPS).',
    returns: 'string',
  },
  'session': {
    name: 'session',
    kind: 'function',
    signature: 'session(array|string|null $key = null, mixed $default = null): \\Illuminate\\Session\\SessionManager|mixed',
    doc: 'Get or set session values or retrieve the active session store.',
    returns: 'SessionManager|mixed',
  },
  'auth': {
    name: 'auth',
    kind: 'function',
    signature: 'auth(string|null $guard = null): \\Illuminate\\Contracts\\Auth\\Factory|\\Illuminate\\Contracts\\Auth\\Guard|\\Illuminate\\Contracts\\Auth\\StatefulGuard',
    doc: 'Get the available authentication instance or specified guard.',
    returns: 'AuthManager|StatefulGuard',
  },
  'abort': {
    name: 'abort',
    kind: 'function',
    signature: 'abort(int $code, string $message = "", array $headers = []): never',
    doc: 'Throw an HttpException with the given HTTP status code (e.g. 404, 403, 500).',
    returns: 'never',
  },
  'collect': {
    name: 'collect',
    kind: 'function',
    signature: 'collect(mixed $value = null): \\Illuminate\\Support\\Collection',
    doc: 'Create a fluent collection instance from the given array or iterable value.',
    returns: 'Collection',
  },
  'now': {
    name: 'now',
    kind: 'function',
    signature: 'now(\\DateTimeZone|string|null $tz = null): \\Illuminate\\Support\\Carbon',
    doc: 'Create a new Carbon date/time instance for the current date and time.',
    returns: 'Carbon',
  },

  // --- BLADE DIRECTIVES ---
  '@extends': {
    name: '@extends',
    kind: 'directive',
    signature: "@extends('layout.name')",
    doc: 'Specify which parent layout template this Blade view should inherit and extend.',
  },
  '@section': {
    name: '@section',
    kind: 'directive',
    signature: "@section('name') ... @endsection",
    doc: 'Define a named content section to inject into a parent layout via @yield.',
  },
  '@yield': {
    name: '@yield',
    kind: 'directive',
    signature: "@yield('section_name', 'default')",
    doc: 'Display the contents of a given section defined in child views.',
  },
  '@include': {
    name: '@include',
    kind: 'directive',
    signature: "@include('partials.view', ['key' => $val])",
    doc: 'Include a sub-view within another view, passing variables if needed.',
  },
  '@if': {
    name: '@if',
    kind: 'directive',
    signature: '@if ($condition) ... @endif',
    doc: 'Conditional rendering block evaluating the given PHP expression.',
  },
  '@foreach': {
    name: '@foreach',
    kind: 'directive',
    signature: '@foreach ($items as $item) ... @endforeach',
    doc: 'Iterate over an array or Collection within Blade templates.',
  },
  '@csrf': {
    name: '@csrf',
    kind: 'directive',
    signature: '@csrf',
    doc: 'Generate a hidden HTML CSRF token input field for secure POST/PUT/DELETE forms.',
  },
  '@method': {
    name: '@method',
    kind: 'directive',
    signature: "@method('PUT')",
    doc: 'Generate a hidden _method HTML input field to spoof HTTP verbs in HTML forms.',
  },
  '@vite': {
    name: '@vite',
    kind: 'directive',
    signature: "@vite(['resources/css/app.css', 'resources/js/app.js'])",
    doc: 'Inject compiled CSS and JavaScript assets via the Laravel Vite plugin.',
  },
};
