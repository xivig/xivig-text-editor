import { spawn as spawnChild, ChildProcessWithoutNullStreams } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { BrowserWindow } from 'electron';
import { assertPathAuthorized } from '../security';

// Dynamically load node-pty with child_process fallback
let ptyModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ptyModule = require('node-pty');
} catch (err) {
  console.warn('[Xivig Terminal] Native node-pty module unavailable, falling back to child_process:', err);
}

export interface TerminalSessionOptions {
  cwd?: string | null;
  shell?: string | null;
  terminalId?: string;
  cols?: number;
  rows?: number;
  env?: Record<string, string>;
}

export interface TerminalInstance {
  terminalId: string;
  proc: any; // IPty or ChildProcessWithoutNullStreams
  isPty: boolean;
  pid: number | undefined;
  cwd: string;
  shell: string;
}

export interface ShellInfo {
  name: string;
  path: string;
  executable: string;
}

// Per-window and per-instance map: winId -> (terminalId -> TerminalInstance)
export const terminalsByWindow = new Map<number, Map<string, TerminalInstance>>();

/**
 * Returns available shells on the current operating system
 */
export function getAvailableShells(): ShellInfo[] {
  const isWin = process.platform === 'win32';
  const shells: ShellInfo[] = [];

  if (isWin) {
    const sysRoot = process.env.SystemRoot || 'C:\\Windows';
    const psPath = path.join(sysRoot, 'System32\\WindowsPowerShell\\v1.0\\powershell.exe');
    const cmdPath = path.join(sysRoot, 'System32\\cmd.exe');
    const pwshPath = 'C:\\Program Files\\PowerShell\\7\\pwsh.exe';
    const gitBashPath = 'C:\\Program Files\\Git\\bin\\bash.exe';

    if (fs.existsSync(psPath)) shells.push({ name: 'PowerShell', path: psPath, executable: 'powershell.exe' });
    if (fs.existsSync(cmdPath)) shells.push({ name: 'Command Prompt', path: cmdPath, executable: 'cmd.exe' });
    if (fs.existsSync(pwshPath)) shells.push({ name: 'PowerShell 7', path: pwshPath, executable: 'pwsh.exe' });
    if (fs.existsSync(gitBashPath)) shells.push({ name: 'Git Bash', path: gitBashPath, executable: 'bash.exe' });
  } else {
    const defaultShell = process.env.SHELL || '/bin/bash';
    shells.push({ name: path.basename(defaultShell), path: defaultShell, executable: path.basename(defaultShell) });
    const candidates = ['/bin/zsh', '/bin/bash', '/bin/sh', '/usr/bin/fish'];
    for (const cand of candidates) {
      if (cand !== defaultShell && fs.existsSync(cand)) {
        shells.push({ name: path.basename(cand), path: cand, executable: path.basename(cand) });
      }
    }
  }

  return shells;
}

/**
 * Resolves the default shell executable
 */
function resolveShellExecutable(requestedShell?: string | null): { shellPath: string; args: string[] } {
  const isWin = process.platform === 'win32';

  if (requestedShell && typeof requestedShell === 'string' && requestedShell.trim()) {
    return { shellPath: requestedShell.trim(), args: [] };
  }

  if (isWin) {
    const sysRoot = process.env.SystemRoot || 'C:\\Windows';
    const defaultPs = path.join(sysRoot, 'System32\\WindowsPowerShell\\v1.0\\powershell.exe');
    const shellPath = fs.existsSync(defaultPs) ? defaultPs : 'powershell.exe';
    return {
      shellPath,
      args: [
        '-NoLogo',
        '-NoExit',
        '-Command',
        '[Console]::InputEncoding = [Console]::OutputEncoding = $OutputEncoding = [System.Text.UTF8Encoding]::new(); chcp 65001 > $null;',
      ],
    };
  }

  return {
    shellPath: process.env.SHELL || '/bin/bash',
    args: ['-l'],
  };
}

/**
 * Initializes a terminal session with pseudo-terminal (node-pty) support,
 * custom dimensions, shell selection, environment, and multi-instance tracking.
 */
export function initTerminalSession(
  optionsOrCwd: string | TerminalSessionOptions | null,
  win: BrowserWindow | null
): boolean {
  if (!win || win.isDestroyed()) return false;

  const winId = win.id;
  const options: TerminalSessionOptions =
    typeof optionsOrCwd === 'string'
      ? { cwd: optionsOrCwd }
      : optionsOrCwd || {};

  const terminalId = options.terminalId || 'default';
  const cols = Math.max(10, options.cols || 80);
  const rows = Math.max(5, options.rows || 24);

  // Stop existing terminal with same terminalId in this window
  stopTerminal(winId, terminalId);

  // Validate and authorize working directory
  let targetCwd = os.homedir();
  if (options.cwd) {
    try {
      const resolved = path.resolve(options.cwd);
      if (fs.existsSync(resolved)) {
        assertPathAuthorized(winId, resolved, 'terminal:init');
        targetCwd = resolved;
      }
    } catch (err: any) {
      console.warn(`[Xivig Terminal Win-${winId}] CWD authorization rejected, falling back to home:`, err.message);
    }
  }

  const { shellPath, args } = resolveShellExecutable(options.shell);

  const baseEnv: Record<string, string> = {
    ...process.env as Record<string, string>,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    PYTHONIOENCODING: 'utf-8',
    LANG: 'en_US.UTF-8',
    LC_ALL: 'en_US.UTF-8',
    ...(options.env || {}),
  };

  let winTerminals = terminalsByWindow.get(winId);
  if (!winTerminals) {
    winTerminals = new Map<string, TerminalInstance>();
    terminalsByWindow.set(winId, winTerminals);
  }

  // 1. Prefer native node-pty pseudoterminal
  if (ptyModule && typeof ptyModule.spawn === 'function') {
    try {
      const ptyProcess = ptyModule.spawn(shellPath, args, {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: targetCwd,
        env: baseEnv,
      });

      const instance: TerminalInstance = {
        terminalId,
        proc: ptyProcess,
        isPty: true,
        pid: ptyProcess.pid,
        cwd: targetCwd,
        shell: shellPath,
      };

      ptyProcess.onData((data: string) => {
        if (!win.isDestroyed()) {
          win.webContents.send('terminal:data', data);
        }
      });

      ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
        if (!win.isDestroyed()) {
          win.webContents.send('terminal:data', `\r\n[Process terminated with exit code ${exitCode}]\r\n`);
        }
        const currentWinMap = terminalsByWindow.get(winId);
        if (currentWinMap && currentWinMap.get(terminalId)?.proc === ptyProcess) {
          currentWinMap.delete(terminalId);
        }
      });

      winTerminals.set(terminalId, instance);
      console.log(`[Xivig Terminal Win-${winId}:${terminalId}] Spawned node-pty PTY shell in:`, targetCwd);
      return true;
    } catch (ptyErr: any) {
      console.warn(`[Xivig Terminal Win-${winId}] node-pty spawn failed, trying child_process:`, ptyErr.message);
    }
  }

  // 2. Fallback: ChildProcess pipeline
  try {
    const childProc = spawnChild(shellPath, args, {
      cwd: targetCwd,
      env: baseEnv,
      shell: false,
    });

    const instance: TerminalInstance = {
      terminalId,
      proc: childProc,
      isPty: false,
      pid: childProc.pid,
      cwd: targetCwd,
      shell: shellPath,
    };

    childProc.stdout.on('data', (data: Buffer) => {
      if (!win.isDestroyed()) {
        win.webContents.send('terminal:data', data.toString('utf-8'));
      }
    });

    childProc.stderr.on('data', (data: Buffer) => {
      if (!win.isDestroyed()) {
        win.webContents.send('terminal:data', data.toString('utf-8'));
      }
    });

    childProc.on('close', (code) => {
      if (!win.isDestroyed()) {
        win.webContents.send('terminal:data', `\r\n[Process terminated with exit code ${code}]\r\n`);
      }
      const currentWinMap = terminalsByWindow.get(winId);
      if (currentWinMap && currentWinMap.get(terminalId)?.proc === childProc) {
        currentWinMap.delete(terminalId);
      }
    });

    winTerminals.set(terminalId, instance);
    console.log(`[Xivig Terminal Win-${winId}:${terminalId}] Spawned child_process shell in:`, targetCwd);
    return true;
  } catch (err: any) {
    console.error(`[Xivig Terminal Win-${winId}] Failed to spawn shell:`, err);
    if (!win.isDestroyed()) {
      win.webContents.send('terminal:data', `Failed to start shell: ${err.message}\r\n`);
    }
    return false;
  }
}

/**
 * Resizes the pseudoterminal geometry (cols, rows)
 */
export function resizeTerminal(winId: number, cols: number, rows: number, terminalId = 'default'): boolean {
  const winTerminals = terminalsByWindow.get(winId);
  if (!winTerminals) return false;
  const instance = winTerminals.get(terminalId);
  if (!instance) return false;

  const safeCols = Math.max(10, cols);
  const safeRows = Math.max(5, rows);

  if (instance.isPty && typeof instance.proc.resize === 'function') {
    try {
      instance.proc.resize(safeCols, safeRows);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Writes interactive input data to the terminal instance
 */
export function writeToTerminal(winId: number, data: string, terminalId = 'default'): void {
  const winTerminals = terminalsByWindow.get(winId);
  const instance = winTerminals?.get(terminalId) || winTerminals?.get('default') || winTerminals?.values().next().value;
  if (!instance) return;

  try {
    if (instance.isPty) {
      instance.proc.write(data);
    } else if (instance.proc.stdin && instance.proc.stdin.writable) {
      instance.proc.stdin.write(data, 'utf-8');
    }
  } catch (err: any) {
    console.warn(`[Xivig Terminal Win-${winId}:${terminalId}] Write failed:`, err.message);
  }
}

/**
 * Reliably terminates the terminal session and its entire process tree
 */
export function stopTerminal(winId?: number, terminalId?: string): void {
  const killInstance = (instance: TerminalInstance) => {
    try {
      if (instance.isPty && typeof instance.proc.kill === 'function') {
        instance.proc.kill();
      }
      if (process.platform === 'win32' && instance.pid) {
        spawnChild('taskkill', ['/pid', String(instance.pid), '/T', '/F'], { shell: false });
      } else if (instance.proc && typeof instance.proc.kill === 'function') {
        instance.proc.kill('SIGTERM');
      }
    } catch {
      // Ignore termination errors
    }
  };

  if (winId !== undefined) {
    const winTerminals = terminalsByWindow.get(winId);
    if (!winTerminals) return;

    if (terminalId !== undefined) {
      const instance = winTerminals.get(terminalId);
      if (instance) {
        killInstance(instance);
        winTerminals.delete(terminalId);
      }
    } else {
      for (const [, instance] of winTerminals) {
        killInstance(instance);
      }
      winTerminals.clear();
      terminalsByWindow.delete(winId);
    }
  } else {
    for (const [, winTerminals] of terminalsByWindow) {
      for (const [, instance] of winTerminals) {
        killInstance(instance);
      }
      winTerminals.clear();
    }
    terminalsByWindow.clear();
  }
}
