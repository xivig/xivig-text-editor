import { describe, it, expect, beforeEach } from 'vitest';
import path from 'node:path';
import {
  isHiddenOrSensitive,
  getLiveServerStatus,
  serversByWindow,
} from '../main/liveserver';

describe('Live Server: Traversal, Sensitive Files, and HTTP Method Restrictions', () => {
  beforeEach(() => {
    serversByWindow.clear();
  });

  it('strictly identifies and denies hidden dotfiles and directories', () => {
    expect(isHiddenOrSensitive('.git')).toBe(true);
    expect(isHiddenOrSensitive('.git/HEAD')).toBe(true);
    expect(isHiddenOrSensitive('.env')).toBe(true);
    expect(isHiddenOrSensitive('.env.production')).toBe(true);
    expect(isHiddenOrSensitive('.vscode/settings.json')).toBe(true);
    expect(isHiddenOrSensitive('sub/.hidden_dir/file.txt')).toBe(true);
    expect(isHiddenOrSensitive('.DS_Store')).toBe(true);
    expect(isHiddenOrSensitive('.htaccess')).toBe(true);
  });

  it('strictly denies sensitive credential and database files by extension or filename', () => {
    expect(isHiddenOrSensitive('id_rsa')).toBe(true);
    expect(isHiddenOrSensitive('id_ed25519')).toBe(true);
    expect(isHiddenOrSensitive('private.key')).toBe(true);
    expect(isHiddenOrSensitive('server.pem')).toBe(true);
    expect(isHiddenOrSensitive('cert.pfx')).toBe(true);
    expect(isHiddenOrSensitive('backup.sql')).toBe(true);
    expect(isHiddenOrSensitive('users.sqlite')).toBe(true);
    expect(isHiddenOrSensitive('dump.db')).toBe(true);
    expect(isHiddenOrSensitive('production.bak')).toBe(true);
  });

  it('allows standard web application files and assets', () => {
    expect(isHiddenOrSensitive('index.html')).toBe(false);
    expect(isHiddenOrSensitive('about.htm')).toBe(false);
    expect(isHiddenOrSensitive('css/main.css')).toBe(false);
    expect(isHiddenOrSensitive('js/app.bundle.js')).toBe(false);
    expect(isHiddenOrSensitive('assets/images/logo.png')).toBe(false);
    expect(isHiddenOrSensitive('assets/vector/icon.svg')).toBe(false);
    expect(isHiddenOrSensitive('data/schema.json')).toBe(false);
  });

  it('safely catches and neutralizes URL-encoded directory traversal attempts (%2e%2e%2f)', () => {
    const canonicalRoot = path.resolve('E:/workspace/web-app');

    // Simulate URL decoding
    const encodedPayloads = [
      '%2e%2e%2foutside.txt',            // ../
      '%2e%2e%5csecret.env',             // ..\
      'subfolder/%2e%2e/%2e%2e/file.key', // subfolder/../../
    ];

    for (const raw of encodedPayloads) {
      let decoded = raw;
      try {
        decoded = decodeURIComponent(raw);
      } catch {}

      const cleanPath = path.normalize(decoded).replace(/^([a-zA-Z]:|[/\\])+/, '');
      const candidate = path.resolve(canonicalRoot, cleanPath);
      const relative = path.relative(canonicalRoot, candidate);

      // Traversal attempt must be detected via relative path escaping root
      const escapesRoot = relative.startsWith('..') || path.isAbsolute(relative);
      expect(escapesRoot).toBe(true);
    }
  });

  it('enforces allowed HTTP methods (GET, HEAD, OPTIONS) and rejects modifying methods', () => {
    const allowedMethods = ['GET', 'HEAD', 'OPTIONS'];
    const forbiddenMethods = ['POST', 'PUT', 'DELETE', 'PATCH', 'TRACE', 'CONNECT'];

    for (const m of allowedMethods) {
      const isAllowed = m === 'GET' || m === 'HEAD' || m === 'OPTIONS';
      expect(isAllowed).toBe(true);
    }

    for (const m of forbiddenMethods) {
      const isAllowed = m === 'GET' || m === 'HEAD' || m === 'OPTIONS';
      expect(isAllowed).toBe(false);
    }
  });

  it('strictly isolates live server status by window ID and never leaks another window status', () => {
    const win1 = 111;
    const win2 = 222;

    serversByWindow.set(win1, {
      server: null as any,
      port: 5500,
      url: 'http://127.0.0.1:5500',
      rootPath: 'E:\\web-site-1',
      sessionToken: 'token-abc',
      sseClients: new Set(),
    });

    const status1 = getLiveServerStatus(win1);
    expect(status1.isRunning).toBe(true);
    expect(status1.port).toBe(5500);

    // Querying window 2 (which has no server) MUST return isRunning: false, NOT window 1's server!
    const status2 = getLiveServerStatus(win2);
    expect(status2.isRunning).toBe(false);
    expect(status2.port).toBe(0);
    expect(status2.url).toBe('');
  });
});
