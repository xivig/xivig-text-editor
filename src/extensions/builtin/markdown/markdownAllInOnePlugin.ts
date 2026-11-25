import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import type { MarkdownTocItem, MarkdownTocOptions } from './types';

/**
 * Slugifies text for Markdown header anchor links.
 */
export function slugifyHeader(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * Parses markdown text into headings.
 */
export function extractMarkdownHeadings(content: string): MarkdownTocItem[] {
  const headings: MarkdownTocItem[] = [];
  const lines = content.replace(/\r\n/g, '\n').split('\n');

  let inCodeBlock = false;
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim().replace(/\s*#+\s*$/, '');
      const slug = slugifyHeader(text);
      headings.push({ level, text, slug });
    }
  }

  return headings;
}

/**
 * Generates Table of Contents Markdown list from document content.
 */
export function generateTableOfContentsMarkdown(
  content: string,
  options: MarkdownTocOptions = {}
): string {
  const minDepth = options.minDepth ?? 1;
  const maxDepth = options.maxDepth ?? 6;
  const ordered = options.ordered ?? false;
  const slugPrefix = options.slugPrefix ?? '#';

  const headings = extractMarkdownHeadings(content).filter(
    (h) => h.level >= minDepth && h.level <= maxDepth
  );

  if (headings.length === 0) return '';

  const baseLevel = Math.min(...headings.map((h) => h.level));
  const lines: string[] = [];
  let orderIndex = 1;

  for (const h of headings) {
    const indent = '  '.repeat(Math.max(0, h.level - baseLevel));
    const prefix = ordered ? `${orderIndex++}. ` : '- ';
    lines.push(`${indent}${prefix}[${h.text}](${slugPrefix}${h.slug})`);
  }

  return lines.join('\n');
}

/**
 * Formats Markdown table text by aligning columns and normalizing delimiters.
 */
export function formatMarkdownTable(tableMarkdown: string): string {
  const rawLines = tableMarkdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && l.endsWith('|'));

  if (rawLines.length < 2) {
    return tableMarkdown;
  }

  const rows = rawLines.map((line) => {
    // split row by pipe, omit leading & trailing empty elements
    const parts = line.split('|');
    return parts.slice(1, parts.length - 1).map((cell) => cell.trim());
  });

  const colCount = Math.max(...rows.map((r) => r.length));
  const colWidths: number[] = new Array(colCount).fill(3);

  // Measure max width per column
  for (let r = 0; r < rows.length; r++) {
    if (r === 1) continue; // delimiter row
    for (let c = 0; c < colCount; c++) {
      const cellLen = (rows[r][c] || '').length;
      if (cellLen > colWidths[c]) {
        colWidths[c] = cellLen;
      }
    }
  }

  // Parse alignments from delimiter row (row index 1)
  const delimiterCells = rows[1] || [];
  const alignments: ('left' | 'center' | 'right')[] = [];
  for (let c = 0; c < colCount; c++) {
    const cell = delimiterCells[c] || '---';
    const starts = cell.startsWith(':');
    const ends = cell.endsWith(':');
    if (starts && ends) {
      alignments.push('center');
    } else if (ends) {
      alignments.push('right');
    } else {
      alignments.push('left');
    }
  }

  // Build aligned output
  const outputLines: string[] = [];

  for (let r = 0; r < rows.length; r++) {
    if (r === 1) {
      // Rebuild delimiter row
      const delims = alignments.map((align, c) => {
        const w = colWidths[c];
        if (align === 'center') {
          return ':' + '-'.repeat(Math.max(1, w - 2)) + ':';
        } else if (align === 'right') {
          return '-'.repeat(Math.max(2, w - 1)) + ':';
        } else {
          return '-'.repeat(w);
        }
      });
      outputLines.push(`| ${delims.join(' | ')} |`);
      continue;
    }

    const cells = [];
    for (let c = 0; c < colCount; c++) {
      const text = rows[r][c] || '';
      const w = colWidths[c];
      const align = alignments[c];
      if (align === 'right') {
        cells.push(text.padStart(w, ' '));
      } else if (align === 'center') {
        const totalPad = w - text.length;
        const leftPad = Math.floor(totalPad / 2);
        const rightPad = totalPad - leftPad;
        cells.push(' '.repeat(leftPad) + text + ' '.repeat(rightPad));
      } else {
        cells.push(text.padEnd(w, ' '));
      }
    }
    outputLines.push(`| ${cells.join(' | ')} |`);
  }

  return outputLines.join('\n');
}

/**
 * Calculates next list prefix when pressing Enter on a list item.
 * Returns null if line is not a list.
 * Returns "" if current line is an empty list item (cancels list).
 */
export function getNextListPrefix(currentLine: string): string | null {
  const line = currentLine.trimEnd();

  // Empty list item checks (terminate list on Enter)
  if (/^\s*([-*+]|\d+\.)\s*$/.test(line) || /^\s*([-*+]|\d+\.)\s*\[[ xX]\]\s*$/.test(line)) {
    return '';
  }

  // Ordered task list: e.g. "  1. [ ] something"
  const orderedTask = line.match(/^(\s*)(\d+)\.\s*\[[ xX]\]\s+(.*)$/);
  if (orderedTask) {
    const indent = orderedTask[1];
    const nextNum = parseInt(orderedTask[2], 10) + 1;
    return `${indent}${nextNum}. [ ] `;
  }

  // Ordered list: e.g. "  1. something"
  const ordered = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
  if (ordered) {
    const indent = ordered[1];
    const nextNum = parseInt(ordered[2], 10) + 1;
    return `${indent}${nextNum}. `;
  }

  // Unordered task list: e.g. "  - [ ] something"
  const unorderedTask = line.match(/^(\s*)([-*+])\s*\[[ xX]\]\s+(.*)$/);
  if (unorderedTask) {
    const indent = unorderedTask[1];
    const bullet = unorderedTask[2];
    return `${indent}${bullet} [ ] `;
  }

  // Unordered list: e.g. "  - something"
  const unordered = line.match(/^(\s*)([-*+])\s+(.*)$/);
  if (unordered) {
    const indent = unordered[1];
    const bullet = unordered[2];
    return `${indent}${bullet} `;
  }

  return null;
}

/**
 * Toggles format wrapper around text.
 */
export function toggleFormatMarker(
  selectedText: string,
  marker: '**' | '*' | '~~' | '`'
): string {
  if (selectedText.startsWith(marker) && selectedText.endsWith(marker) && selectedText.length >= marker.length * 2) {
    return selectedText.slice(marker.length, selectedText.length - marker.length);
  }
  return `${marker}${selectedText}${marker}`;
}

/**
 * Autocompletion source for Markdown All in One snippets and structures.
 */
export function createMarkdownCompletionSource() {
  const snippets = [
    {
      label: 'table',
      type: 'snippet',
      info: 'Markdown 3x3 Table template',
      apply: '| Header 1 | Header 2 | Header 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n',
    },
    {
      label: 'toc',
      type: 'snippet',
      info: 'Table of Contents placeholder',
      apply: '<!-- TOC -->\n\n<!-- /TOC -->\n',
    },
    {
      label: 'alert-note',
      type: 'snippet',
      info: 'GitHub-style Note alert',
      apply: '> [!NOTE]\n> ',
    },
    {
      label: 'alert-tip',
      type: 'snippet',
      info: 'GitHub-style Tip alert',
      apply: '> [!TIP]\n> ',
    },
    {
      label: 'alert-important',
      type: 'snippet',
      info: 'GitHub-style Important alert',
      apply: '> [!IMPORTANT]\n> ',
    },
    {
      label: 'alert-warning',
      type: 'snippet',
      info: 'GitHub-style Warning alert',
      apply: '> [!WARNING]\n> ',
    },
    {
      label: 'alert-caution',
      type: 'snippet',
      info: 'GitHub-style Caution alert',
      apply: '> [!CAUTION]\n> ',
    },
    {
      label: 'details',
      type: 'snippet',
      info: 'Collapsible details section',
      apply: '<details>\n  <summary>Click to expand</summary>\n\n  Content here\n</details>\n',
    },
    {
      label: 'math-block',
      type: 'snippet',
      info: 'KaTeX display math equation',
      apply: '$$\n\\sum_{i=1}^{n} x_i\n$$\n',
    },
    {
      label: 'code-block',
      type: 'snippet',
      info: 'Fenced code block with syntax language',
      apply: '```typescript\n\n```\n',
    },
  ];

  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z0-9_-]+/);
    if (!word && !context.explicit) return null;

    return {
      from: word ? word.from : context.pos,
      options: snippets,
      validFor: /^[a-zA-Z0-9_-]*$/,
    };
  };
}
