// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  addRecentWorkspace,
  getRecentWorkspaces,
  addRecentFile,
  getRecentFiles,
  clearRecentHistory,
} from '../main/database';

describe('Electron: Workspace Database & History Clearing', () => {
  it('adds and retrieves recent workspaces and files, then clears them cleanly', () => {
    // 1. Add recent workspace and file
    addRecentWorkspace('/projects/web-app.code-workspace', 'web-app (Workspace)');
    addRecentFile('/projects/web-app/index.html', 'index.html');

    const workspaces = getRecentWorkspaces(10);
    const files = getRecentFiles(10);

    expect(workspaces.some((w) => w.path === '/projects/web-app.code-workspace')).toBe(true);
    expect(files.some((f) => f.path === '/projects/web-app/index.html')).toBe(true);

    // 2. Clear history
    clearRecentHistory();

    const emptyWorkspaces = getRecentWorkspaces(10);
    const emptyFiles = getRecentFiles(10);

    expect(emptyWorkspaces).toHaveLength(0);
    expect(emptyFiles).toHaveLength(0);
  });
});
