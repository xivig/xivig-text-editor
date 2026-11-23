import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { BrowserWindow } from 'electron';
import { assertPathAuthorized } from '../security';

// Per-window tracking to avoid global singleton collision
const activeProcessesByWindow = new Map<number, { process: ChildProcess; startTime: number }>();

export interface RunBuildOptions {
  command: string;
  args?: string[];
  cwd?: string;
}

/**
 * Validates that command components do not contain dangerous shell metacharacters.
 */
function validateCommandTokens(tokens: string[]): void {
  const dangerousPattern = /[|&;`$<>]/;
  for (const token of tokens) {
    if (dangerousPattern.test(token)) {
      throw new Error(`Security Exception: Command contains forbidden shell metacharacter: "${token}"`);
    }
  }
}

/**
 * Resolves the executable path on Windows safely without invoking shell interpretation.
 */
function resolveWindowsBinary(command: string): string {
  const isWin = process.platform === 'win32';
  if (!isWin) return command;

  const ext = path.extname(command).toLowerCase();
  if (ext === '.exe' || ext === '.cmd' || ext === '.bat') {
    return command;
  }

  // Common tool mappings on Windows
  const knownCmdTools = new Set(['npm', 'npx', 'yarn', 'pnpm', 'tsc']);
  if (knownCmdTools.has(command.toLowerCase())) {
    return `${command}.cmd`;
  }

  return command;
}

export function runBuildProcess(
  options: RunBuildOptions,
  win: BrowserWindow | null
): { success: boolean; error?: string } {
  if (!win || win.isDestroyed()) {
    return { success: false, error: 'No active window available for build execution' };
  }

  const winId = win.id;

  // Stop any currently running build task in THIS window
  stopBuildProcess(win);

  const { command, args = [], cwd = process.cwd() } = options;

  // 1. Strict validation of command and working directory
  if (!command || typeof command !== 'string' || !command.trim()) {
    return { success: false, error: 'Build command must be a non-empty string' };
  }

  const safeCwd = path.resolve(cwd);
  if (!fs.existsSync(safeCwd)) {
    return { success: false, error: `Working directory does not exist: ${cwd}` };
  }

  try {
    const stat = fs.statSync(safeCwd);
    if (!stat.isDirectory()) {
      return { success: false, error: `Working directory is not a directory: ${cwd}` };
    }
  } catch (err: any) {
    return { success: false, error: `Failed to inspect working directory: ${err.message}` };
  }

  // 2. Strict workspace authorization check
  try {
    assertPathAuthorized(safeCwd, 'build:run');
  } catch (secErr: any) {
    return { success: false, error: secErr.message };
  }

  // 3. Parse and validate command tokens
  const tokens = command.trim().split(/\s+/);
  const mainBinary = tokens[0];
  const initialArgs = tokens.slice(1);
  const rawFinalArgs = [...initialArgs, ...args];

  // Defensive sanitization: strip any surrounding quotes from arguments to prevent Node/spawn relative-path concatenation bugs
  const finalArgs = rawFinalArgs.map((arg) => {
    if (typeof arg === 'string' && ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'")))) {
      return arg.slice(1, -1);
    }
    return arg;
  });

  try {
    validateCommandTokens([mainBinary, ...finalArgs]);
  } catch (valErr: any) {
    return { success: false, error: valErr.message };
  }

  const startTime = Date.now();

  try {
    // Notify renderer that build has started
    if (!win.isDestroyed()) {
      win.webContents.send('build:start', {
        command: command.trim(),
        args: finalArgs,
        cwd: safeCwd,
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    const isWin = process.platform === 'win32';
    const targetBinary = resolveWindowsBinary(mainBinary);

    // Secure execution:
    // Always pass binary and arguments as discrete array items with shell: false.
    // Avoid cmd.exe string concatenation and windowsVerbatimArguments vulnerabilities.
    let proc: ChildProcess;

    if (isWin && (targetBinary.endsWith('.cmd') || targetBinary.endsWith('.bat'))) {
      // For Windows batch/cmd wrappers, pass arguments as discrete array entries to cmd.exe
      proc = spawn('cmd.exe', ['/d', '/c', targetBinary, ...finalArgs], {
        cwd: safeCwd,
        env: {
          ...process.env,
          FORCE_COLOR: '1',
        },
        shell: false,
      });
    } else {
      // Direct binary execution with shell: false
      proc = spawn(targetBinary, finalArgs, {
        cwd: safeCwd,
        env: {
          ...process.env,
          FORCE_COLOR: '1',
        },
        shell: false,
      });
    }

    activeProcessesByWindow.set(winId, { process: proc, startTime });

    proc.stdout?.on('data', (chunk: Buffer) => {
      if (!win.isDestroyed()) {
        win.webContents.send('build:data', {
          type: 'stdout',
          text: chunk.toString('utf-8'),
        });
      }
    });

    proc.stderr?.on('data', (chunk: Buffer) => {
      if (!win.isDestroyed()) {
        win.webContents.send('build:data', {
          type: 'stderr',
          text: chunk.toString('utf-8'),
        });
      }
    });

    proc.on('error', (err: Error) => {
      if (!win.isDestroyed()) {
        win.webContents.send('build:error', {
          error: `Failed to launch build process [${targetBinary}]: ${err.message}`,
        });
      }
      activeProcessesByWindow.delete(winId);
    });

    proc.on('close', (code: number | null) => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      if (!win.isDestroyed()) {
        win.webContents.send('build:exit', {
          code: code ?? 0,
          duration,
        });
      }
      activeProcessesByWindow.delete(winId);
    });

    return { success: true };
  } catch (err: any) {
    activeProcessesByWindow.delete(winId);
    return { success: false, error: `Execution exception: ${err.message}` };
  }
}

export function stopBuildProcess(win: BrowserWindow | null): boolean {
  if (!win) return false;
  const entry = activeProcessesByWindow.get(win.id);
  if (!entry) return false;

  const { process: proc } = entry;
  try {
    if (process.platform === 'win32' && proc.pid) {
      // Clean process tree termination on Windows
      spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { shell: false });
    } else {
      proc.kill('SIGTERM');
    }
  } catch {
    // Ignore error
  }
  activeProcessesByWindow.delete(win.id);
  return true;
}

export function stopAllBuildProcesses(): void {
  for (const [winId, entry] of activeProcessesByWindow) {
    try {
      if (process.platform === 'win32' && entry.process.pid) {
        spawn('taskkill', ['/pid', String(entry.process.pid), '/T', '/F'], { shell: false });
      } else {
        entry.process.kill('SIGKILL');
      }
    } catch {}
  }
  activeProcessesByWindow.clear();
}
