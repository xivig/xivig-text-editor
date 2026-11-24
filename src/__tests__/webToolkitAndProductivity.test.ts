import { describe, it, expect } from 'vitest';
import { validateHtmlDocument } from '../components/webToolkit/htmlValidator';
import { extractHtmlOutline } from '../components/webToolkit/htmlOutline';
import {
  calculateCssSpecificity,
  extractCssClasses,
  extractCssVariables,
  validateCssSelector,
} from '../components/webToolkit/cssTools';
import {
  renderAndSanitizeMarkdown,
  extractTableOfContents,
  lintMarkdown,
} from '../utils/markdownSanitizer';
import { exportMarkdownToHtml } from '../utils/markdownExporter';
import { isolatedExtensionHost } from '../extensions/host/isolatedExtensionHost';

describe('Web Toolkit & Markdown & Productivity Suite', () => {
  describe('HTML Validation & Accessibility & SEO', () => {
    it('detects unclosed void tag issues and structure', () => {
      const html = '<div><img></img><br></br></div>';
      const issues = validateHtmlDocument(html);
      const voidIssue = issues.find((i) => i.id.startsWith('html-void-close'));
      expect(voidIssue).toBeDefined();
    });

    it('identifies accessibility violations: missing image alt text and empty buttons', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Test Page</title></head>
          <body>
            <img src="avatar.png">
            <button></button>
            <a href="/login"></a>
          </body>
        </html>
      `;
      const issues = validateHtmlDocument(html);
      const a11yImg = issues.find((i) => i.rule === 'a11y/img-has-alt');
      const a11yBtn = issues.find((i) => i.rule === 'a11y/button-has-name');
      const a11yLink = issues.find((i) => i.rule === 'a11y/link-has-name');

      expect(a11yImg).toBeDefined();
      expect(a11yBtn).toBeDefined();
      expect(a11yLink).toBeDefined();
    });

    it('identifies SEO checks: title, meta description and viewport', () => {
      const html = '<html><body><h1>Welcome</h1></body></html>';
      const issues = validateHtmlDocument(html);
      const missingTitle = issues.find((i) => i.rule === 'seo/title');
      const missingViewport = issues.find((i) => i.rule === 'seo/viewport');

      expect(missingTitle).toBeDefined();
      expect(missingViewport).toBeDefined();
    });

    it('extracts hierarchical DOM outline with line numbers', () => {
      const html = `
        <header id="main-header" class="header-dark">
          <nav class="nav-bar">
            <a href="/">Home</a>
          </nav>
        </header>
        <main>
          <article id="post-1">
            <h2>Post Title</h2>
          </article>
        </main>
      `;
      const outline = extractHtmlOutline(html);
      expect(outline.length).toBeGreaterThan(0);
      expect(outline[0].tag).toBe('header');
      expect(outline[0].elementId).toBe('main-header');
      expect(outline[0].classes).toContain('header-dark');
      expect(outline[0].children.length).toBeGreaterThan(0);
    });
  });

  describe('CSS Tools & Specificity', () => {
    it('calculates CSS specificity correctly', () => {
      const idSpec = calculateCssSpecificity('#navbar');
      expect(idSpec.a).toBe(1);
      expect(idSpec.b).toBe(0);
      expect(idSpec.c).toBe(0);

      const classSpec = calculateCssSpecificity('.btn.btn-primary');
      expect(classSpec.a).toBe(0);
      expect(classSpec.b).toBe(2);
      expect(classSpec.c).toBe(0);

      const complexSpec = calculateCssSpecificity('div.container #header > ul.nav li:hover');
      expect(complexSpec.a).toBe(1); // #header
      expect(complexSpec.b).toBe(3); // .container, .nav, :hover
      expect(complexSpec.c).toBe(3); // div, ul, li
    });

    it('validates CSS selectors', () => {
      expect(validateCssSelector('.valid-class > div:first-child').valid).toBe(true);
      expect(validateCssSelector('div:hover::after').valid).toBe(true);
      expect(validateCssSelector('div[').valid).toBe(false);
      expect(validateCssSelector('div >').valid).toBe(false);
    });

    it('extracts CSS variables and classes', () => {
      const css = `
        :root {
          --primary-color: #6c8cff;
          --font-size-base: 16px;
        }
        .app-container {
          background-color: var(--primary-color);
        }
        .header-nav.sticky-top {
          display: flex;
        }
      `;
      const vars = extractCssVariables(css);
      const varNames = vars.map((v) => v.name);
      expect(varNames).toContain('--primary-color');
      expect(varNames).toContain('--font-size-base');

      const classes = extractCssClasses(css);
      const classNames = classes.map((c) => c.name);
      expect(classNames).toContain('app-container');
      expect(classNames).toContain('header-nav');
      expect(classNames).toContain('sticky-top');
    });
  });

  describe('Markdown & Documentation Suite', () => {
    it('renders GitHub Flavored Markdown with task lists and code blocks', () => {
      const markdown = `
# Title

- [x] Completed task
- [ ] Incomplete task

\`\`\`javascript
const greeting = "Hello, Xivig";
\`\`\`
      `;
      const html = renderAndSanitizeMarkdown(markdown);
      expect(html).toContain('checkbox');
      expect(html).toContain('data-task-line');
      expect(html).toContain('markdown-copy-btn');
    });

    it('renders math equations and generates Mermaid diagrams', () => {
      const mathMarkdown = 'The Pythagorean theorem is $a^2 + b^2 = c^2$.';
      const mathHtml = renderAndSanitizeMarkdown(mathMarkdown);
      expect(mathHtml).toContain('\\( a^2 + b^2 = c^2 \\)');

      const mermaidMarkdown = `
\`\`\`mermaid
graph TD
  A[Start] --> B(Process)
  B --> C[Finish]
\`\`\`
      `;
      const mermaidHtml = renderAndSanitizeMarkdown(mermaidMarkdown);
      expect(mermaidHtml).toContain('Mermaid Diagram');
      expect(mermaidHtml).toContain('<svg');
    });

    it('extracts Table of Contents with slugs and heading anchors', () => {
      const markdown = `
# Introduction
## Getting Started
### Prerequisites
## Advanced Architecture
      `;
      const toc = extractTableOfContents(markdown);
      expect(toc.length).toBe(4);
      expect(toc[0].title).toBe('Introduction');
      expect(toc[0].level).toBe(1);
      expect(toc[1].title).toBe('Getting Started');
      expect(toc[1].slug).toBe('getting-started');
      expect(toc[2].level).toBe(3);
    });

    it('lints markdown and reports style issues', () => {
      const markdown = '# Title\n\n### Skipped level from 1 to 3\n';
      const lintIssues = lintMarkdown(markdown);
      const skipped = lintIssues.find((i) => i.rule === 'MD001/heading-increment');
      expect(skipped).toBeDefined();
    });

    it('exports self-contained HTML document with stylesheet', () => {
      const renderedHtml = '<h1>Export Title</h1><p>Welcome to Xivig export!</p>';
      const htmlDoc = exportMarkdownToHtml('Custom Document', renderedHtml);
      expect(htmlDoc).toContain('<!DOCTYPE html>');
      expect(htmlDoc).toContain('<title>Custom Document</title>');
      expect(htmlDoc).toContain('Export Title');
    });
  });

  describe('Isolated Extension Host Sandbox', () => {
    it('registers and executes sandboxed commands only with permission', () => {
      isolatedExtensionHost.clear();

      let executed = false;
      const res = isolatedExtensionHost.activateExtension(
        'test-plugin',
        ['commands.register'],
        (api) => {
          api.commands.registerCommand('test.sayHi', () => {
            executed = true;
            return 'Hi!';
          });
        }
      );

      expect(res.success).toBe(true);
      const commandResult = isolatedExtensionHost.executeCommand('test.sayHi');
      expect(commandResult).toBe('Hi!');
      expect(executed).toBe(true);
    });

    it('denies unpermitted capability requests in sandboxed host', () => {
      isolatedExtensionHost.clear();

      isolatedExtensionHost.activateExtension(
        'restricted-plugin',
        [], // No permissions granted
        (api) => {
          // Attempting to register status bar item without 'ui.statusbar' permission
          try {
            api.window.createStatusBarItem('status-1', 'Running');
          } catch (e) {
            // Caught permission error
          }
        }
      );

      const items = isolatedExtensionHost.getStatusBarItems();
      expect(items.length).toBe(0);
    });
  });
});
