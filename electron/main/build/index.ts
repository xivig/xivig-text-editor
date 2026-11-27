import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { BrowserWindow } from 'electron';
import { assertPathAuthorized } from '../security';

export interface ActiveProcessEntry {
  process: ChildProcess;
  startTime: number;
  cancelled?: boolean;
}

// Per-window tracking to avoid global singleton collision
export const activeProcessesByWindow = new Map<number, ActiveProcessEntry>();

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
    // Allow standard Windows Program Files (x86) directory paths in batch validation
    const tokenToCheck = isWindowsBatch ? token.replace(/\(x86\)/gi, '') : token;
    if (pattern.test(tokenToCheck)) {
      const charMatch = tokenToCheck.match(pattern)?.[0];
      throw new Error(
        `Security Exception: Command argument contains forbidden ${isWindowsBatch ? 'Windows cmd.exe' : 'shell'} metacharacter (${charMatch}): "${token}"`
      );
    }
  }
}

/**
 * Auto-detects standard Kotlin compiler locations on Windows if not available on PATH.
 */
export function findStandardKotlinCompiler(toolName: string): string | null {
  const isWin = process.platform === 'win32';
  if (!isWin) return null;

  const cleanName = toolName.toLowerCase().replace(/\.(bat|cmd|exe)$/i, '');
  const candidateToolNames = [`${cleanName}.bat`, `${cleanName}.cmd`, `${cleanName}.exe`, cleanName];

  // 1. Check PATH
  const pathEnv = process.env.PATH || '';
  const pathDirs = pathEnv.split(path.delimiter).filter(Boolean);
  for (const dir of pathDirs) {
    for (const cand of candidateToolNames) {
      const full = path.join(dir, cand);
      try {
        if (fs.existsSync(full) && fs.statSync(full).isFile()) {
          return full;
        }
      } catch {}
    }
  }

  // 2. Check Standard Installation Paths (Android Studio, IntelliJ IDEA, SDKMAN, Scoop, Chocolatey)
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const localAppData = process.env['LOCALAPPDATA'] || '';
  const userProfile = process.env['USERPROFILE'] || '';
  const programData = process.env['ProgramData'] || 'C:\\ProgramData';

  const searchRoots: string[] = [];

  // Android Studio bundled Kotlin
  searchRoots.push(
    path.join(programFiles, 'Android', 'Android Studio', 'plugins', 'Kotlin', 'kotlinc', 'bin'),
    path.join(localAppData, 'Programs', 'Android Studio', 'plugins', 'Kotlin', 'kotlinc', 'bin')
  );

  // JetBrains IDEs (IntelliJ IDEA Ultimate, Community, etc.)
  const jetbrainsDirs = [
    path.join(programFiles, 'JetBrains'),
    path.join(programFilesX86, 'JetBrains'),
    path.join(localAppData, 'Programs', 'JetBrains'),
  ];

  for (const jbRoot of jetbrainsDirs) {
    try {
      if (fs.existsSync(jbRoot)) {
        const subdirs = fs.readdirSync(jbRoot);
        for (const sub of subdirs) {
          searchRoots.push(path.join(jbRoot, sub, 'plugins', 'Kotlin', 'kotlinc', 'bin'));
        }
      }
    } catch {}
  }

  // Standalone Kotlin compiler (SDKMAN, Scoop, Chocolatey, manual C:\kotlinc)
  searchRoots.push(
    path.join(userProfile, '.sdkman', 'candidates', 'kotlin', 'current', 'bin'),
    path.join(userProfile, 'scoop', 'apps', 'kotlin', 'current', 'bin'),
    path.join(programData, 'chocolatey', 'bin'),
    path.join(programData, 'chocolatey', 'lib', 'kotlinc', 'tools', 'kotlinc', 'bin'),
    'C:\\kotlinc\\bin',
    'C:\\tools\\kotlinc\\bin'
  );

  for (const root of searchRoots) {
    for (const cand of candidateToolNames) {
      const targetPath = path.join(root, cand);
      try {
        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
          return targetPath;
        }
      } catch {}
    }
  }

  return null;
}

/**
 * Auto-detects standard Java JDK installations on Windows if JAVA_HOME is not set.
 */
export function findStandardJdkHome(): string | null {
  const isWin = process.platform === 'win32';
  if (!isWin) return null;

  if (process.env.JAVA_HOME && fs.existsSync(process.env.JAVA_HOME)) {
    return process.env.JAVA_HOME;
  }

  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const localAppData = process.env['LOCALAPPDATA'] || '';

  const candidateHomes: string[] = [];

  // 1. JDKs under Program Files\Java
  for (const pf of [programFiles, programFilesX86]) {
    const javaDir = path.join(pf, 'Java');
    try {
      if (fs.existsSync(javaDir)) {
        const entries = fs.readdirSync(javaDir);
        const jdkEntries = entries
          .filter((e) => e.startsWith('jdk'))
          .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
        for (const jdk of jdkEntries) {
          candidateHomes.push(path.join(javaDir, jdk));
        }
        if (entries.includes('latest')) {
          candidateHomes.push(path.join(javaDir, 'latest'));
        }
      }
    } catch {}
  }

  // 2. Android Studio JetBrains Runtime (jbr)
  candidateHomes.push(
    path.join(programFiles, 'Android', 'Android Studio', 'jbr'),
    path.join(localAppData, 'Programs', 'Android Studio', 'jbr')
  );

  // 3. JetBrains IDEs jbr
  const jetbrainsDirs = [path.join(programFiles, 'JetBrains'), path.join(localAppData, 'Programs', 'JetBrains')];
  for (const jbRoot of jetbrainsDirs) {
    try {
      if (fs.existsSync(jbRoot)) {
        const subdirs = fs.readdirSync(jbRoot);
        for (const sub of subdirs) {
          candidateHomes.push(path.join(jbRoot, sub, 'jbr'));
        }
      }
    } catch {}
  }

  for (const home of candidateHomes) {
    try {
      const javaBin = path.join(home, 'bin', 'java.exe');
      if (fs.existsSync(javaBin)) {
        return home;
      }
    } catch {}
  }

  return null;
}

/**
 * Auto-detects standard PHP executable installations on Windows if not available on PATH.
 */
export function findStandardPhpExecutable(): string | null {
  const isWin = process.platform === 'win32';
  if (!isWin) return null;

  // 1. Check PATH
  const pathEnv = process.env.PATH || '';
  const pathDirs = pathEnv.split(path.delimiter).filter(Boolean);
  for (const dir of pathDirs) {
    const full = path.join(dir, 'php.exe');
    try {
      if (fs.existsSync(full) && fs.statSync(full).isFile()) {
        return full;
      }
    } catch {}
  }

  // 2. Check Standard Environments: XAMPP, Laragon, WampServer, Chocolatey, Scoop, standalone C:\php
  const userProfile = process.env['USERPROFILE'] || '';
  const programData = process.env['ProgramData'] || 'C:\\ProgramData';

  const candidatePaths: string[] = [
    'C:\\xampp\\php\\php.exe',
    'D:\\xampp\\php\\php.exe',
    'C:\\php\\php.exe',
    'C:\\tools\\php\\php.exe',
    path.join(programData, 'chocolatey', 'bin', 'php.exe'),
    path.join(userProfile, 'scoop', 'apps', 'php', 'current', 'php.exe'),
  ];

  // Laragon (e.g. C:\laragon\bin\php\php-8.x.x\php.exe)
  for (const root of ['C:\\laragon\\bin\\php', 'D:\\laragon\\bin\\php']) {
    try {
      if (fs.existsSync(root)) {
        const subdirs = fs.readdirSync(root).sort().reverse();
        for (const sub of subdirs) {
          candidatePaths.push(path.join(root, sub, 'php.exe'));
        }
      }
    } catch {}
  }

  // WampServer (e.g. C:\wamp64\bin\php\php8.x.x\php.exe)
  for (const root of ['C:\\wamp64\\bin\\php', 'C:\\wamp\\bin\\php', 'D:\\wamp64\\bin\\php']) {
    try {
      if (fs.existsSync(root)) {
        const subdirs = fs.readdirSync(root).sort().reverse();
        for (const sub of subdirs) {
          candidatePaths.push(path.join(root, sub, 'php.exe'));
        }
      }
    } catch {}
  }

  for (const cand of candidatePaths) {
    try {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        return cand;
      }
    } catch {}
  }

  return null;
}

/**
 * Auto-detects standard C and C++ compilers (GCC, G++, Clang, Clang++) on Windows if not available on PATH.
 */
export function findStandardCCompiler(tool: 'gcc' | 'g++' | 'clang' | 'clang++'): string | null {
  const isWin = process.platform === 'win32';
  if (!isWin) return null;

  const targetExe = `${tool}.exe`;

  // 1. Check PATH
  const pathEnv = process.env.PATH || '';
  const pathDirs = pathEnv.split(path.delimiter).filter(Boolean);
  for (const dir of pathDirs) {
    const full = path.join(dir, targetExe);
    try {
      if (fs.existsSync(full) && fs.statSync(full).isFile()) {
        return full;
      }
    } catch {}
  }

  // 2. Common Windows compiler directories
  const userProfile = process.env['USERPROFILE'] || '';
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const programData = process.env['ProgramData'] || 'C:\\ProgramData';
  const localAppData = process.env['LOCALAPPDATA'] || path.join(userProfile, 'AppData', 'Local');

  const candidateDirs: string[] = [
    // Embarcadero Dev-Cpp TDM-GCC
    path.join(programFilesX86, 'Embarcadero', 'Dev-Cpp', 'TDM-GCC-64', 'bin'),
    path.join(programFiles, 'Embarcadero', 'Dev-Cpp', 'TDM-GCC-64', 'bin'),
    path.join(programFilesX86, 'Dev-Cpp', 'MinGW64', 'bin'),
    path.join(programFiles, 'Dev-Cpp', 'MinGW64', 'bin'),

    // MSYS2 (ucrt64, mingw64, clang64, usr/bin)
    'C:\\msys64\\ucrt64\\bin',
    'C:\\msys64\\mingw64\\bin',
    'C:\\msys64\\clang64\\bin',
    'C:\\msys64\\usr\\bin',
    'D:\\msys64\\ucrt64\\bin',
    'D:\\msys64\\mingw64\\bin',

    // MinGW / MinGW-w64 / TDM-GCC
    'C:\\MinGW\\bin',
    'C:\\mingw-w64\\bin',
    'C:\\mingw64\\bin',
    'C:\\TDM-GCC-64\\bin',
    'C:\\TDM-GCC-32\\bin',
    'D:\\MinGW\\bin',
    'D:\\mingw64\\bin',

    // Strawberry Perl MinGW bundle
    'C:\\Strawberry\\c\\bin',

    // LLVM / Clang
    path.join(programFiles, 'LLVM', 'bin'),
    path.join(programFilesX86, 'LLVM', 'bin'),

    // CodeBlocks MinGW
    path.join(programFiles, 'CodeBlocks', 'MinGW', 'bin'),
    path.join(programFilesX86, 'CodeBlocks', 'MinGW', 'bin'),

    // Package managers (Chocolatey, Scoop, WinGet)
    path.join(programData, 'chocolatey', 'bin'),
    path.join(userProfile, 'scoop', 'shims'),
    path.join(userProfile, 'scoop', 'apps', 'mingw', 'current', 'bin'),
    path.join(userProfile, 'scoop', 'apps', 'llvm', 'current', 'bin'),
  ];

  // Also check WinGet package directories under %LOCALAPPDATA%\Microsoft\WinGet\Packages
  try {
    const wingetPackages = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
    if (fs.existsSync(wingetPackages)) {
      const entries = fs.readdirSync(wingetPackages);
      for (const entry of entries) {
        if (/llvm|mingw|gcc|clang/i.test(entry)) {
          candidateDirs.push(path.join(wingetPackages, entry, 'bin'));
        }
      }
    }
  } catch {}

  // Check direct tool match in candidate directories
  for (const dir of candidateDirs) {
    const candidateFile = path.join(dir, targetExe);
    try {
      if (fs.existsSync(candidateFile) && fs.statSync(candidateFile).isFile()) {
        return candidateFile;
      }
    } catch {}
  }

  // Cross-fallback: if tool is 'gcc' but 'clang.exe' exists, or if 'g++' but 'clang++.exe' exists
  const fallbackExe = tool === 'gcc' ? 'clang.exe' : tool === 'g++' ? 'clang++.exe' : null;
  if (fallbackExe) {
    for (const dir of candidateDirs) {
      const candidateFile = path.join(dir, fallbackExe);
      try {
        if (fs.existsSync(candidateFile) && fs.statSync(candidateFile).isFile()) {
          return candidateFile;
        }
      } catch {}
    }
  }

  return null;
}

/**
 * Auto-detects standard Swift compiler toolchain executables (swift, swiftc, lldb) on Windows.
 */
export function findStandardSwiftCompiler(tool: 'swift' | 'swiftc' | 'lldb' = 'swift'): string | null {
  const isWin = process.platform === 'win32';
  if (!isWin) return null;

  const targetExe = `${tool}.exe`;

  // 1. Check PATH
  const pathEnv = process.env.PATH || '';
  const pathDirs = pathEnv.split(path.delimiter).filter(Boolean);
  for (const dir of pathDirs) {
    const full = path.join(dir, targetExe);
    try {
      if (fs.existsSync(full) && fs.statSync(full).isFile()) {
        return full;
      }
    } catch {}
  }

  // 2. Common Windows Swift installation paths
  const userProfile = process.env['USERPROFILE'] || '';
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const localAppData = process.env['LOCALAPPDATA'] || path.join(userProfile, 'AppData', 'Local');

  const candidateDirs: string[] = [
    'C:\\Program Files\\Swift\\bin',
    'C:\\Program Files\\Swift\\usr\\bin',
    'C:\\Program Files (x86)\\Swift\\bin',
    'C:\\Program Files (x86)\\Swift\\usr\\bin',
    'C:\\Swift\\bin',
    'C:\\Swift\\usr\\bin',
    path.join(localAppData, 'Programs', 'Swift', 'bin'),
    path.join(localAppData, 'Programs', 'Swift', 'usr', 'bin'),
    path.join(userProfile, 'scoop', 'shims'),
    path.join(userProfile, 'scoop', 'apps', 'swift', 'current', 'bin'),
    path.join(process.env['ProgramData'] || 'C:\\ProgramData', 'chocolatey', 'bin'),
  ];

  // Dynamic search in Swift Toolchains roots:
  // 1. User local AppData (standard winget / user-level installer):
  //    %LOCALAPPDATA%\Programs\Swift\Toolchains\<version>\usr\bin
  // 2. System Program Files:
  //    C:\Program Files\Swift\Toolchains\<version>\usr\bin
  const toolchainRoots = [
    path.join(localAppData, 'Programs', 'Swift', 'Toolchains'),
    path.join(programFiles, 'Swift', 'Toolchains'),
    path.join(programFilesX86, 'Swift', 'Toolchains'),
  ];

  for (const root of toolchainRoots) {
    try {
      if (fs.existsSync(root)) {
        const versions = fs.readdirSync(root).sort().reverse();
        for (const v of versions) {
          candidateDirs.unshift(path.join(root, v, 'usr', 'bin'));
          candidateDirs.unshift(path.join(root, v, 'bin'));
        }
      }
    } catch {}
  }

  for (const dir of candidateDirs) {
    const candidateFile = path.join(dir, targetExe);
    try {
      if (fs.existsSync(candidateFile) && fs.statSync(candidateFile).isFile()) {
        return candidateFile;
      }
    } catch {}
  }

  return null;
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
    for (const candExt of ['.exe', '.bat', '.cmd', '']) {
      const direct = path.join(cwd, `${commandOrProgram}${candExt}`);
      if (fs.existsSync(direct)) {
        const isB = candExt === '.bat' || candExt === '.cmd';
        return { binary: direct, isBatch: isB };
      }
    }
  }

  const lower = commandOrProgram.toLowerCase();

  // Kotlin tools on Windows are .bat files, with auto-discovery support
  const knownKotlinTools = new Set(['kotlinc', 'kotlin', 'kotlinc-jvm', 'kotlinc-js']);
  if (knownKotlinTools.has(lower)) {
    const discovered = findStandardKotlinCompiler(lower);
    if (discovered) {
      return { binary: discovered, isBatch: true };
    }
    return { binary: `${commandOrProgram}.bat`, isBatch: true };
  }

  // PHP runner executable auto-discovery on Windows
  if (lower === 'php') {
    const discovered = findStandardPhpExecutable();
    if (discovered) {
      return { binary: discovered, isBatch: false };
    }
    return { binary: 'php.exe', isBatch: false };
  }

  // C/C++ compiler executable auto-discovery on Windows (GCC, G++, Clang, Clang++)
  const knownCCompilerTools = new Set(['gcc', 'g++', 'clang', 'clang++']);
  if (knownCCompilerTools.has(lower)) {
    const discovered = findStandardCCompiler(lower as any);
    if (discovered) {
      return { binary: discovered, isBatch: false };
    }
    return { binary: `${commandOrProgram}.exe`, isBatch: false };
  }

  // Swift compiler executable auto-discovery on Windows (swift, swiftc)
  const knownSwiftTools = new Set(['swift', 'swiftc']);
  if (knownSwiftTools.has(lower)) {
    const discovered = findStandardSwiftCompiler(lower as any);
    if (discovered) {
      return { binary: discovered, isBatch: false };
    }
    return { binary: `${commandOrProgram}.exe`, isBatch: false };
  }

  // Common tool mappings on Windows:
  // Node, Python, PHP, GCC, Java, Swift are direct executables (.exe)
  const knownExeTools = new Set(['node', 'python', 'py', 'python3', 'php', 'composer', 'gcc', 'g++', 'clang', 'clang++', 'java', 'javac', 'git', 'cargo', 'rustc', 'swift', 'swiftc', 'cmd']);
  if (knownExeTools.has(lower)) {
    return { binary: `${commandOrProgram}.exe`, isBatch: false };
  }

  // npm, npx, yarn, pnpm are .cmd batch wrappers on Windows
  const knownCmdTools = new Set(['npm', 'npx', 'yarn', 'pnpm']);
  if (knownCmdTools.has(lower)) {
    return { binary: `${commandOrProgram}.cmd`, isBatch: true };
  }

  // Gradle wrapper on Windows
  if (lower === 'gradlew') {
    return { binary: `${commandOrProgram}.bat`, isBatch: true };
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

  // Stop any currently running build task in THIS window without emitting duplicate cancellation event
  stopBuildProcess(win, false);

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
    const baseEnv: Record<string, string | undefined> = {
      ...process.env,
      FORCE_COLOR: '1',
      PYTHONUNBUFFERED: '1',
    };

    if (isWin) {
      // Auto-detect and configure JAVA_HOME if unset
      const detectedJdk = findStandardJdkHome();
      if (detectedJdk) {
        if (!baseEnv.JAVA_HOME) {
          baseEnv.JAVA_HOME = detectedJdk;
        }
        const jdkBin = path.join(detectedJdk, 'bin');
        const currentPath = baseEnv.PATH || process.env.PATH || '';
        if (!currentPath.toLowerCase().includes(jdkBin.toLowerCase())) {
          baseEnv.PATH = `${jdkBin}${path.delimiter}${currentPath}`;
        }
      }

      // Prepend resolved tool directory to PATH so companion executables work seamlessly
      if (path.isAbsolute(targetBinary)) {
        const binDir = path.dirname(targetBinary);
        const currentPath = baseEnv.PATH || process.env.PATH || '';
        if (!currentPath.toLowerCase().includes(binDir.toLowerCase())) {
          baseEnv.PATH = `${binDir}${path.delimiter}${currentPath}`;
        }

        // If running Swift toolchain, also ensure companion Runtimes usr/bin is on PATH and SDKROOT is configured
        if (targetBinary.toLowerCase().includes('swift')) {
          const swiftRoot = path.resolve(binDir, '../../../..');
          const runtimesRoot = path.join(swiftRoot, 'Runtimes');
          try {
            if (fs.existsSync(runtimesRoot)) {
              const runtimes = fs.readdirSync(runtimesRoot).sort().reverse();
              for (const r of runtimes) {
                const rBin = path.join(runtimesRoot, r, 'usr', 'bin');
                if (fs.existsSync(rBin) && !(baseEnv.PATH || '').toLowerCase().includes(rBin.toLowerCase())) {
                  baseEnv.PATH = `${rBin}${path.delimiter}${baseEnv.PATH || ''}`;
                }
              }
            }
          } catch {}

          if (!baseEnv.SDKROOT) {
            const platformsRoot = path.join(swiftRoot, 'Platforms');
            try {
              if (fs.existsSync(platformsRoot)) {
                const platforms = fs.readdirSync(platformsRoot).sort().reverse();
                for (const p of platforms) {
                  const sdk = path.join(platformsRoot, p, 'Windows.platform', 'Developer', 'SDKs', 'Windows.sdk');
                  if (fs.existsSync(sdk)) {
                    baseEnv.SDKROOT = sdk;
                    break;
                  }
                }
              }
            } catch {}
          }
        }
      }
    }

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

    const entry: ActiveProcessEntry = { process: proc, startTime, cancelled: false };
    activeProcessesByWindow.set(winId, entry);

    proc.stdout?.on('data', (chunk: Buffer) => {
      if (entry.cancelled) return;
      if (!win.isDestroyed()) {
        win.webContents.send('build:data', {
          type: 'stdout',
          text: chunk.toString('utf-8'),
        });
      }
    });

    proc.stderr?.on('data', (chunk: Buffer) => {
      if (entry.cancelled) return;
      if (!win.isDestroyed()) {
        const text = chunk.toString('utf-8');
        let extraTip = '';
        if (
          targetBinary.toLowerCase().includes('swift') &&
          (text.includes("'stdlib.h' file not found") || text.includes("could not build C module 'SwiftShims'"))
        ) {
          extraTip =
            '\r\n[Tip] Swift on Windows requires the Microsoft Windows 10/11 SDK & Visual C++ Runtime (UCRT) headers.' +
            '\r\nPlease install Visual Studio Build Tools with C++ or the Windows SDK in an Administrator terminal:\r\n' +
            '  winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"\r\n';
        }
        win.webContents.send('build:data', {
          type: 'stderr',
          text: text + extraTip,
        });
      }
    });

    proc.on('error', (err: any) => {
      if (entry.cancelled) return;
      const current = activeProcessesByWindow.get(winId);
      if (current && current.process !== proc) return;
      activeProcessesByWindow.delete(winId);

      if (!win.isDestroyed()) {
        let helpfulTip = '';
        if (err.code === 'ENOENT') {
          const binLower = rawProgram.toLowerCase();
          if (binLower === 'python' || binLower === 'py' || binLower === 'python3') {
            helpfulTip = '\r\n[Tip] Python interpreter was not found on PATH. Please ensure Python is installed and added to PATH (e.g. from python.org or Microsoft Store).\r\n';
          } else if (binLower === 'gcc' || binLower === 'g++' || binLower === 'clang' || binLower === 'clang++') {
            helpfulTip = `\r\n[Tip] C/C++ compiler '${targetBinary}' was not found. Please install MinGW-w64 (e.g. from winlibs.com or MSYS2 or Embarcadero Dev-C++) or LLVM Clang, and verify it is accessible.\r\n`;
          } else if (binLower === 'javac' || binLower === 'java') {
            helpfulTip = `\r\n[Tip] '${targetBinary}' was not found on PATH. Install Java Development Kit (JDK 17+) and verify java/javac is in your environment PATH.\r\n`;
          } else if (binLower === 'node' || binLower === 'npm' || binLower === 'npx') {
            helpfulTip = `\r\n[Tip] '${targetBinary}' was not found on PATH. Install Node.js from nodejs.org and restart the editor.\r\n`;
          } else if (binLower === 'kotlinc' || binLower === 'kotlin' || binLower === 'kotlinc-jvm') {
            helpfulTip = `\r\n[Tip] Kotlin compiler was not found on PATH. Install Kotlin (e.g. via 'winget install JetBrains.Kotlin.Compiler' or Android Studio) and add its bin directory to PATH.\r\n`;
          } else if (binLower === 'swift' || binLower === 'swiftc') {
            helpfulTip = `\r\n[Tip] Swift toolchain was not found on PATH. Install the official Swift for Windows toolchain from swift.org/download or via 'winget install Swift.Swift' (or 'choco install swift') and add its usr/bin folder to PATH.\r\n`;
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
    });

    proc.on('close', (code: number | null, signal: string | null) => {
      // If process was cancelled or replaced by a new build process, suppress stale completion event
      if (entry.cancelled) return;
      const current = activeProcessesByWindow.get(winId);
      if (current && current.process !== proc) return;
      activeProcessesByWindow.delete(winId);

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

        const secEntry: ActiveProcessEntry = { process: secProc, startTime, cancelled: false };
        activeProcessesByWindow.set(winId, secEntry);

        secProc.stdout?.on('data', (chunk: Buffer) => {
          if (secEntry.cancelled) return;
          if (!win.isDestroyed()) {
            win.webContents.send('build:data', {
              type: 'stdout',
              text: chunk.toString('utf-8'),
            });
          }
        });

        secProc.stderr?.on('data', (chunk: Buffer) => {
          if (secEntry.cancelled) return;
          if (!win.isDestroyed()) {
            win.webContents.send('build:data', {
              type: 'stderr',
              text: chunk.toString('utf-8'),
            });
          }
        });

        secProc.on('error', (secErr: any) => {
          if (secEntry.cancelled) return;
          const cur = activeProcessesByWindow.get(winId);
          if (cur && cur.process !== secProc) return;
          activeProcessesByWindow.delete(winId);

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
        });

        secProc.on('close', (secCode: number | null, secSignal: string | null) => {
          if (secEntry.cancelled) return;
          const cur = activeProcessesByWindow.get(winId);
          if (cur && cur.process !== secProc) return;
          activeProcessesByWindow.delete(winId);

          const durationMs = Date.now() - startTime;
          const finalExitCode = secCode !== null ? secCode : (secSignal ? 130 : -1);
          if (!win.isDestroyed()) {
            win.webContents.send('build:done', {
              exitCode: finalExitCode,
              durationMs,
            } as BuildCompletedEvent);
          }
        });
        return;
      }

      // Normal single command completion
      const durationMs = Date.now() - startTime;
      const finalExitCode = code !== null ? code : (signal ? 130 : -1);
      if (!win.isDestroyed()) {
        win.webContents.send('build:done', {
          exitCode: finalExitCode,
          durationMs,
        } as BuildCompletedEvent);
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

export function stopBuildProcess(win: BrowserWindow | null, notifyCancelled = true): boolean {
  if (!win) return false;
  const entry = activeProcessesByWindow.get(win.id);
  if (!entry) return false;

  const { process: proc, startTime } = entry;
  entry.cancelled = true;

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

  if (notifyCancelled && !win.isDestroyed()) {
    win.webContents.send('build:data', {
      type: 'stderr',
      text: '\r\n[Build stopped by user]\r\n',
    });
    win.webContents.send('build:done', {
      exitCode: -1,
      durationMs: Date.now() - startTime,
    } as BuildCompletedEvent);
  }

  return true;
}

export function stopAllBuildProcesses(): void {
  for (const [winId, entry] of activeProcessesByWindow) {
    entry.cancelled = true;
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
