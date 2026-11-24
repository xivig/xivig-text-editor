import { CodeiumSettings } from './types';

export const DEFAULT_CODEIUM_SETTINGS: CodeiumSettings = {
  enabled: true,
  enableDocstringGen: true,
  maxSuggestions: 3,
  fastMode: true,
};

// Response cache for Codeium autocompletions
const completionCache = new Map<string, string[]>();

export function getCachedSuggestions(cacheKey: string): string[] | null {
  return completionCache.get(cacheKey) || null;
}

export function setCachedSuggestions(cacheKey: string, suggestions: string[]): void {
  if (completionCache.size > 200) {
    const firstKey = completionCache.keys().next().value;
    if (firstKey) completionCache.delete(firstKey);
  }
  completionCache.set(cacheKey, suggestions);
}

export function clearCodeiumCache(): void {
  completionCache.clear();
}

/**
 * Generates docstring comments based on language conventions.
 */
export function generateDocstring(
  functionSignature: string,
  language = 'typescript'
): string {
  const lang = language.toLowerCase();

  // Extract function name and arguments
  const fnMatch = /(?:function|def|fn)\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/.exec(functionSignature);
  const fnName = fnMatch ? fnMatch[1] : 'function';
  const params = fnMatch && fnMatch[2] ? fnMatch[2].split(',').map((p) => p.trim().split(/[:= ]/)[0]).filter(Boolean) : [];

  if (lang.includes('python')) {
    const paramLines = params.map((p) => `    :param ${p}: Description of ${p}`).join('\n');
    return `"""\n${fnName} implementation.\n\n${paramLines ? `${paramLines}\n` : ''}    :return: Result\n"""`;
  }

  // JSDoc / PHPDoc standard
  const paramDocs = params.map((p) => ` * @param ${p} Parameter description`).join('\n');
  return `/**\n * ${fnName} description.\n${paramDocs ? `${paramDocs}\n` : ''} * @returns {any} Result description\n */`;
}
