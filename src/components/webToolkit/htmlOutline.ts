/**
 * HTML Document Outline Extractor
 * Parses HTML to build a tree representation of DOM elements for navigation and structure review.
 */

export interface HtmlOutlineNode {
  id: string;
  tag: string;
  elementId?: string;
  classes: string[];
  textSnippet?: string;
  line: number;
  col: number;
  depth: number;
  children: HtmlOutlineNode[];
}

export function extractHtmlOutline(html: string): HtmlOutlineNode[] {
  const rootNodes: HtmlOutlineNode[] = [];
  const stack: HtmlOutlineNode[] = [];
  const lines = html.split('\n');

  // Regex matching start tags, void tags, and closing tags
  const tagRegex = /<\/?([a-zA-Z0-9_-]+)([^>]*?)(\/?)>/g;
  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype'
  ]);

  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    const fullMatch = match[0];
    const tagName = match[1].toLowerCase();
    const rawAttrs = match[2] || '';
    const isSelfClosing = match[3] === '/' || voidElements.has(tagName) || fullMatch.startsWith('<!');
    const isClosingTag = fullMatch.startsWith('</');

    // Calculate line and col
    const matchPos = match.index;
    let accumulated = 0;
    let line = 1;
    let col = 1;

    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i].length + 1; // +1 for \n
      if (accumulated + lineLen > matchPos) {
        line = i + 1;
        col = matchPos - accumulated + 1;
        break;
      }
      accumulated += lineLen;
    }

    if (isClosingTag) {
      if (stack.length > 0 && stack[stack.length - 1].tag === tagName) {
        stack.pop();
      }
      continue;
    }

    // Extract id and class attributes
    const idMatch = rawAttrs.match(/\bid=["']([^"']+)["']/i);
    const classMatch = rawAttrs.match(/\bclass=["']([^"']+)["']/i);

    const elementId = idMatch ? idMatch[1] : undefined;
    const classes = classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : [];

    // Extract quick text snippet following the tag
    const afterTag = html.slice(match.index + fullMatch.length, match.index + fullMatch.length + 60);
    const textSnippet = afterTag.split('<')[0]?.trim().slice(0, 30) || undefined;

    const node: HtmlOutlineNode = {
      id: `outline-${line}-${col}-${tagName}`,
      tag: tagName,
      elementId,
      classes,
      textSnippet,
      line,
      col,
      depth: stack.length,
      children: [],
    };

    if (stack.length === 0) {
      rootNodes.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    if (!isSelfClosing) {
      stack.push(node);
    }
  }

  return rootNodes;
}
