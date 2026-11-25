import { KotlinSymbol } from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

const KOTLIN_KEYWORDS = [
  'package', 'import', 'fun', 'val', 'var', 'class', 'data class',
  'sealed class', 'abstract class', 'interface', 'object', 'companion object',
  'constructor', 'init', 'this', 'super', 'is', 'as', 'in', '!in', '!is',
  'when', 'if', 'else', 'try', 'catch', 'finally', 'throw', 'return',
  'break', 'continue', 'while', 'do', 'for', 'suspend', 'inline', 'noinline',
  'crossinline', 'reified', 'tailrec', 'operator', 'infix', 'external',
  'override', 'open', 'final', 'lateinit', 'by', 'lazy',
];

const KOTLIN_STDLIB = [
  'String', 'Int', 'Long', 'Double', 'Float', 'Boolean', 'Byte', 'Short', 'Char',
  'List', 'ArrayList', 'MutableList', 'Map', 'HashMap', 'MutableMap',
  'Set', 'HashSet', 'MutableSet', 'Array', 'Sequence', 'Pair', 'Triple',
  'let', 'also', 'apply', 'run', 'with', 'takeIf', 'takeUnless',
  'CoroutineScope', 'Dispatchers', 'launch', 'async', 'withContext',
  'Flow', 'flow', 'StateFlow', 'SharedFlow', 'collect', 'emit',
];

/**
 * Extracts Kotlin symbols (packages, functions, data classes, interfaces, objects, properties).
 */
export function parseKotlinSymbols(sourceCode: string): {
  package?: string;
  symbols: KotlinSymbol[];
} {
  if (!sourceCode || !sourceCode.trim()) {
    return { symbols: [] };
  }

  const lines = sourceCode.split(/\r?\n/);
  let pkg: string | undefined;
  const symbols: KotlinSymbol[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();
    const lineNum = idx + 1;

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    // Package: package com.example.app
    if (trimmed.startsWith('package ')) {
      pkg = trimmed.replace('package ', '').replace(/;$/, '').trim();
      continue;
    }

    // Function: [override ] [suspend ] fun name(...)
    const funMatch = trimmed.match(/(?:override\s+)?(?:(suspend)\s+)?fun\s+([a-zA-Z0-9_]+)\s*\(/);
    if (funMatch) {
      symbols.push({
        name: funMatch[2],
        kind: 'fun',
        package: pkg,
        isSuspend: Boolean(funMatch[1]),
        lineNumber: lineNum,
      });
      continue;
    }

    // Data class: data class UserDto(...)
    const dataClassMatch = trimmed.match(/data\s+class\s+([a-zA-Z0-9_]+)/);
    if (dataClassMatch) {
      symbols.push({
        name: dataClassMatch[1],
        kind: 'data class',
        package: pkg,
        lineNumber: lineNum,
      });
      continue;
    }

    // Regular class: [abstract | sealed | open ] class Name
    const classMatch = trimmed.match(/(?:abstract|sealed|open)?\s*class\s+([a-zA-Z0-9_]+)/);
    if (classMatch && !trimmed.includes('data class')) {
      symbols.push({
        name: classMatch[1],
        kind: 'class',
        package: pkg,
        lineNumber: lineNum,
      });
      continue;
    }

    // Interface: interface Name
    const ifaceMatch = trimmed.match(/interface\s+([a-zA-Z0-9_]+)/);
    if (ifaceMatch) {
      symbols.push({
        name: ifaceMatch[1],
        kind: 'interface',
        package: pkg,
        lineNumber: lineNum,
      });
      continue;
    }

    // Object: object Singleton or companion object
    const objMatch = trimmed.match(/(?:companion\s+)?object(?:\s+([a-zA-Z0-9_]+))?/);
    if (objMatch) {
      symbols.push({
        name: objMatch[1] || 'Companion',
        kind: 'object',
        package: pkg,
        lineNumber: lineNum,
      });
      continue;
    }

    // Property: val name: Type or var name: Type
    const propMatch = trimmed.match(/(val|var)\s+([a-zA-Z0-9_]+)\s*:/);
    if (propMatch) {
      symbols.push({
        name: propMatch[2],
        kind: propMatch[1] as 'val' | 'var',
        package: pkg,
        lineNumber: lineNum,
      });
    }
  }

  return {
    package: pkg,
    symbols,
  };
}

/**
 * Autocompletion for Kotlin keywords and stdlib.
 */
export function createKotlinCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z0-9_!]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const norm = word.text;
    const options: any[] = [];

    for (const kw of KOTLIN_KEYWORDS) {
      if (kw.startsWith(norm)) {
        options.push({
          label: kw,
          type: 'keyword',
          detail: 'Kotlin Keyword',
          boost: 3,
        });
      }
    }

    for (const std of KOTLIN_STDLIB) {
      if (std.startsWith(norm)) {
        options.push({
          label: std,
          type: 'variable',
          detail: 'Kotlin Standard Library',
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
