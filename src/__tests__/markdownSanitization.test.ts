import { describe, it, expect } from 'vitest';
import { renderAndSanitizeMarkdown, sanitizeMarkdownHtml, resolveMarkdownImagePath } from '../utils/markdownSanitizer';

describe('Markdown Sanitization with DOMPurify (P1 Finding)', () => {
  it('neutralizes malicious script tags', () => {
    const malicious = '# Hello\n<script>alert("xss")</script>\nParagraph text';
    const output = renderAndSanitizeMarkdown(malicious);

    expect(output).not.toContain('<script');
    expect(output).not.toContain('alert("xss")');
    expect(output).toContain('Hello');
    expect(output).toContain('Paragraph text');
  });

  it('strips inline event handlers (onerror, onload, onclick, onmouseover)', () => {
    const malicious = '<img src="invalid-image" onerror="alert(\'pwned\')" />\n<p onclick="steal()">Click</p>';
    const output = sanitizeMarkdownHtml(malicious);

    expect(output).not.toContain('onerror');
    expect(output).not.toContain('onclick');
    expect(output).not.toContain('alert');
    expect(output).not.toContain('steal');
  });

  it('strips dangerous javascript: and vbscript: URI schemes from links', () => {
    const malicious = '[Click here](javascript:alert(document.cookie))\n[VBScript](vbscript:msgbox(1))';
    const output = renderAndSanitizeMarkdown(malicious);

    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('vbscript:');
    expect(output).not.toContain('document.cookie');
  });

  it('removes unauthorized iframes, objects, and embeds', () => {
    const malicious = '<iframe src="https://attacker.com/login"></iframe><object data="exploit.swf"></object><embed src="bad.pdf">';
    const output = renderAndSanitizeMarkdown(malicious);

    expect(output).not.toContain('<iframe');
    expect(output).not.toContain('<object');
    expect(output).not.toContain('<embed');
  });

  it('renders standard markdown formatting safely', () => {
    const valid = '# Heading 1\n\n**Bold Text** and *Italic Text*\n\n`const x = 10;`\n\n- Item 1\n- Item 2';
    const output = renderAndSanitizeMarkdown(valid);

    expect(output).toContain('<h1');
    expect(output).toContain('Heading 1');
    expect(output).toContain('<strong');
    expect(output).toContain('Bold Text');
    expect(output).toContain('<code');
    expect(output).toContain('const x = 10;');
    expect(output).toContain('<li');
  });

  it('tags headings, paragraphs, and sections with data-line for live scroll synchronization', () => {
    const markdown = '# Main Title\n\nIntro paragraph\n\n## Section Two\n\n```js\nconsole.log(1);\n```';
    const output = renderAndSanitizeMarkdown(markdown);

    expect(output).toContain('<h1 data-line="1"');
    expect(output).toContain('<p data-line="3"');
    expect(output).toContain('<h2 data-line="5"');
    expect(output).toContain('<div data-line="7"');
  });

  it('preserves image dimensions width and height attributes in DOMPurify', () => {
    const htmlWithImg = '<p align="center"><img src="public/logo.png" width="96" height="96" alt="Logo" /></p>';
    const sanitized = sanitizeMarkdownHtml(htmlWithImg);

    expect(sanitized).toContain('width="96"');
    expect(sanitized).toContain('height="96"');
    expect(sanitized).toContain('alt="Logo"');
  });

  it('correctly rewrites HTML images with dimension styling and without rogue trailing tags', () => {
    const md = '<p align="center">\n  <img src="public/logo.png" alt="Xivig Text Editor" width="96" height="96" style="width: 96px; height: 96px; object-fit: contain;" />\n</p>';
    const output = renderAndSanitizeMarkdown(md, 'E:/my-project', 'E:/my-project');

    expect(output).toContain('width: 96px');
    expect(output).toContain('height: 96px');
    expect(output).not.toContain('&gt;&gt;');
    expect(output).not.toContain('/>>');
  });

  it('resolves local relative image paths to file:/// URLs using basePath and workspaceRoot', () => {
    const resolved = resolveMarkdownImagePath('public/logo.png', 'E:/my-project', 'E:/my-project');
    expect(resolved).toMatch(/^file:\/\/\/E:\/my-project\/public\/logo\.png$/i);

    const external = resolveMarkdownImagePath('https://example.com/image.png');
    expect(external).toBe('https://example.com/image.png');

    const dataUri = resolveMarkdownImagePath('data:image/png;base64,abc');
    expect(dataUri).toBe('data:image/png;base64,abc');
  });
});
