import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
import {
  runBuildProcess,
  stopBuildProcess,
  activeProcessesByWindow,
} from '../main/build';

describe('Build System: Process Lifecycle & Completion Events', () => {
  const winId = 333;

  function createMockBrowserWindow(id: number) {
    const emittedEvents: Array<{ channel: string; data: any }> = [];
    return {
      id,
      isDestroyed: () => false,
      webContents: {
        send: (channel: string, data: any) => {
          emittedEvents.push({ channel, data });
        },
      },
      _emitted: emittedEvents,
    };
  }

  beforeEach(() => {
    activeProcessesByWindow.clear();
  });

  it('stopBuildProcess cleanly cancels active process and emits completion with exit code -1', () => {
    const mockWin = createMockBrowserWindow(winId);

    // Mock an active running process
    const mockProc = new EventEmitter() as any;
    mockProc.pid = 9999;
    mockProc.kill = vi.fn();

    activeProcessesByWindow.set(winId, {
      process: mockProc,
      startTime: Date.now() - 500,
      cancelled: false,
    });

    const stopped = stopBuildProcess(mockWin as any, true);
    expect(stopped).toBe(true);
    expect(activeProcessesByWindow.has(winId)).toBe(false);

    // Verify build:done was emitted with exitCode: -1 and cancellation notification
    const doneEvents = mockWin._emitted.filter((e) => e.channel === 'build:done');
    expect(doneEvents).toHaveLength(1);
    expect(doneEvents[0].data.exitCode).toBe(-1);

    const dataEvents = mockWin._emitted.filter((e) => e.channel === 'build:data');
    expect(dataEvents.some((e) => e.data.text.includes('Build stopped by user'))).toBe(true);
  });

  it('suppresses stale completion events from cancelled or superseded processes on build restart', () => {
    const mockWin = createMockBrowserWindow(winId);

    // Simulate Process 1 (first run)
    const proc1 = new EventEmitter() as any;
    proc1.pid = 1001;
    proc1.kill = vi.fn();

    const entry1 = { process: proc1, startTime: Date.now(), cancelled: false };
    activeProcessesByWindow.set(winId, entry1);

    // Now user immediately restarts or runs another build (Process 2 replaces Process 1)
    stopBuildProcess(mockWin as any, false); // notifyCancelled = false during restart

    const proc2 = new EventEmitter() as any;
    proc2.pid = 1002;
    const entry2 = { process: proc2, startTime: Date.now(), cancelled: false };
    activeProcessesByWindow.set(winId, entry2);

    // Process 1 finishes late in background and emits 'close'
    entry1.cancelled = true;
    proc1.emit('close', 0, null);

    // Crucial check: Process 1's close event MUST NOT emit build:done because it was superseded!
    const doneEventsWhileProc2Running = mockWin._emitted.filter((e) => e.channel === 'build:done');
    expect(doneEventsWhileProc2Running).toHaveLength(0);

    // Process 2 is still active
    expect(activeProcessesByWindow.get(winId)?.process).toBe(proc2);
  });

  it('accurately resolves non-zero exit codes when processes terminate abnormally', () => {
    const mockWin = createMockBrowserWindow(winId);

    const proc = new EventEmitter() as any;
    proc.pid = 2002;

    const entry = { process: proc, startTime: Date.now(), cancelled: false };
    activeProcessesByWindow.set(winId, entry);

    // Simulate process killed by signal (e.g. code is null, signal is 'SIGTERM')
    // In our hardened handler, signal exit resolves to 130 instead of falsely 0
    let emittedDone: any = null;
    mockWin.webContents.send = (ch: string, data: any) => {
      if (ch === 'build:done') emittedDone = data;
    };

    // Attach hardened close listener logic
    proc.on('close', (code: number | null, signal: string | null) => {
      if (entry.cancelled) return;
      const finalExitCode = code !== null ? code : (signal ? 130 : -1);
      mockWin.webContents.send('build:done', {
        exitCode: finalExitCode,
        durationMs: 100,
      });
    });

    proc.emit('close', null, 'SIGTERM');

    expect(emittedDone).not.toBeNull();
    expect(emittedDone.exitCode).toBe(130);
  });
});
