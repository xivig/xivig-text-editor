import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';

import {
  // JavaScript (ES6) Code Snippets
  getJsSnippets,
  searchJsSnippets,
  createJsSnippetsCompletionSource,
  jsSnippetsExtensionModule,

  // TypeScript Hero
  categorizeImportSource,
  parseImportStatement,
  organizeTypeScriptImports,
  extractTypeScriptExports,
  typeScriptHeroExtensionModule,

  // npm Intellisense
  extractDependenciesFromPackageJson,
  NpmPackageCatalog,
  createNpmIntellisenseCompletionSource,
  npmIntellisenseExtensionModule,

  // Import Cost
  calculateImportCost,
  formatCostBadge,
  parseImportsWithCost,
  importCostExtensionModule,

  // Turbo Console Log
  createTurboLogStatement,
  commentAllTurboLogs,
  uncommentAllTurboLogs,
  deleteAllTurboLogs,
  turboConsoleLogExtensionModule,

  // Jest
  isJestTestFile,
  parseJestTestCases,
  generateJestCommand,
  jestExtensionModule,

  // Vitest Explorer
  buildVitestTestTree,
  generateVitestCommand,
  parseVitestJsonReport,
  vitestExplorerExtensionModule,
} from '../extensions/builtin/javascript';

describe('Category 5: JavaScript / TypeScript Extensions', () => {
  // --------------------------------------------------------------------------
  // 1. JavaScript (ES6) Code Snippets
  // --------------------------------------------------------------------------
  describe('JavaScript (ES6) Code Snippets Extension', () => {
    it('retrieves and searches ES6 snippets catalog', () => {
      const snippets = getJsSnippets();
      expect(snippets.length).toBeGreaterThanOrEqual(15);

      const clg = searchJsSnippets('clg');
      expect(clg.length).toBe(1);
      expect(clg[0].template).toContain('console.log');

      const fn = searchJsSnippets('fn');
      expect(fn.some((s) => s.prefix === 'fn')).toBe(true);
      expect(fn.some((s) => s.prefix === 'afn')).toBe(true);
    });

    it('provides CodeMirror autocompletions for ES6 snippet triggers', () => {
      const source = createJsSnippetsCompletionSource();
      const doc = 'clg';
      const state = EditorState.create({ doc });
      const ctx = new CompletionContext(state, 3, false);
      const res = source(ctx);

      expect(res).not.toBeNull();
      expect(res?.options.some((o) => o.label === 'clg')).toBe(true);
    });

    it('returns snippets for JS and TS files via module getSnippets', () => {
      const jsSnippets = jsSnippetsExtensionModule.getSnippets?.('typescript');
      expect(jsSnippets).toBeDefined();
      expect(jsSnippets?.length).toBeGreaterThanOrEqual(15);
      expect(jsSnippets?.some((s) => s.label === 'trycatch')).toBe(true);
    });

    it('manifests with proper metadata', () => {
      expect(jsSnippetsExtensionModule.manifest.id).toBe('xivig.js-snippets');
      expect(jsSnippetsExtensionModule.manifest.categories).toContain('Languages');
    });
  });

  // --------------------------------------------------------------------------
  // 2. TypeScript Hero
  // --------------------------------------------------------------------------
  describe('TypeScript Hero Extension', () => {
    it('categorizes import sources into standard 4 tiers', () => {
      expect(categorizeImportSource('node:fs')).toBe(1);
      expect(categorizeImportSource('path')).toBe(1);
      expect(categorizeImportSource('react')).toBe(2);
      expect(categorizeImportSource('@codemirror/state')).toBe(2);
      expect(categorizeImportSource('@/components/Button')).toBe(3);
      expect(categorizeImportSource('~/stores/editorStore')).toBe(3);
      expect(categorizeImportSource('./utils')).toBe(4);
      expect(categorizeImportSource('../types')).toBe(4);
    });

    it('parses import statements and sorts specifiers alphabetically', () => {
      const parsed = parseImportStatement("import { useState, useEffect, useCallback } from 'react';");
      expect(parsed).not.toBeNull();
      expect(parsed?.source).toBe('react');
      expect(parsed?.specifiers).toEqual(['useCallback', 'useEffect', 'useState']);
      expect(parsed?.tier).toBe(2);
    });

    it('organizes, groups, and sorts imports according to standard conventions', () => {
      const unorganized = `
import { B, A } from './local';
import React, { useState } from 'react';
import * as path from 'path';
import { useStore } from '@/stores/app';

export function run() {
  return true;
}
      `.trim();

      const organized = organizeTypeScriptImports(unorganized);

      // Node built-in first
      expect(organized.indexOf("from 'path'")).toBeLessThan(organized.indexOf("from 'react'"));
      // External npm second
      expect(organized.indexOf("from 'react'")).toBeLessThan(organized.indexOf("from '@/stores/app'"));
      // Internal alias third
      expect(organized.indexOf("from '@/stores/app'")).toBeLessThan(organized.indexOf("from './local'"));
      // Specifiers inside ./local sorted (A, B)
      expect(organized).toContain('{ A, B }');
      // Preserves function code
      expect(organized).toContain('export function run()');
    });

    it('extracts exported symbols for TypeScript export outlines', () => {
      const tsCode = `
export interface UserConfig {
  id: string;
}
export class UserManager {
  start() {}
}
export function getUser(): UserConfig {
  return { id: '1' };
}
export const DEFAULT_TIMEOUT = 5000;
export type UserId = string;
export enum Status { Active, Inactive }
export default function main() {}
      `.trim();

      const symbols = extractTypeScriptExports(tsCode);
      expect(symbols.some((s) => s.name === 'UserConfig' && s.kind === 'interface')).toBe(true);
      expect(symbols.some((s) => s.name === 'UserManager' && s.kind === 'class')).toBe(true);
      expect(symbols.some((s) => s.name === 'getUser' && s.kind === 'function')).toBe(true);
      expect(symbols.some((s) => s.name === 'DEFAULT_TIMEOUT' && s.kind === 'variable')).toBe(true);
      expect(symbols.some((s) => s.name === 'UserId' && s.kind === 'type')).toBe(true);
      expect(symbols.some((s) => s.name === 'Status' && s.kind === 'enum')).toBe(true);
      expect(symbols.some((s) => s.isDefault)).toBe(true);
    });

    it('manifests with proper metadata', () => {
      expect(typeScriptHeroExtensionModule.manifest.id).toBe('xivig.typescript-hero');
    });
  });

  // --------------------------------------------------------------------------
  // 3. npm Intellisense
  // --------------------------------------------------------------------------
  describe('npm Intellisense Extension', () => {
    it('extracts packages from package.json dependencies and devDependencies', () => {
      const pkgJson = JSON.stringify({
        dependencies: {
          react: '^18.3.1',
          zustand: '^5.0.3',
        },
        devDependencies: {
          vitest: '^3.0.5',
          typescript: '^5.7.3',
        },
      });

      const packages = extractDependenciesFromPackageJson(pkgJson, true);
      expect(packages.length).toBe(4);
      expect(packages.some((p) => p.name === 'react')).toBe(true);
      expect(packages.some((p) => p.name === 'vitest' && p.isDev)).toBe(true);
    });

    it('searches package catalog and resolves sub-paths', () => {
      const catalog = new NpmPackageCatalog([
        { name: 'lodash', subPaths: ['lodash', 'lodash/debounce', 'lodash/throttle'] },
        { name: 'react', subPaths: ['react', 'react/jsx-runtime'] },
      ]);

      const debounce = catalog.search('deb');
      expect(debounce).toContain('lodash/debounce');

      const react = catalog.search('react');
      expect(react).toContain('react');
      expect(react).toContain('react/jsx-runtime');
    });

    it('provides CodeMirror completion source inside import from quotes', () => {
      const catalog = new NpmPackageCatalog([
        { name: 'axios' },
        { name: 'zustand' },
      ]);
      const source = createNpmIntellisenseCompletionSource(catalog);

      // 1. Inside import from
      const doc = "import axios from 'ax";
      const state = EditorState.create({ doc });
      const ctx = new CompletionContext(state, doc.length, false);
      const res = source(ctx);

      expect(res).not.toBeNull();
      expect(res?.options.some((o) => o.label === 'axios')).toBe(true);

      // 2. Relative path should not suggest npm packages
      const relDoc = "import { something } from './ax";
      const relState = EditorState.create({ doc: relDoc });
      const relCtx = new CompletionContext(relState, relDoc.length, false);
      expect(source(relCtx)).toBeNull();
    });

    it('manifests with proper metadata', () => {
      expect(npmIntellisenseExtensionModule.manifest.id).toBe('xivig.npm-intellisense');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Import Cost
  // --------------------------------------------------------------------------
  describe('Import Cost Extension', () => {
    it('calculates bundle and gzip sizes for known popular packages', () => {
      const reactCost = calculateImportCost('react');
      expect(reactCost.sizeBytes).toBeGreaterThan(5000);
      expect(reactCost.gzipBytes).toBeGreaterThan(2000);
      expect(reactCost.category).toBe('small');

      const reactDomCost = calculateImportCost('react-dom');
      expect(reactDomCost.category).toBe('large'); // >= 50 kB

      const zustandCost = calculateImportCost('zustand');
      expect(zustandCost.category).toBe('small');
    });

    it('formats import cost badge strings cleanly', () => {
      const cost = calculateImportCost('react');
      const badge = formatCostBadge(cost, true);
      expect(badge).toContain('gzip:');
    });

    it('parses import declarations across a document and extracts costs with line numbers', () => {
      const code = `
import React from 'react';
import ReactDOM from 'react-dom';
import './styles.css';
const lodash = require('lodash');
      `.trim();

      const results = parseImportsWithCost(code);
      expect(results.length).toBe(3); // react, react-dom, lodash (styles.css is ignored)
      expect(results[0].cost.packageName).toBe('react');
      expect(results[0].line).toBe(1);
      expect(results[1].cost.packageName).toBe('react-dom');
      expect(results[2].cost.packageName).toBe('lodash');
    });

    it('manifests with proper metadata', () => {
      expect(importCostExtensionModule.manifest.id).toBe('xivig.import-cost');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Turbo Console Log
  // --------------------------------------------------------------------------
  describe('Turbo Console Log Extension', () => {
    it('creates formatted log statements with file, line, and variable name', () => {
      const logStmt = createTurboLogStatement('selectedUser', 'UserList.tsx', 42);
      expect(logStmt).toBe("console.log('🚀 ~ file: UserList.tsx:42 ~ selectedUser:', selectedUser);");
    });

    it('comments out all turbo console logs across code', () => {
      const code = `
function update(item) {
  console.log('🚀 ~ file: test.ts:2 ~ item:', item);
  doWork(item);
}
      `.trim();

      const commented = commentAllTurboLogs(code);
      expect(commented).toContain("// console.log('🚀 ~ file: test.ts:2 ~ item:', item);");

      const uncommented = uncommentAllTurboLogs(commented);
      expect(uncommented).not.toContain('// console.log');
      expect(uncommented).toContain("console.log('🚀");
    });

    it('deletes all turbo console logs from a file', () => {
      const code = `
function calculate(val) {
  console.log('🚀 ~ file: math.ts:2 ~ val:', val);
  return val * 2;
}
      `.trim();

      const cleaned = deleteAllTurboLogs(code);
      expect(cleaned).not.toContain('console.log');
      expect(cleaned).toContain('return val * 2;');
    });

    it('manifests with proper metadata', () => {
      expect(turboConsoleLogExtensionModule.manifest.id).toBe('xivig.turbo-console-log');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Jest
  // --------------------------------------------------------------------------
  describe('Jest Extension', () => {
    it('identifies test files by naming convention and directory', () => {
      expect(isJestTestFile('src/utils/math.test.ts')).toBe(true);
      expect(isJestTestFile('src/components/Button.spec.jsx')).toBe(true);
      expect(isJestTestFile('src/__tests__/app.ts')).toBe(true);
      expect(isJestTestFile('src/utils/math.ts')).toBe(false);
    });

    it('parses describe, it, and test blocks with skip and only modifiers', () => {
      const testCode = `
describe('Auth Service', () => {
  it('logs in user successfully', () => {});
  it.skip('handles timeout', () => {});
  test.only('refreshes token', () => {});
});
      `.trim();

      const cases = parseJestTestCases(testCode);
      expect(cases.length).toBe(4);
      expect(cases[0].type).toBe('describe');
      expect(cases[0].name).toBe('Auth Service');

      const skipped = cases.find((c) => c.name === 'handles timeout');
      expect(skipped?.skipped).toBe(true);

      const only = cases.find((c) => c.name === 'refreshes token');
      expect(only?.only).toBe(true);
    });

    it('generates CLI runner command arguments for single tests and files', () => {
      const cmd = generateJestCommand({
        filePath: 'src/auth.test.ts',
        testNamePattern: 'logs in user',
        coverage: true,
        updateSnapshots: true,
      });

      expect(cmd).toContain('npx jest');
      expect(cmd).toContain('"src/auth.test.ts"');
      expect(cmd).toContain('-t "logs in user"');
      expect(cmd).toContain('--coverage');
      expect(cmd).toContain('-u');
    });

    it('manifests with proper metadata', () => {
      expect(jestExtensionModule.manifest.id).toBe('xivig.jest');
    });
  });

  // --------------------------------------------------------------------------
  // 7. Vitest Explorer
  // --------------------------------------------------------------------------
  describe('Vitest Explorer Extension', () => {
    it('builds a hierarchical test suite tree from test file contents', () => {
      const testCode = `
describe('Parser', () => {
  it('parses tokens', () => {});
  it('reports syntax error', () => {});
});
test('top-level assertion', () => {});
      `.trim();

      const tree = buildVitestTestTree('src/parser.test.ts', testCode);
      expect(tree.type).toBe('file');
      expect(tree.name).toBe('parser.test.ts');
      expect(tree.children?.length).toBe(2); // 1 suite, 1 top-level test

      const suite = tree.children?.find((c) => c.type === 'suite');
      expect(suite?.name).toBe('Parser');
      expect(suite?.children?.length).toBe(2);
    });

    it('generates Vitest shell run and watch commands', () => {
      const runCmd = generateVitestCommand({
        filePath: 'src/app.test.ts',
        testPattern: 'renders main header',
        runMode: 'run',
      });
      expect(runCmd).toBe('npx vitest run "src/app.test.ts" -t "renders main header"');

      const watchCmd = generateVitestCommand({ runMode: 'watch' });
      expect(watchCmd).toBe('npx vitest watch');
    });

    it('parses Vitest JSON test execution reports', () => {
      const mockReport = JSON.stringify({
        numTotalTests: 45,
        numPassedTests: 43,
        numFailedTests: 2,
        numPendingTests: 0,
        startTime: Date.now() - 3200,
      });

      const summary = parseVitestJsonReport(mockReport);
      expect(summary.total).toBe(45);
      expect(summary.passed).toBe(43);
      expect(summary.failed).toBe(2);
      expect(summary.success).toBe(false);
      expect(summary.durationMs).toBeGreaterThan(0);
    });

    it('manifests with proper metadata', () => {
      expect(vitestExplorerExtensionModule.manifest.id).toBe('xivig.vitest-explorer');
    });
  });
});
