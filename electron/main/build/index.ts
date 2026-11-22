import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { BrowserWindow } from 'electron';

let activeBuildProcess: ChildProcess | null = null;
let buildStartTime: number = 0;

export interface RunBuildOptions {
  command: string;
  args?: string[];
  cwd?: string;
}

export function runBuildProcess(
  options: RunBuildOptions,
  win: BrowserWindow | null
): { success: boolean; error?: string } {
  // If an existing build is running, terminate its full process tree first
  stopBuildProcess();

  if (!win || win.isDestroyed()) {
    return { success: false, error: 'No active window available for build execution' };
  }

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

  buildStartTime = Date.now();

  try {
    // Notify renderer that build has started with full details
    if (!win.isDestroyed()) {
      win.webContents.send('build:start', {
        command: command.trim(),
        args,
        cwd: safeCwd,
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    const isWin = process.platform === 'win32';

    // Parse command components
    const tokens = command.trim().split(/\s+/);
    const mainBinary = tokens[0];
    const initialArgs = tokens.slice(1);
    const finalArgs = [...initialArgs, ...args];

    // Prefer direct execution without shell where possible; on Windows use cmd wrapper with explicit argument isolation
    if (isWin) {
      const fullCmdString = [mainBinary, ...finalArgs].map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ');
      activeBuildProcess = spawn('cmd.exe', ['/d', '/s', '/c', fullCmdString], {
        cwd: safeCwd,
        env: {
          ...process.env,
          FORCE_COLOR: '1',
        },
        windowsVerbatimArguments: true,
      });
    } else {
      activeBuildProcess = spawn(mainBinary, finalArgs, {
        cwd: safeCwd,
        env: {
          ...process.env,
          FORCE_COLOR: '1',
        },
        shell: false,
      });
    }

    activeBuildProcess.stdout?.on('data', (chunk: Buffer) => {
      if (!win.isDestroyed()) {
        win.webContents.send('build:data', {
          type: 'stdout',
          text: chunk.toString('utf-8'),
        });
      }
    });

    activeBuildProcess.stderr?.on('data', (chunk: Buffer) => {
      if (!win.isDestroyed()) {
        win.webContents.send('build:data', {
          type: 'stderr',
          text: chunk.toString('utf-8'),
        });
      }
    });

    activeBuildProcess.on('close', (code: number | null) => {
      const durationMs = Date.now() - buildStartTime;
      if (!win.isDestroyed()) {
        win.webContents.send('build:done', {
          exitCode: code ?? 0,
          durationMs,
        });
      }
      activeBuildProcess = null;
    });

    activeBuildProcess.on('error', (err: Error) => {
      const durationMs = Date.now() - buildStartTime;
      if (!win.isDestroyed()) {
        win.webContents.send('build:data', {
          type: 'stderr',
          text: `\r\nBuild Error: ${err.message}\r\n`,
        });
        win.webContents.send('build:done', {
          exitCode: 1,
          durationMs,
        });
      }
      activeBuildProcess = null;
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Terminates the active build process and all its child processes in the process tree.
 */
export function stopBuildProcess(): boolean {
  if (activeBuildProcess && activeBuildProcess.pid) {
    const pid = activeBuildProcess.pid;
    try {
      if (process.platform === 'win32') {
        // Force kill entire process tree on Windows
        spawn('taskkill', ['/pid', pid.toString(), '/T', '/F']);
      } else {
        // Kill process group on POSIX
        try {
          process.kill(-pid, 'SIGKILL');
        } catch {
          activeBuildProcess.kill('SIGKILL');
        }
      }
    } catch {
      // Ignore cleanup error
    }
    activeBuildProcess = null;
    return true;
  }
  return false;
}
