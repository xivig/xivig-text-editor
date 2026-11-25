import { describe, it, expect, beforeEach } from 'vitest';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';

import {
  // Live Server
  validatePort,
  isPathReloadEligible,
  computeLiveServerUrl,
  liveServerExtensionModule,

  // Live Preview
  calculateEmulatedViewport,
  generatePreviewInjectionScript,
  livePreviewExtensionModule,

  // HTML CSS Support
  CssSelectorCatalog,
  createHtmlCssCompletionSource,
  htmlCssSupportExtensionModule,

  // CSS Peek
  findCssSelectorDefinitions,
  formatCssPeekPreview,
  cssPeekExtensionModule,

  // CSS Class IntelliSense & Specificity
  calculateCssSpecificity,
  compareSpecificity,
  formatSpecificityBadge,
  cssClassIntellisenseExtensionModule,

  // Tailwind CSS
  getTailwindClass,
  searchTailwindClasses,
  getTailwindHoverCss,
  createTailwindCompletionSource,
  tailwindIntellisenseExtensionModule,

  // Bootstrap
  searchBootstrapClasses,
  getBootstrapSnippet,
  createBootstrapCompletionSource,
  bootstrapIntellisenseExtensionModule,

  // SVG Viewer
  sanitizeSvg,
  extractSvgMetadata,
  optimizeSvg,
  svgToDataUri,
  svgViewerExtensionModule,
} from '../extensions/builtin/web';

describe('Category 4: Web Development Extensions', () => {
  // --------------------------------------------------------------------------
  // 1. Live Server
  // --------------------------------------------------------------------------
  describe('Live Server Extension', () => {
    it('validates TCP port numbers correctly', () => {
      expect(validatePort(5500).valid).toBe(true);
      expect(validatePort(8080).port).toBe(8080);
      expect(validatePort(80).valid).toBe(false); // < 1024
      expect(validatePort(70000).valid).toBe(false); // > 65535
      expect(validatePort(3.14).valid).toBe(false);
    });

    it('identifies file paths eligible for live reload', () => {
      expect(isPathReloadEligible('src/index.html')).toBe(true);
      expect(isPathReloadEligible('styles/app.css')).toBe(true);
      expect(isPathReloadEligible('resources/views/welcome.blade.php')).toBe(true);
      expect(isPathReloadEligible('assets/logo.svg')).toBe(true);
      expect(isPathReloadEligible('node_modules/pkg/index.js')).toBe(false);
      expect(isPathReloadEligible('.git/HEAD')).toBe(false);
      expect(isPathReloadEligible('dist/bundle.js')).toBe(false);
    });

    it('computes HTTP preview URLs accurately relative to workspace root', () => {
      const url = computeLiveServerUrl('/workspace/project', '/workspace/project/pages/about.html', 5500);
      expect(url).toBe('http://127.0.0.1:5500/pages/about.html');

      const fallback = computeLiveServerUrl('/workspace/project', undefined, 3000);
      expect(fallback).toBe('http://127.0.0.1:3000');
    });

    it('manifests with proper metadata', () => {
      expect(liveServerExtensionModule.manifest.id).toBe('xivig.live-server');
      expect(liveServerExtensionModule.manifest.categories).toContain('Productivity');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Live Preview
  // --------------------------------------------------------------------------
  describe('Live Preview Extension', () => {
    it('calculates emulated viewport for responsive preset', () => {
      const vp = calculateEmulatedViewport('responsive');
      expect(vp.width).toBe('100%');
      expect(vp.height).toBe('100%');
      expect(vp.zoom).toBe(100);
    });

    it('calculates emulated viewport for iPhone 14 in portrait and landscape', () => {
      const portrait = calculateEmulatedViewport('iphone14', 'portrait', 100);
      expect(portrait.width).toBe(390);
      expect(portrait.height).toBe(844);
      expect(portrait.dpr).toBe(3);

      const landscape = calculateEmulatedViewport('iphone14', 'landscape', 100);
      expect(landscape.width).toBe(844);
      expect(landscape.height).toBe(390);
    });

    it('calculates emulated viewport for Pixel 7 and Desktop presets', () => {
      const pixel = calculateEmulatedViewport('pixel7');
      expect(pixel.width).toBe(412);
      expect(pixel.height).toBe(915);

      const desktop = calculateEmulatedViewport('desktop');
      expect(desktop.width).toBe(1920);
      expect(desktop.height).toBe(1080);
    });

    it('generates preview injection script capturing console logs and inspect overlay', () => {
      const script = generatePreviewInjectionScript({ captureConsole: true, inspectMode: true });
      expect(script).toContain('__xivig_preview_initialized');
      expect(script).toContain('xivig-preview-console');
      expect(script).toContain('__xivig_inspect_overlay');
      expect(script).toContain('xivig-preview-inspect');
    });

    it('manifests with proper metadata', () => {
      expect(livePreviewExtensionModule.manifest.id).toBe('xivig.live-preview');
    });
  });

  // --------------------------------------------------------------------------
  // 3. HTML CSS Support
  // --------------------------------------------------------------------------
  describe('HTML CSS Support Extension', () => {
    let catalog: CssSelectorCatalog;

    beforeEach(() => {
      catalog = new CssSelectorCatalog();
    });

    it('scrapes class and id selectors from CSS stylesheets', () => {
      const css = `
        .navbar-brand { font-size: 1.5rem; color: #fff; }
        #main-container { max-width: 1200px; margin: 0 auto; }
        .btn, .btn-primary { background-color: #007bff; }
      `;
      catalog.indexCssDocument(css, 'style.css');

      expect(catalog.getAllClassNames()).toContain('navbar-brand');
      expect(catalog.getAllClassNames()).toContain('btn');
      expect(catalog.getAllClassNames()).toContain('btn-primary');
      expect(catalog.getAllIdNames()).toContain('main-container');

      const btnClasses = catalog.getClasses('btn');
      expect(btnClasses.length).toBeGreaterThanOrEqual(2);
    });

    it('scrapes classes and ids from HTML documents', () => {
      const html = `
        <div id="app" class="wrapper page-container">
          <header className="hero-header"></header>
        </div>
      `;
      catalog.indexHtmlDocument(html, 'index.html');

      expect(catalog.getAllClassNames()).toContain('wrapper');
      expect(catalog.getAllClassNames()).toContain('page-container');
      expect(catalog.getAllClassNames()).toContain('hero-header');
      expect(catalog.getAllIdNames()).toContain('app');
    });

    it('provides CodeMirror autocompletions when inside class="..." or id="..."', () => {
      catalog.addClass({ name: 'custom-card', rawSelector: '.custom-card', type: 'class', file: 'app.css' });
      catalog.addId({ name: 'main-header', rawSelector: '#main-header', type: 'id', file: 'app.css' });

      const source = createHtmlCssCompletionSource(catalog);

      // 1. Inside class attribute
      const docClass = '<div class="custom-';
      const stateClass = EditorState.create({ doc: docClass });
      const ctxClass = new CompletionContext(stateClass, docClass.length, false);
      const resClass = source(ctxClass);

      expect(resClass).not.toBeNull();
      expect(resClass?.options.some((o) => o.label === 'custom-card')).toBe(true);

      // 2. Inside id attribute
      const docId = '<div id="main-';
      const stateId = EditorState.create({ doc: docId });
      const ctxId = new CompletionContext(stateId, docId.length, false);
      const resId = source(ctxId);

      expect(resId).not.toBeNull();
      expect(resId?.options.some((o) => o.label === 'main-header')).toBe(true);

      // 3. Outside attributes
      const docOutside = '<div ';
      const stateOutside = EditorState.create({ doc: docOutside });
      const ctxOutside = new CompletionContext(stateOutside, docOutside.length, false);
      expect(source(ctxOutside)).toBeNull();
    });

    it('manifests with proper metadata', () => {
      expect(htmlCssSupportExtensionModule.manifest.id).toBe('xivig.html-css-support');
    });
  });

  // --------------------------------------------------------------------------
  // 4. CSS Peek
  // --------------------------------------------------------------------------
  describe('CSS Peek Extension', () => {
    const sampleCssFiles = [
      {
        path: '/workspace/css/buttons.css',
        content: `
          .btn { display: inline-block; padding: 0.5rem 1rem; }
          .btn-primary { background: #007bff; color: #fff; }
        `,
      },
      {
        path: '/workspace/css/layout.css',
        content: `
          #sidebar { width: 250px; position: fixed; }
        `,
      },
    ];

    it('locates selector definitions and rule blocks accurately', () => {
      const results = findCssSelectorDefinitions('btn-primary', 'class', sampleCssFiles);
      expect(results.length).toBe(1);
      expect(results[0].file).toBe('/workspace/css/buttons.css');
      expect(results[0].line).toBeGreaterThanOrEqual(2);
      expect(results[0].cssBlock).toContain('background: #007bff');

      const idResults = findCssSelectorDefinitions('sidebar', 'id', sampleCssFiles);
      expect(idResults.length).toBe(1);
      expect(idResults[0].cssBlock).toContain('width: 250px');
    });

    it('formats peek preview markdown cleanly', () => {
      const results = findCssSelectorDefinitions('btn-primary', 'class', sampleCssFiles);
      const formatted = formatCssPeekPreview(results[0]);
      expect(formatted).toContain('### .btn-primary');
      expect(formatted).toContain('buttons.css:');
      expect(formatted).toContain('```css');
    });

    it('returns empty array when selector is not present', () => {
      const results = findCssSelectorDefinitions('non-existent-class', 'class', sampleCssFiles);
      expect(results).toEqual([]);
    });

    it('manifests with proper metadata', () => {
      expect(cssPeekExtensionModule.manifest.id).toBe('xivig.css-peek');
    });
  });

  // --------------------------------------------------------------------------
  // 5. IntelliSense for CSS Class Names (Specificity Scoring)
  // --------------------------------------------------------------------------
  describe('IntelliSense for CSS Class Names & Specificity', () => {
    it('computes exact W3C specificity vectors (a, b, c)', () => {
      // Type selector only: (0, 0, 1)
      const pSpec = calculateCssSpecificity('p');
      expect(pSpec.formatted).toBe('(0, 0, 1)');
      expect(pSpec.score).toBe(1);
      expect(pSpec.category).toBe('low');

      // Class selector: (0, 1, 0)
      const btnSpec = calculateCssSpecificity('.btn');
      expect(btnSpec.formatted).toBe('(0, 1, 0)');
      expect(btnSpec.score).toBe(100);
      expect(btnSpec.category).toBe('medium');

      // ID selector: (1, 0, 0)
      const idSpec = calculateCssSpecificity('#header');
      expect(idSpec.formatted).toBe('(1, 0, 0)');
      expect(idSpec.score).toBe(1000);
      expect(idSpec.category).toBe('high');

      // Multiple IDs: (2, 0, 0)
      const multiId = calculateCssSpecificity('#header #nav');
      expect(multiId.formatted).toBe('(2, 0, 0)');
      expect(multiId.category).toBe('ultra');

      // Complex: div#sidebar ul.nav > li.active a:hover::after
      // a = 1 (#sidebar)
      // b = 3 (.nav, .active, :hover)
      // c = 4 (div, ul, li, a, plus pseudo-element ::after = 5)
      const complex = calculateCssSpecificity('div#sidebar ul.nav > li.active a:hover::after');
      expect(complex.a).toBe(1);
      expect(complex.b).toBe(3);
      expect(complex.c).toBe(5);
      expect(complex.formatted).toBe('(1, 3, 5)');
    });

    it('compares specificity rules correctly', () => {
      expect(compareSpecificity('#header', '.navbar')).toBe(1); // ID beats class
      expect(compareSpecificity('.btn', 'button')).toBe(1); // Class beats element
      expect(compareSpecificity('div.container', '.container')).toBe(1); // (0, 1, 1) beats (0, 1, 0)
      expect(compareSpecificity('.btn', '.btn')).toBe(0); // Equal
    });

    it('formats specificity badge string', () => {
      const spec = calculateCssSpecificity('.active:hover');
      const badge = formatSpecificityBadge(spec);
      expect(badge).toBe('[Spec: (0, 2, 0) - MEDIUM]');
    });

    it('manifests with proper metadata', () => {
      expect(cssClassIntellisenseExtensionModule.manifest.id).toBe('xivig.css-class-intellisense');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Tailwind CSS IntelliSense
  // --------------------------------------------------------------------------
  describe('Tailwind CSS IntelliSense', () => {
    it('searches and resolves utility classes', () => {
      const flexItem = getTailwindClass('flex');
      expect(flexItem).toBeDefined();
      expect(flexItem?.cssRules).toContain('display: flex;');

      const bgRed = getTailwindClass('bg-red-500');
      expect(bgRed).toBeDefined();
      expect(bgRed?.colorPreview).toBe('#ef4444');

      const matches = searchTailwindClasses('justify-');
      expect(matches.length).toBeGreaterThanOrEqual(3);
      expect(matches.some((m) => m.name === 'justify-center')).toBe(true);
      expect(matches.some((m) => m.name === 'justify-between')).toBe(true);
    });

    it('expands utility classes to raw CSS rule format for hover preview', () => {
      const hoverP4 = getTailwindHoverCss('p-4');
      expect(hoverP4).toContain('.p-4 {');
      expect(hoverP4).toContain('padding: 1rem;');

      expect(getTailwindHoverCss('unknown-tailwind-class')).toBeNull();
    });

    it('provides CodeMirror completion source for Tailwind utilities', () => {
      const source = createTailwindCompletionSource();
      const doc = '<div class="bg-red-';
      const state = EditorState.create({ doc });
      const ctx = new CompletionContext(state, doc.length, false);
      const res = source(ctx);

      expect(res).not.toBeNull();
      expect(res?.options.some((o) => o.label === 'bg-red-500')).toBe(true);
      const red500 = res?.options.find((o) => o.label === 'bg-red-500');
      expect(red500?.detail).toContain('#ef4444');
    });

    it('manifests with proper metadata', () => {
      expect(tailwindIntellisenseExtensionModule.manifest.id).toBe('xivig.tailwindcss-intellisense');
    });
  });

  // --------------------------------------------------------------------------
  // 7. Bootstrap IntelliSense
  // --------------------------------------------------------------------------
  describe('Bootstrap IntelliSense Extension', () => {
    it('searches Bootstrap classes across grid, components, and colors', () => {
      const gridMatches = searchBootstrapClasses('col-md-');
      expect(gridMatches.length).toBeGreaterThanOrEqual(1);
      expect(gridMatches[0].category).toBe('grid');

      const btnMatches = searchBootstrapClasses('btn-primary');
      expect(btnMatches.length).toBe(1);
      expect(btnMatches[0].category).toBe('color');
    });

    it('retrieves Bootstrap 5.3 starter and component snippets', () => {
      const template = getBootstrapSnippet('bs5-template');
      expect(template).toBeDefined();
      expect(template?.template).toContain('bootstrap@5.3.3');

      const navbar = getBootstrapSnippet('bs5-navbar');
      expect(navbar).toBeDefined();
      expect(navbar?.template).toContain('class="navbar navbar-expand-lg');

      const modal = getBootstrapSnippet('bs5-modal');
      expect(modal).toBeDefined();
      expect(modal?.template).toContain('class="modal-dialog');
    });

    it('provides completions for bs5- snippets and bootstrap classes', () => {
      const source = createBootstrapCompletionSource();

      // 1. Snippet trigger
      const snippetDoc = 'bs5-';
      const snippetState = EditorState.create({ doc: snippetDoc });
      const snippetCtx = new CompletionContext(snippetState, snippetDoc.length, false);
      const snippetRes = source(snippetCtx);
      expect(snippetRes).not.toBeNull();
      expect(snippetRes?.options.some((o) => o.label === 'bs5-template')).toBe(true);

      // 2. Class trigger
      const classDoc = '<div class="alert-';
      const classState = EditorState.create({ doc: classDoc });
      const classCtx = new CompletionContext(classState, classDoc.length, false);
      const classRes = source(classCtx);
      expect(classRes).not.toBeNull();
      expect(classRes?.options.some((o) => o.label === 'alert-primary')).toBe(true);
    });

    it('provides snippets for HTML documents via module getSnippets', () => {
      const snippets = bootstrapIntellisenseExtensionModule.getSnippets?.('html');
      expect(snippets).toBeDefined();
      expect(snippets?.length).toBeGreaterThanOrEqual(4);
    });

    it('manifests with proper metadata', () => {
      expect(bootstrapIntellisenseExtensionModule.manifest.id).toBe('xivig.bootstrap-intellisense');
    });
  });

  // --------------------------------------------------------------------------
  // 8. SVG Viewer & Sanitizer
  // --------------------------------------------------------------------------
  describe('SVG Viewer & Sanitizer Extension', () => {
    const maliciousSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="40" fill="#ff0000" stroke="#000000" onload="alert('XSS')" />
        <script>window.location='https://evil.com'</script>
        <a href="javascript:alert(1)"><path d="M10 10 H 90 V 90 H 10 L 10 10" fill="#00ff00"/></a>
      </svg>
    `;

    const cleanSvg = `
      <!-- Generator: Adobe Illustrator -->
      <svg viewBox="0 0 200 200" width="200" height="200">
        <rect x="10" y="10" width="180" height="180" fill="#3b82f6" stroke="#1d4ed8" />
        <path d="M 20 20 L 180 180" stroke="#ffffff" />
      </svg>
    `;

    it('strips dangerous scripts, onload handlers, and javascript: links', () => {
      const { cleanSvg: result, isClean, removedElements } = sanitizeSvg(maliciousSvg);
      expect(isClean).toBe(false);
      expect(removedElements.length).toBeGreaterThanOrEqual(2);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('onload=');
      expect(result).not.toContain('javascript:');
      expect(result).toContain('<circle');
    });

    it('extracts metadata (dimensions, viewBox, element/path count, colors)', () => {
      const meta = extractSvgMetadata(cleanSvg);
      expect(meta.width).toBe('200');
      expect(meta.height).toBe('200');
      expect(meta.viewBox).toBe('0 0 200 200');
      expect(meta.pathCount).toBe(1);
      expect(meta.elementCount).toBeGreaterThanOrEqual(3);
      expect(meta.colors).toContain('#3b82f6');
      expect(meta.colors).toContain('#1d4ed8');
      expect(meta.colors).toContain('#ffffff');
      expect(meta.isSanitized).toBe(true);
    });

    it('optimizes SVG markup by removing comments and extra whitespace', () => {
      const optimized = optimizeSvg(cleanSvg);
      expect(optimized).not.toContain('<!-- Generator: Adobe Illustrator -->');
      expect(optimized.length).toBeLessThan(cleanSvg.length);
    });

    it('generates browser-safe Data URI', () => {
      const dataUri = svgToDataUri(cleanSvg);
      expect(dataUri.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
      expect(dataUri).toContain('%3Crect');
    });

    it('manifests with proper metadata', () => {
      expect(svgViewerExtensionModule.manifest.id).toBe('xivig.svg-viewer');
    });
  });
});
