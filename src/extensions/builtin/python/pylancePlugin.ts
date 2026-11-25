import { PylanceSettings } from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export const DEFAULT_PYLANCE_SETTINGS: PylanceSettings = {
  enabled: true,
  typeCheckingMode: 'basic',
  autoImportCompletions: true,
  diagnosticMode: 'openFilesOnly',
};

const PYTHON_KEYWORDS = [
  'def', 'class', 'async def', 'await', 'return', 'yield',
  'import', 'from', 'as', 'try', 'except', 'finally', 'raise',
  'if', 'elif', 'else', 'for', 'while', 'break', 'continue',
  'with', 'lambda', 'pass', 'global', 'nonlocal', 'assert',
  'match', 'case', 'True', 'False', 'None',
];

const PYTHON_BUILTINS = [
  'int', 'str', 'float', 'bool', 'list', 'dict', 'set', 'tuple',
  'bytes', 'bytearray', 'range', 'enumerate', 'zip', 'len',
  'min', 'max', 'sum', 'sorted', 'reversed', 'filter', 'map',
  'any', 'all', 'open', 'print', 'input', 'isinstance', 'issubclass',
  'super', 'property', 'classmethod', 'staticmethod',
];

const PYTHON_TYPING = [
  'Optional', 'Union', 'List', 'Dict', 'Set', 'Tuple', 'Any',
  'Callable', 'Iterable', 'Iterator', 'Generator', 'TypeVar',
  'Literal', 'Protocol', 'TypedDict', 'Final', 'Annotated',
];

/**
 * Extracts top-level classes, functions, and annotated variables.
 */
export function extractPythonSymbols(
  code: string
): Array<{ name: string; kind: 'class' | 'function' | 'variable'; line: number; typeAnnotation?: string }> {
  if (!code || !code.trim()) return [];

  const symbols: Array<{ name: string; kind: 'class' | 'function' | 'variable'; line: number; typeAnnotation?: string }> = [];
  const lines = code.split(/\r?\n/);

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const lineNum = idx + 1;

    // Class definition: class MyClass(Base):
    const classMatch = line.match(/^class\s+([a-zA-Z0-9_]+)/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        kind: 'class',
        line: lineNum,
      });
      continue;
    }

    // Function definition: def my_func(a, b) -> int:
    const funcMatch = line.match(/^(?:async\s+)?def\s+([a-zA-Z0-9_]+)\s*\([^)]*\)(?:\s*->\s*([a-zA-Z0-9_\[\], ]+))?:/);
    if (funcMatch) {
      symbols.push({
        name: funcMatch[1],
        kind: 'function',
        line: lineNum,
        typeAnnotation: funcMatch[2]?.trim(),
      });
      continue;
    }

    // Annotated variable: count: int = 0
    const varMatch = line.match(/^([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_\[\], ]+)\s*=/);
    if (varMatch) {
      symbols.push({
        name: varMatch[1],
        kind: 'variable',
        line: lineNum,
        typeAnnotation: varMatch[2].trim(),
      });
    }
  }

  return symbols;
}

/**
 * Extracts docstrings associated with a specific symbol.
 */
export function extractDocstrings(code: string, symbolName: string): string | null {
  if (!code || !symbolName) return null;

  const lines = code.split(/\r?\n/);
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (new RegExp(`^(?:class|(?:async\\s+)?def)\\s+${symbolName}\\b`).test(line)) {
      // Look at following lines for """ or '''
      for (let j = idx + 1; j < Math.min(idx + 10, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine.startsWith('"""') || nextLine.startsWith("'''")) {
          const quote = nextLine.slice(0, 3);
          const remainder = nextLine.slice(3);
          if (remainder.includes(quote)) {
            return remainder.split(quote)[0].trim();
          }

          const docLines: string[] = [remainder];
          for (let k = j + 1; k < lines.length; k++) {
            if (lines[k].includes(quote)) {
              docLines.push(lines[k].split(quote)[0]);
              return docLines.join('\n').trim();
            }
            docLines.push(lines[k]);
          }
        }
      }
    }
  }

  return null;
}

/**
 * Builds an auto-import statement.
 */
export function buildAutoImport(module: string, symbol?: string): string {
  if (symbol) {
    return `from ${module} import ${symbol}`;
  }
  return `import ${module}`;
}

/**
 * Autocompletion source for Python keywords, builtins, and typing constructs.
 */
export function createPythonCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z0-9_]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const norm = word.text;
    const options: any[] = [];

    for (const kw of PYTHON_KEYWORDS) {
      if (kw.startsWith(norm)) {
        options.push({
          label: kw,
          type: 'keyword',
          detail: 'Python Keyword',
          boost: 4,
        });
      }
    }

    for (const bi of PYTHON_BUILTINS) {
      if (bi.startsWith(norm)) {
        options.push({
          label: bi,
          type: 'function',
          detail: 'Python Built-in',
          boost: 3,
        });
      }
    }

    for (const ty of PYTHON_TYPING) {
      if (ty.startsWith(norm)) {
        options.push({
          label: ty,
          type: 'type',
          detail: 'typing module',
          boost: 2,
        });
      }
    }

    if (options.length === 0) return null;

    return {
      from: word.from,
      options,
    };
  };
}
