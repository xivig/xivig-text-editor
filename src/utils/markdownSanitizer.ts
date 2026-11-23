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
      'a', 'img', 'div', 'span', 'input',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class',
      'type', 'checked', 'disabled', 'target', 'rel',
    ],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'style', 'base', 'link', 'meta', 'applet'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'style'],
    // Disallow javascript:, vbscript:, and data: schemes for links
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|#):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'],
  });
}

/**
 * Parses raw Markdown text into structured HTML and applies DOMPurify sanitization.
 * Flow:
 * Markdown source -> Markdown parser -> HTML output -> DOMPurify sanitization -> Preview HTML
 */
export function renderAndSanitizeMarkdown(markdownContent: string): string {
  if (!markdownContent || !markdownContent.trim()) {
    return '<p class="text-gray-500 italic">No content to preview.</p>';
  }

  let md = markdownContent;

  // 1. Normalize line endings
  md = md.replace(/\r\n/g, '\n');

  // 2. Code blocks with syntax container
  md = md.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<div class="my-4 rounded-md overflow-hidden border border-[#3e3e42] bg-[#1a1a1a]">
      <div class="px-3 py-1 bg-[#252526] text-gray-400 text-xs font-mono border-b border-[#3e3e42] flex justify-between select-none">
        <span>${lang || 'text'}</span>
        <span>code</span>
      </div>
      <pre class="p-3 text-xs font-mono text-[#d4d4d4] overflow-x-auto whitespace-pre leading-relaxed"><code>${escapedCode}</code></pre>
    </div>`;
  });

  // 3. Inline code
  md = md.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#2d2d2d] text-[#ce9178] font-mono text-xs border border-[#3c3c3c]">$1</code>');

  // 4. Tables
  const tableRegex = /((?:\|[^\n]+\|\r?\n)+)/g;
  md = md.replace(tableRegex, (tableBlock) => {
    const rows = tableBlock.trim().split('\n').map((row) => row.trim());
    if (rows.length < 2) return tableBlock;

    let html = '<div class="overflow-x-auto my-4"><table class="w-full text-xs text-left border-collapse border border-[#3e3e42]">';
    rows.forEach((row, idx) => {
      if (idx === 1 && /^[|\s-:]+$/.test(row)) return;

      const cells = row
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

      if (idx === 0) {
        html += '<thead class="bg-[#252526] text-gray-200"><tr>';
        cells.forEach((c) => {
          html += `<th class="px-3 py-2 border border-[#3e3e42] font-semibold">${c}</th>`;
        });
        html += '</tr></thead><tbody>';
      } else {
        html += `<tr class="${idx % 2 === 0 ? 'bg-[#1e1e1e]' : 'bg-[#181818]'} hover:bg-[#282828]">`;
        cells.forEach((c) => {
          html += `<td class="px-3 py-2 border border-[#3e3e42] text-gray-300">${c}</td>`;
        });
        html += '</tr>';
      }
    });
    html += '</tbody></table></div>';
    return html;
  });

  // 5. Blockquotes
  md = md.replace(/^>\s?(.*)$/gm, '<blockquote class="border-l-4 border-[#007acc] pl-3 py-1 my-2 text-gray-400 bg-[#20252b] rounded-r italic">$1</blockquote>');

  // 6. Headers
  md = md.replace(/^######\s+(.*)$/gm, '<h6 class="text-xs font-bold text-gray-400 mt-4 mb-2 uppercase tracking-wider">$1</h6>');
  md = md.replace(/^#####\s+(.*)$/gm, '<h5 class="text-sm font-bold text-gray-300 mt-4 mb-2">$1</h5>');
  md = md.replace(/^####\s+(.*)$/gm, '<h4 class="text-base font-semibold text-gray-200 mt-5 mb-2">$1</h4>');
  md = md.replace(/^###\s+(.*)$/gm, '<h3 class="text-lg font-semibold text-[#569cd6] mt-6 mb-2 border-b border-[#2e2e2e] pb-1">$1</h3>');
  md = md.replace(/^##\s+(.*)$/gm, '<h2 class="text-xl font-bold text-[#4ec9b0] mt-7 mb-3 border-b border-[#333] pb-1.5">$1</h2>');
  md = md.replace(/^#\s+(.*)$/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-4 border-b border-[#444] pb-2">$1</h1>');

  // 7. Horizontal rule
  md = md.replace(/^(?:---|\*\*\*|___)$/gm, '<hr class="my-6 border-t border-[#3e3e42]" />');

  // 8. Task lists
  md = md.replace(/^[-*]\s+\[ \]\s+(.*)$/gm, '<li class="flex items-center space-x-2 my-1 list-none"><input type="checkbox" disabled class="rounded bg-[#2a2a2a] border-[#444]" /> <span>$1</span></li>');
  md = md.replace(/^[-*]\s+\[x\]\s+(.*)$/gm, '<li class="flex items-center space-x-2 my-1 list-none"><input type="checkbox" checked disabled class="rounded text-[#007acc]" /> <span class="line-through text-gray-500">$1</span></li>');

  // 9. Unordered & Ordered lists
  md = md.replace(/^[-*]\s+(.*)$/gm, '<li class="ml-4 list-disc text-gray-300 my-0.5">$1</li>');
  md = md.replace(/^(\d+)\.\s+(.*)$/gm, '<li class="ml-4 list-decimal text-gray-300 my-0.5">$2</li>');

  // 10. Bold & Italics
  md = md.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong class="font-bold text-white"><em>$1</em></strong>');
  md = md.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
  md = md.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-300">$1</em>');
  md = md.replace(/~~([^~]+)~~/g, '<del class="line-through text-gray-500">$1</del>');

  // 11. Links & Images
  md = md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded border border-[#3e3e42] my-3 inline-block" />');
  md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#3794ff] hover:underline cursor-pointer">$1</a>');

  // 12. Paragraph line breaks
  const paragraphs = md.split(/\n\n+/);
  const rawHtml = paragraphs
    .map((p) => {
      p = p.trim();
      if (
        p.startsWith('<h') ||
        p.startsWith('<div') ||
        p.startsWith('<pre') ||
        p.startsWith('<blockquote') ||
        p.startsWith('<hr') ||
        p.startsWith('<table') ||
        p.startsWith('<li')
      ) {
        return p;
      }
      return `<p class="my-2 leading-relaxed text-gray-300 text-sm">${p.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');

  // 13. DOMPurify Sanitization Stage
  return sanitizeMarkdownHtml(rawHtml);
}
