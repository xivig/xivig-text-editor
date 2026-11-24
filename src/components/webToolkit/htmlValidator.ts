/**
 * HTML Validator, Accessibility (a11y) & SEO Linter
 * Performs static analysis on HTML strings to detect structural errors,
 * accessibility violations (WCAG), and search engine optimization issues.
 */

export interface ValidationIssue {
  id: string;
  category: 'html' | 'a11y' | 'seo';
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  col: number;
  rule: string;
  suggestion?: string;
}

export function validateHtmlDocument(html: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const lines = html.split('\n');

  // Helper to find line/col of a regex match or string occurrence
  const findPosition = (targetStr: string | RegExp): { line: number; col: number } => {
    for (let i = 0; i < lines.length; i++) {
      const idx = typeof targetStr === 'string' ? lines[i].indexOf(targetStr) : lines[i].search(targetStr);
      if (idx !== -1) {
        return { line: i + 1, col: idx + 1 };
      }
    }
    return { line: 1, col: 1 };
  };

  const isHtmlDoc = /<!doctype\s+html/i.test(html) || /<html[\s>]/i.test(html);

  // -------------------------------------------------------------
  // 1. SEO Checks (for full HTML documents)
  // -------------------------------------------------------------
  if (isHtmlDoc) {
    // Missing <title>
    if (!/<title[^>]*>[\s\S]*?<\/title>/i.test(html)) {
      issues.push({
        id: 'seo-missing-title',
        category: 'seo',
        severity: 'error',
        rule: 'seo/title',
        message: 'Document is missing a <title> element in <head>.',
        suggestion: 'Add <title>Page Title</title> inside <head> for search engines and browser tabs.',
        line: 1,
        col: 1,
      });
    }

    // Missing meta viewport
    if (!/<meta[^>]+name=["']viewport["']/i.test(html)) {
      issues.push({
        id: 'seo-missing-viewport',
        category: 'seo',
        severity: 'warning',
        rule: 'seo/viewport',
        message: 'Document is missing a responsive <meta name="viewport"> tag.',
        suggestion: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        line: 1,
        col: 1,
      });
    }

    // Missing meta description
    if (!/<meta[^>]+name=["']description["']/i.test(html)) {
      issues.push({
        id: 'seo-missing-desc',
        category: 'seo',
        severity: 'info',
        rule: 'seo/description',
        message: 'Document is missing a <meta name="description"> tag.',
        suggestion: 'Add a 150-160 character description for search engine result snippets.',
        line: 1,
        col: 1,
      });
    }

    // Missing lang attribute on <html>
    const htmlTagMatch = html.match(/<html([^>]*)>/i);
    if (htmlTagMatch && !/lang=["'][^"']+["']/i.test(htmlTagMatch[1])) {
      const pos = findPosition('<html');
      issues.push({
        id: 'a11y-missing-html-lang',
        category: 'a11y',
        severity: 'error',
        rule: 'a11y/html-lang',
        message: 'The <html> element does not specify a "lang" attribute.',
        suggestion: 'Add lang="en" (or your target locale) to <html> for screen readers.',
        line: pos.line,
        col: pos.col,
      });
    }

    // Open Graph / Social Sharing tags
    if (!/<meta[^>]+property=["']og:title["']/i.test(html)) {
      issues.push({
        id: 'seo-missing-og-title',
        category: 'seo',
        severity: 'info',
        rule: 'seo/open-graph',
        message: 'Missing OpenGraph social card tag: <meta property="og:title">',
        suggestion: 'Provide og:title and og:image for rich previews on social sharing platforms.',
        line: 1,
        col: 1,
      });
    }
  }

  // -------------------------------------------------------------
  // 2. Accessibility (a11y) Checks
  // -------------------------------------------------------------
  // Check <img> tags for alt attribute
  const imgRegex = /<img\b([^>]*)>/gi;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const attrs = imgMatch[1];
    if (!/\balt\s*=/i.test(attrs)) {
      const pos = findPosition(imgMatch[0]);
      issues.push({
        id: `a11y-img-alt-${pos.line}-${pos.col}`,
        category: 'a11y',
        severity: 'error',
        rule: 'a11y/img-has-alt',
        message: '<img> element is missing an "alt" attribute.',
        suggestion: 'Provide a descriptive alt="..." or alt="" if the image is purely decorative.',
        line: pos.line,
        col: pos.col,
      });
    }
  }

  // Check <button> elements for content or aria-label
  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let btnMatch: RegExpExecArray | null;
  while ((btnMatch = buttonRegex.exec(html)) !== null) {
    const attrs = btnMatch[1];
    const textContent = btnMatch[2].replace(/<[^>]+>/g, '').trim();
    const hasAria = /\baria-label\s*=/i.test(attrs) || /\baria-labelledby\s*=/i.test(attrs);
    if (!textContent && !hasAria && !/<img\b[^>]*\balt\s*=/i.test(btnMatch[2])) {
      const pos = findPosition(btnMatch[0].slice(0, 30));
      issues.push({
        id: `a11y-empty-button-${pos.line}-${pos.col}`,
        category: 'a11y',
        severity: 'error',
        rule: 'a11y/button-has-name',
        message: '<button> has no accessible name or visible text.',
        suggestion: 'Include text inside the button or add an aria-label="Action Name" attribute.',
        line: pos.line,
        col: pos.col,
      });
    }
  }

  // Check <a> elements for empty text/href
  const linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const attrs = linkMatch[1];
    const textContent = linkMatch[2].replace(/<[^>]+>/g, '').trim();
    const hasAria = /\baria-label\s*=/i.test(attrs);
    if (!textContent && !hasAria && !/<img\b[^>]*\balt\s*=/i.test(linkMatch[2])) {
      const pos = findPosition(linkMatch[0].slice(0, 30));
      issues.push({
        id: `a11y-empty-link-${pos.line}-${pos.col}`,
        category: 'a11y',
        severity: 'warning',
        rule: 'a11y/link-has-name',
        message: '<a> link contains no text, aria-label, or image with alt text.',
        suggestion: 'Add link text so screen readers can describe the destination.',
        line: pos.line,
        col: pos.col,
      });
    }
  }

  // Duplicate ID checks
  const idMap = new Map<string, number>();
  const idRegex = /\bid=["']([^"']+)["']/gi;
  let idMatch: RegExpExecArray | null;
  while ((idMatch = idRegex.exec(html)) !== null) {
    const val = idMatch[1];
    const count = (idMap.get(val) || 0) + 1;
    idMap.set(val, count);
    if (count === 2) {
      const pos = findPosition(`id="${val}"`);
      issues.push({
        id: `html-duplicate-id-${val}`,
        category: 'html',
        severity: 'error',
        rule: 'html/unique-id',
        message: `Duplicate ID "${val}" detected. ID attributes must be unique within a document.`,
        suggestion: `Change id="${val}" to a unique identifier or class="${val}".`,
        line: pos.line,
        col: pos.col,
      });
    }
  }

  // Heading Level Hierarchy Check (e.g. h1 followed by h3 without h2)
  const headingRegex = /<h([1-6])\b/gi;
  let headingMatch: RegExpExecArray | null;
  let lastHeadingLevel = 0;
  while ((headingMatch = headingRegex.exec(html)) !== null) {
    const level = parseInt(headingMatch[1], 10);
    if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
      const pos = findPosition(headingMatch[0]);
      issues.push({
        id: `a11y-skipped-heading-${pos.line}-${pos.col}`,
        category: 'a11y',
        severity: 'warning',
        rule: 'a11y/heading-hierarchy',
        message: `Heading hierarchy skipped from <h${lastHeadingLevel}> directly to <h${level}>.`,
        suggestion: `Use <h${lastHeadingLevel + 1}> to maintain consecutive semantic heading structure.`,
        line: pos.line,
        col: pos.col,
      });
    }
    lastHeadingLevel = level;
  }

  // -------------------------------------------------------------
  // 3. HTML Structural Checks
  // -------------------------------------------------------------
  // Unclosed void elements or bad nesting
  const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const closingTagRegex = /<\/([a-zA-Z0-9_-]+)>/g;
  let closeMatch: RegExpExecArray | null;
  while ((closeMatch = closingTagRegex.exec(html)) !== null) {
    const tag = closeMatch[1].toLowerCase();
    if (voidElements.has(tag)) {
      const pos = findPosition(`</${tag}>`);
      issues.push({
        id: `html-void-close-${pos.line}-${pos.col}`,
        category: 'html',
        severity: 'warning',
        rule: 'html/no-void-closing-tag',
        message: `Void element <${tag}> must not have a closing tag </${tag}>.`,
        suggestion: `Remove </${tag}>.`,
        line: pos.line,
        col: pos.col,
      });
    }
  }

  return issues;
}
