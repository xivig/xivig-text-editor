import { PhpIntelephenseSettings } from './types';

export const DEFAULT_PHP_INTELEPHENSE_SETTINGS: PhpIntelephenseSettings = {
  enabled: true,
  version: '1.12.5',
  diagnostics: true,
  typeInference: true,
  suggestDocblocks: true,
};

export interface PhpSymbolInfo {
  name: string;
  kind: 'class' | 'interface' | 'trait' | 'function' | 'method' | 'property' | 'constant';
  line: number;
  returnType?: string;
  visibility?: 'public' | 'protected' | 'private';
}

/**
 * Scans PHP symbols (classes, interfaces, traits, functions, methods) from source code.
 */
export function extractPhpSymbols(code: string): PhpSymbolInfo[] {
  if (!code) return [];

  const symbols: PhpSymbolInfo[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNum = i + 1;

    // Class / Interface / Trait
    const typeMatch = trimmed.match(/^(?:abstract\s+|final\s+)?(class|interface|trait|enum)\s+([a-zA-Z0-9_]+)/);
    if (typeMatch) {
      symbols.push({
        name: typeMatch[2],
        kind: typeMatch[1] as any,
        line: lineNum,
      });
      continue;
    }

    // Method with visibility: public function foo(): string
    const methodMatch = trimmed.match(/^(public|protected|private)(?:\s+static)?\s+function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)(?:\s*:\s*([?a-zA-Z0-9_|\\]+))?/);
    if (methodMatch) {
      symbols.push({
        name: methodMatch[2],
        kind: 'method',
        line: lineNum,
        visibility: methodMatch[1] as any,
        returnType: methodMatch[3],
      });
      continue;
    }

    // Top-level function
    const fnMatch = trimmed.match(/^function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)(?:\s*:\s*([?a-zA-Z0-9_|\\]+))?/);
    if (fnMatch) {
      symbols.push({
        name: fnMatch[1],
        kind: 'function',
        line: lineNum,
        returnType: fnMatch[2],
      });
    }
  }

  return symbols;
}
