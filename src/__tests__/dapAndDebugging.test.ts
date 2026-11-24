// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { useDebugStore } from '../stores/debugStore';

describe('DAP & Debugging System', () => {
  beforeEach(() => {
    useDebugStore.setState({
      breakpoints: {},
      activeSessionId: null,
      sessionState: 'stopped',
      stackFrames: [],
      activeFrame: null,
      variablesByScope: {},
      watchExpressions: [],
      consoleMessages: [],
    });
  });

  it('toggles breakpoints on and off with condition support', () => {
    const store = useDebugStore.getState();
    const filePath = 'C:/projects/app/main.ts';

    // Add breakpoint at line 10
    store.toggleBreakpoint(filePath, 10);
    const bps1 = useDebugStore.getState().breakpoints['C:/projects/app/main.ts'];
    expect(bps1).toHaveLength(1);
    expect(bps1[0].line).toBe(10);
    expect(bps1[0].verified).toBe(true);

    // Add conditional breakpoint at line 20
    store.toggleBreakpoint(filePath, 20, 'count > 5');
    const bps2 = useDebugStore.getState().breakpoints['C:/projects/app/main.ts'];
    expect(bps2).toHaveLength(2);
    expect(bps2[1].line).toBe(20);
    expect(bps2[1].condition).toBe('count > 5');

    // Toggle line 10 off
    store.toggleBreakpoint(filePath, 10);
    const bps3 = useDebugStore.getState().breakpoints['C:/projects/app/main.ts'];
    expect(bps3).toHaveLength(1);
    expect(bps3[0].line).toBe(20);
  });

  it('clears all breakpoints across all files', () => {
    const store = useDebugStore.getState();
    store.toggleBreakpoint('/src/a.ts', 5);
    store.toggleBreakpoint('/src/b.ts', 15);

    expect(Object.keys(useDebugStore.getState().breakpoints)).toHaveLength(2);
    store.clearAllBreakpoints();
    expect(Object.keys(useDebugStore.getState().breakpoints)).toHaveLength(0);
  });

  it('adds and removes watch expressions', () => {
    const store = useDebugStore.getState();
    store.addWatchExpression('x + y');
    store.addWatchExpression('user.name');

    const watches = useDebugStore.getState().watchExpressions;
    expect(watches).toHaveLength(2);
    expect(watches[0].expression).toBe('x + y');
    expect(watches[1].expression).toBe('user.name');

    store.removeWatchExpression(watches[0].id);
    expect(useDebugStore.getState().watchExpressions).toHaveLength(1);
    expect(useDebugStore.getState().watchExpressions[0].expression).toBe('user.name');
  });

  it('manages debug console logs and message buffering', () => {
    const store = useDebugStore.getState();
    store.appendConsoleMessage('stdout', 'Server listening on 3000');
    store.appendConsoleMessage('stderr', 'Warning: deprecated API');

    const msgs = useDebugStore.getState().consoleMessages;
    expect(msgs).toHaveLength(2);
    expect(msgs[0].category).toBe('stdout');
    expect(msgs[0].text).toBe('Server listening on 3000');
    expect(msgs[1].category).toBe('stderr');

    store.clearConsole();
    expect(useDebugStore.getState().consoleMessages).toHaveLength(0);
  });

  it('manages stack frames and active frame selection', async () => {
    const store = useDebugStore.getState();
    const mockFrame = {
      id: 101,
      name: 'calculateTotal',
      source: { name: 'checkout.ts', path: '/src/checkout.ts' },
      line: 42,
      column: 1,
    };

    await store.selectFrame(mockFrame);
    expect(useDebugStore.getState().activeFrame).toEqual(mockFrame);
  });
});
