import { describe, it, expect } from 'vitest';
import {
  parseCommandLine,
  validateCommandTokens,
  resolveWindowsBinary,
  resolveStructuredCommand,
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
