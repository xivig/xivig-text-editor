import { describe, it, expect } from 'vitest';
import { renderAndSanitizeMarkdown, sanitizeMarkdownHtml } from '../utils/markdownSanitizer';

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
});
