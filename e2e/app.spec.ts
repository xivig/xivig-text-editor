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
});
