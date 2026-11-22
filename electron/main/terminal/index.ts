import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import os from 'node:os';
import { BrowserWindow } from 'electron';

let currentShell: ChildProcessWithoutNullStreams | null = null;

export function initTerminalSession(cwd: string | null, win: BrowserWindow | null): void {
  stopTerminal();

  if (!win) return;

  const shellCmd = process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL || 'bash');
  const args = process.platform === 'win32' ? ['-NoLogo'] : [];
  const targetCwd = cwd || os.homedir();

  try {
    currentShell = spawn(shellCmd, args, {
      cwd: targetCwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
      },
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
      currentShell = null;
    });

    console.log('[Xivig Terminal] Spawned terminal shell in:', targetCwd);
  } catch (err: any) {
    console.error('[Xivig Terminal] Failed to spawn terminal shell:', err);
    if (!win.isDestroyed()) {
      win.webContents.send('terminal:data', `Failed to start shell: ${err.message}\r\n`);
    }
  }
}

export function writeToTerminal(data: string): void {
  if (currentShell && currentShell.stdin.writable) {
    currentShell.stdin.write(data);
  }
}

export function stopTerminal(): void {
  if (currentShell) {
    try {
      currentShell.kill();
    } catch {
      // ignore
    }
    currentShell = null;
  }
}
