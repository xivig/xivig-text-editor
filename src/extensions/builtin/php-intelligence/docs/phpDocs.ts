export interface PhpDocItem {
  name: string;
  kind: 'function' | 'class' | 'method' | 'keyword' | 'type';
  signature: string;
  doc: string;
  returns?: string;
  parameters?: { name: string; type: string; doc?: string }[];
}

export const PHP_DOCS: Record<string, PhpDocItem> = {
  'array_map': {
    name: 'array_map',
    kind: 'function',
    signature: 'array_map(callable|null $callback, array $array, array ...$arrays): array',
    doc: 'Applies the callback to the elements of the given arrays. Returns an array containing the results of applying the callback to the corresponding elements.',
    parameters: [
      { name: '$callback', type: 'callable|null', doc: 'Callback function to run for each element in each array' },
      { name: '$array', type: 'array', doc: 'An array to run through the callback function' },
    ],
    returns: 'array',
  },
  'array_filter': {
    name: 'array_filter',
    kind: 'function',
    signature: 'array_filter(array $array, ?callable $callback = null, int $mode = 0): array',
    doc: 'Iterates over each value in the array passing them to the callback function. If callback returns true, current value from array is returned into result array.',
    parameters: [
      { name: '$array', type: 'array', doc: 'The array to iterate over' },
      { name: '$callback', type: '?callable', doc: 'The callback function to use' },
    ],
    returns: 'array',
  },
  'array_reduce': {
    name: 'array_reduce',
    kind: 'function',
    signature: 'array_reduce(array $array, callable $callback, mixed $initial = null): mixed',
    doc: 'Iteratively reduce the array to a single value using a callback function.',
    parameters: [
      { name: '$array', type: 'array' },
      { name: '$callback', type: 'callable' },
      { name: '$initial', type: 'mixed' },
    ],
    returns: 'mixed',
  },
  'array_merge': {
    name: 'array_merge',
    kind: 'function',
    signature: 'array_merge(array ...$arrays): array',
    doc: 'Merges the elements of one or more arrays together so that the values of one are appended to the end of the previous one.',
    parameters: [{ name: '...$arrays', type: 'array' }],
    returns: 'array',
  },
  'in_array': {
    name: 'in_array',
    kind: 'function',
    signature: 'in_array(mixed $needle, array $haystack, bool $strict = false): bool',
    doc: 'Searches haystack for needle using loose comparison unless strict is set.',
    parameters: [
      { name: '$needle', type: 'mixed', doc: 'The searched value' },
      { name: '$haystack', type: 'array', doc: 'The array' },
      { name: '$strict', type: 'bool', doc: 'If true, also checks types' },
    ],
    returns: 'bool',
  },
  'strlen': {
    name: 'strlen',
    kind: 'function',
    signature: 'strlen(string $string): int',
    doc: 'Returns the number of bytes in given string.',
    parameters: [{ name: '$string', type: 'string' }],
    returns: 'int',
  },
  'str_replace': {
    name: 'str_replace',
    kind: 'function',
    signature: 'str_replace(array|string $search, array|string $replace, string|array $subject, int &$count = null): string|array',
    doc: 'Returns a string or an array with all occurrences of search in subject replaced with the given replace value.',
    parameters: [
      { name: '$search', type: 'string|array' },
      { name: '$replace', type: 'string|array' },
      { name: '$subject', type: 'string|array' },
    ],
    returns: 'string|array',
  },
  'str_contains': {
    name: 'str_contains',
    kind: 'function',
    signature: 'str_contains(string $haystack, string $needle): bool',
    doc: 'Performs a case-sensitive check indicating if needle is contained in haystack (PHP 8.0+).',
    parameters: [
      { name: '$haystack', type: 'string' },
      { name: '$needle', type: 'string' },
    ],
    returns: 'bool',
  },
  'explode': {
    name: 'explode',
    kind: 'function',
    signature: 'explode(string $separator, string $string, int $limit = PHP_INT_MAX): array',
    doc: 'Returns an array of strings, each of which is a substring of string formed by splitting it on boundaries formed by string separator.',
    parameters: [
      { name: '$separator', type: 'string' },
      { name: '$string', type: 'string' },
    ],
    returns: 'array',
  },
  'implode': {
    name: 'implode',
    kind: 'function',
    signature: 'implode(string $separator, array $array): string',
    doc: 'Join array elements with a string separator.',
    parameters: [
      { name: '$separator', type: 'string' },
      { name: '$array', type: 'array' },
    ],
    returns: 'string',
  },
  'json_encode': {
    name: 'json_encode',
    kind: 'function',
    signature: 'json_encode(mixed $value, int $flags = 0, int $depth = 512): string|false',
    doc: 'Returns a string containing the JSON representation of the supplied value.',
    parameters: [
      { name: '$value', type: 'mixed' },
      { name: '$flags', type: 'int' },
    ],
    returns: 'string|false',
  },
  'json_decode': {
    name: 'json_decode',
    kind: 'function',
    signature: 'json_decode(string $json, ?bool $associative = null, int $depth = 512, int $flags = 0): mixed',
    doc: 'Takes a JSON encoded string and converts it into a PHP value.',
    parameters: [
      { name: '$json', type: 'string' },
      { name: '$associative', type: '?bool' },
    ],
    returns: 'mixed',
  },
  'dd': {
    name: 'dd',
    kind: 'function',
    signature: 'dd(mixed ...$vars): void',
    doc: 'Laravel Dump and Die helper: Dumps the given variables and ends execution of the script.',
    parameters: [{ name: '...$vars', type: 'mixed' }],
    returns: 'void',
  },
  'route': {
    name: 'route',
    kind: 'function',
    signature: 'route(string $name, mixed $parameters = [], bool $absolute = true): string',
    doc: 'Laravel URL generator helper for named application routes.',
    parameters: [
      { name: '$name', type: 'string' },
      { name: '$parameters', type: 'mixed' },
    ],
    returns: 'string',
  },
};
