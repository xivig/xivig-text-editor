import { spawn, ChildProcess } from 'node:child_process';
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
  // If an existing build is running, terminate it first
  stopBuildProcess();

  if (!win) {
    return { success: false, error: 'No active window' };
  }

  const { command, args = [], cwd = process.cwd() } = options;
  buildStartTime = Date.now();

  try {
    // Notify renderer build has started
    if (!win.isDestroyed()) {
      win.webContents.send('build:start', {
        command,
        args,
        cwd,
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    // Windows shell execution wrapper
    const isWin = process.platform === 'win32';
    const finalCmd = isWin ? 'cmd.exe' : (process.env.SHELL || '/bin/sh');
    const fullCommandLine = args.length > 0 ? `${command} ${args.join(' ')}` : command;
    const finalArgs = isWin ? ['/d', '/s', '/c', fullCommandLine] : ['-c', fullCommandLine];

    activeBuildProcess = spawn(finalCmd, finalArgs, {
      cwd,
      env: {
        ...process.env,
        FORCE_COLOR: '1',
      },
      windowsVerbatimArguments: isWin,
    });

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

export function stopBuildProcess(): boolean {
  if (activeBuildProcess) {
    try {
      activeBuildProcess.kill('SIGTERM');
    } catch {
      // ignore kill errors
    }
    activeBuildProcess = null;
    return true;
  }
  return false;
}
