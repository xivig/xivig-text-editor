import { TypeScriptHeroSettings, TypeScriptExportSymbol } from './types';

export const DEFAULT_TYPESCRIPT_HERO_SETTINGS: TypeScriptHeroSettings = {
  enabled: true,
  groupImports: true,
  sortSpecifiers: true,
  removeUnusedSpecifiers: true,
  quoteStyle: 'single',
  semi: true,
};

const NODE_BUILTINS = new Set([
  'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console',
  'constants', 'crypto', 'dgram', 'diagnostics_channel', 'dns', 'domain',
  'events', 'fs', 'fs/promises', 'http', 'http2', 'https', 'inspector',
  'module', 'net', 'os', 'path', 'perf_hooks', 'process', 'punycode',
  'querystring', 'readline', 'repl', 'stream', 'string_decoder', 'timers',
  'tls', 'trace_events', 'tty', 'url', 'util', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib',
]);

export interface ParsedImport {
  raw: string;
  defaultImport?: string;
  namespaceImport?: string;
  specifiers: string[];
  source: string;
  isTypeOnly: boolean;
  tier: number; // 1: node builtin, 2: external npm, 3: alias (@/ or ~/), 4: relative
}

/**
 * Categorizes an import source module into standard 4 tiers:
 * Tier 1: Builtin Node modules (e.g. node:fs, path)
 * Tier 2: Third-party npm packages (e.g. react, zustand, @codemirror/state)
 * Tier 3: Workspace aliases (e.g. @/components/Button)
 * Tier 4: Relative path imports (e.g. ./utils, ../types)
 */
export function categorizeImportSource(source: string): number {
  const clean = source.replace(/['"]/g, '').trim();

  if (clean.startsWith('node:') || NODE_BUILTINS.has(clean)) {
    return 1;
  }
  if (clean.startsWith('@/') || clean.startsWith('~/')) {
    return 3;
  }
  if (clean.startsWith('./') || clean.startsWith('../') || clean === '.' || clean === '..') {
    return 4;
  }
  return 2;
}

/**
 * Parses individual import lines and cleans/sorts their specifiers.
 */
export function parseImportStatement(line: string): ParsedImport | null {
  const trimmed = line.trim();
  const importRegex = /^import(?:\s+type)?\s+(?:([\w$]+)\s*,\s*)?(?:(\*\s+as\s+[\w$]+)|(?:\{([^}]*)\}))?\s*(?:from\s*)?['"]([^'"]+)['"]\s*;?$/;
  const match = trimmed.match(importRegex);

  if (!match) {
    // Check side-effect import: import 'styles.css';
    const sideEffectRegex = /^import\s+['"]([^'"]+)['"]\s*;?$/;
    const sideMatch = trimmed.match(sideEffectRegex);
    if (sideMatch) {
      const source = sideMatch[1];
      return {
        raw: trimmed,
        specifiers: [],
        source,
        isTypeOnly: false,
        tier: categorizeImportSource(source),
      };
    }
    return null;
  }

  const isTypeOnly = /^import\s+type\b/.test(trimmed);
  const defaultImport = match[1]?.trim();
  const namespaceImport = match[2]?.trim();
  const rawSpecifiers = match[3];
  const source = match[4]?.trim() || '';

  const specifiers: string[] = [];
  if (rawSpecifiers) {
    const rawTokens = rawSpecifiers.split(',').map((s) => s.trim()).filter(Boolean);
    const uniqueTokens = Array.from(new Set(rawTokens));
    uniqueTokens.sort((a, b) => a.localeCompare(b));
    specifiers.push(...uniqueTokens);
  }

  return {
    raw: trimmed,
    defaultImport,
    namespaceImport,
    specifiers,
    source,
    isTypeOnly,
    tier: categorizeImportSource(source),
  };
}

/**
 * Organizes, groups, deduplicates, and sorts TypeScript & JavaScript imports.
 */
export function organizeTypeScriptImports(
  code: string,
  settings: TypeScriptHeroSettings = DEFAULT_TYPESCRIPT_HERO_SETTINGS
): string {
  if (!settings.enabled || !code.trim()) {
    return code;
  }

  const lines = code.split('\n');
  const importLines: string[] = [];
  const nonImportLines: string[] = [];
  let inImportsHeader = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (inImportsHeader) {
      if (trimmed.startsWith('import ') || trimmed.startsWith('import\t') || trimmed === 'import') {
        // Collect full statement if multiline
        let fullImport = line;
        while (!fullImport.includes(';') && !/['"][^'"]+['"]\s*$/.test(fullImport.trim()) && i + 1 < lines.length) {
          i++;
          fullImport += ' ' + lines[i].trim();
        }
        importLines.push(fullImport.trim());
      } else if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        // Comments/blank lines between imports can be skipped in header
        if (importLines.length === 0) {
          nonImportLines.push(line);
        }
      } else {
        inImportsHeader = false;
        nonImportLines.push(line);
      }
    } else {
      nonImportLines.push(line);
    }
  }

  if (importLines.length === 0) {
    return code;
  }

  const quote = settings.quoteStyle === 'double' ? '"' : "'";
  const semi = settings.semi ? ';' : '';

  const parsedImports: ParsedImport[] = [];
  for (const raw of importLines) {
    const parsed = parseImportStatement(raw);
    if (parsed) {
      parsedImports.push(parsed);
    } else {
      // Fallback
      parsedImports.push({
        raw,
        specifiers: [],
        source: raw,
        isTypeOnly: false,
        tier: 2,
      });
    }
  }

  // Group by tier
  const tier1: ParsedImport[] = [];
  const tier2: ParsedImport[] = [];
  const tier3: ParsedImport[] = [];
  const tier4: ParsedImport[] = [];

  for (const item of parsedImports) {
    if (item.tier === 1) tier1.push(item);
    else if (item.tier === 2) tier2.push(item);
    else if (item.tier === 3) tier3.push(item);
    else tier4.push(item);
  }

  const sortGroup = (group: ParsedImport[]) => {
    group.sort((a, b) => a.source.localeCompare(b.source));
  };

  sortGroup(tier1);
  sortGroup(tier2);
  sortGroup(tier3);
  sortGroup(tier4);

  const formatImport = (p: ParsedImport): string => {
    if (!p.source) return p.raw;
    const typePrefix = p.isTypeOnly ? 'type ' : '';

    if (p.defaultImport && p.specifiers.length > 0) {
      return `import ${typePrefix}${p.defaultImport}, { ${p.specifiers.join(', ')} } from ${quote}${p.source}${quote}${semi}`;
    }
    if (p.defaultImport) {
      return `import ${typePrefix}${p.defaultImport} from ${quote}${p.source}${quote}${semi}`;
    }
    if (p.namespaceImport) {
      return `import ${typePrefix}${p.namespaceImport} from ${quote}${p.source}${quote}${semi}`;
    }
    if (p.specifiers.length > 0) {
      return `import ${typePrefix}{ ${p.specifiers.join(', ')} } from ${quote}${p.source}${quote}${semi}`;
    }
    // Side effect
    return `import ${quote}${p.source}${quote}${semi}`;
  };

  const formattedGroups: string[] = [];
  if (tier1.length > 0) formattedGroups.push(tier1.map(formatImport).join('\n'));
  if (tier2.length > 0) formattedGroups.push(tier2.map(formatImport).join('\n'));
  if (tier3.length > 0) formattedGroups.push(tier3.map(formatImport).join('\n'));
  if (tier4.length > 0) formattedGroups.push(tier4.map(formatImport).join('\n'));

  const organizedImportsHeader = formattedGroups.join('\n\n');
  const restOfCode = nonImportLines.join('\n').replace(/^\n+/, '');

  return restOfCode ? `${organizedImportsHeader}\n\n${restOfCode}` : organizedImportsHeader;
}

/**
 * Extracts exported functions, classes, interfaces, types, and variables from TypeScript/JavaScript code.
 */
export function extractTypeScriptExports(code: string): TypeScriptExportSymbol[] {
  if (!code) return [];

  const symbols: TypeScriptExportSymbol[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNum = i + 1;

    // export default
    if (/^export\s+default\s+/.test(trimmed)) {
      const match = trimmed.match(/^export\s+default\s+(?:(?:function|class)\s+)?([a-zA-Z0-9_$]+)?/);
      symbols.push({
        name: match?.[1] || 'default',
        kind: trimmed.includes('class') ? 'class' : 'function',
        line: lineNum,
        isDefault: true,
      });
      continue;
    }

    // export function
    const fnMatch = trimmed.match(/^export\s+(?:async\s+)?function\s+([a-zA-Z0-9_$]+)/);
    if (fnMatch) {
      symbols.push({ name: fnMatch[1], kind: 'function', line: lineNum });
      continue;
    }

    // export class / abstract class
    const classMatch = trimmed.match(/^export\s+(?:abstract\s+)?class\s+([a-zA-Z0-9_$]+)/);
    if (classMatch) {
      symbols.push({ name: classMatch[1], kind: 'class', line: lineNum });
      continue;
    }

    // export interface
    const intfMatch = trimmed.match(/^export\s+interface\s+([a-zA-Z0-9_$]+)/);
    if (intfMatch) {
      symbols.push({ name: intfMatch[1], kind: 'interface', line: lineNum });
      continue;
    }

    // export type
    const typeMatch = trimmed.match(/^export\s+type\s+([a-zA-Z0-9_$]+)/);
    if (typeMatch) {
      symbols.push({ name: typeMatch[1], kind: 'type', line: lineNum });
      continue;
    }

    // export enum
    const enumMatch = trimmed.match(/^export\s+enum\s+([a-zA-Z0-9_$]+)/);
    if (enumMatch) {
      symbols.push({ name: enumMatch[1], kind: 'enum', line: lineNum });
      continue;
    }

    // export const / let / var
    const varMatch = trimmed.match(/^export\s+(?:const|let|var)\s+([a-zA-Z0-9_$]+)/);
    if (varMatch) {
      symbols.push({ name: varMatch[1], kind: 'variable', line: lineNum });
      continue;
    }
  }

  return symbols;
}
