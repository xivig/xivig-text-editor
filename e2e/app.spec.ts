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
});
