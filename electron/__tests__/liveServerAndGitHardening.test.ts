import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { validateRepoRelativePath } from '../main/git';
import { isHiddenOrSensitive, getLiveServerStatus } from '../main/liveserver';
import { getAvailableShells } from '../main/terminal';

describe('Git Repository Path Hardening (P1 Finding)', () => {
  const repoRoot = path.resolve('E:/my-project');

  it('normalizes valid relative paths inside the repository', () => {
    expect(validateRepoRelativePath(repoRoot, 'src/index.ts')).toBe('src/index.ts');
    expect(validateRepoRelativePath(repoRoot, './README.md')).toBe('README.md');
  });

  it('blocks path traversal attempts escaping the repository root', () => {
    expect(() => validateRepoRelativePath(repoRoot, '../outside.txt')).toThrow(/escapes repository root/);
    expect(() => validateRepoRelativePath(repoRoot, '../../windows/system32/cmd.exe')).toThrow(/escapes repository root/);
  });

  it('blocks null byte injections', () => {
    expect(() => validateRepoRelativePath(repoRoot, 'safe.txt\0bad')).toThrow(/null byte/);
  });

  it('blocks empty or non-string paths', () => {
    expect(() => validateRepoRelativePath(repoRoot, '')).toThrow(/non-empty/);
    expect(() => validateRepoRelativePath(repoRoot, '   ')).toThrow(/non-empty/);
  });
});

describe('Live Server Hardening & Window Isolation (P1 Finding)', () => {
  it('denies hidden files and directories by default', () => {
    expect(isHiddenOrSensitive('.git/config')).toBe(true);
    expect(isHiddenOrSensitive('.env')).toBe(true);
    expect(isHiddenOrSensitive('.env.local')).toBe(true);
    expect(isHiddenOrSensitive('.vscode/settings.json')).toBe(true);
    expect(isHiddenOrSensitive('subfolder/.hidden')).toBe(true);
    expect(isHiddenOrSensitive('id_rsa')).toBe(true);
    expect(isHiddenOrSensitive('database.sql')).toBe(true);
  });

  it('allows standard public web assets', () => {
    expect(isHiddenOrSensitive('index.html')).toBe(false);
    expect(isHiddenOrSensitive('assets/style.css')).toBe(false);
    expect(isHiddenOrSensitive('scripts/app.js')).toBe(false);
    expect(isHiddenOrSensitive('images/logo.png')).toBe(false);
  });

  it('getLiveServerStatus strictly isolates status by window ID', () => {
    // When queried with an unknown window ID, it must NOT fall back to another window's server
    const status = getLiveServerStatus(999999);
    expect(status.isRunning).toBe(false);
    expect(status.port).toBe(0);
    expect(status.url).toBe('');
  });
});

describe('Terminal Pseudoterminal & Shell Capabilities (P1 Finding)', () => {
  it('detects available shells on the system', () => {
    const shells = getAvailableShells();
    expect(Array.isArray(shells)).toBe(true);
    expect(shells.length).toBeGreaterThan(0);
    expect(shells[0]).toHaveProperty('name');
    expect(shells[0]).toHaveProperty('executable');
  });
});
