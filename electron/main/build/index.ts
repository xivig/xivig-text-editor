import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { BrowserWindow } from 'electron';
import { assertPathAuthorized } from '../security';

// Per-window tracking to avoid global singleton collision
const activeProcessesByWindow = new Map<number, { process: ChildProcess; startTime: number }>();

export interface BuildCompletedEvent {
  exitCode: number;
  durationMs: number;
}

export interface StructuredCommand {
  program?: string;
  command?: string;
  args?: string[];
  cwd?: string;
}

export interface RunBuildOptions {
  program?: string;
  command?: string;
  args?: string[];
  cwd?: string;
  secondaryCommand?: StructuredCommand;
}

/**
 * Quote-aware command-line string tokenizer that respects single/double quotes and escapes.
 * Never performs naive whitespace splitting.
 */
export function parseCommandLine(cmdString: string): { program: string; args: string[] } {
  const trimmed = cmdString.trim();
  if (!trimmed) return { program: '', args: [] };

  const tokens: string[] = [];
  let current = '';
  let inQuote: '"' | "'" | null = null;
  let escape = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (escape) {
      current += char;
      escape = false;
    } else if (char === '\\' && inQuote !== "'") {
      if (i + 1 < trimmed.length && (trimmed[i + 1] === '"' || trimmed[i + 1] === '\\')) {
        escape = true;
      } else {
        current += char;
      }
    } else if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = char;
    } else if (/\s/.test(char)) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  const program = tokens[0] || '';
  const args = tokens.slice(1);
  return { program, args };
}

/**
 * Validates that command components do not contain dangerous shell metacharacters.
 * If running via Windows batch/cmd interpreter, enforces strict checks against
 * cmd.exe expansion characters (%, ^, !, parentheses, &, |, <, >, ;, `).
 */
export function validateCommandTokens(tokens: string[], isWindowsBatch = false): void {
  // General shell metacharacters
  const dangerousGeneral = /[|&;`$<>]/;
  // Strict Windows cmd.exe expansion and delimiter metacharacters
  const dangerousCmd = /[|&;`$<>%^!()]/;

  const pattern = isWindowsBatch ? dangerousCmd : dangerousGeneral;

  for (const token of tokens) {
    if (typeof token !== 'string') continue;
    if (pattern.test(token)) {
      const charMatch = token.match(pattern)?.[0];
      throw new Error(
        `Security Exception: Command argument contains forbidden ${isWindowsBatch ? 'Windows cmd.exe' : 'shell'} metacharacter (${charMatch}): "${token}"`
      );
    }
  }
}

/**
 * Resolves the executable path on Windows safely.
 * Prefers direct .exe binaries over batch files to avoid shell interpreter invocation.
 */
export function resolveWindowsBinary(commandOrProgram: string, cwd?: string): { binary: string; isBatch: boolean } {
  const isWin = process.platform === 'win32';
  if (!isWin) {
    return { binary: commandOrProgram, isBatch: false };
  }

  const ext = path.extname(commandOrProgram).toLowerCase();
  if (ext === '.cmd' || ext === '.bat') {
    return { binary: commandOrProgram, isBatch: true };
  }
  if (ext === '.exe') {
    return { binary: commandOrProgram, isBatch: false };
  }

  // Check if executable exists in cwd with .exe or without
  if (cwd && !path.isAbsolute(commandOrProgram)) {
    const directExe = path.join(cwd, `${commandOrProgram}.exe`);
    if (fs.existsSync(directExe)) {
      return { binary: directExe, isBatch: false };
    }
    const directBin = path.join(cwd, commandOrProgram);
    if (fs.existsSync(directBin)) {
      return { binary: directBin, isBatch: false };
    }
  }

  // Common tool mappings on Windows:
  // Node, Python, GCC, Java, Swift are direct executables (.exe)
  const knownExeTools = new Set(['node', 'python', 'py', 'python3', 'gcc', 'g++', 'java', 'javac', 'git', 'cargo', 'rustc', 'swift', 'swiftc', 'cmd']);
  const lower = commandOrProgram.toLowerCase();
  if (knownExeTools.has(lower)) {
    return { binary: `${commandOrProgram}.exe`, isBatch: false };
  }

  // npm, npx, yarn, pnpm, kotlinc, kotlin are batch wrappers on Windows
  const knownCmdTools = new Set(['npm', 'npx', 'yarn', 'pnpm', 'kotlinc', 'kotlin']);
  if (knownCmdTools.has(lower)) {
    return { binary: `${commandOrProgram}.cmd`, isBatch: true };
  }

  return { binary: commandOrProgram, isBatch: false };
}

/**
 * Extracts structured program and argument list from RunBuildOptions.
 */
export function resolveStructuredCommand(options: { program?: string; command?: string; args?: string[] }): { program: string; args: string[] } {
  if (options.program && options.program.trim()) {
    const program = options.program.trim();
    const explicitArgs = (options.args || []).map((a) => String(a));
    return { program, args: explicitArgs };
  }

  if (options.command && options.command.trim()) {
    const parsed = parseCommandLine(options.command);
    const combinedArgs = [...parsed.args, ...(options.args || []).map((a) => String(a))];
    return { program: parsed.program, args: combinedArgs };
  }

  return { program: '', args: [] };
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

  const { program: rawProgram, args: initialArgs } = resolveStructuredCommand(options);
  const cwd = options.cwd || process.cwd();

  // 1. Strict validation of program and working directory
  if (!rawProgram) {
    return { success: false, error: 'Build execution requires a valid program or command' };
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

  // 2. Strict per-window workspace authorization check
  try {
    assertPathAuthorized(winId, safeCwd, 'build:run');
  } catch (secErr: any) {
    return { success: false, error: secErr.message };
  }

  // 3. Resolve Windows binary type (direct .exe vs batch launcher)
  const { binary: targetBinary, isBatch } = resolveWindowsBinary(rawProgram, safeCwd);

  // Strip wrapping quotes from arguments to prevent Node/spawn relative-path concatenation bugs
  const finalArgs = initialArgs.map((arg) => {
    if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
      return arg.slice(1, -1);
    }
    return arg;
  });

  // 4. Validate command arguments against shell and cmd.exe expansion rules
  try {
    validateCommandTokens([targetBinary, ...finalArgs], isBatch);

    if (options.secondaryCommand) {
      const secResolved = resolveStructuredCommand(options.secondaryCommand);
      const secBinaryInfo = resolveWindowsBinary(secResolved.program, options.secondaryCommand.cwd ? path.resolve(options.secondaryCommand.cwd) : safeCwd);
      validateCommandTokens([secBinaryInfo.binary, ...secResolved.args], secBinaryInfo.isBatch);
    }
  } catch (valErr: any) {
    return { success: false, error: valErr.message };
  }

  const startTime = Date.now();
  let proc: ChildProcess | undefined;

  try {
    // Notify renderer that build has started
    if (!win.isDestroyed()) {
      win.webContents.send('build:start', {
        command: rawProgram,
        args: finalArgs,
        cwd: safeCwd,
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    const isWin = process.platform === 'win32';
    const baseEnv = {
      ...process.env,
      FORCE_COLOR: '1',
      PYTHONUNBUFFERED: '1',
    };

    if (isWin && isBatch) {
      // For Windows batch files, pass discrete arguments to cmd.exe with shell: false
      proc = spawn('cmd.exe', ['/d', '/c', targetBinary, ...finalArgs], {
        cwd: safeCwd,
        env: baseEnv,
        shell: false,
      });
    } else {
      // Direct binary execution with shell: false
      proc = spawn(targetBinary, finalArgs, {
        cwd: safeCwd,
        env: baseEnv,
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

    proc.on('error', (err: any) => {
      if (!win.isDestroyed()) {
        let helpfulTip = '';
        if (err.code === 'ENOENT') {
          const binLower = rawProgram.toLowerCase();
          if (binLower === 'python' || binLower === 'py' || binLower === 'python3') {
            helpfulTip = '\r\n[Tip] Python interpreter was not found on PATH. Please ensure Python is installed and added to PATH (e.g. from python.org or Microsoft Store).\r\n';
          } else if (binLower === 'gcc' || binLower === 'g++') {
            helpfulTip = `\r\n[Tip] '${targetBinary}' was not found on PATH. For C/C++ development on Windows, install MinGW-w64 (e.g. winlibs.com or MSYS2) and add its bin folder to PATH.\r\n`;
          } else if (binLower === 'javac' || binLower === 'java') {
            helpfulTip = `\r\n[Tip] '${targetBinary}' was not found on PATH. Install Java Development Kit (JDK 17+) and verify java/javac is in your environment PATH.\r\n`;
          } else if (binLower === 'node' || binLower === 'npm' || binLower === 'npx') {
            helpfulTip = `\r\n[Tip] '${targetBinary}' was not found on PATH. Install Node.js from nodejs.org and restart the editor.\r\n`;
          }
        }

        win.webContents.send('build:data', {
          type: 'stderr',
          text: `Failed to launch runner [${targetBinary}]: ${err.message}${helpfulTip}`,
        });
        win.webContents.send('build:error', {
          error: `Failed to launch runner [${targetBinary}]: ${err.message}`,
        });
        win.webContents.send('build:done', {
          exitCode: 1,
          durationMs: Date.now() - startTime,
        } as BuildCompletedEvent);
      }

      // Safe cleanup: only delete if map entry still refers to THIS process
      const current = activeProcessesByWindow.get(winId);
      if (current?.process === proc) {
        activeProcessesByWindow.delete(winId);
      }
    });

    proc.on('close', (code: number | null) => {
      // If primary command succeeded and a secondary command was provided (e.g. compile & run)
      if (code === 0 && options.secondaryCommand) {
        const secResolved = resolveStructuredCommand(options.secondaryCommand);
        const secCwd = options.secondaryCommand.cwd ? path.resolve(options.secondaryCommand.cwd) : safeCwd;
        const { binary: secBinary, isBatch: secIsBatch } = resolveWindowsBinary(secResolved.program, secCwd);

        let finalSecBinary = secBinary;
        if (!path.isAbsolute(finalSecBinary) && fs.existsSync(path.join(secCwd, finalSecBinary))) {
          finalSecBinary = path.join(secCwd, finalSecBinary);
        }

        const secFinalArgs = secResolved.args.map((arg) => {
          if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
            return arg.slice(1, -1);
          }
          return arg;
        });

        if (!win.isDestroyed()) {
          win.webContents.send('build:data', {
            type: 'stdout',
            text: `\r\n[Compilation successful. Launching: ${path.basename(finalSecBinary)}]\r\n`,
          });
        }

        let secProc: ChildProcess;
        if (isWin && secIsBatch) {
          secProc = spawn('cmd.exe', ['/d', '/c', finalSecBinary, ...secFinalArgs], {
            cwd: secCwd,
            env: baseEnv,
            shell: false,
          });
        } else {
          secProc = spawn(finalSecBinary, secFinalArgs, {
            cwd: secCwd,
            env: baseEnv,
            shell: false,
          });
        }

        activeProcessesByWindow.set(winId, { process: secProc, startTime });

        secProc.stdout?.on('data', (chunk: Buffer) => {
          if (!win.isDestroyed()) {
            win.webContents.send('build:data', {
              type: 'stdout',
              text: chunk.toString('utf-8'),
            });
          }
        });

        secProc.stderr?.on('data', (chunk: Buffer) => {
          if (!win.isDestroyed()) {
            win.webContents.send('build:data', {
              type: 'stderr',
              text: chunk.toString('utf-8'),
            });
          }
        });

        secProc.on('error', (secErr: any) => {
          if (!win.isDestroyed()) {
            win.webContents.send('build:data', {
              type: 'stderr',
              text: `\r\n[Runner Error: Failed to execute compiled binary: ${secErr.message}]\r\n`,
            });
            win.webContents.send('build:done', {
              exitCode: 1,
              durationMs: Date.now() - startTime,
            } as BuildCompletedEvent);
          }
          const current = activeProcessesByWindow.get(winId);
          if (current?.process === secProc) {
            activeProcessesByWindow.delete(winId);
          }
        });

        secProc.on('close', (secCode: number | null) => {
          const durationMs = Date.now() - startTime;
          if (!win.isDestroyed()) {
            win.webContents.send('build:done', {
              exitCode: secCode ?? 0,
              durationMs,
            } as BuildCompletedEvent);
          }
          const current = activeProcessesByWindow.get(winId);
          if (current?.process === secProc) {
            activeProcessesByWindow.delete(winId);
          }
        });
        return;
      }

      // Normal single command completion
      const durationMs = Date.now() - startTime;
      if (!win.isDestroyed()) {
        win.webContents.send('build:done', {
          exitCode: code ?? 0,
          durationMs,
        } as BuildCompletedEvent);
      }

      // Safe cleanup: only delete if map entry still refers to THIS process
      const current = activeProcessesByWindow.get(winId);
      if (current?.process === proc) {
        activeProcessesByWindow.delete(winId);
      }
    });

    return { success: true };
  } catch (err: any) {
    if (proc) {
      const current = activeProcessesByWindow.get(winId);
      if (current?.process === proc) {
        activeProcessesByWindow.delete(winId);
      }
    }
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
