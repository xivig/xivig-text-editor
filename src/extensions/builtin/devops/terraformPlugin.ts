import { TerraformBlock, TerraformLintResult, TerraformBlockType } from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

const TERRAFORM_BLOCK_TYPES: TerraformBlockType[] = [
  'terraform', 'provider', 'resource', 'data', 'variable', 'output', 'locals', 'module',
];

/**
 * Parses HCL / Terraform files into top-level blocks.
 */
export function parseTerraformBlocks(hclContent: string): TerraformBlock[] {
  if (!hclContent || !hclContent.trim()) return [];

  const blocks: TerraformBlock[] = [];
  const lines = hclContent.split(/\r?\n/);

  let currentType: TerraformBlockType | null = null;
  let currentLabels: string[] = [];
  let currentBody: string[] = [];
  let braceDepth = 0;
  let startLine = 1;

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const trimmed = rawLine.trim();

    if (!currentType) {
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

      const headerMatch = trimmed.match(/^([a-zA-Z_-]+)\s*(?:("[^"]*"\s*|\b[a-zA-Z0-9_-]+\b\s*)*)\s*\{/);
      if (headerMatch) {
        const typeCandidate = headerMatch[1] as TerraformBlockType;
        if (TERRAFORM_BLOCK_TYPES.includes(typeCandidate)) {
          currentType = typeCandidate;
          startLine = idx + 1;

          const labelMatches = trimmed.match(/"([^"]+)"/g) || [];
          currentLabels = labelMatches.map((l) => l.slice(1, -1));

          braceDepth = 1;
          currentBody = [];

          if (trimmed.endsWith('}') && (trimmed.match(/\{/g)?.length === trimmed.match(/\}/g)?.length)) {
            blocks.push({
              type: currentType,
              labels: currentLabels,
              lineNumber: startLine,
              body: trimmed,
            });
            currentType = null;
            currentLabels = [];
            braceDepth = 0;
          }
        }
      }
    } else {
      currentBody.push(rawLine);

      const opens = (rawLine.match(/\{/g) || []).length;
      const closes = (rawLine.match(/\}/g) || []).length;
      braceDepth += opens - closes;

      if (braceDepth <= 0) {
        blocks.push({
          type: currentType,
          labels: currentLabels,
          lineNumber: startLine,
          body: currentBody.join('\n'),
        });
        currentType = null;
        currentLabels = [];
        currentBody = [];
        braceDepth = 0;
      }
    }
  }

  return blocks;
}

/**
 * Lints Terraform blocks for missing labels and duplicate identifiers.
 */
export function lintTerraformBlocks(blocks: TerraformBlock[]): TerraformLintResult[] {
  const results: TerraformLintResult[] = [];
  const seenResources = new Set<string>();

  for (const block of blocks) {
    if (block.type === 'resource') {
      if (block.labels.length < 2) {
        results.push({
          block: `resource ${block.labels.join('.')}`,
          severity: 'error',
          lineNumber: block.lineNumber,
          message: 'Resource block must declare both a type and a local name: resource "<TYPE>" "<NAME>"',
        });
      } else {
        const key = `${block.labels[0]}.${block.labels[1]}`;
        if (seenResources.has(key)) {
          results.push({
            block: key,
            severity: 'error',
            lineNumber: block.lineNumber,
            message: `Duplicate resource declaration '${key}' found`,
          });
        } else {
          seenResources.add(key);
        }
      }
    }

    if (block.type === 'provider') {
      if (block.labels.length === 0) {
        results.push({
          block: 'provider',
          severity: 'error',
          lineNumber: block.lineNumber,
          message: 'Provider block requires a name label: provider "<NAME>"',
        });
      }
    }

    if (block.type === 'variable' && block.labels.length === 0) {
      results.push({
        block: 'variable',
        severity: 'error',
        lineNumber: block.lineNumber,
        message: 'Variable block requires a name label: variable "<NAME>"',
      });
    }

    if (block.type === 'output' && block.labels.length === 0) {
      results.push({
        block: 'output',
        severity: 'error',
        lineNumber: block.lineNumber,
        message: 'Output block requires a name label: output "<NAME>"',
      });
    }
  }

  return results;
}

/**
 * CodeMirror autocompletion source for Terraform blocks and providers.
 */
export function createTerraformCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z0-9_"-]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const norm = word.text.toLowerCase();
    const options: any[] = [];

    for (const b of TERRAFORM_BLOCK_TYPES) {
      if (b.startsWith(norm)) {
        options.push({
          label: `${b} `,
          type: 'keyword',
          detail: 'Terraform Block',
          boost: 4,
        });
      }
    }

    const providers = ['aws', 'google', 'azurerm', 'kubernetes', 'helm', 'cloudflare', 'github'];
    for (const p of providers) {
      if (p.startsWith(norm)) {
        options.push({
          label: `provider "${p}" {\n  \n}`,
          type: 'snippet',
          detail: 'Provider Configuration',
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
