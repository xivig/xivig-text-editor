import { test, expect, _electron as electron } from '@playwright/test';
import path from 'node:path';

test.describe('Xivig Editor Application Workflows', () => {
  let app: any;

  test.beforeEach(async () => {
    app = await electron.launch({
      args: [path.resolve(__dirname, '..')],
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    });
  });

  test.afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('launches application and displays editor window', async () => {
    const window = await app.firstWindow();
    expect(window).toBeTruthy();

    const title = await window.title();
    expect(title).toContain('Xivig');

    // Verify root layout container is rendered
    const root = await window.$('#root');
    expect(root).toBeTruthy();
  });

  test('loads welcome view or editor surface', async () => {
    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Verify main editor element exists
    const mainArea = await window.$('main');
    expect(mainArea).toBeTruthy();
  });

  test('renders markdown preview and enables vertical scrolling', async () => {
    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await window.waitForTimeout(1000);

    // Switch to README.md tab if present or open a markdown document
    const readmeTab = await window.$('text=README.md');
    if (readmeTab) {
      await readmeTab.click();
      await window.waitForTimeout(500);
    }

    // Ensure Markdown preview is open
    let hasPreview = await window.$('.markdown-preview');
    if (!hasPreview) {
      // Click Markdown preview icon or press shortcut
      const mdBtn = await window.$('button[title*="Markdown"]');
      if (mdBtn) {
        await mdBtn.click();
      } else {
        await window.keyboard.press('Control+Shift+V');
      }
      await window.waitForTimeout(1000);
      hasPreview = await window.$('.markdown-preview');
    }
    expect(hasPreview).toBeTruthy();

    // Verify preview has constrained height and can scroll
    const previewState = await window.evaluate(() => {
      const preview = document.querySelector('.markdown-preview') as HTMLElement;
      if (!preview) return { found: false, canScroll: false, scrolled: false };

      const initialScroll = preview.scrollTop;
      preview.scrollTop = 300;
      const scrolledTop = preview.scrollTop;

      return {
        found: true,
        clientHeight: preview.clientHeight,
        scrollHeight: preview.scrollHeight,
        canScroll: preview.scrollHeight > preview.clientHeight,
        scrolled: scrolledTop > initialScroll,
      };
    });

    expect(previewState.found).toBe(true);
    expect(previewState.canScroll).toBe(true);
    expect(previewState.scrolled).toBe(true);
  });

  test('renders html live preview with full height iframe and aligned toolbar', async () => {
    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await window.waitForTimeout(1000);

    // Switch to index.html tab
    const indexTab = await window.$('text=index.html');
    if (indexTab) {
      await indexTab.click();
      await window.waitForTimeout(500);
    }

    // Click Live Web Preview button (title contains "Live Web Preview")
    const liveBtn = await window.$('button[title*="Live Web Preview"]');
    if (liveBtn) {
      await liveBtn.click();
    } else {
      await window.keyboard.press('Control+Shift+V');
    }
    await window.waitForTimeout(1000);

    const iframeMetrics = await window.evaluate(() => {
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (!iframe) return { found: false };

      const computed = window.getComputedStyle(iframe);
      const parent = iframe.parentElement as HTMLElement;
      return {
        found: true,
        clientHeight: iframe.clientHeight,
        offsetHeight: iframe.offsetHeight,
        height: computed.height,
        parentHeight: parent ? parent.clientHeight : 0,
      };
    });

    console.log('HTML_IFRAME_METRICS:', JSON.stringify(iframeMetrics));
    expect(iframeMetrics.found).toBe(true);
    expect(iframeMetrics.clientHeight).toBeGreaterThan(400);

    await window.screenshot({
      path: 'C:/Users/CyberWord/.gemini/antigravity/brain/c1f6cb44-9b8f-4859-a490-88dce2fd3052/scratch/html_preview_debug.png',
    });
  });

  test('renders rainbow brackets and indent guides in active editor', async () => {
    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await window.waitForTimeout(1000);

    // Click into CodeMirror editor
    const cmEditor = await window.$('.cm-content');
    expect(cmEditor).toBeTruthy();

    // Type nested code with multiple bracket levels and indentation
    await cmEditor.click();
    await window.keyboard.press('Control+A');
    await window.keyboard.press('Backspace');
    await window.keyboard.type('const application = {\n  user: {\n    profile: {\n      name: "Xivig"\n    }\n  }\n};\n');
    await window.waitForTimeout(1000);

    // Evaluate DOM for rainbow bracket and indent guide classes
    const rainbowResults = await window.evaluate(() => {
      const redBrackets = document.querySelectorAll('.xivig-rainbow-bracket-red');
      const orangeBrackets = document.querySelectorAll('.xivig-rainbow-bracket-orange');
      const yellowBrackets = document.querySelectorAll('.xivig-rainbow-bracket-yellow');
      const indentGuides = document.querySelectorAll('.xivig-indent-guide');

      return {
        redCount: redBrackets.length,
        orangeCount: orangeBrackets.length,
        yellowCount: yellowBrackets.length,
        indentGuideCount: indentGuides.length,
      };
    });

    console.log('RAINBOW_RESULTS:', JSON.stringify(rainbowResults));
    expect(rainbowResults.redCount).toBeGreaterThan(0);
    expect(rainbowResults.orangeCount).toBeGreaterThan(0);
    expect(rainbowResults.yellowCount).toBeGreaterThan(0);
    // Vertical indent guide lines should be removed
    expect(rainbowResults.indentGuideCount).toBe(0);

    // Take screenshot of rainbow brackets in action
    await window.screenshot({
      path: 'C:/Users/CyberWord/.gemini/antigravity/brain/c1f6cb44-9b8f-4859-a490-88dce2fd3052/rainbow_brackets_live.png',
    });
  });
});
