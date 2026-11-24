import { snippetCompletion, Completion } from '@codemirror/autocomplete';

export const phpCoreCompletions: Completion[] = [
  // --- ARRAY FUNCTIONS ---
  snippetCompletion('array_map(\${1:callback}, \${\${2:array}})', {
    label: 'array_map',
    detail: '(callable|null $callback, array $array): array',
    info: 'Applies the callback to the elements of the given arrays.',
    type: 'function',
  }),
  snippetCompletion('array_filter(\${\${1:array}}, \${2:callback})', {
    label: 'array_filter',
    detail: '(array $array, ?callable $callback = null): array',
    info: 'Filters elements of an array using a callback function.',
    type: 'function',
  }),
  snippetCompletion('array_reduce(\${\${1:array}}, \${2:callback}, \${3:initial})', {
    label: 'array_reduce',
    detail: '(array $array, callable $callback, mixed $initial = null): mixed',
    info: 'Iteratively reduce the array to a single value using a callback function.',
    type: 'function',
  }),
  snippetCompletion('array_merge(\${\${1:array1}}, \${\${2:array2}})', {
    label: 'array_merge',
    detail: '(array ...$arrays): array',
    info: 'Merge one or more arrays into a combined array.',
    type: 'function',
  }),
  snippetCompletion('in_array(\${1:$needle}, \${\${2:haystack}}, \${3:true})', {
    label: 'in_array',
    detail: '(mixed $needle, array $haystack, bool $strict = false): bool',
    info: 'Checks if a value exists in an array.',
    type: 'function',
  }),
  snippetCompletion('array_key_exists(\${1:$key}, \${\${2:array}})', {
    label: 'array_key_exists',
    detail: '(string|int $key, array $array): bool',
    info: 'Checks if the given key or index exists in the array.',
    type: 'function',
  }),
  snippetCompletion('array_keys(\${\${1:array}})', {
    label: 'array_keys',
    detail: '(array $array): array',
    info: 'Return all the keys or a subset of the keys of an array.',
    type: 'function',
  }),
  snippetCompletion('array_values(\${\${1:array}})', {
    label: 'array_values',
    detail: '(array $array): array',
    info: 'Return all the values of an array.',
    type: 'function',
  }),
  snippetCompletion('count(\${\${1:value}})', {
    label: 'count',
    detail: '(Countable|array $value): int',
    info: 'Counts all elements in an array or Countable object.',
    type: 'function',
  }),

  // --- STRING FUNCTIONS ---
  snippetCompletion('strlen(\${\${1:string}})', {
    label: 'strlen',
    detail: '(string $string): int',
    info: 'Returns the length of the given string.',
    type: 'function',
  }),
  snippetCompletion('str_replace(\${1:$search}, \${2:$replace}, \${\${3:subject}})', {
    label: 'str_replace',
    detail: '(array|string $search, array|string $replace, string|array $subject): string|array',
    info: 'Replace all occurrences of the search string with the replacement string.',
    type: 'function',
  }),
  snippetCompletion('str_contains(\${\${1:haystack}}, \${2:$needle})', {
    label: 'str_contains',
    detail: '(string $haystack, string $needle): bool',
    info: 'Determine if a string contains a given substring (PHP 8.0+).',
    type: 'function',
  }),
  snippetCompletion('str_starts_with(\${\${1:haystack}}, \${2:$needle})', {
    label: 'str_starts_with',
    detail: '(string $haystack, string $needle): bool',
    info: 'Checks if a string starts with a given substring (PHP 8.0+).',
    type: 'function',
  }),
  snippetCompletion('str_ends_with(\${\${1:haystack}}, \${2:$needle})', {
    label: 'str_ends_with',
    detail: '(string $haystack, string $needle): bool',
    info: 'Checks if a string ends with a given substring (PHP 8.0+).',
    type: 'function',
  }),
  snippetCompletion('strpos(\${\${1:haystack}}, \${2:$needle})', {
    label: 'strpos',
    detail: '(string $haystack, string $needle, int $offset = 0): int|false',
    info: 'Find the numeric position of the first occurrence of a substring.',
    type: 'function',
  }),
  snippetCompletion('substr(\${\${1:string}}, \${2:offset}, \${3:length})', {
    label: 'substr',
    detail: '(string $string, int $offset, ?int $length = null): string',
    info: 'Return part of a string starting from offset.',
    type: 'function',
  }),
  snippetCompletion('trim(\${\${1:string}})', {
    label: 'trim',
    detail: '(string $string, string $characters = " \\n\\r\\t\\v\\x00"): string',
    info: 'Strip whitespace (or other characters) from the beginning and end of a string.',
    type: 'function',
  }),
  snippetCompletion('strtolower(\${\${1:string}})', {
    label: 'strtolower',
    detail: '(string $string): string',
    type: 'function',
  }),
  snippetCompletion('strtoupper(\${\${1:string}})', {
    label: 'strtoupper',
    detail: '(string $string): string',
    type: 'function',
  }),
  snippetCompletion("explode('\${1:,}', \${\${2:string}})", {
    label: 'explode',
    detail: '(string $separator, string $string, int $limit = PHP_INT_MAX): array',
    info: 'Split a string by a string separator into an array.',
    type: 'function',
  }),
  snippetCompletion("implode('\${1:,}', \${\${2:array}})", {
    label: 'implode',
    detail: '(string $separator, array $array): string',
    info: 'Join array elements with a string separator.',
    type: 'function',
  }),
  snippetCompletion('sprintf("\${1:%s}", \${2})', {
    label: 'sprintf',
    detail: '(string $format, mixed ...$values): string',
    info: 'Return a formatted string.',
    type: 'function',
  }),

  // --- JSON & HTTP ---
  snippetCompletion('json_encode(\${\${1:value}}, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR)', {
    label: 'json_encode',
    detail: '(mixed $value, int $flags = 0, int $depth = 512): string|false',
    info: 'Returns the JSON representation of a value.',
    type: 'function',
  }),
  snippetCompletion('json_decode(\${\${1:json}}, true, 512, JSON_THROW_ON_ERROR)', {
    label: 'json_decode',
    detail: '(string $json, ?bool $associative = null, int $depth = 512, int $flags = 0): mixed',
    info: 'Decodes a JSON string into a PHP array or object.',
    type: 'function',
  }),
  snippetCompletion("header('Content-Type: application/json; charset=utf-8');", {
    label: 'header',
    detail: '(string $header, bool $replace = true, int $response_code = 0): void',
    type: 'function',
  }),
  snippetCompletion('http_response_code(\${1:200});', {
    label: 'http_response_code',
    detail: '(int $response_code = 0): int|bool',
    type: 'function',
  }),

  // --- FILESYSTEM ---
  snippetCompletion('file_get_contents(\${\${1:filename}})', {
    label: 'file_get_contents',
    detail: '(string $filename): string|false',
    type: 'function',
  }),
  snippetCompletion('file_put_contents(\${\${1:filename}}, \${\${2:data}})', {
    label: 'file_put_contents',
    detail: '(string $filename, mixed $data, int $flags = 0): int|false',
    type: 'function',
  }),

  // --- SUPERGLOBALS ---
  { label: '$_GET', detail: 'array - HTTP GET query parameters', type: 'variable' },
  { label: '$_POST', detail: 'array - HTTP POST body parameters', type: 'variable' },
  { label: '$_SERVER', detail: 'array - Server and execution environment info', type: 'variable' },
  { label: '$_SESSION', detail: 'array - Session variables', type: 'variable' },
  { label: '$_COOKIE', detail: 'array - HTTP Cookies', type: 'variable' },
  { label: '$_FILES', detail: 'array - Uploaded files metadata', type: 'variable' },
  { label: '$_ENV', detail: 'array - Environment variables', type: 'variable' },

  // --- STANDARD CLASSES ---
  snippetCompletion('new \\DateTime(\${1})', {
    label: 'DateTime',
    detail: 'class DateTime implements DateTimeInterface',
    type: 'class',
  }),
  snippetCompletion('new \\DateTimeImmutable(\${1})', {
    label: 'DateTimeImmutable',
    detail: 'class DateTimeImmutable implements DateTimeInterface',
    type: 'class',
  }),
  snippetCompletion(
    'new \\PDO("\${1:mysql:host=localhost;dbname=test}", "\${2:root}", "\${3:secret}")',
    {
      label: 'PDO',
      detail: 'class PDO - PHP Data Objects Database Bridge',
      type: 'class',
    }
  ),

  // --- CONSTANTS ---
  { label: 'PHP_EOL', detail: 'string - The correct newline character for this platform', type: 'constant' },
  { label: 'PHP_VERSION', detail: 'string - The current PHP version as a string', type: 'constant' },
  { label: 'DIRECTORY_SEPARATOR', detail: 'string - Directory separator for OS (/ or \\)', type: 'constant' },
  { label: 'JSON_PRETTY_PRINT', detail: 'int - Use whitespace in returned JSON data', type: 'constant' },
  { label: 'JSON_THROW_ON_ERROR', detail: 'int - Throws JsonException if an error occurs', type: 'constant' },
];
