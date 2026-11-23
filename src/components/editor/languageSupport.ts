import { Extension } from '@codemirror/state';
import { StreamLanguage, StringStream } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';

interface CStyleParserState {
  inBlockComment: boolean;
  inString: string | false;
  braceDepth: number;
}

// -------------------------------------------------------------
// 1. Java Stream Language
// -------------------------------------------------------------
const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
  'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
  'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
  'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public',
  'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
  'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'record',
  'sealed', 'permits', 'non-sealed', 'var', 'yield',
]);

const JAVA_BUILTIN_TYPES = new Set([
  'String', 'Object', 'System', 'Integer', 'Double', 'Float', 'Long', 'Short', 'Byte',
  'Boolean', 'Character', 'Math', 'List', 'Map', 'Set', 'ArrayList', 'HashMap', 'HashSet',
  'Arrays', 'Collections', 'Optional', 'Exception', 'Throwable', 'RuntimeException',
  'Class', 'Thread', 'Runnable', 'Scanner', 'PrintStream', 'StringBuilder', 'StringBuffer',
]);

const JAVA_ATOMS = new Set(['true', 'false', 'null']);

export const javaLanguage = StreamLanguage.define<CStyleParserState>({
  name: 'java',
  startState: () => ({
    inBlockComment: false,
    inString: false,
    braceDepth: 0,
  }),
  token(stream: StringStream, state: CStyleParserState): string | null {
    if (state.inBlockComment) {
      if (stream.match(/.*?\*\//)) {
        state.inBlockComment = false;
        return 'blockComment';
      }
      stream.skipToEnd();
      return 'blockComment';
    }

    if (stream.eatSpace()) return null;

    // Line comment
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'lineComment';
    }

    // Block comment
    if (stream.match('/*')) {
      state.inBlockComment = true;
      if (stream.match(/.*?\*\//)) {
        state.inBlockComment = false;
      } else {
        stream.skipToEnd();
      }
      return 'blockComment';
    }

    // Strings
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) {
      return 'string';
    }
    // Character literals
    if (stream.match(/^'(?:[^'\\]|\\.)*'/)) {
      return 'string';
    }

    // Annotation e.g. @Override
    if (stream.match(/^@[a-zA-Z_]\w*/)) {
      return 'annotation';
    }

    // Numbers (hex, binary, float, integer)
    if (stream.match(/^0x[0-9a-fA-F_]+/i) || stream.match(/^0b[01_]+/i) || stream.match(/^\d[\d_]*(\.[\d_]+)?([eE][+-]?\d+)?[fFdDlL]?/)) {
      return 'number';
    }

    // Braces tracking for auto-indent
    if (stream.eat('{')) {
      state.braceDepth++;
      return 'bracket';
    }
    if (stream.eat('}')) {
      state.braceDepth = Math.max(0, state.braceDepth - 1);
      return 'bracket';
    }
    if (stream.match(/^[()[\]]/)) {
      return 'bracket';
    }

    // Operators
    if (stream.match(/^(?:[-+*/%&|^!=<>?~:;]|&&|\|\||<<|>>|>>>|\+\+|--|==|!=|<=|>=|\+=|-=|\*=|\/=|%=|&=|\|=|\^=)/)) {
      return 'operator';
    }

    // Identifiers & keywords
    const match = stream.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
    if (match) {
      const word = stream.current();
      if (JAVA_KEYWORDS.has(word)) return 'keyword';
      if (JAVA_ATOMS.has(word)) return 'atom';
      if (JAVA_BUILTIN_TYPES.has(word)) return 'typeName';
      if (/^[A-Z]/.test(word)) return 'className';
      return 'variableName';
    }

    stream.next();
    return null;
  },
  indent(state: CStyleParserState, textAfter: string, cx): number | null {
    const depth = state.braceDepth || 0;
    if (/^\s*\}/.test(textAfter)) {
      return Math.max(0, depth - 1) * cx.unit;
    }
    return depth * cx.unit;
  },
  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
    closeBrackets: { brackets: ['(', '[', '{', '"', "'"] },
    indentOnInput: /^\s*\}$/,
  },
});

// -------------------------------------------------------------
// 2. C / C++ Stream Language
// -------------------------------------------------------------
const CPP_KEYWORDS = new Set([
  'auto', 'break', 'case', 'catch', 'class', 'const', 'constexpr', 'const_cast',
  'continue', 'decltype', 'default', 'delete', 'do', 'dynamic_cast', 'else', 'enum',
  'explicit', 'export', 'extern', 'for', 'friend', 'goto', 'if', 'inline', 'mutable',
  'namespace', 'new', 'noexcept', 'operator', 'private', 'protected', 'public',
  'reinterpret_cast', 'return', 'sizeof', 'static', 'static_assert', 'static_cast',
  'struct', 'switch', 'template', 'this', 'thread_local', 'throw', 'try', 'typedef',
  'typeid', 'typename', 'union', 'using', 'virtual', 'volatile', 'while', 'concept',
  'requires', 'co_await', 'co_return', 'co_yield',
]);

const CPP_BUILTIN_TYPES = new Set([
  'void', 'bool', 'char', 'char8_t', 'char16_t', 'char32_t', 'wchar_t', 'short',
  'int', 'long', 'signed', 'unsigned', 'float', 'double', 'size_t', 'int8_t', 'int16_t',
  'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'string',
  'vector', 'map', 'set', 'unordered_map', 'unordered_set', 'pair', 'tuple',
  'shared_ptr', 'unique_ptr', 'weak_ptr', 'iostream', 'cout', 'cin', 'cerr', 'endl',
]);

export const cppLanguage = StreamLanguage.define<CStyleParserState>({
  name: 'cpp',
  startState: () => ({
    inBlockComment: false,
    inString: false,
    braceDepth: 0,
  }),
  token(stream: StringStream, state: CStyleParserState): string | null {
    if (state.inBlockComment) {
      if (stream.match(/.*?\*\//)) {
        state.inBlockComment = false;
        return 'blockComment';
      }
      stream.skipToEnd();
      return 'blockComment';
    }

    if (stream.eatSpace()) return null;

    // Preprocessor directive
    if (stream.match(/^#(?:include|define|ifdef|ifndef|endif|if|else|elif|pragma|undef|error)\b/)) {
      return 'meta';
    }

    // Line comment
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'lineComment';
    }

    // Block comment
    if (stream.match('/*')) {
      state.inBlockComment = true;
      if (stream.match(/.*?\*\//)) {
        state.inBlockComment = false;
      } else {
        stream.skipToEnd();
      }
      return 'blockComment';
    }

    // Strings & include angle paths
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) {
      return 'string';
    }
    if (stream.match(/^'(?:[^'\\]|\\.)*'/)) {
      return 'string';
    }

    // Numbers
    if (stream.match(/^0x[0-9a-fA-F]+/i) || stream.match(/^0b[01]+/i) || stream.match(/^\d+(\.\d+)?([eE][+-]?\d+)?[fFlLuU]*/)) {
      return 'number';
    }

    // Braces tracking
    if (stream.eat('{')) {
      state.braceDepth++;
      return 'bracket';
    }
    if (stream.eat('}')) {
      state.braceDepth = Math.max(0, state.braceDepth - 1);
      return 'bracket';
    }
    if (stream.match(/^[()[\]]/)) {
      return 'bracket';
    }

    // Operators
    if (stream.match(/^(?:[-+*/%&|^!=<>?~:;]|&&|\|\||<<|>>|::|->|\+\+|--|==|!=|<=|>=|\+=|-=|\*=|\/=|%=|&=|\|=|\^=)/)) {
      return 'operator';
    }

    const match = stream.match(/^[a-zA-Z_]\w*/);
    if (match) {
      const word = stream.current();
      if (CPP_KEYWORDS.has(word)) return 'keyword';
      if (word === 'true' || word === 'false' || word === 'nullptr' || word === 'NULL') return 'atom';
      if (CPP_BUILTIN_TYPES.has(word)) return 'typeName';
      if (/^[A-Z]/.test(word)) return 'className';
      return 'variableName';
    }

    stream.next();
    return null;
  },
  indent(state: CStyleParserState, textAfter: string, cx): number | null {
    const depth = state.braceDepth || 0;
    if (/^\s*\}/.test(textAfter)) {
      return Math.max(0, depth - 1) * cx.unit;
    }
    return depth * cx.unit;
  },
  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
    closeBrackets: { brackets: ['(', '[', '{', '"', "'", '<'] },
    indentOnInput: /^\s*\}$/,
  },
});

// -------------------------------------------------------------
// 3. C# Stream Language
// -------------------------------------------------------------
const CSHARP_KEYWORDS = new Set([
  'abstract', 'as', 'async', 'await', 'base', 'bool', 'break', 'byte', 'case', 'catch',
  'char', 'checked', 'class', 'const', 'continue', 'decimal', 'default', 'delegate',
  'do', 'double', 'else', 'enum', 'event', 'explicit', 'extern', 'false', 'finally',
  'fixed', 'float', 'for', 'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface',
  'internal', 'is', 'lock', 'long', 'namespace', 'new', 'null', 'object', 'operator',
  'out', 'override', 'params', 'private', 'protected', 'public', 'readonly', 'ref',
  'return', 'sbyte', 'sealed', 'short', 'sizeof', 'stackalloc', 'static', 'string',
  'struct', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'uint', 'ulong',
  'unchecked', 'unsafe', 'ushort', 'using', 'virtual', 'void', 'volatile', 'while',
  'record', 'init', 'var', 'yield',
]);

export const csharpLanguage = StreamLanguage.define<CStyleParserState>({
  name: 'csharp',
  startState: () => ({ inBlockComment: false, inString: false, braceDepth: 0 }),
  token(stream: StringStream, state: CStyleParserState): string | null {
    if (state.inBlockComment) {
      if (stream.match(/.*?\*\//)) {
        state.inBlockComment = false;
        return 'blockComment';
      }
      stream.skipToEnd();
      return 'blockComment';
    }
    if (stream.eatSpace()) return null;

    if (stream.match(/^#(?:region|endregion|if|else|elif|endif|nullable|pragma)\b/)) {
      return 'meta';
    }
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'lineComment';
    }
    if (stream.match('/*')) {
      state.inBlockComment = true;
      if (stream.match(/.*?\*\//)) state.inBlockComment = false;
      else stream.skipToEnd();
      return 'blockComment';
    }
    if (stream.match(/^@"[^"]*"/)) return 'string';
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) return 'string';
    if (stream.match(/^'(?:[^'\\]|\\.)*'/)) return 'string';
    if (stream.match(/^0x[0-9a-fA-F_]+/i) || stream.match(/^\d[\d_]*(\.[\d_]+)?([eE][+-]?\d+)?[fFdDmM]?/)) {
      return 'number';
    }
    if (stream.eat('{')) {
      state.braceDepth++;
      return 'bracket';
    }
    if (stream.eat('}')) {
      state.braceDepth = Math.max(0, state.braceDepth - 1);
      return 'bracket';
    }
    if (stream.match(/^[()[\]]/)) return 'bracket';
    if (stream.match(/^(?:[-+*/%&|^!=<>?~:;]|&&|\|\||\+\+|--|==|!=|<=|>=|\+=|-=|\*=|\/=|%=)/)) {
      return 'operator';
    }
    const match = stream.match(/^[a-zA-Z_]\w*/);
    if (match) {
      const word = stream.current();
      if (CSHARP_KEYWORDS.has(word)) return 'keyword';
      if (word === 'true' || word === 'false' || word === 'null') return 'atom';
      if (/^[A-Z]/.test(word)) return 'className';
      return 'variableName';
    }
    stream.next();
    return null;
  },
  indent(state: CStyleParserState, textAfter: string, cx): number | null {
    const depth = state.braceDepth || 0;
    if (/^\s*\}/.test(textAfter)) {
      return Math.max(0, depth - 1) * cx.unit;
    }
    return depth * cx.unit;
  },
  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
    closeBrackets: { brackets: ['(', '[', '{', '"', "'"] },
    indentOnInput: /^\s*\}$/,
  },
});

// -------------------------------------------------------------
// 4. Go Stream Language
// -------------------------------------------------------------
const GO_KEYWORDS = new Set([
  'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
  'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface',
  'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type', 'var',
]);

const GO_BUILTIN_TYPES = new Set([
  'bool', 'byte', 'complex64', 'complex128', 'error', 'float32', 'float64',
  'int', 'int8', 'int16', 'int32', 'int64', 'rune', 'string',
  'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr',
  'true', 'false', 'iota', 'nil', 'make', 'new', 'len', 'cap',
  'append', 'copy', 'close', 'delete', 'panic', 'recover', 'print', 'println',
]);

export const goLanguage = StreamLanguage.define<CStyleParserState>({
  name: 'go',
  startState: () => ({ inBlockComment: false, inString: false, braceDepth: 0 }),
  token(stream: StringStream, state: CStyleParserState): string | null {
    if (state.inBlockComment) {
      if (stream.match(/.*?\*\//)) {
        state.inBlockComment = false;
        return 'blockComment';
      }
      stream.skipToEnd();
      return 'blockComment';
    }
    if (stream.eatSpace()) return null;
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'lineComment';
    }
    if (stream.match('/*')) {
      state.inBlockComment = true;
      if (stream.match(/.*?\*\//)) state.inBlockComment = false;
      else stream.skipToEnd();
      return 'blockComment';
    }
    if (stream.match(/^`[^`]*`/)) return 'string';
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) return 'string';
    if (stream.match(/^'(?:[^'\\]|\\.)*'/)) return 'string';
    if (stream.match(/^0x[0-9a-fA-F_]+/i) || stream.match(/^\d+(\.\d+)?/)) return 'number';
    if (stream.eat('{')) {
      state.braceDepth++;
      return 'bracket';
    }
    if (stream.eat('}')) {
      state.braceDepth = Math.max(0, state.braceDepth - 1);
      return 'bracket';
    }
    if (stream.match(/^[()[\]]/)) return 'bracket';
    if (stream.match(/^(?:[-+*/%&|^!=<>?~:;]|:=|&&|\|\||<-|\+\+|--|==|!=|<=|>=|\+=|-=|\*=|\/=|%=)/)) {
      return 'operator';
    }
    const match = stream.match(/^[a-zA-Z_]\w*/);
    if (match) {
      const word = stream.current();
      if (GO_KEYWORDS.has(word)) return 'keyword';
      if (GO_BUILTIN_TYPES.has(word)) return 'typeName';
      if (/^[A-Z]/.test(word)) return 'className';
      return 'variableName';
    }
    stream.next();
    return null;
  },
  indent(state: CStyleParserState, textAfter: string, cx): number | null {
    const depth = state.braceDepth || 0;
    if (/^\s*\}/.test(textAfter)) {
      return Math.max(0, depth - 1) * cx.unit;
    }
    return depth * cx.unit;
  },
  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
    closeBrackets: { brackets: ['(', '[', '{', '"', "'", '`'] },
    indentOnInput: /^\s*\}$/,
  },
});

// -------------------------------------------------------------
// 5. SQL Stream Language
// -------------------------------------------------------------
const SQL_KEYWORDS = new Set([
  'select', 'from', 'where', 'insert', 'into', 'values', 'update', 'set', 'delete',
  'create', 'table', 'drop', 'alter', 'add', 'constraint', 'primary', 'key', 'foreign',
  'references', 'join', 'inner', 'left', 'right', 'full', 'outer', 'cross', 'on',
  'group', 'by', 'order', 'having', 'limit', 'offset', 'asc', 'desc', 'union', 'all',
  'distinct', 'as', 'and', 'or', 'not', 'in', 'between', 'like', 'is', 'null', 'case',
  'when', 'then', 'else', 'end', 'exists', 'count', 'sum', 'avg', 'min', 'max', 'cast',
  'coalesce', 'view', 'index', 'trigger', 'procedure', 'database', 'schema', 'with',
  'recursive', 'default', 'check', 'unique', 'cascade',
]);

export const sqlLanguage = StreamLanguage.define<{ inBlockComment: boolean }>({
  name: 'sql',
  startState: () => ({ inBlockComment: false }),
  token(stream: StringStream, state: { inBlockComment: boolean }): string | null {
    if (state.inBlockComment) {
      if (stream.match(/.*?\*\//)) {
        state.inBlockComment = false;
        return 'blockComment';
      }
      stream.skipToEnd();
      return 'blockComment';
    }
    if (stream.eatSpace()) return null;
    if (stream.match('--')) {
      stream.skipToEnd();
      return 'lineComment';
    }
    if (stream.match('/*')) {
      state.inBlockComment = true;
      if (stream.match(/.*?\*\//)) state.inBlockComment = false;
      else stream.skipToEnd();
      return 'blockComment';
    }
    if (stream.match(/^'(?:[^'\\]|\\.)*'/)) return 'string';
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) return 'string';
    if (stream.match(/^\d+(\.\d+)?/)) return 'number';
    if (stream.match(/^[(),;.]/)) return 'punctuation';
    if (stream.match(/^(?:[-+*/%=<>!]|<=|>=|!=|<>)/)) return 'operator';

    const match = stream.match(/^[a-zA-Z_]\w*/);
    if (match) {
      const word = stream.current().toLowerCase();
      if (SQL_KEYWORDS.has(word)) return 'keyword';
      return 'variableName';
    }
    stream.next();
    return null;
  },
  languageData: {
    commentTokens: { line: '--', block: { open: '/*', close: '*/' } },
  },
});

// -------------------------------------------------------------
// 6. YAML Stream Language
// -------------------------------------------------------------
export const yamlLanguage = StreamLanguage.define<{ inDoc: boolean }>({
  name: 'yaml',
  startState: () => ({ inDoc: true }),
  token(stream: StringStream): string | null {
    if (stream.eatSpace()) return null;
    if (stream.match(/^#.*/)) {
      return 'lineComment';
    }
    // YAML key
    if (stream.match(/^[\w\-]+(?=\s*:)/)) {
      return 'propertyName';
    }
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) return 'string';
    if (stream.match(/^'(?:[^'\\]|\\.)*'/)) return 'string';
    if (stream.match(/^(?:true|false|yes|no|on|off|null)\b/i)) return 'atom';
    if (stream.match(/^[-+]?\d+(\.\d+)?/)) return 'number';
    if (stream.match(/^[-:]/)) return 'operator';
    stream.next();
    return null;
  },
  languageData: {
    commentTokens: { line: '#' },
  },
});

// -------------------------------------------------------------
// 7. PHP Stream Language
// -------------------------------------------------------------
const PHP_KEYWORDS = new Set([
  'function', 'class', 'extends', 'implements', 'public', 'private', 'protected',
  'static', 'return', 'if', 'else', 'elseif', 'while', 'for', 'foreach', 'as',
  'switch', 'case', 'default', 'break', 'continue', 'new', 'try', 'catch', 'finally',
  'throw', 'namespace', 'use', 'echo', 'print', 'array', 'die', 'exit', 'var', 'const',
]);

export const phpLanguage = StreamLanguage.define<CStyleParserState>({
  name: 'php',
  startState: () => ({ inBlockComment: false, inString: false, braceDepth: 0 }),
  token(stream: StringStream, state: CStyleParserState): string | null {
    if (state.inBlockComment) {
      if (stream.match(/.*?\*\//)) {
        state.inBlockComment = false;
        return 'blockComment';
      }
      stream.skipToEnd();
      return 'blockComment';
    }
    if (stream.eatSpace()) return null;
    if (stream.match(/^<\?(?:php)?|\?>/)) return 'meta';
    if (stream.match('//') || stream.match('#')) {
      stream.skipToEnd();
      return 'lineComment';
    }
    if (stream.match('/*')) {
      state.inBlockComment = true;
      if (stream.match(/.*?\*\//)) state.inBlockComment = false;
      else stream.skipToEnd();
      return 'blockComment';
    }
    // PHP variables
    if (stream.match(/^\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/)) {
      return 'variableName';
    }
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) return 'string';
    if (stream.match(/^'(?:[^'\\]|\\.)*'/)) return 'string';
    if (stream.match(/^\d+(\.\d+)?/)) return 'number';
    if (stream.eat('{')) {
      state.braceDepth++;
      return 'bracket';
    }
    if (stream.eat('}')) {
      state.braceDepth = Math.max(0, state.braceDepth - 1);
      return 'bracket';
    }
    if (stream.match(/^[()[\]]/)) return 'bracket';
    if (stream.match(/^(?:[-+*/%&|^!=<>?~:;]|->|=>|::|\+\+|--|==|!=|<=|>=|\+=|-=|\*=|\/=|%=)/)) {
      return 'operator';
    }
    const match = stream.match(/^[a-zA-Z_]\w*/);
    if (match) {
      const word = stream.current().toLowerCase();
      if (PHP_KEYWORDS.has(word)) return 'keyword';
      if (word === 'true' || word === 'false' || word === 'null') return 'atom';
      return 'variableName';
    }
    stream.next();
    return null;
  },
  indent(state: CStyleParserState, textAfter: string, cx): number | null {
    const depth = state.braceDepth || 0;
    if (/^\s*\}/.test(textAfter)) {
      return Math.max(0, depth - 1) * cx.unit;
    }
    return depth * cx.unit;
  },
  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
    closeBrackets: { brackets: ['(', '[', '{', '"', "'"] },
    indentOnInput: /^\s*\}$/,
  },
});

// -------------------------------------------------------------
// 8. Shell / Bash Stream Language
// -------------------------------------------------------------
const SHELL_KEYWORDS = new Set([
  'if', 'then', 'else', 'elif', 'fi', 'case', 'esac', 'for', 'select', 'while',
  'until', 'do', 'done', 'in', 'function', 'time', 'export', 'source', 'alias',
  'echo', 'exit', 'return', 'set', 'unset', 'local', 'readonly',
]);

export const shellLanguage = StreamLanguage.define<{ inString: boolean }>({
  name: 'shell',
  startState: () => ({ inString: false }),
  token(stream: StringStream): string | null {
    if (stream.eatSpace()) return null;
    if (stream.match(/^#.*/)) return 'lineComment';
    if (stream.match(/^\$\w+|\$\{[^}]+\}/)) return 'variableName';
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) return 'string';
    if (stream.match(/^'(?:[^'\\]|\\.)*'/)) return 'string';
    if (stream.match(/^\d+/)) return 'number';
    if (stream.match(/^(?:[-+*/%=<>!&|]|&&|\|\||\|)/)) return 'operator';
    const match = stream.match(/^[a-zA-Z_][\w-]*/);
    if (match) {
      const word = stream.current();
      if (SHELL_KEYWORDS.has(word)) return 'keyword';
      return 'variableName';
    }
    stream.next();
    return null;
  },
  languageData: {
    commentTokens: { line: '#' },
  },
});

// -------------------------------------------------------------
// Language Extension Resolver
// -------------------------------------------------------------
export function getLanguageExtension(languageOrFilename?: string, fallbackFilename?: string): Extension {
  const target = (languageOrFilename || fallbackFilename || '').trim().toLowerCase();
  if (!target) return [];

  // Match by filename extension
  if (target.endsWith('.js') || target.endsWith('.mjs') || target.endsWith('.cjs')) {
    return javascript();
  }
  if (target.endsWith('.jsx')) {
    return javascript({ jsx: true });
  }
  if (target.endsWith('.ts') || target.endsWith('.mts') || target.endsWith('.cts')) {
    return javascript({ typescript: true });
  }
  if (target.endsWith('.tsx')) {
    return javascript({ jsx: true, typescript: true });
  }
  if (target.endsWith('.html') || target.endsWith('.htm') || target.endsWith('.xml') || target.endsWith('.svg')) {
    return html();
  }
  if (target.endsWith('.css') || target.endsWith('.scss') || target.endsWith('.less')) {
    return css();
  }
  if (target.endsWith('.json')) {
    return json();
  }
  if (target.endsWith('.md') || target.endsWith('.markdown')) {
    return markdown();
  }
  if (target.endsWith('.py')) {
    return python();
  }
  if (target.endsWith('.rs')) {
    return rust();
  }
  if (target.endsWith('.java')) {
    return javaLanguage;
  }
  if (target.endsWith('.c') || target.endsWith('.h')) {
    return cppLanguage;
  }
  if (target.endsWith('.cpp') || target.endsWith('.hpp') || target.endsWith('.cc') || target.endsWith('.cxx') || target.endsWith('.hh') || target.endsWith('.hxx')) {
    return cppLanguage;
  }
  if (target.endsWith('.cs')) {
    return csharpLanguage;
  }
  if (target.endsWith('.go')) {
    return goLanguage;
  }
  if (target.endsWith('.php') || target.endsWith('.phtml')) {
    return phpLanguage;
  }
  if (target.endsWith('.sql')) {
    return sqlLanguage;
  }
  if (target.endsWith('.yaml') || target.endsWith('.yml')) {
    return yamlLanguage;
  }
  if (target.endsWith('.sh') || target.endsWith('.bash') || target.endsWith('.zsh')) {
    return shellLanguage;
  }

  // Match by exact language identifier
  switch (target) {
    case 'javascript':
    case 'js':
      return javascript();
    case 'jsx':
      return javascript({ jsx: true });
    case 'typescript':
    case 'ts':
      return javascript({ typescript: true });
    case 'tsx':
      return javascript({ jsx: true, typescript: true });
    case 'html':
    case 'xml':
    case 'svg':
      return html();
    case 'css':
    case 'scss':
    case 'less':
      return css();
    case 'json':
      return json();
    case 'markdown':
    case 'md':
      return markdown();
    case 'python':
    case 'py':
      return python();
    case 'rust':
    case 'rs':
      return rust();
    case 'java':
      return javaLanguage;
    case 'c':
      return cppLanguage;
    case 'cpp':
    case 'c++':
      return cppLanguage;
    case 'csharp':
    case 'cs':
      return csharpLanguage;
    case 'go':
    case 'golang':
      return goLanguage;
    case 'php':
      return phpLanguage;
    case 'sql':
      return sqlLanguage;
    case 'yaml':
    case 'yml':
      return yamlLanguage;
    case 'shell':
    case 'bash':
    case 'sh':
      return shellLanguage;
    default:
      // If language identifier didn't match, try checking fallback filename if provided
      if (fallbackFilename && fallbackFilename.toLowerCase() !== target) {
        return getLanguageExtension(fallbackFilename);
      }
      return [];
  }
}

// -------------------------------------------------------------
// Language Name Detector for UI & Status Bar
// -------------------------------------------------------------
export function detectLanguageName(filenameOrLang?: string, fallbackLangId?: string): string {
  const target = (filenameOrLang || fallbackLangId || '').trim();
  if (!target) return 'Plain Text';

  const ext = target.includes('.') ? target.split('.').pop()?.toLowerCase() : target.toLowerCase();

  switch (ext) {
    case 'js':
    case 'mjs':
    case 'cjs':
    case 'javascript':
      return 'JavaScript';
    case 'ts':
    case 'mts':
    case 'cts':
    case 'typescript':
      return 'TypeScript';
    case 'jsx':
      return 'JavaScript (JSX)';
    case 'tsx':
      return 'TypeScript (TSX)';
    case 'html':
    case 'htm':
      return 'HTML';
    case 'xml':
    case 'svg':
      return 'XML';
    case 'css':
    case 'scss':
    case 'less':
      return 'CSS';
    case 'json':
      return 'JSON';
    case 'md':
    case 'markdown':
      return 'Markdown';
    case 'py':
    case 'python':
      return 'Python';
    case 'rs':
    case 'rust':
      return 'Rust';
    case 'java':
      return 'Java';
    case 'c':
      return 'C';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
    case 'hh':
    case 'hxx':
    case 'c++':
      return 'C++';
    case 'cs':
    case 'csharp':
      return 'C#';
    case 'go':
    case 'golang':
      return 'Go';
    case 'php':
    case 'phtml':
      return 'PHP';
    case 'sql':
      return 'SQL';
    case 'yaml':
    case 'yml':
      return 'YAML';
    case 'sh':
    case 'bash':
    case 'zsh':
    case 'shell':
      return 'Shell Script';
    default:
      if (fallbackLangId && fallbackLangId !== target) {
        return detectLanguageName(fallbackLangId);
      }
      return 'Plain Text';
  }
}
