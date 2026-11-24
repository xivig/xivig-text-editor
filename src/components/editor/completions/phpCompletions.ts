import { Completion, CompletionContext, CompletionResult, snippetCompletion } from '@codemirror/autocomplete';
import { PHP_DOCS } from '../../../extensions/builtin/php-intelligence/docs/phpDocs';

// ============================================================================
// 1. PHP SUPERGLOBALS
// ============================================================================

export const PHP_SUPERGLOBALS: Completion[] = [
  { label: '$_GET', detail: 'Associative array of variables passed via URL query parameters', type: 'variable', boost: 95 },
  { label: '$_POST', detail: 'Associative array of variables passed via HTTP POST request method', type: 'variable', boost: 95 },
  { label: '$_SESSION', detail: 'Associative array containing session variables available to current script', type: 'variable', boost: 95 },
  { label: '$_SERVER', detail: 'Array containing information such as headers, paths, and script locations', type: 'variable', boost: 95 },
  { label: '$_COOKIE', detail: 'Associative array of variables passed to current script via HTTP Cookies', type: 'variable', boost: 90 },
  { label: '$_FILES', detail: 'Associative array of items uploaded to the current script via POST method', type: 'variable', boost: 90 },
  { label: '$_REQUEST', detail: 'Associative array that by default contains contents of $_GET, $_POST and $_COOKIE', type: 'variable', boost: 85 },
  { label: '$_ENV', detail: 'Associative array of variables passed to current script via environment method', type: 'variable', boost: 80 },
  { label: '$GLOBALS', detail: 'References all variables available in global scope', type: 'variable', boost: 85 },
];

// ============================================================================
// 2. PHP KEYWORDS & STATEMENTS
// ============================================================================

export const PHP_KEYWORDS: Completion[] = [
  snippetCompletion('public function ${1:name}(${2:params}): ${3:void}\n{\n\t${0}\n}', {
    label: 'public function',
    detail: 'Public method declaration',
    type: 'keyword',
    boost: 95,
  }),
  snippetCompletion('private function ${1:name}(${2:params}): ${3:void}\n{\n\t${0}\n}', {
    label: 'private function',
    detail: 'Private method declaration',
    type: 'keyword',
    boost: 94,
  }),
  snippetCompletion('protected function ${1:name}(${2:params}): ${3:void}\n{\n\t${0}\n}', {
    label: 'protected function',
    detail: 'Protected method declaration',
    type: 'keyword',
    boost: 94,
  }),
  snippetCompletion('public static function ${1:name}(${2:params}): ${3:void}\n{\n\t${0}\n}', {
    label: 'public static function',
    detail: 'Public static method declaration',
    type: 'keyword',
    boost: 93,
  }),
  snippetCompletion('public function __construct(${1:params})\n{\n\t${0}\n}', {
    label: '__construct',
    detail: 'Class constructor method',
    type: 'keyword',
    boost: 96,
  }),
  snippetCompletion('class ${1:ClassName}\n{\n\t${0}\n}', {
    label: 'class',
    detail: 'Class definition',
    type: 'keyword',
    boost: 95,
  }),
  snippetCompletion('foreach (${1:$array} as ${2:$item}) {\n\t${0}\n}', {
    label: 'foreach',
    detail: 'Foreach loop iteration',
    type: 'keyword',
    boost: 95,
  }),
  snippetCompletion('foreach (${1:$array} as ${2:$key} => ${3:$value}) {\n\t${0}\n}', {
    label: 'foreach-key',
    detail: 'Foreach key-value loop iteration',
    type: 'keyword',
    boost: 94,
  }),
  snippetCompletion('if (${1:$condition}) {\n\t${0}\n}', {
    label: 'if',
    detail: 'If statement',
    type: 'keyword',
    boost: 95,
  }),
  snippetCompletion('if (${1:$condition}) {\n\t${2}\n} else {\n\t${0}\n}', {
    label: 'ifelse',
    detail: 'If-Else statement',
    type: 'keyword',
    boost: 94,
  }),
  snippetCompletion('try {\n\t${0}\n} catch (${1:\\Throwable} ${2:$e}) {\n\t${3}\n}', {
    label: 'try',
    detail: 'Try-catch exception handling',
    type: 'keyword',
    boost: 92,
  }),
  snippetCompletion('namespace ${1:App};\n\n${0}', {
    label: 'namespace',
    detail: 'Namespace declaration',
    type: 'keyword',
    boost: 90,
  }),
  { label: 'function', detail: 'Function declaration keyword', type: 'keyword', boost: 90 },
  { label: 'return', detail: 'Return statement', type: 'keyword', boost: 95 },
  { label: 'public', detail: 'Public visibility modifier', type: 'keyword', boost: 92 },
  { label: 'private', detail: 'Private visibility modifier', type: 'keyword', boost: 90 },
  { label: 'protected', detail: 'Protected visibility modifier', type: 'keyword', boost: 90 },
  { label: 'static', detail: 'Static keyword for class properties and methods', type: 'keyword', boost: 90 },
  { label: 'extends', detail: 'Extends parent class', type: 'keyword', boost: 90 },
  { label: 'implements', detail: 'Implements interface', type: 'keyword', boost: 90 },
  { label: 'use', detail: 'Import class / trait / namespace', type: 'keyword', boost: 92 },
  { label: 'echo', detail: 'Outputs one or more strings', type: 'keyword', boost: 92 },
  { label: 'print', detail: 'Output a string', type: 'keyword', boost: 85 },
  { label: 'die', detail: 'Equivalent to exit()', type: 'keyword', boost: 85 },
  { label: 'exit', detail: 'Output a message and terminate current script', type: 'keyword', boost: 85 },
];

// ============================================================================
// 3. CORE PHP BUILT-IN FUNCTIONS
// ============================================================================

export const ADDITIONAL_PHP_FUNCTIONS: Completion[] = [
  // Inspection & type check
  snippetCompletion('isset(${1:$var})', { label: 'isset', detail: 'isset(mixed $var, mixed ...$vars): bool', type: 'function', boost: 97 }),
  snippetCompletion('empty(${1:$var})', { label: 'empty', detail: 'empty(mixed $var): bool', type: 'function', boost: 96 }),
  snippetCompletion('is_array(${1:$var})', { label: 'is_array', detail: 'is_array(mixed $value): bool', type: 'function', boost: 95 }),
  snippetCompletion('is_null(${1:$var})', { label: 'is_null', detail: 'is_null(mixed $value): bool', type: 'function', boost: 92 }),
  snippetCompletion('is_string(${1:$var})', { label: 'is_string', detail: 'is_string(mixed $value): bool', type: 'function', boost: 90 }),
  snippetCompletion('is_numeric(${1:$var})', { label: 'is_numeric', detail: 'is_numeric(mixed $value): bool', type: 'function', boost: 90 }),
  snippetCompletion('is_int(${1:$var})', { label: 'is_int', detail: 'is_int(mixed $value): bool', type: 'function', boost: 88 }),
  snippetCompletion('var_dump(${1:$var});', { label: 'var_dump', detail: 'var_dump(mixed $value, mixed ...$values): void', type: 'function', boost: 95 }),
  snippetCompletion('print_r(${1:$var});', { label: 'print_r', detail: 'print_r(mixed $value, bool $return = false): mixed', type: 'function', boost: 94 }),
  snippetCompletion('get_declared_classes()', { label: 'get_declared_classes', detail: 'get_declared_classes(): array', type: 'function', boost: 92 }),

  // String functions
  snippetCompletion('strlen(${1:$string})', { label: 'strlen', detail: 'strlen(string $string): int', type: 'function', boost: 96 }),
  snippetCompletion('strpos(${1:$haystack}, ${2:$needle})', { label: 'strpos', detail: 'strpos(string $haystack, string $needle, int $offset = 0): int|false', type: 'function', boost: 95 }),
  snippetCompletion('substr(${1:$string}, ${2:$offset}, ${3:$length})', { label: 'substr', detail: 'substr(string $string, int $offset, ?int $length = null): string', type: 'function', boost: 95 }),
  snippetCompletion('str_replace(${1:$search}, ${2:$replace}, ${3:$subject})', { label: 'str_replace', detail: 'str_replace(string|array $search, string|array $replace, string|array $subject): string|array', type: 'function', boost: 96 }),
  snippetCompletion('str_contains(${1:$haystack}, ${2:$needle})', { label: 'str_contains', detail: 'str_contains(string $haystack, string $needle): bool', type: 'function', boost: 94 }),
  snippetCompletion('str_starts_with(${1:$haystack}, ${2:$needle})', { label: 'str_starts_with', detail: 'str_starts_with(string $haystack, string $needle): bool', type: 'function', boost: 94 }),
  snippetCompletion('str_ends_with(${1:$haystack}, ${2:$needle})', { label: 'str_ends_with', detail: 'str_ends_with(string $haystack, string $needle): bool', type: 'function', boost: 94 }),
  snippetCompletion('explode("${1:,}", ${2:$string})', { label: 'explode', detail: 'explode(string $separator, string $string, int $limit = PHP_INT_MAX): array', type: 'function', boost: 96 }),
  snippetCompletion('implode("${1:,}", ${2:$array})', { label: 'implode', detail: 'implode(string $separator, array $array): string', type: 'function', boost: 96 }),
  snippetCompletion('trim(${1:$string})', { label: 'trim', detail: 'trim(string $string, string $characters = " \\n\\r\\t\\v\\x00"): string', type: 'function', boost: 95 }),
  snippetCompletion('strtolower(${1:$string})', { label: 'strtolower', detail: 'strtolower(string $string): string', type: 'function', boost: 92 }),
  snippetCompletion('strtoupper(${1:$string})', { label: 'strtoupper', detail: 'strtoupper(string $string): string', type: 'function', boost: 92 }),
  snippetCompletion('sprintf("${1:%s}", ${2:$val})', { label: 'sprintf', detail: 'sprintf(string $format, mixed ...$values): string', type: 'function', boost: 90 }),

  // Array functions
  snippetCompletion('count(${1:$array})', { label: 'count', detail: 'count(Countable|array $value): int', type: 'function', boost: 98 }),
  snippetCompletion('compact(${1:\'var1\'}, ${2:\'var2\'})', { label: 'compact', detail: 'compact(array|string ...$var_names): array', type: 'function', boost: 95 }),
  snippetCompletion('array_keys(${1:$array})', { label: 'array_keys', detail: 'array_keys(array $array): array', type: 'function', boost: 94 }),
  snippetCompletion('array_values(${1:$array})', { label: 'array_values', detail: 'array_values(array $array): array', type: 'function', boost: 94 }),
  snippetCompletion('array_key_exists(${1:$key}, ${2:$array})', { label: 'array_key_exists', detail: 'array_key_exists(string|int $key, array $array): bool', type: 'function', boost: 94 }),
  snippetCompletion('array_push(${1:$array}, ${2:$val})', { label: 'array_push', detail: 'array_push(array &$array, mixed ...$values): int', type: 'function', boost: 90 }),
  snippetCompletion('array_pop(${1:$array})', { label: 'array_pop', detail: 'array_pop(array &$array): mixed', type: 'function', boost: 90 }),
  snippetCompletion('array_slice(${1:$array}, ${2:$offset}, ${3:$length})', { label: 'array_slice', detail: 'array_slice(array $array, int $offset, ?int $length = null): array', type: 'function', boost: 88 }),

  // JSON & Web
  snippetCompletion('json_encode(${1:$data})', { label: 'json_encode', detail: 'json_encode(mixed $value, int $flags = 0): string|false', type: 'function', boost: 96 }),
  snippetCompletion('json_decode(${1:$json}, true)', { label: 'json_decode', detail: 'json_decode(string $json, bool $associative = true): mixed', type: 'function', boost: 96 }),
  snippetCompletion('header("${1:Content-Type: application/json}");', { label: 'header', detail: 'header(string $header, bool $replace = true): void', type: 'function', boost: 90 }),
  snippetCompletion('http_response_code(${1:200});', { label: 'http_response_code', detail: 'http_response_code(int $response_code = 0): int|bool', type: 'function', boost: 88 }),
  snippetCompletion('date("${1:Y-m-d H:i:s}")', { label: 'date', detail: 'date(string $format, ?int $timestamp = null): string', type: 'function', boost: 92 }),
  snippetCompletion('time()', { label: 'time', detail: 'time(): int', type: 'function', boost: 92 }),
  snippetCompletion('file_get_contents(${1:$filename})', { label: 'file_get_contents', detail: 'file_get_contents(string $filename): string|false', type: 'function', boost: 92 }),
  snippetCompletion('file_put_contents(${1:$filename}, ${2:$data});', { label: 'file_put_contents', detail: 'file_put_contents(string $filename, mixed $data): int|false', type: 'function', boost: 90 }),
  snippetCompletion('file_exists(${1:$filename})', { label: 'file_exists', detail: 'file_exists(string $filename): bool', type: 'function', boost: 90 }),
];

// ============================================================================
// 4. OBJECT ARROW COMPLETIONS ($this->, $obj->)
// ============================================================================

export const PHP_ARROW_MEMBERS: Completion[] = [
  { label: 'classList', detail: 'Property on current instance ($this->classList)', type: 'property', boost: 95 },
  { label: 'id', detail: 'Model primary key attribute ($this->id)', type: 'property', boost: 94 },
  { label: 'name', detail: 'Name attribute ($this->name)', type: 'property', boost: 92 },
  { label: 'save()', detail: 'Save model instance to database', type: 'method', apply: 'save()', boost: 92 },
  { label: 'update()', detail: 'Update model with attributes', type: 'method', apply: 'update([${1}])', boost: 90 },
  { label: 'delete()', detail: 'Delete model from database', type: 'method', apply: 'delete()', boost: 90 },
  { label: 'toArray()', detail: 'Convert model or collection to array', type: 'method', apply: 'toArray()', boost: 90 },
  { label: 'toJson()', detail: 'Convert model or collection to JSON string', type: 'method', apply: 'toJson()', boost: 88 },
  { label: 'all()', detail: 'Get all items from collection or request', type: 'method', apply: 'all()', boost: 90 },
  { label: 'get()', detail: 'Execute query or get attribute', type: 'method', apply: 'get()', boost: 90 },
  { label: 'first()', detail: 'Get the first item matching query', type: 'method', apply: 'first()', boost: 90 },
  { label: 'where()', detail: 'Add a where clause to query', type: 'method', apply: 'where(\'${1:column}\', ${2:\'$val\'})', boost: 92 },
];

// ============================================================================
// 5. PHP COMPLETION SOURCE IMPLEMENTATION
// ============================================================================

export function phpCompletions(context: CompletionContext): CompletionResult | null {
  const line = context.state.doc.lineAt(context.pos);
  const textBefore = line.text.slice(0, context.pos - line.from);

  // 1. PHP Opening tag trigger: "<?" or "<?p"
  const tagMatch = context.matchBefore(/<\?(?:php)?/);
  if (tagMatch) {
    return {
      from: tagMatch.from,
      options: [
        snippetCompletion('<?php\n\n${0}', {
          label: '<?php',
          detail: 'PHP Opening Tag',
          type: 'keyword',
          boost: 99,
        }),
      ],
      validFor: /^<\?(?:php)?$/,
    };
  }

  // 2. Object arrow trigger: "$this->", "$var->", or "->"
  const arrowMatch = textBefore.match(/(?:\$?[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*|\)|\])\s*->\s*([a-zA-Z0-9_]*)$/);
  if (arrowMatch) {
    const memberTyped = arrowMatch[1];
    const fromPos = context.pos - memberTyped.length;

    return {
      from: fromPos,
      options: PHP_ARROW_MEMBERS,
      validFor: /^[a-zA-Z0-9_]*$/,
    };
  }

  // 3. Superglobals on "$_"
  const superMatch = context.matchBefore(/\$_[a-zA-Z]*/);
  if (superMatch) {
    return {
      from: superMatch.from,
      options: PHP_SUPERGLOBALS,
      validFor: /^\$_[a-zA-Z]*$/,
    };
  }

  // 4. Standard PHP functions, keywords, and docs
  const word = context.matchBefore(/[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/);
  if (word && !textBefore.endsWith('->') && !textBefore.endsWith('::')) {
    // Collect functions from PHP_DOCS
    const docsFunctions: Completion[] = Object.values(PHP_DOCS).map((item) => {
      const paramSnippet = (item.parameters || []).map((p, idx) => `\${${idx + 1}:${p.name}}`).join(', ');
      return snippetCompletion(`${item.name}(${paramSnippet})`, {
        label: item.name,
        detail: item.signature || item.doc,
        type: 'function',
        boost: 88,
      });
    });

    const options = [
      ...PHP_KEYWORDS,
      ...ADDITIONAL_PHP_FUNCTIONS,
      ...docsFunctions,
      ...PHP_SUPERGLOBALS,
    ];

    return {
      from: word.from,
      options,
      validFor: /^[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/,
    };
  }

  return null;
}
