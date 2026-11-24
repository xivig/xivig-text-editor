import { snippetCompletion, Completion } from '@codemirror/autocomplete';

export const FACADE_COMPLETIONS: Record<string, Completion[]> = {
  'Route': [
    snippetCompletion("get('\${1:uri}', [\${2:Controller}::class, '\${3:index}'])->name('\${4:name}');", {
      label: 'get',
      detail: 'Route::get(uri, action)',
      info: 'Register a new GET route with the router.',
      type: 'method',
    }),
    snippetCompletion("post('\${1:uri}', [\${2:Controller}::class, '\${3:store}'])->name('\${4:name}');", {
      label: 'post',
      detail: 'Route::post(uri, action)',
      info: 'Register a new POST route with the router.',
      type: 'method',
    }),
    snippetCompletion("put('\${1:uri}/{\${2:id}}', [\${3:Controller}::class, '\${4:update}']);", {
      label: 'put',
      detail: 'Route::put(uri, action)',
      info: 'Register a new PUT route with the router.',
      type: 'method',
    }),
    snippetCompletion("patch('\${1:uri}/{\${2:id}}', [\${3:Controller}::class, '\${4:update}']);", {
      label: 'patch',
      detail: 'Route::patch(uri, action)',
      info: 'Register a new PATCH route with the router.',
      type: 'method',
    }),
    snippetCompletion("delete('\${1:uri}/{\${2:id}}', [\${3:Controller}::class, '\${4:destroy}']);", {
      label: 'delete',
      detail: 'Route::delete(uri, action)',
      info: 'Register a new DELETE route with the router.',
      type: 'method',
    }),
    snippetCompletion("resource('\${1:resource}', \${2:Controller}::class);", {
      label: 'resource',
      detail: 'Route::resource(name, controller)',
      info: 'Route a resource to a controller handling all 7 CRUD actions.',
      type: 'method',
    }),
    snippetCompletion("apiResource('\${1:resource}', \${2:Controller}::class);", {
      label: 'apiResource',
      detail: 'Route::apiResource(name, controller)',
      info: 'Route an API resource to a controller excluding create/edit.',
      type: 'method',
    }),
    snippetCompletion("middleware([\${1:'auth'}])->group(function () {\n\t\${2}\n});", {
      label: 'middleware',
      detail: 'Route::middleware([...])->group(...)',
      info: 'Create a route group with shared middleware.',
      type: 'method',
    }),
    snippetCompletion("prefix('\${1:admin}')->group(function () {\n\t\${2}\n});", {
      label: 'prefix',
      detail: 'Route::prefix(string)->group(...)',
      info: 'Create a route group with a URI prefix.',
      type: 'method',
    }),
    snippetCompletion("name('\${1:admin.}')->group(function () {\n\t\${2}\n});", {
      label: 'name',
      detail: 'Route::name(string)->group(...)',
      info: 'Create a route group with a route name prefix.',
      type: 'method',
    }),
    snippetCompletion("group(function () {\n\t\${1}\n});", {
      label: 'group',
      detail: 'Route::group(callback)',
      info: 'Create a route group sharing attributes.',
      type: 'method',
    }),
    snippetCompletion("fallback([\${1:FallbackController}::class, 'index']);", {
      label: 'fallback',
      detail: 'Route::fallback(action)',
      info: 'Register a fallback route executing when no other route matches.',
      type: 'method',
    }),
    snippetCompletion("redirect('\${1:from}', '\${2:to}', \${3:301});", {
      label: 'redirect',
      detail: 'Route::redirect(from, to, status)',
      info: 'Register a route that redirects to another URI.',
      type: 'method',
    }),
    snippetCompletion("view('\${1:uri}', '\${2:view.name}', [\${3}]);", {
      label: 'view',
      detail: 'Route::view(uri, view, data)',
      info: 'Register a route that only renders a Blade view.',
      type: 'method',
    }),
  ],

  'Auth': [
    snippetCompletion('check()', {
      label: 'check',
      detail: 'Auth::check(): bool',
      info: 'Determine if the current user is authenticated.',
      type: 'method',
    }),
    snippetCompletion('guest()', {
      label: 'guest',
      detail: 'Auth::guest(): bool',
      info: 'Determine if the current user is a guest (not authenticated).',
      type: 'method',
    }),
    snippetCompletion('user()', {
      label: 'user',
      detail: 'Auth::user(): ?Authenticatable',
      info: 'Get the currently authenticated user model instance.',
      type: 'method',
    }),
    snippetCompletion('id()', {
      label: 'id',
      detail: 'Auth::id(): ?int',
      info: 'Get the primary key identifier of the currently authenticated user.',
      type: 'method',
    }),
    snippetCompletion("attempt(['\${1:email}' => \${2:$email}, 'password' => \${3:$password}], \${4:$remember})", {
      label: 'attempt',
      detail: 'Auth::attempt(credentials, remember): bool',
      info: 'Attempt to authenticate a user using the given credentials.',
      type: 'method',
    }),
    snippetCompletion('login(\${1:$user}, \${2:$remember = false});', {
      label: 'login',
      detail: 'Auth::login(user, remember): void',
      info: 'Log a given user instance into the application.',
      type: 'method',
    }),
    snippetCompletion('loginUsingId(\${1:$id}, \${2:$remember = false});', {
      label: 'loginUsingId',
      detail: 'Auth::loginUsingId(id, remember): ?Authenticatable',
      info: 'Log the given user ID into the application.',
      type: 'method',
    }),
    snippetCompletion('logout();', {
      label: 'logout',
      detail: 'Auth::logout(): void',
      info: 'Log the user out of the application and invalidate the session.',
      type: 'method',
    }),
    snippetCompletion("guard('\${1:web}')", {
      label: 'guard',
      detail: 'Auth::guard(name): StatefulGuard',
      info: 'Get a specific authentication guard instance.',
      type: 'method',
    }),
    snippetCompletion('routes();', {
      label: 'routes',
      detail: 'Auth::routes(): void',
      info: 'Register the typical authentication routes for an application.',
      type: 'method',
    }),
  ],

  'DB': [
    snippetCompletion("table('\${1:users}')", {
      label: 'table',
      detail: 'DB::table(tableName): Builder',
      info: 'Begin a fluent query builder against a database table.',
      type: 'method',
    }),
    snippetCompletion("select('\${1:SELECT * FROM users WHERE active = ?}', [\${2:1}])", {
      label: 'select',
      detail: 'DB::select(query, bindings): array',
      info: 'Run a select statement against the database.',
      type: 'method',
    }),
    snippetCompletion("insert('\${1:INSERT INTO users (name) VALUES (?)}', [\${2:$name}])", {
      label: 'insert',
      detail: 'DB::insert(query, bindings): bool',
      info: 'Run an insert statement against the database.',
      type: 'method',
    }),
    snippetCompletion("update('\${1:UPDATE users SET active = 1 WHERE id = ?}', [\${2:$id}])", {
      label: 'update',
      detail: 'DB::update(query, bindings): int',
      info: 'Run an update statement against the database.',
      type: 'method',
    }),
    snippetCompletion("delete('\${1:DELETE FROM users WHERE id = ?}', [\${2:$id}])", {
      label: 'delete',
      detail: 'DB::delete(query, bindings): int',
      info: 'Run a delete statement against the database.',
      type: 'method',
    }),
    snippetCompletion("statement('\${1:DROP TABLE IF EXISTS logs}');", {
      label: 'statement',
      detail: 'DB::statement(query): bool',
      info: 'Execute an arbitrary SQL statement against the database.',
      type: 'method',
    }),
    snippetCompletion("transaction(function () {\n\t\${1}\n});", {
      label: 'transaction',
      detail: 'DB::transaction(callback, attempts = 1)',
      info: 'Execute a Closure within a database transaction with automatic rollback.',
      type: 'method',
    }),
    snippetCompletion('beginTransaction();', {
      label: 'beginTransaction',
      detail: 'DB::beginTransaction(): void',
      info: 'Start a new database transaction manually.',
      type: 'method',
    }),
    snippetCompletion('commit();', {
      label: 'commit',
      detail: 'DB::commit(): void',
      info: 'Commit the active database transaction.',
      type: 'method',
    }),
    snippetCompletion('rollBack();', {
      label: 'rollBack',
      detail: 'DB::rollBack(): void',
      info: 'Rollback the active database transaction.',
      type: 'method',
    }),
    snippetCompletion("raw('\${1:COUNT(*) as total}')", {
      label: 'raw',
      detail: 'DB::raw(value): Expression',
      info: 'Create a raw database expression string.',
      type: 'method',
    }),
  ],

  'Schema': [
    snippetCompletion("create('\${1:table_name}', function (\\Illuminate\\Database\\Schema\\Blueprint $table) {\n\t$table->id();\n\t\${2}\n\t$table->timestamps();\n});", {
      label: 'create',
      detail: 'Schema::create(table, callback)',
      info: 'Create a new database table on the schema.',
      type: 'method',
    }),
    snippetCompletion("table('\${1:table_name}', function (\\Illuminate\\Database\\Schema\\Blueprint $table) {\n\t\${2}\n});", {
      label: 'table',
      detail: 'Schema::table(table, callback)',
      info: 'Modify an existing database table schema.',
      type: 'method',
    }),
    snippetCompletion("dropIfExists('\${1:table_name}');", {
      label: 'dropIfExists',
      detail: 'Schema::dropIfExists(table): void',
      info: 'Drop a table from the schema if it exists.',
      type: 'method',
    }),
    snippetCompletion("hasTable('\${1:table_name}')", {
      label: 'hasTable',
      detail: 'Schema::hasTable(table): bool',
      info: 'Determine if the given table exists.',
      type: 'method',
    }),
    snippetCompletion("hasColumn('\${1:table_name}', '\${2:column_name}')", {
      label: 'hasColumn',
      detail: 'Schema::hasColumn(table, column): bool',
      info: 'Determine if the given table has a given column.',
      type: 'method',
    }),
    snippetCompletion("drop('\${1:table_name}');", {
      label: 'drop',
      detail: 'Schema::drop(table): void',
      info: 'Drop a table from the schema.',
      type: 'method',
    }),
  ],

  'Storage': [
    snippetCompletion("disk('\${1:public}')", {
      label: 'disk',
      detail: 'Storage::disk(name): Filesystem',
      info: 'Get a filesystem disk instance by name.',
      type: 'method',
    }),
    snippetCompletion("put('\${1:path/file.txt}', \${2:$contents});", {
      label: 'put',
      detail: 'Storage::put(path, contents): bool',
      info: 'Write the contents of a file to storage.',
      type: 'method',
    }),
    snippetCompletion("get('\${1:path/file.txt}')", {
      label: 'get',
      detail: 'Storage::get(path): ?string',
      info: 'Get the contents of a file from storage.',
      type: 'method',
    }),
    snippetCompletion("delete('\${1:path/file.txt}');", {
      label: 'delete',
      detail: 'Storage::delete(paths): bool',
      info: 'Delete the file at a given path from storage.',
      type: 'method',
    }),
    snippetCompletion("exists('\${1:path/file.txt}')", {
      label: 'exists',
      detail: 'Storage::exists(path): bool',
      info: 'Determine if a file exists at the given path.',
      type: 'method',
    }),
    snippetCompletion("url('\${1:path/file.png}')", {
      label: 'url',
      detail: 'Storage::url(path): string',
      info: 'Get the public URL for the file at the given path.',
      type: 'method',
    }),
    snippetCompletion("download('\${1:path/file.pdf}', \${2:'name.pdf'});", {
      label: 'download',
      detail: 'Storage::download(path, name): StreamedResponse',
      info: 'Create a streamed download response for a file.',
      type: 'method',
    }),
  ],

  'Cache': [
    snippetCompletion("remember('\${1:key}', \${2:now()->addHours(24)}, function () {\n\treturn \${3};\n});", {
      label: 'remember',
      detail: 'Cache::remember(key, ttl, callback): mixed',
      info: 'Get an item from the cache, or execute Closure and store result forever/ttl.',
      type: 'method',
    }),
    snippetCompletion("rememberForever('\${1:key}', function () {\n\treturn \${2};\n});", {
      label: 'rememberForever',
      detail: 'Cache::rememberForever(key, callback): mixed',
      info: 'Get an item from cache, or store Closure result indefinitely.',
      type: 'method',
    }),
    snippetCompletion("get('\${1:key}', \${2:null})", {
      label: 'get',
      detail: 'Cache::get(key, default = null): mixed',
      info: 'Retrieve an item from the cache by key.',
      type: 'method',
    }),
    snippetCompletion("put('\${1:key}', \${2:$value}, \${3:now()->addMinutes(10)});", {
      label: 'put',
      detail: 'Cache::put(key, value, ttl = null): bool',
      info: 'Store an item in the cache for a given duration.',
      type: 'method',
    }),
    snippetCompletion("has('\${1:key}')", {
      label: 'has',
      detail: 'Cache::has(key): bool',
      info: 'Determine if an item exists in the cache.',
      type: 'method',
    }),
    snippetCompletion("forget('\${1:key}');", {
      label: 'forget',
      detail: 'Cache::forget(key): bool',
      info: 'Remove an item from the cache.',
      type: 'method',
    }),
    snippetCompletion('flush();', {
      label: 'flush',
      detail: 'Cache::flush(): bool',
      info: 'Remove all items from the cache.',
      type: 'method',
    }),
  ],

  'Log': [
    snippetCompletion("info('\${1:Message}', [\${2:'context' => 'details'}]);", {
      label: 'info',
      detail: 'Log::info(message, context)',
      info: 'Log an informational message to the log files.',
      type: 'method',
    }),
    snippetCompletion("error('\${1:Error message}', [\${2:'exception' => $e}]);", {
      label: 'error',
      detail: 'Log::error(message, context)',
      info: 'Log an error message to the log files.',
      type: 'method',
    }),
    snippetCompletion("warning('\${1:Warning message}', [\${2}]);", {
      label: 'warning',
      detail: 'Log::warning(message, context)',
      info: 'Log a warning message to the log files.',
      type: 'method',
    }),
    snippetCompletion("debug('\${1:Debug message}', [\${2}]);", {
      label: 'debug',
      detail: 'Log::debug(message, context)',
      info: 'Log a debug message to the log files.',
      type: 'method',
    }),
  ],

  'Http': [
    snippetCompletion("get('\${1:https://api.example.com/data}', [\${2}])", {
      label: 'get',
      detail: 'Http::get(url, query): Response',
      info: 'Issue a GET request to the given URL.',
      type: 'method',
    }),
    snippetCompletion("post('\${1:https://api.example.com/endpoint}', [\${2}])", {
      label: 'post',
      detail: 'Http::post(url, data): Response',
      info: 'Issue a POST request to the given URL.',
      type: 'method',
    }),
    snippetCompletion("withToken('\${1:$token}')", {
      label: 'withToken',
      detail: 'Http::withToken(token): PendingRequest',
      info: 'Attach a Bearer token to the Authorization header.',
      type: 'method',
    }),
    snippetCompletion("withHeaders([\${1:'X-Header' => 'Value'}])", {
      label: 'withHeaders',
      detail: 'Http::withHeaders(headers): PendingRequest',
      info: 'Attach custom headers to the request.',
      type: 'method',
    }),
    snippetCompletion("asJson()", {
      label: 'asJson',
      detail: 'Http::asJson(): PendingRequest',
      info: 'Indicate the request body format should be JSON.',
      type: 'method',
    }),
    snippetCompletion("timeout(\${1:30})", {
      label: 'timeout',
      detail: 'Http::timeout(seconds): PendingRequest',
      info: 'Specify the request timeout in seconds.',
      type: 'method',
    }),
    snippetCompletion("retry(\${1:3}, \${2:100})", {
      label: 'retry',
      detail: 'Http::retry(times, sleepMilliseconds): PendingRequest',
      info: 'Specify the number of times the request should be retried.',
      type: 'method',
    }),
  ],

  'Str': [
    snippetCompletion("slug('\${1:$title}', '\${2:-}')", {
      label: 'slug',
      detail: 'Str::slug(title, separator = "-"): string',
      info: 'Generate a URL-friendly slug from a given string.',
      type: 'method',
    }),
    snippetCompletion("limit('\${1:$value}', \${2:100}, '\${3:...')", {
      label: 'limit',
      detail: 'Str::limit(value, limit = 100, end = "..."): string',
      info: 'Limit the number of characters in a string.',
      type: 'method',
    }),
    snippetCompletion("contains('\${1:$haystack}', \${2:$needle})", {
      label: 'contains',
      detail: 'Str::contains(haystack, needles): bool',
      info: 'Determine if a given string contains a given substring.',
      type: 'method',
    }),
    snippetCompletion("startsWith('\${1:$haystack}', \${2:$needles})", {
      label: 'startsWith',
      detail: 'Str::startsWith(haystack, needles): bool',
      info: 'Determine if a given string starts with a given substring.',
      type: 'method',
    }),
    snippetCompletion("endsWith('\${1:$haystack}', \${2:$needles})", {
      label: 'endsWith',
      detail: 'Str::endsWith(haystack, needles): bool',
      info: 'Determine if a given string ends with a given substring.',
      type: 'method',
    }),
    snippetCompletion("random(\${1:16})", {
      label: 'random',
      detail: 'Str::random(length = 16): string',
      info: 'Generate a more truly random alphanumeric string.',
      type: 'method',
    }),
    snippetCompletion('uuid()', {
      label: 'uuid',
      detail: 'Str::uuid(): UuidInterface',
      info: 'Generate a UUID (version 4).',
      type: 'method',
    }),
    snippetCompletion('ulid()', {
      label: 'ulid',
      detail: 'Str::ulid(): Ulid',
      info: 'Generate a ULID.',
      type: 'method',
    }),
    snippetCompletion("camel('\${1:$value}')", {
      label: 'camel',
      detail: 'Str::camel(value): string',
      info: 'Convert a value to camelCase.',
      type: 'method',
    }),
    snippetCompletion("kebab('\${1:$value}')", {
      label: 'kebab',
      detail: 'Str::kebab(value): string',
      info: 'Convert a value to kebab-case.',
      type: 'method',
    }),
    snippetCompletion("snake('\${1:$value}')", {
      label: 'snake',
      detail: 'Str::snake(value, delimiter = "_"): string',
      info: 'Convert a value to snake_case.',
      type: 'method',
    }),
    snippetCompletion("title('\${1:$value}')", {
      label: 'title',
      detail: 'Str::title(value): string',
      info: 'Convert a value to title Case.',
      type: 'method',
    }),
  ],

  'Arr': [
    snippetCompletion("get(\${1:$array}, '\${2:key}', \${3:null})", {
      label: 'get',
      detail: 'Arr::get(array, key, default): mixed',
      info: 'Get an item from an array using "dot" notation.',
      type: 'method',
    }),
    snippetCompletion("set(\${1:$array}, '\${2:key}', \${3:$value});", {
      label: 'set',
      detail: 'Arr::set(array, key, value): array',
      info: 'Set an array item to a given value using "dot" notation.',
      type: 'method',
    }),
    snippetCompletion("has(\${1:$array}, '\${2:key}')", {
      label: 'has',
      detail: 'Arr::has(array, keys): bool',
      info: 'Check if an item or items exist in an array using "dot" notation.',
      type: 'method',
    }),
    snippetCompletion("first(\${1:$array}, fn ($v) => \${2})", {
      label: 'first',
      detail: 'Arr::first(array, callback, default): mixed',
      info: 'Return the first element in an array passing a given truth test.',
      type: 'method',
    }),
    snippetCompletion("last(\${1:$array}, fn ($v) => \${2})", {
      label: 'last',
      detail: 'Arr::last(array, callback, default): mixed',
      info: 'Return the last element in an array passing a given truth test.',
      type: 'method',
    }),
    snippetCompletion("pluck(\${1:$array}, '\${2:value}', '\${3:key}')", {
      label: 'pluck',
      detail: 'Arr::pluck(array, value, key): array',
      info: 'Pluck an array of values from an array.',
      type: 'method',
    }),
    snippetCompletion("flatten(\${1:$array}, \${2:INF})", {
      label: 'flatten',
      detail: 'Arr::flatten(array, depth = INF): array',
      info: 'Flatten a multi-dimensional array into a single level.',
      type: 'method',
    }),
  ],

  'Validator': [
    snippetCompletion("make(\${1:$request->all()}, [\n\t'\${2:email}' => '\${3:required|email}',\n]);", {
      label: 'make',
      detail: 'Validator::make(data, rules, messages = []): Validator',
      info: 'Create a new Validator instance.',
      type: 'method',
    }),
    snippetCompletion("validate(\${1:$request->all()}, [\n\t'\${2:field}' => '\${3:required}',\n]);", {
      label: 'validate',
      detail: 'Validator::validate(data, rules): array',
      info: 'Run validation against given data and return validated data or throw.',
      type: 'method',
    }),
  ],

  'Gate': [
    snippetCompletion("allows('\${1:ability}', [\${2}])", {
      label: 'allows',
      detail: 'Gate::allows(ability, arguments): bool',
      info: 'Determine if the given ability should be granted for current user.',
      type: 'method',
    }),
    snippetCompletion("denies('\${1:ability}', [\${2}])", {
      label: 'denies',
      detail: 'Gate::denies(ability, arguments): bool',
      info: 'Determine if the given ability should be denied for current user.',
      type: 'method',
    }),
    snippetCompletion("authorize('\${1:ability}', [\${2}]);", {
      label: 'authorize',
      detail: 'Gate::authorize(ability, arguments): Response',
      info: 'Inspect user ability, throw AuthorizationException if denied.',
      type: 'method',
    }),
    snippetCompletion("define('\${1:update-post}', function (\\App\\Models\\User $user, \\App\\Models\\Post $post) {\n\treturn $user->id === $post->user_id;\n});", {
      label: 'define',
      detail: 'Gate::define(ability, callback): void',
      info: 'Define a new authorization gate ability.',
      type: 'method',
    }),
  ],

  'Event': [
    snippetCompletion("dispatch(new \${1:OrderPlaced}(\${2:$order}));", {
      label: 'dispatch',
      detail: 'Event::dispatch(event, payload = []): ?array',
      info: 'Dispatch an event and call the registered listeners.',
      type: 'method',
    }),
    snippetCompletion("listen(\${1:OrderPlaced}::class, [\${2:SendNotification}::class, 'handle']);", {
      label: 'listen',
      detail: 'Event::listen(events, listener): void',
      info: 'Register an event listener with the dispatcher.',
      type: 'method',
    }),
  ],
};

export const LARAVEL_FACADE_NAMES: Completion[] = Object.keys(FACADE_COMPLETIONS).map((facade) => ({
  label: facade,
  detail: `Laravel ${facade} Facade`,
  info: `Laravel ${facade} facade providing expressive static access to underlying service container component.`,
  type: 'class',
}));
