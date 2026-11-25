import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { NpmPackageInfo, NpmIntellisenseSettings } from './types';

export const DEFAULT_NPM_INTELLISENSE_SETTINGS: NpmIntellisenseSettings = {
  enabled: true,
  scanDevDependencies: true,
  recursivePackageLookup: true,
  packageCacheTimeoutMs: 60000,
};

/**
 * Common popular packages and their standard export sub-paths.
 */
export const POPULAR_SUBPATHS: Record<string, string[]> = {
  react: ['react', 'react/jsx-runtime', 'react/compiler-runtime'],
  'react-dom': ['react-dom', 'react-dom/client', 'react-dom/server', 'react-dom/test-utils'],
  lodash: ['lodash', 'lodash/debounce', 'lodash/throttle', 'lodash/cloneDeep', 'lodash/get', 'lodash/set', 'lodash/merge'],
  zustand: ['zustand', 'zustand/middleware', 'zustand/shallow', 'zustand/vanilla'],
  '@codemirror/state': ['@codemirror/state'],
  '@codemirror/view': ['@codemirror/view'],
  '@codemirror/autocomplete': ['@codemirror/autocomplete'],
  '@codemirror/commands': ['@codemirror/commands'],
  '@codemirror/language': ['@codemirror/language'],
  '@codemirror/lint': ['@codemirror/lint'],
  '@codemirror/search': ['@codemirror/search'],
  'lucide-react': ['lucide-react'],
  dompurify: ['dompurify'],
  'js-beautify': ['js-beautify'],
  vitest: ['vitest', 'vitest/config'],
  chokidar: ['chokidar'],
};

/**
 * Extracts dependency package names from a package.json string.
 */
export function extractDependenciesFromPackageJson(
  packageJsonText: string,
  includeDev = true
): NpmPackageInfo[] {
  if (!packageJsonText.trim()) return [];

  try {
    const parsed = JSON.parse(packageJsonText);
    const packages: NpmPackageInfo[] = [];

    if (parsed.dependencies && typeof parsed.dependencies === 'object') {
      for (const [name, version] of Object.entries(parsed.dependencies)) {
        packages.push({
          name,
          version: String(version),
          isDev: false,
          subPaths: POPULAR_SUBPATHS[name] || [name],
        });
      }
    }

    if (includeDev && parsed.devDependencies && typeof parsed.devDependencies === 'object') {
      for (const [name, version] of Object.entries(parsed.devDependencies)) {
        if (!packages.some((p) => p.name === name)) {
          packages.push({
            name,
            version: String(version),
            isDev: true,
            subPaths: POPULAR_SUBPATHS[name] || [name],
          });
        }
      }
    }

    return packages;
  } catch {
    return [];
  }
}

export class NpmPackageCatalog {
  private packages = new Map<string, NpmPackageInfo>();

  constructor(initialPackages: NpmPackageInfo[] = []) {
    this.setPackages(initialPackages);
  }

  public setPackages(list: NpmPackageInfo[]): void {
    this.packages.clear();
    for (const p of list) {
      this.packages.set(p.name, p);
    }
  }

  public addPackage(p: NpmPackageInfo): void {
    this.packages.set(p.name, p);
  }

  public getPackages(): NpmPackageInfo[] {
    return Array.from(this.packages.values());
  }

  public search(query = ''): string[] {
    const norm = query.toLowerCase();
    const suggestions: string[] = [];

    for (const [name, p] of this.packages) {
      if (p.subPaths && p.subPaths.length > 0) {
        for (const sp of p.subPaths) {
          if (!norm || sp.toLowerCase().includes(norm)) {
            suggestions.push(sp);
          }
        }
      } else if (!norm || name.toLowerCase().includes(norm)) {
        suggestions.push(name);
      }
    }

    return suggestions;
  }
}

/**
 * Shared singleton package catalog initialized with popular npm packages.
 */
export const sharedNpmCatalog = new NpmPackageCatalog([
  { name: 'react', version: '^18.3.1', subPaths: POPULAR_SUBPATHS.react },
  { name: 'react-dom', version: '^18.3.1', subPaths: POPULAR_SUBPATHS['react-dom'] },
  { name: 'zustand', version: '^5.0.3', subPaths: POPULAR_SUBPATHS.zustand },
  { name: 'lodash', version: '^4.17.21', subPaths: POPULAR_SUBPATHS.lodash },
  { name: 'lucide-react', version: '^0.475.0', subPaths: POPULAR_SUBPATHS['lucide-react'] },
  { name: 'dompurify', version: '^3.2.4', subPaths: POPULAR_SUBPATHS.dompurify },
  { name: '@codemirror/state', version: '^6.5.2', subPaths: POPULAR_SUBPATHS['@codemirror/state'] },
  { name: '@codemirror/view', version: '^6.36.4', subPaths: POPULAR_SUBPATHS['@codemirror/view'] },
  { name: '@codemirror/autocomplete', version: '^6.18.4', subPaths: POPULAR_SUBPATHS['@codemirror/autocomplete'] },
  { name: 'vitest', version: '^3.0.5', subPaths: POPULAR_SUBPATHS.vitest },
]);

/**
 * CodeMirror 6 autocompletion source for npm package names in import/require statements.
 */
export function createNpmIntellisenseCompletionSource(catalog: NpmPackageCatalog = sharedNpmCatalog) {
  return (context: CompletionContext): CompletionResult | null => {
    const line = context.state.doc.lineAt(context.pos);
    const textBefore = line.text.slice(0, context.pos - line.from);

    // Detect: import ... from '...' OR require('...') OR import('...')
    const match = textBefore.match(/(?:from|require\s*\(|import\s*\()\s*['"]([^'"]*)$/);
    if (!match) return null;

    const token = match[1];
    const from = context.pos - token.length;

    // Do not suggest npm modules for relative paths (./ or ../)
    if (token.startsWith('.') || token.startsWith('/')) {
      return null;
    }

    const matches = catalog.search(token);
    if (matches.length === 0) return null;

    return {
      from,
      options: matches.slice(0, 30).map((name) => ({
        label: name,
        type: 'package',
        detail: 'npm',
        boost: 2,
      })),
    };
  };
}
