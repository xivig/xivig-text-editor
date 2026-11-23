import { describe, it, expect, beforeEach } from 'vitest';
import path from 'node:path';
import {
  addApprovedWorkspace,
  removeApprovedWorkspace,
  addApprovedFile,
  isPathAuthorized,
  assertPathAuthorized,
  clearWindowPermissions,
} from '../main/security';

describe('Per-Window Authorization Isolation (P0 Finding)', () => {
  const win1 = 101;
  const win2 = 202;

  const workspaceA = path.resolve(process.cwd(), 'src');
  const workspaceB = path.resolve(process.cwd(), 'public');
  const fileA = path.join(workspaceA, 'app.ts');
  const fileB = path.join(workspaceB, 'logo.png');

  beforeEach(() => {
    clearWindowPermissions(win1);
    clearWindowPermissions(win2);
  });

  it('maintains strict authorization isolation between distinct windows', () => {
    // Window 1 approves Workspace A (src)
    addApprovedWorkspace(win1, workspaceA);
    // Window 2 approves a specific file in public only
    addApprovedFile(win2, fileB);

    // Window 1 should be authorized for Workspace A files
    expect(isPathAuthorized(win1, fileA)).toBe(true);

    // Window 2 should NOT be authorized for Workspace A files
    expect(isPathAuthorized(win2, fileA)).toBe(false);

    // Window 2 should be authorized for its approved fileB
    expect(isPathAuthorized(win2, fileB)).toBe(true);

    // Window 1 should NOT be authorized for Window 2's specific fileB
    expect(isPathAuthorized(win1, fileB)).toBe(false);
  });

  it('revoking authorization in Window A does not affect Window B', () => {
    const sharedWorkspace = process.cwd();

    // Both windows open the same project
    addApprovedWorkspace(win1, sharedWorkspace);
    addApprovedWorkspace(win2, sharedWorkspace);

    expect(isPathAuthorized(win1, path.resolve(sharedWorkspace, 'package.json'))).toBe(true);
    expect(isPathAuthorized(win2, path.resolve(sharedWorkspace, 'package.json'))).toBe(true);

    // Window 1 closes the project
    removeApprovedWorkspace(win1, sharedWorkspace);

    // Window 1 authorization is revoked
    expect(isPathAuthorized(win1, path.resolve(sharedWorkspace, 'package.json'))).toBe(false);

    // Window 2 authorization MUST remain intact
    expect(isPathAuthorized(win2, path.resolve(sharedWorkspace, 'package.json'))).toBe(true);
  });

  it('assertPathAuthorized throws security exception when window is not authorized', () => {
    expect(() => {
      assertPathAuthorized(win1, 'C:\\Unauthorized\\secret.txt', 'file:read');
    }).toThrow(/Security Exception.*Access denied outside approved workspaces for window 101/);
  });

  it('clearing window permissions on window close purges only that window', () => {
    addApprovedFile(win1, fileA);
    addApprovedFile(win2, fileB);

    expect(isPathAuthorized(win1, fileA)).toBe(true);
    expect(isPathAuthorized(win2, fileB)).toBe(true);

    clearWindowPermissions(win1);

    expect(isPathAuthorized(win1, fileA)).toBe(false);
    expect(isPathAuthorized(win2, fileB)).toBe(true);
  });
});
