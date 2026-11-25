import type { MarkdownLintDiagnostic } from './types';

/**
 * Lints a markdown document and returns structural and style diagnostics.
 */
export function lintMarkdownDocument(markdown: string): MarkdownLintDiagnostic[] {
  const diagnostics: MarkdownLintDiagnostic[] = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');

  let prevHeadingLevel = 0;
  let inCodeBlock = false;
  let hasFirstHeading = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Toggle fenced code blocks
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // MD009: Trailing spaces
    if (/\s+$/.test(rawLine)) {
      diagnostics.push({
        rule: 'MD009',
        message: 'Trailing whitespace detected at end of line',
        line: lineNum,
        severity: 'warning',
        fixable: true,
      });
    }

    // MD010: Hard tab characters
    if (rawLine.includes('\t')) {
      diagnostics.push({
        rule: 'MD010',
        message: 'Hard tab detected; use spaces instead',
        line: lineNum,
        severity: 'warning',
        fixable: true,
      });
    }

    // Check ATX Heading rules
    const headingMatch = rawLine.match(/^(\s*)(#{1,6})(.*)$/);
    if (headingMatch) {
      const hashes = headingMatch[2];
      const rest = headingMatch[3];
      const level = hashes.length;

      // MD018: No space after hash
      if (rest.length > 0 && !rest.startsWith(' ') && !rest.startsWith('#')) {
        diagnostics.push({
          rule: 'MD018',
          message: 'No space after hashes in ATX heading',
          line: lineNum,
          severity: 'error',
          fixable: true,
        });
      }

      // MD019: Multiple spaces after hash
      if (rest.startsWith('  ')) {
        diagnostics.push({
          rule: 'MD019',
          message: 'Multiple spaces after hashes in ATX heading',
          line: lineNum,
          severity: 'warning',
          fixable: true,
        });
      }

      // MD001: Heading levels increment by more than one level
      if (prevHeadingLevel > 0 && level > prevHeadingLevel + 1) {
        diagnostics.push({
          rule: 'MD001',
          message: `Heading level skipped: expected h${prevHeadingLevel + 1} or lower, but got h${level}`,
          line: lineNum,
          severity: 'warning',
          fixable: false,
        });
      }
      prevHeadingLevel = level;

      // MD041: First heading should be top-level (h1)
      if (!hasFirstHeading) {
        hasFirstHeading = true;
        if (level !== 1) {
          diagnostics.push({
            rule: 'MD041',
            message: 'First heading in document should be a top-level h1 heading',
            line: lineNum,
            severity: 'info',
            fixable: false,
          });
        }
      }
    }
  }

  return diagnostics;
}

/**
 * Automatically fixes fixable markdown lint issues.
 */
export function autoFixMarkdownLint(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let inCodeBlock = false;

  const fixedLines = lines.map((line) => {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return line.trimEnd();
    }
    if (inCodeBlock) return line;

    let modified = line;

    // Fix MD009: remove trailing whitespace
    modified = modified.replace(/\s+$/, '');

    // Fix MD010: convert tabs to 2 spaces
    modified = modified.replace(/\t/g, '  ');

    // Fix MD018 / MD019: normalize ATX heading spacing
    const headingMatch = modified.match(/^(\s*)(#{1,6})([ \t]*)(.*)$/);
    if (headingMatch) {
      const indent = headingMatch[1];
      const hashes = headingMatch[2];
      const content = headingMatch[4].trim();
      if (content) {
        modified = `${indent}${hashes} ${content}`;
      }
    }

    return modified;
  });

  return fixedLines.join('\n');
}
