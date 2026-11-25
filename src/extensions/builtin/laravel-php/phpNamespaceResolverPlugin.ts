import { PhpNamespaceResult, PhpNamespaceSettings } from './types';

export const DEFAULT_PHP_NAMESPACE_SETTINGS: PhpNamespaceSettings = {
  enabled: true,
  psr4Prefix: 'App\\',
  psr4RootDirectory: 'app',
  sortAlphabetically: true,
};

/**
 * Resolves PSR-4 PHP namespace and class name from a relative file path.
 * e.g. "app/Http/Controllers/Api/V1/OrderController.php"
 * -> namespace: "App\Http\Controllers\Api\V1"
 * -> className: "OrderController"
 */
export function resolvePhpNamespaceFromPath(
  relativeFilePath: string,
  settings: PhpNamespaceSettings = DEFAULT_PHP_NAMESPACE_SETTINGS
): PhpNamespaceResult | null {
  if (!relativeFilePath) return null;

  const normalized = relativeFilePath.replace(/\\/g, '/');
  const rootDir = settings.psr4RootDirectory.replace(/^\/|\/$/g, '');
  const prefix = settings.psr4Prefix.replace(/\\+$/, '');

  const parts = normalized.split('/');
  const fileName = parts.pop() || '';
  if (!fileName.endsWith('.php')) return null;

  const className = fileName.replace('.php', '');
  const rootIndex = parts.indexOf(rootDir);

  if (rootIndex === -1) {
    // If not inside root dir, return fallback
    return {
      namespace: prefix,
      className,
      fullQualifiedClass: `${prefix}\\${className}`,
    };
  }

  const subDirs = parts.slice(rootIndex + 1);
  const namespace = subDirs.length > 0
    ? `${prefix}\\${subDirs.join('\\')}`
    : prefix;

  return {
    namespace,
    className,
    fullQualifiedClass: `${namespace}\\${className}`,
  };
}

/**
 * Injects a new `use ClassName;` statement into existing PHP code in alphabetical order.
 */
export function insertUseStatement(code: string, newImport: string): string {
  const cleanImport = newImport.trim().replace(/^use\s+/, '').replace(/;$/, '');
  const fullUseStatement = `use ${cleanImport};`;

  if (code.includes(fullUseStatement)) {
    return code; // Already imported
  }

  const lines = code.split('\n');
  let namespaceLineIndex = -1;
  const existingUseIndices: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('namespace ') && line.endsWith(';')) {
      namespaceLineIndex = i;
    } else if (line.startsWith('use ') && line.endsWith(';')) {
      existingUseIndices.push(i);
    }
  }

  if (existingUseIndices.length > 0) {
    // Insert after the last existing use line
    const lastUseIndex = existingUseIndices[existingUseIndices.length - 1];
    lines.splice(lastUseIndex + 1, 0, fullUseStatement);
    return lines.join('\n');
  }

  if (namespaceLineIndex !== -1) {
    // Insert two lines below namespace
    lines.splice(namespaceLineIndex + 1, 0, '', fullUseStatement);
    return lines.join('\n');
  }

  // Fallback: insert after <?php
  if (lines.length > 0 && lines[0].includes('<?php')) {
    lines.splice(1, 0, '', fullUseStatement);
    return lines.join('\n');
  }

  return `${fullUseStatement}\n${code}`;
}
