import DOMPurify from 'dompurify';

/**
 * Retrieves or initializes a DOMPurify instance.
 * Works seamlessly in both Electron browser renderer and test environments (JSDOM).
 */
export function getDOMPurifier(): any {
  if (typeof window !== 'undefined') {
    if (typeof (DOMPurify as any).sanitize === 'function') {
      return DOMPurify;
    }
    return (DOMPurify as any)(window);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('');
    return (DOMPurify as any)(dom.window);
  } catch {
    return null;
  }
}

/**
 * Strict HTML Sanitizer for Markdown Preview
 * Uses DOMPurify with an explicit allowlist of safe tags and attributes.
 * Disallows executable scripts, iframes, embedded objects, and inline event handlers.
 */
export function sanitizeMarkdownHtml(rawHtml: string): string {
  const purifier = getDOMPurifier();
  if (!purifier) {
    return rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  return purifier.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr', 'blockquote',
      'ul', 'ol', 'li',
      'strong', 'b', 'em', 'i', 'del', 's', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'a', 'img', 'div', 'span', 'input', 'button',
      'svg', 'path', 'rect', 'text', 'g', 'polygon', 'circle', 'line', 'marker', 'defs',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class',
      'type', 'checked', 'disabled', 'target', 'rel', 'id', 'data-line', 'data-task-line', 'data-code',
      'width', 'height', 'style', 'align',
      'd', 'fill', 'stroke', 'stroke-width', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'points', 'transform', 'viewBox', 'xmlns',
    ],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'base', 'link', 'meta', 'applet'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    // Allow http, https, mailto, file (for local workspace assets), and in-page # anchors
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|file|#):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: true,
    ADD_ATTR: ['target', 'rel'],
  });
}

/**
 * Resolves relative image paths against the Markdown file directory or workspace root.
 * Converts local relative paths (e.g. public/logo.png, ./images/banner.png) to file:// URLs
 * so Electron renders them cleanly without hitting Vite's dev server or 404ing.
 */
export function resolveMarkdownImagePath(src: string, basePath?: string, workspaceRoot?: string): string {
  if (!src) return src;
  const trimmed = src.trim();

  // Keep external URLs, data URIs, or anchor hashes intact
  if (/^(?:https?:|data:|file:|blob:|#)/i.test(trimmed)) {
    return trimmed;
  }

  const effectiveDir = basePath || workspaceRoot;
  if (!effectiveDir) return trimmed;

  try {
    let targetOnDisk: string;
    if (trimmed.startsWith('/') || trimmed.startsWith('\\')) {
      const rootDir = workspaceRoot || basePath || '';
      const cleanRel = trimmed.replace(/^[/\\]+/, '');
      targetOnDisk = `${rootDir.replace(/\\/g, '/').replace(/\/+$/, '')}/${cleanRel}`;
    } else {
      const cleanBase = effectiveDir.replace(/\\/g, '/').replace(/\/+$/, '');
      const cleanRel = trimmed.replace(/^\.\//, '');
      targetOnDisk = `${cleanBase}/${cleanRel}`;
    }

    let fileUrl = targetOnDisk.replace(/\\/g, '/');
    if (!fileUrl.startsWith('/')) {
      fileUrl = '/' + fileUrl;
    }
    return `file://${encodeURI(fileUrl)}`;
  } catch {
    return trimmed;
  }
}

/**
 * Rewrites <img src="..."> in raw HTML blocks to use resolved local file paths.
 */
function resolveHtmlImages(html: string, basePath?: string, workspaceRoot?: string): string {
  return html.replace(/<img\b([^>]*\bsrc=["'])([^"']+)(["'][^>]*)>/gi, (match, prefix, src, suffix) => {
    const resolved = resolveMarkdownImagePath(src, basePath, workspaceRoot);
    const cleanPrefix = prefix.replace(/^<img\b\s*/i, '');
    let cleanSuffix = suffix.replace(/^\s*["']/, '" ').replace(/\s*\/?>?\s*$/, '').trimEnd();

    // Check if style is already defined in cleanSuffix
    const styleMatch = cleanSuffix.match(/\bstyle=["']([^"']*)["']/i);
    const widthMatch = `${cleanPrefix} ${cleanSuffix}`.match(/\bwidth=["']?(\d+)(?:px)?["']?/i);
    const heightMatch = `${cleanPrefix} ${cleanSuffix}`.match(/\bheight=["']?(\d+)(?:px)?["']?/i);

    let finalStyle = styleMatch ? styleMatch[1].trim() : '';
    if (widthMatch) {
      const w = widthMatch[1];
      const h = heightMatch ? `${heightMatch[1]}px` : 'auto';
      if (!/width\s*:/i.test(finalStyle)) {
        finalStyle = `width: ${w}px; max-width: 100%; ${finalStyle}`.trim();
      }
      if (!/height\s*:/i.test(finalStyle)) {
        finalStyle = `height: ${h}; ${finalStyle}`.trim();
      }
      if (!/object-fit\s*:/i.test(finalStyle)) {
        finalStyle = `${finalStyle} object-fit: contain;`.trim();
      }
    } else {
      if (!/max-width\s*:/i.test(finalStyle)) {
        finalStyle = `max-width: 100%; ${finalStyle}`.trim();
      }
      if (!/object-fit\s*:/i.test(finalStyle)) {
        finalStyle = `${finalStyle} object-fit: contain;`.trim();
      }
    }

    if (styleMatch) {
      cleanSuffix = cleanSuffix.replace(/\bstyle=["'][^"']*["']/i, `style="${finalStyle}"`);
    } else if (finalStyle) {
      cleanSuffix = `${cleanSuffix} style="${finalStyle}"`;
    }

    return `<img ${cleanPrefix}${resolved}${cleanSuffix} />`;
  });
}

function renderMermaidSvg(code: string): string {
  const lines = code.split('\n').map((l) => l.trim()).filter(Boolean);
  const connections: Array<{ from: string; to: string; label?: string }> = [];
  const nodes = new Map<string, string>();

  for (const line of lines) {
    if (/^(graph|flowchart|sequenceDiagram)/i.test(line)) continue;

    // Match A[Label] --> B[Label] or A --> B
    const arrowParts = line.split(/-->|->|==>|--/);
    if (arrowParts.length >= 2) {
      for (let p = 0; p < arrowParts.length - 1; p++) {
        const leftRaw = arrowParts[p].trim();
        const rightRaw = arrowParts[p + 1].trim();

        const parseNode = (raw: string): string => {
          const bracketMatch = raw.match(/^([a-zA-Z0-9_-]+)\[(.*?)\]$/) ||
            raw.match(/^([a-zA-Z0-9_-]+)\((.*?)\)$/) ||
            raw.match(/^([a-zA-Z0-9_-]+)\{(.*?)\}$/);
          if (bracketMatch) {
            const id = bracketMatch[1];
            const text = bracketMatch[2];
            nodes.set(id, text);
            return id;
          }
          const plainId = raw.replace(/[^a-zA-Z0-9_-]/g, '');
          if (!nodes.has(plainId)) {
            nodes.set(plainId, plainId);
          }
          return plainId;
        };

        const fromId = parseNode(leftRaw);
        const toId = parseNode(rightRaw);
        if (fromId && toId) {
          connections.push({ from: fromId, to: toId });
        }
      }
    }
  }

  const nodeList = Array.from(nodes.entries());
  if (nodeList.length === 0) {
    return `<div class="p-3 font-mono text-xs text-gray-400 bg-[#1e1e1e] rounded border border-[#333]">${code.replace(/</g, '&lt;')}</div>`;
  }

  const nodeWidth = 120;
  const nodeHeight = 36;
  const gapY = 50;
  const totalHeight = Math.max(100, nodeList.length * (nodeHeight + gapY) - gapY + 40);
  const totalWidth = 360;
  const centerX = totalWidth / 2;

  const nodePositions = new Map<string, { x: number; y: number }>();
  let svgNodes = '';
  let svgEdges = '';

  nodeList.forEach(([id, text], idx) => {
    const x = centerX - nodeWidth / 2;
    const y = 20 + idx * (nodeHeight + gapY);
    nodePositions.set(id, { x: centerX, y: y + nodeHeight / 2 });

    svgNodes += `
      <g transform="translate(${x}, ${y})">
        <rect width="${nodeWidth}" height="${nodeHeight}" rx="6" fill="#1e2433" stroke="#6c8cff" stroke-width="1.5" />
        <text x="${nodeWidth / 2}" y="${nodeHeight / 2 + 4}" fill="#ffffff" font-size="11" font-family="sans-serif" font-weight="600" text-anchor="middle">${text.slice(0, 16)}</text>
      </g>
    `;
  });

  connections.forEach((conn) => {
    const from = nodePositions.get(conn.from);
    const to = nodePositions.get(conn.to);
    if (from && to) {
      svgEdges += `
        <line x1="${from.x}" y1="${from.y + nodeHeight / 2}" x2="${to.x}" y2="${to.y - nodeHeight / 2}" stroke="#6c8cff" stroke-width="2" marker-end="url(#mermaid-arrow)" />
      `;
    }
  });

  return `
    <div class="my-4 p-4 bg-[#141820] rounded-lg border border-[#2b3548] flex flex-col items-center overflow-x-auto">
      <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 select-none">Mermaid Diagram</div>
      <svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="mermaid-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#6c8cff" />
          </marker>
        </defs>
        ${svgEdges}
        ${svgNodes}
      </svg>
    </div>
  `;
}

function formatInlineMarkdown(text: string, basePath?: string, workspaceRoot?: string): string {
  let res = text;
  // Inline math equations: $math$
  res = res.replace(/\$([^\$\n]+)\$/g, '<span class="px-1.5 py-0.5 rounded bg-[#1e2330] text-[#93c5fd] font-mono text-xs border border-[#2b3548]">\\( $1 \\)</span>');
  // Inline code: `...`
  res = res.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#2d2d2d] text-[#ce9178] font-mono text-xs border border-[#3c3c3c]">$1</code>');
  // Bold & italic
  res = res.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong class="font-bold text-white"><em>$1</em></strong>');
  res = res.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
  res = res.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-300">$1</em>');
  res = res.replace(/~~([^~]+)~~/g, '<del class="line-through text-gray-500">$1</del>');
  // Images: ![alt](url)
  res = res.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const resolvedSrc = resolveMarkdownImagePath(src, basePath, workspaceRoot);
    return `<img src="${resolvedSrc}" alt="${alt}" class="max-w-full max-h-[420px] object-contain rounded border border-[#3e3e42] my-3 inline-block" />`;
  });
  // Links: [text](url)
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#3794ff] hover:underline cursor-pointer">$1</a>');
  // Raw HTML <img src="..."> tags inside inline text
  res = resolveHtmlImages(res, basePath, workspaceRoot);
  return res;
}

/**
 * Parses raw Markdown text into structured HTML with 100% exact line number tags on every block element.
 * Follows:
 * Markdown source -> Precise Line Parser -> DOMPurify Sanitization -> Rendered HTML
 */
export function renderAndSanitizeMarkdown(markdownContent: string, basePath?: string, workspaceRoot?: string): string {
  if (!markdownContent || !markdownContent.trim()) {
    return '<p class="text-gray-500 italic">No content to preview.</p>';
  }

  const lines = markdownContent.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let i = 0;

  // 0. Parse YAML frontmatter at line 0
  if (lines.length > 0 && lines[0].trim() === '---') {
    let frontmatterEnd = -1;
    for (let f = 1; f < lines.length; f++) {
      if (lines[f].trim() === '---') {
        frontmatterEnd = f;
        break;
      }
    }
    if (frontmatterEnd > 0) {
      const fmLines = lines.slice(1, frontmatterEnd);
      const metaRows: string[] = [];
      for (const fml of fmLines) {
        const parts = fml.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join(':').trim();
          metaRows.push(`<div class="flex items-center gap-1.5"><span class="font-semibold text-gray-400 capitalize">${key}:</span> <span class="text-white">${val}</span></div>`);
        }
      }
      if (metaRows.length > 0) {
        blocks.push(`
          <div data-line="1" class="my-3 p-3 bg-[#1e2330] border border-[#2b3548] rounded-md text-xs font-mono">
            <div class="text-[10px] font-bold text-[#6c8cff] uppercase tracking-wider mb-1.5">Metadata</div>
            <div class="grid grid-cols-2 gap-2">${metaRows.join('')}</div>
          </div>
        `);
      }
      i = frontmatterEnd + 1;
    }
  }

  while (i < lines.length) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Math block: $$ ... $$
    if (trimmed.startsWith('$$')) {
      const mathLines: string[] = [];
      const mathStartLine = lineNum;
      if (trimmed.endsWith('$$') && trimmed.length > 2) {
        mathLines.push(trimmed.slice(2, -2).trim());
        i++;
      } else {
        i++;
        while (i < lines.length && !lines[i].trim().endsWith('$$')) {
          mathLines.push(lines[i]);
          i++;
        }
        if (i < lines.length && lines[i].trim().endsWith('$$')) {
          const last = lines[i].trim().replace(/\$\$$/, '');
          if (last) mathLines.push(last);
          i++;
        }
      }
      const rawFormula = mathLines.join(' ');
      blocks.push(`
        <div data-line="${mathStartLine}" class="my-3 p-3 bg-[#181d26] border border-[#2a3447] rounded text-center font-mono text-sm text-[#93c5fd] overflow-x-auto select-all">
          \\[ ${rawFormula} \\]
        </div>
      `);
      continue;
    }

    // 1. Fenced Code Block / Mermaid
    const codeFenceMatch = line.match(/^```([a-zA-Z0-9_-]*)/);
    if (codeFenceMatch) {
      const lang = (codeFenceMatch[1] || 'text').toLowerCase();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].startsWith('```')) {
        i++;
      }

      // Handle Mermaid diagrams directly
      if (lang === 'mermaid') {
        const diagramHtml = renderMermaidSvg(codeLines.join('\n'));
        blocks.push(`<div data-line="${lineNum}">${diagramHtml}</div>`);
        continue;
      }

      const rawCode = codeLines.join('\n');
      const escapedCodeLines = codeLines.map((codeLine, index) => {
        const escapedLine = codeLine
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<span data-line="${lineNum + index + 1}" class="block">${escapedLine || '&nbsp;'}</span>`;
      });

      blocks.push(`
        <div data-line="${lineNum}" class="my-4 rounded-md overflow-hidden border border-[#3e3e42] bg-[#1a1a1a]">
          <div class="px-3 py-1 bg-[#252526] text-gray-400 text-xs font-mono border-b border-[#3e3e42] flex justify-between items-center select-none">
            <span>${lang}</span>
            <button data-code="${encodeURIComponent(rawCode)}" class="markdown-copy-btn px-2 py-0.5 rounded bg-[#333] hover:bg-[#444] text-gray-300 text-[10px] cursor-pointer">Copy</button>
          </div>
          <pre class="p-3 text-xs font-mono text-[#d4d4d4] overflow-x-auto whitespace-pre leading-relaxed"><code>${escapedCodeLines.join('\n')}</code></pre>
        </div>
      `);
      continue;
    }

    // 2. Headers (# through ######) with Slug Anchors
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const title = formatInlineMarkdown(headerMatch[2], basePath, workspaceRoot);
      const rawTitle = headerMatch[2].replace(/[*_~`]/g, '').trim();
      const slug = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `section-${lineNum}`;

      const classes: Record<number, string> = {
        1: 'text-2xl font-bold text-white mt-8 mb-4 border-b border-[#444] pb-2',
        2: 'text-xl font-bold text-[#4ec9b0] mt-7 mb-3 border-b border-[#333] pb-1.5',
        3: 'text-lg font-semibold text-[#569cd6] mt-6 mb-2 border-b border-[#2e2e2e] pb-1',
        4: 'text-base font-semibold text-gray-200 mt-5 mb-2',
        5: 'text-sm font-bold text-gray-300 mt-4 mb-2',
        6: 'text-xs font-bold text-gray-400 mt-4 mb-2 uppercase tracking-wider',
      };
      blocks.push(`
        <h${level} data-line="${lineNum}" id="${slug}" class="${classes[level] || ''} group flex items-center justify-between">
          <span>${title}</span>
          <a href="#${slug}" class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white ml-2 text-xs font-mono no-underline">#</a>
        </h${level}>
      `);
      i++;
      continue;
    }

    // 3. Horizontal Rule (---, ***, ___)
    if (/^(?:---|\*\*\*|___)$/.test(trimmed)) {
      blocks.push(`<hr data-line="${lineNum}" class="my-6 border-t border-[#3e3e42]" />`);
      i++;
      continue;
    }

    // 4. Blockquotes
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      const quoteStartLine = lineNum;
      while (i < lines.length && (lines[i].startsWith('>') || (lines[i].trim() && quoteLines.length > 0 && !lines[i].startsWith('#')))) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const quoteContent = formatInlineMarkdown(quoteLines.join(' '), basePath, workspaceRoot);
      blocks.push(`<blockquote data-line="${quoteStartLine}" class="border-l-4 border-[#007acc] pl-3 py-1 my-2 text-gray-400 bg-[#20252b] rounded-r italic">${quoteContent}</blockquote>`);
      continue;
    }

    // 5. Tables
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      const tableStartLine = lineNum;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        let html = `<div data-line="${tableStartLine}" class="overflow-x-auto my-4"><table class="w-full text-xs text-left border-collapse border border-[#3e3e42]">`;
        tableLines.forEach((row, idx) => {
          if (idx === 1 && /^[|\s-:]+$/.test(row)) return;
          const cells = row.split('|').slice(1, -1).map((c) => formatInlineMarkdown(c.trim(), basePath, workspaceRoot));
          if (idx === 0) {
            html += `<thead class="bg-[#252526] text-gray-200"><tr data-line="${tableStartLine + idx}">`;
            cells.forEach((c) => { html += `<th class="px-3 py-2 border border-[#3e3e42] font-semibold">${c}</th>`; });
            html += '</tr></thead><tbody>';
          } else {
            html += `<tr data-line="${tableStartLine + idx}" class="${idx % 2 === 0 ? 'bg-[#1e1e1e]' : 'bg-[#181818]'} hover:bg-[#282828]">`;
            cells.forEach((c) => { html += `<td class="px-3 py-2 border border-[#3e3e42] text-gray-300">${c}</td>`; });
            html += '</tr>';
          }
        });
        html += '</tbody></table></div>';
        blocks.push(html);
        continue;
      }
    }

    // 6. Lists (Unordered, Ordered, Task Lists)
    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const listItems: string[] = [];
      const listStartLine = lineNum;
      while (i < lines.length) {
        const itemMatch = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (!itemMatch) break;
        const itemLine = i + 1;
        const rawItemText = itemMatch[3];
        const taskMatch = rawItemText.match(/^\[([ xX])\]\s+(.*)$/);
        if (taskMatch) {
          const checked = taskMatch[1].toLowerCase() === 'x';
          const itemText = formatInlineMarkdown(taskMatch[2], basePath, workspaceRoot);
          listItems.push(`
            <li data-line="${itemLine}" class="flex items-center space-x-2 my-1 list-none">
              <input type="checkbox" data-task-line="${itemLine}" ${checked ? 'checked' : ''} class="task-checkbox-input rounded cursor-pointer mr-2 accent-[#007acc]" />
              <span class="${checked ? 'line-through text-gray-500' : ''}">${itemText}</span>
            </li>
          `);
        } else {
          const isNum = /\d+\./.test(itemMatch[2]);
          const itemText = formatInlineMarkdown(rawItemText, basePath, workspaceRoot);
          listItems.push(`<li data-line="${itemLine}" class="ml-4 ${isNum ? 'list-decimal' : 'list-disc'} text-gray-300 my-0.5">${itemText}</li>`);
        }
        i++;
      }
      blocks.push(`<ul data-line="${listStartLine}" class="my-2 space-y-0.5">${listItems.join('\n')}</ul>`);
      continue;
    }

    // 7. Raw HTML block
    if (line.trim().startsWith('<')) {
      const htmlStartLine = lineNum;
      const htmlLines: string[] = [];
      while (i < lines.length && lines[i].trim()) {
        htmlLines.push(lines[i]);
        i++;
      }
      let htmlBlock = htmlLines.join('\n');
      htmlBlock = resolveHtmlImages(htmlBlock, basePath, workspaceRoot);
      blocks.push(`<div data-line="${htmlStartLine}">${htmlBlock}</div>`);
      continue;
    }

    // 8. Regular Paragraph with data-line
    const paraLines: string[] = [];
    const paraStartLine = lineNum;
    paraLines.push(lines[i]);
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].match(/^(?:#{1,6}\s|```|---|\*\*\*|___|>|[-*]\s|\d+\.\s|\||<|\$\$)/)
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    const paraText = formatInlineMarkdown(paraLines.join('\n'), basePath, workspaceRoot);
    const paraHtml = paraText
      .split('\n')
      .map((part, index) =>
        `${index > 0 ? `<br data-line="${paraStartLine + index}" />` : ''}${part}`
      )
      .join('');
    blocks.push(`<p data-line="${paraStartLine}" class="my-2 leading-relaxed text-gray-300 text-sm">${paraHtml}</p>`);
  }

  const rawHtml = blocks.join('\n');
  return sanitizeMarkdownHtml(rawHtml);
}

/**
 * Extracts a Table of Contents (TOC) from Markdown headings.
 */
export interface TocHeadingItem {
  level: number;
  title: string;
  slug: string;
  line: number;
}

export function extractTableOfContents(markdown: string): TocHeadingItem[] {
  const items: TocHeadingItem[] = [];
  const lines = markdown.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.*)$/);
    if (match) {
      const level = match[1].length;
      const rawTitle = match[2].replace(/[*_~`]/g, '').trim();
      const slug = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      items.push({
        level,
        title: rawTitle,
        slug: slug || `heading-${i + 1}`,
        line: i + 1,
      });
    }
  }

  return items;
}

/**
 * Markdown linter checking for common structural issues (MD001 heading skips, MD009 trailing whitespace).
 */
export interface MarkdownLintIssue {
  line: number;
  rule: string;
  message: string;
}

export function lintMarkdown(markdown: string): MarkdownLintIssue[] {
  const issues: MarkdownLintIssue[] = [];
  const lines = markdown.split('\n');
  let prevHeaderLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // MD009: Trailing spaces
    if (/\s+$/.test(line)) {
      issues.push({
        line: i + 1,
        rule: 'MD009/no-trailing-spaces',
        message: 'Trailing whitespace detected at end of line.',
      });
    }

    // MD001: Heading level increment
    const headerMatch = line.match(/^(#{1,6})\s/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      if (prevHeaderLevel > 0 && level > prevHeaderLevel + 1) {
        issues.push({
          line: i + 1,
          rule: 'MD001/heading-increment',
          message: `Heading levels should only increment by one level at a time (skipped from H${prevHeaderLevel} to H${level}).`,
        });
      }
      prevHeaderLevel = level;
    }
  }

  return issues;
}
