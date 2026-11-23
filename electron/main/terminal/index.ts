import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { BrowserWindow } from 'electron';
import { assertPathAuthorized } from '../security';

const terminalsByWindow = new Map<number, ChildProcessWithoutNullStreams>();

export function initTerminalSession(cwd: string | null, win: BrowserWindow | null): boolean {
  if (!win || win.isDestroyed()) return false;

  const winId = win.id;
  stopTerminal(winId);

  let targetCwd = os.homedir();
  if (cwd) {
    try {
      const resolved = path.resolve(cwd);
      if (fs.existsSync(resolved)) {
        assertPathAuthorized(winId, resolved, 'terminal:init');
        targetCwd = resolved;
      }
    } catch (err: any) {
      console.warn(`[Xivig Terminal Win-${winId}] CWD authorization rejected, falling back to home:`, err.message);
    }
  }

  const shellCmd = process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL || 'bash');
  const args = process.platform === 'win32'
    ? [
        '-NoLogo',
        '-NoExit',
        '-Command',
        '[Console]::InputEncoding = [Console]::OutputEncoding = $OutputEncoding = [System.Text.UTF8Encoding]::new(); chcp 65001 > $null;',
      ]
    : [];

  try {
    const currentShell = spawn(shellCmd, args, {
      cwd: targetCwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        PYTHONIOENCODING: 'utf-8',
        LANG: 'en_US.UTF-8',
        LC_ALL: 'en_US.UTF-8',
      },
      shell: false,
    });

    currentShell.stdout.on('data', (data: Buffer) => {
      if (!win.isDestroyed()) {
        win.webContents.send('terminal:data', data.toString('utf-8'));
      }
    });

    currentShell.stderr.on('data', (data: Buffer) => {
      if (!win.isDestroyed()) {
        win.webContents.send('terminal:data', data.toString('utf-8'));
      }
    });

    currentShell.on('close', (code) => {
      if (!win.isDestroyed()) {
        win.webContents.send('terminal:data', `\r\n[Process terminated with exit code ${code}]\r\n`);
      }
      // Safe cleanup: only delete entry if it still refers to this specific closed process
      if (terminalsByWindow.get(winId) === currentShell) {
        if (terminalsByWindow.get(winId) === currentShell) {
        terminalsByWindow.delete(winId);
      }
      }
    });

    terminalsByWindow.set(winId, currentShell);
    console.log(`[Xivig Terminal Win-${winId}] Spawned terminal shell in:`, targetCwd);
    return true;
  } catch (err: any) {
    console.error(`[Xivig Terminal Win-${winId}] Failed to spawn terminal shell:`, err);
    if (!win.isDestroyed()) {
      win.webContents.send('terminal:data', `Failed to start shell: ${err.message}\r\n`);
    }
    return false;
  }
}

export function writeToTerminal(winId: number, data: string): void {
  const currentShell = terminalsByWindow.get(winId);
  if (currentShell && currentShell.stdin.writable) {
    currentShell.stdin.write(data, 'utf-8');
  }
}

export function stopTerminal(winId?: number): void {
  if (winId !== undefined) {
    const currentShell = terminalsByWindow.get(winId);
    if (currentShell) {
      try {
        if (process.platform === 'win32' && currentShell.pid) {
          spawn('taskkill', ['/pid', String(currentShell.pid), '/T', '/F'], { shell: false });
        } else {
          currentShell.kill('SIGTERM');
        }
      } catch {
        // ignore
      }
      if (terminalsByWindow.get(winId) === currentShell) {
        terminalsByWindow.delete(winId);
      }
    }
  } else {
    for (const [id, shellProc] of terminalsByWindow) {
      try {
        if (process.platform === 'win32' && shellProc.pid) {
          spawn('taskkill', ['/pid', String(shellProc.pid), '/T', '/F'], { shell: false });
        } else {
          shellProc.kill('SIGTERM');
        }
      } catch {}
    }
    terminalsByWindow.clear();
  }
}
