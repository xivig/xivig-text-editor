import { ClangdSettings } from './types';

export const DEFAULT_CLANGD_SETTINGS: ClangdSettings = {
  enabled: true,
  fallbackFlags: ['-std=c++20', '-Wall'],
  formatStyle: 'LLVM',
};

const RECOGNIZED_CLANGD_SECTIONS = [
  'CompileFlags', 'Diagnostics', 'InlayHints', 'Hover', 'Index', 'Format',
];

/**
 * Generates standard .clang-format YAML configuration.
 */
export function generateClangFormatConfig(
  style: 'LLVM' | 'Google' | 'Chromium' | 'Mozilla' | 'WebKit' = 'LLVM',
  indentWidth = 4
): string {
  return [
    `# ClangFormat configuration generated via Xivig`,
    `BasedOnStyle: ${style}`,
    `IndentWidth: ${indentWidth}`,
    `ColumnLimit: 100`,
    `Standard: Latest`,
    `SortIncludes: CaseSensitive`,
    `IncludeBlocks: Regroup`,
    `DerivePointerAlignment: false`,
    `PointerAlignment: Left`,
  ].join('\n') + '\n';
}

/**
 * Validates a user .clangd configuration document.
 */
export function validateClangdConfig(yamlText: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!yamlText || !yamlText.trim()) {
    return { valid: true, errors: [] };
  }

  const lines = yamlText.split(/\r?\n/);
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    if (!line.startsWith(' ') && !line.startsWith('\t')) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx !== -1) {
        const sectionName = trimmed.slice(0, colonIdx).trim();
        if (!RECOGNIZED_CLANGD_SECTIONS.includes(sectionName)) {
          errors.push(`Unrecognized top-level .clangd section '${sectionName}' at line ${idx + 1}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
