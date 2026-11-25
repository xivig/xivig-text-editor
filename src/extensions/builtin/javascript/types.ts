/**
 * Category 5: JavaScript / TypeScript Extensions
 * Type definitions & configuration interfaces
 */

export interface JsSnippetItem {
  prefix: string;
  label: string;
  detail: string;
  template: string;
  description?: string;
}

export interface JsSnippetsSettings {
  enabled: boolean;
  showDescriptions: boolean;
}

export interface TypeScriptHeroSettings {
  enabled: boolean;
  groupImports: boolean;
  sortSpecifiers: boolean;
  removeUnusedSpecifiers: boolean;
  quoteStyle: 'single' | 'double';
  semi: boolean;
}

export interface TypeScriptExportSymbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'enum';
  line: number;
  isDefault?: boolean;
}

export interface NpmPackageInfo {
  name: string;
  version?: string;
  isDev?: boolean;
  subPaths?: string[];
}

export interface NpmIntellisenseSettings {
  enabled: boolean;
  scanDevDependencies: boolean;
  recursivePackageLookup: boolean;
  packageCacheTimeoutMs: number;
}

export interface ImportCostInfo {
  packageName: string;
  sizeBytes: number;
  gzipBytes: number;
  formattedSize: string;
  formattedGzip: string;
  category: 'small' | 'medium' | 'large'; // green (<15kb), yellow (<50kb), red (>=50kb)
}

export interface ImportCostSettings {
  enabled: boolean;
  showGzip: boolean;
  smallThresholdKb: number; // default: 15
  mediumThresholdKb: number; // default: 50
}

export interface TurboConsoleLogSettings {
  enabled: boolean;
  wrapWithEmoji: boolean;
  emoji: string; // default: "🚀"
  includeLineNumber: boolean;
  includeFileName: boolean;
  quoteChar: "'" | '"' | '`';
}

export interface ParsedTestCase {
  id: string;
  name: string;
  suiteName?: string;
  line: number;
  type: 'test' | 'it' | 'describe';
  skipped?: boolean;
  only?: boolean;
}

export interface JestSettings {
  enabled: boolean;
  jestCommand: string; // default: "npx jest"
  coverage: boolean;
  verbose: boolean;
}

export interface VitestTestNode {
  id: string;
  name: string;
  filePath: string;
  type: 'file' | 'suite' | 'test';
  status: 'passed' | 'failed' | 'skipped' | 'pending' | 'idle';
  durationMs?: number;
  errorMessage?: string;
  children?: VitestTestNode[];
}

export interface VitestExplorerSettings {
  enabled: boolean;
  testFilePatterns: string[];
  runOnSave: boolean;
  watchMode: boolean;
}
