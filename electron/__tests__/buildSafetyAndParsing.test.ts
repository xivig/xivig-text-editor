import { describe, it, expect } from 'vitest';
import {
  parseCommandLine,
  validateCommandTokens,
  resolveWindowsBinary,
  resolveStructuredCommand,
  findStandardKotlinCompiler,
  findStandardJdkHome,
} from '../main/build';

describe('Windows Build Execution and Command Safety (P0 Finding)', () => {
  it('correctly tokenizes command lines with quoted paths containing spaces', () => {
    const input = '"C:\\Program Files\\nodejs\\node.exe" "C:\\Users\\Cyber Word\\app.js" --flag';
    const { program, args } = parseCommandLine(input);

    expect(program).toBe('C:\\Program Files\\nodejs\\node.exe');
    expect(args).toEqual(['C:\\Users\\Cyber Word\\app.js', '--flag']);
  });

  it('handles single quotes and escaped quotes inside command lines', () => {
    const input = "python -u 'scripts/my script.py' \"nested \\\"quotes\\\"\"";
    const { program, args } = parseCommandLine(input);

    expect(program).toBe('python');
    expect(args).toEqual(['-u', 'scripts/my script.py', 'nested "quotes"']);
  });

  it('rejects forbidden general shell metacharacters', () => {
    expect(() => validateCommandTokens(['node', 'app.js', ';', 'calc.exe'])).toThrow(
      /Security Exception.*forbidden shell metacharacter/
    );
    expect(() => validateCommandTokens(['node', 'app.js | dir'])).toThrow(
      /Security Exception.*forbidden shell metacharacter/
    );
    expect(() => validateCommandTokens(['node', '`id`'])).toThrow(
      /Security Exception.*forbidden shell metacharacter/
    );
    expect(() => validateCommandTokens(['node', '$VAR'])).toThrow(
      /Security Exception.*forbidden shell metacharacter/
    );
  });

  it('strictly rejects Windows cmd.exe expansion characters for batch files', () => {
    // When isWindowsBatch is true, % ^ ! ( ) are caught
    expect(() => validateCommandTokens(['npm.cmd', '%PATH%'], true)).toThrow(
      /Security Exception.*forbidden Windows cmd\.exe metacharacter/
    );
    expect(() => validateCommandTokens(['npm.cmd', '^foo'], true)).toThrow(
      /Security Exception.*forbidden Windows cmd\.exe metacharacter/
    );
    expect(() => validateCommandTokens(['npm.cmd', '!DELAYED!'], true)).toThrow(
      /Security Exception.*forbidden Windows cmd\.exe metacharacter/
    );
    expect(() => validateCommandTokens(['npm.cmd', '(calc)'], true)).toThrow(
      /Security Exception.*forbidden Windows cmd\.exe metacharacter/
    );
  });

  it('distinguishes direct binaries from Windows batch files', () => {
    if (process.platform === 'win32') {
      const pythonInfo = resolveWindowsBinary('python');
      expect(pythonInfo.isBatch).toBe(false);

      const gccInfo = resolveWindowsBinary('gcc');
      expect(gccInfo.isBatch).toBe(false);

      const npmInfo = resolveWindowsBinary('npm');
      expect(npmInfo.isBatch).toBe(true);
      expect(npmInfo.binary).toBe('npm.cmd');

      const kotlincInfo = resolveWindowsBinary('kotlinc');
      expect(kotlincInfo.isBatch).toBe(true);
      expect(kotlincInfo.binary).toMatch(/kotlinc\.bat$/i);

      const kotlinInfo = resolveWindowsBinary('kotlin');
      expect(kotlinInfo.isBatch).toBe(true);
      expect(kotlinInfo.binary).toMatch(/kotlin\.bat$/i);
    }
  });

  it('allows standard Windows Program Files (x86) paths in batch token validation', () => {
    expect(() =>
      validateCommandTokens(['C:\\Program Files (x86)\\Java\\jdk\\bin\\java.exe'], true)
    ).not.toThrow();
  });

  it('provides auto-discovery helpers for Kotlin compiler and JDK', () => {
    if (process.platform === 'win32') {
      const kotlincPath = findStandardKotlinCompiler('kotlinc');
      // On systems with Android Studio / IntelliJ installed, returns valid .bat path
      if (kotlincPath) {
        expect(kotlincPath).toMatch(/kotlinc\.bat$/i);
      }

      const jdkHome = findStandardJdkHome();
      if (jdkHome) {
        expect(typeof jdkHome).toBe('string');
      }
    }
  });

  it('prioritizes structured command options over whitespace splitting', () => {
    const structured = resolveStructuredCommand({
      program: 'C:\\Program Files\\MinGW\\bin\\gcc.exe',
      args: ['-Wall', 'C:\\My Projects\\main.c', '-o', 'main.exe'],
    });

    expect(structured.program).toBe('C:\\Program Files\\MinGW\\bin\\gcc.exe');
    expect(structured.args).toEqual(['-Wall', 'C:\\My Projects\\main.c', '-o', 'main.exe']);
  });
});
