import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  terminalsByWindow,
  stopTerminal,
  resizeTerminal,
  writeToTerminal,
  getAvailableShells,
  TerminalInstance,
} from '../main/terminal';

describe('Terminal: Pseudoterminal & Multi-Instance Session Management', () => {
  const win1 = 1001;
  const win2 = 2002;

  beforeEach(() => {
    stopTerminal(); // Clears all terminals across all windows
  });

  it('detects system shells correctly', () => {
    const shells = getAvailableShells();
    expect(Array.isArray(shells)).toBe(true);
    expect(shells.length).toBeGreaterThan(0);
    for (const shell of shells) {
      expect(typeof shell.name).toBe('string');
      expect(typeof shell.executable).toBe('string');
      expect(typeof shell.path).toBe('string');
    }
  });

  it('supports multiple independent terminal instances within the same window', () => {
    // Manually register two terminal instances for win1
    const mockProc1 = { kill: vi.fn(), resize: vi.fn(), write: vi.fn() };
    const mockProc2 = { kill: vi.fn(), resize: vi.fn(), write: vi.fn() };

    const win1Map = new Map<string, TerminalInstance>();
    terminalsByWindow.set(win1, win1Map);

    const inst1: TerminalInstance = {
      terminalId: 'term-1',
      proc: mockProc1,
      isPty: true,
      pid: 1111,
      cwd: 'C:\\workspace',
      shell: 'powershell.exe',
    };

    const inst2: TerminalInstance = {
      terminalId: 'term-2',
      proc: mockProc2,
      isPty: true,
      pid: 2222,
      cwd: 'C:\\workspace',
      shell: 'cmd.exe',
    };

    win1Map.set('term-1', inst1);
    win1Map.set('term-2', inst2);

    expect(win1Map.size).toBe(2);
    expect(win1Map.get('term-1')?.pid).toBe(1111);
    expect(win1Map.get('term-2')?.pid).toBe(2222);

    // Write directed to specific terminal instance
    writeToTerminal(win1, 'echo hello\n', 'term-1');
    expect(mockProc1.write).toHaveBeenCalledWith('echo hello\n');
    expect(mockProc2.write).not.toHaveBeenCalled();

    writeToTerminal(win1, 'dir\n', 'term-2');
    expect(mockProc2.write).toHaveBeenCalledWith('dir\n');
  });

  it('resizes PTY instances with valid boundary clamping', () => {
    const mockPty = {
      kill: vi.fn(),
      resize: vi.fn(),
    };

    const winMap = new Map<string, TerminalInstance>();
    terminalsByWindow.set(win1, winMap);

    winMap.set('pty-1', {
      terminalId: 'pty-1',
      proc: mockPty,
      isPty: true,
      pid: 3333,
      cwd: 'C:\\workspace',
      shell: 'pwsh.exe',
    });

    // Resize valid dimensions
    const res1 = resizeTerminal(win1, 120, 40, 'pty-1');
    expect(res1).toBe(true);
    expect(mockPty.resize).toHaveBeenCalledWith(120, 40);

    // Clamps lower bound to minimum 10 cols, 5 rows
    const res2 = resizeTerminal(win1, 2, 1, 'pty-1');
    expect(res2).toBe(true);
    expect(mockPty.resize).toHaveBeenCalledWith(10, 5);

    // Returns false for non-existent session
    expect(resizeTerminal(win1, 80, 24, 'unknown-id')).toBe(false);
  });

  it('stopping a specific terminal instance cleans up only that instance', () => {
    const mockProc1 = { kill: vi.fn() };
    const mockProc2 = { kill: vi.fn() };

    const win1Map = new Map<string, TerminalInstance>();
    terminalsByWindow.set(win1, win1Map);

    win1Map.set('term-1', {
      terminalId: 'term-1',
      proc: mockProc1,
      isPty: true,
      pid: 1111,
      cwd: 'C:\\',
      shell: 'cmd.exe',
    });

    win1Map.set('term-2', {
      terminalId: 'term-2',
      proc: mockProc2,
      isPty: true,
      pid: 2222,
      cwd: 'C:\\',
      shell: 'powershell.exe',
    });

    // Stop term-1 only
    stopTerminal(win1, 'term-1');

    expect(mockProc1.kill).toHaveBeenCalled();
    expect(mockProc2.kill).not.toHaveBeenCalled();
    expect(win1Map.has('term-1')).toBe(false);
    expect(win1Map.has('term-2')).toBe(true);
  });

  it('closing a window terminates all terminal instances for that window without affecting other windows', () => {
    const mockProcWin1 = { kill: vi.fn() };
    const mockProcWin2 = { kill: vi.fn() };

    const win1Map = new Map<string, TerminalInstance>();
    win1Map.set('term-a', {
      terminalId: 'term-a',
      proc: mockProcWin1,
      isPty: true,
      pid: 101,
      cwd: 'C:\\',
      shell: 'cmd.exe',
    });
    terminalsByWindow.set(win1, win1Map);

    const win2Map = new Map<string, TerminalInstance>();
    win2Map.set('term-b', {
      terminalId: 'term-b',
      proc: mockProcWin2,
      isPty: true,
      pid: 202,
      cwd: 'C:\\',
      shell: 'cmd.exe',
    });
    terminalsByWindow.set(win2, win2Map);

    // Window 1 closes
    stopTerminal(win1);

    expect(mockProcWin1.kill).toHaveBeenCalled();
    expect(mockProcWin2.kill).not.toHaveBeenCalled();
    expect(terminalsByWindow.has(win1)).toBe(false);
    expect(terminalsByWindow.has(win2)).toBe(true);
  });
});
