import type { EnhancedMarkdownDocument, FrontmatterMetadata } from './types';

/**
 * Extracts and parses frontmatter metadata from Markdown.
 */
export function extractFrontmatter(markdown: string): {
  frontmatter: FrontmatterMetadata | null;
  body: string;
} {
  const trimmed = markdown.replace(/\r\n/g, '\n');
  if (!trimmed.startsWith('---\n')) {
    return { frontmatter: null, body: markdown };
  }

  const endIndex = trimmed.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return { frontmatter: null, body: markdown };
  }

  const rawYaml = trimmed.slice(4, endIndex);
  const body = trimmed.slice(endIndex + 5);

  const custom: Record<string, unknown> = {};
  let title: string | undefined;
  let description: string | undefined;
  let date: string | undefined;
  let author: string | undefined;
  let layout: string | undefined;
  let tags: string[] | undefined;

  const lines = rawYaml.split('\n');
  let currentListKey: string | null = null;
  let currentList: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    // List item (e.g. "  - tag1")
    if (trimmedLine.startsWith('- ') && currentListKey) {
      currentList.push(trimmedLine.slice(2).trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }

    if (currentListKey) {
      if (currentListKey === 'tags') tags = [...currentList];
      else custom[currentListKey] = [...currentList];
      currentListKey = null;
      currentList = [];
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();

      if (!val) {
        currentListKey = key;
        currentList = [];
        continue;
      }

      // Inline array: e.g. [a, b, c]
      if (val.startsWith('[') && val.endsWith(']')) {
        const items = val
          .slice(1, -1)
          .split(',')
          .map((i) => i.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);

        if (key === 'tags') tags = items;
        else custom[key] = items;
        continue;
      }

      const cleanVal = val.replace(/^['"]|['"]$/g, '');
      if (key === 'title') title = cleanVal;
      else if (key === 'description') description = cleanVal;
      else if (key === 'date') date = cleanVal;
      else if (key === 'author') author = cleanVal;
      else if (key === 'layout') layout = cleanVal;
      else custom[key] = cleanVal;
    }
  }

  if (currentListKey) {
    if (currentListKey === 'tags') tags = [...currentList];
    else custom[currentListKey] = [...currentList];
  }

  return {
    frontmatter: {
      title,
      description,
      tags,
      date,
      author,
      layout,
      custom,
    },
    body,
  };
}

/**
 * Parses Markdown into an EnhancedMarkdownDocument extracting math, diagrams, and imports.
 */
export function parseEnhancedMarkdown(markdown: string): EnhancedMarkdownDocument {
  const { frontmatter, body } = extractFrontmatter(markdown);

  // Check for KaTeX Math ($...$ or $$...$$)
  const hasMath = /\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$/.test(body);

  // Check for Mermaid
  const hasMermaid = /```mermaid[\s\S]+?```/.test(body);

  // Check for PlantUML
  const hasPlantUml = /```plantuml[\s\S]+?```|@startuml[\s\S]+?@enduml/.test(body);

  // Check for transclusions / imports: @import "..." or ![[note]]
  const imports: string[] = [];
  const importRegex = /@import\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(body)) !== null) {
    imports.push(match[1]);
  }

  const wikiRegex = /!\[\[([^\]]+)\]\]/g;
  while ((match = wikiRegex.exec(body)) !== null) {
    imports.push(match[1]);
  }

  return {
    frontmatter,
    rawBody: body,
    hasMath,
    hasMermaid,
    hasPlantUml,
    imports,
  };
}
