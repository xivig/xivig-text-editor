import { create } from 'zustand';

export interface SourceBreakpoint {
  line: number;
  column?: number;
  condition?: string;
  hitCondition?: string;
  logMessage?: string;
  verified?: boolean;
}

export interface DapStackFrame {
  id: number;
  name: string;
  source?: { name?: string; path?: string };
  line: number;
  column: number;
}

export interface DapVariable {
  name: string;
  value: string;
  type?: string;
  variablesReference: number;
}

export interface DebugConfiguration {
  name: string;
  type: string;
  request: 'launch' | 'attach';
  program?: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  stopOnEntry?: boolean;
  port?: number;
}

export interface WatchExpression {
  id: string;
  expression: string;
  value?: string;
}

export interface DebugConsoleMessage {
  id: string;
  category: 'stdout' | 'stderr' | 'console' | 'error';
  text: string;
  timestamp: number;
}

interface DebugState {
  breakpoints: Record<string, SourceBreakpoint[]>;
  activeSessionId: string | null;
  sessionState: 'stopped' | 'running' | 'paused';
  configurations: DebugConfiguration[];
  selectedConfigIndex: number;
  stackFrames: DapStackFrame[];
  activeFrame: DapStackFrame | null;
  variablesByScope: Record<string, DapVariable[]>;
  watchExpressions: WatchExpression[];
  consoleMessages: DebugConsoleMessage[];
  initialized: boolean;

  // Actions
  initialize: () => void;
  toggleBreakpoint: (filePath: string, line: number, condition?: string, logMessage?: string) => void;
  clearAllBreakpoints: () => void;
  startDebugging: (config?: DebugConfiguration) => Promise<boolean>;
  stopDebugging: () => Promise<void>;
  continueExecution: () => Promise<void>;
  pauseExecution: () => Promise<void>;
  stepOver: () => Promise<void>;
  stepInto: () => Promise<void>;
  stepOut: () => Promise<void>;
  restartDebugging: () => Promise<void>;
  selectFrame: (frame: DapStackFrame) => Promise<void>;
  addWatchExpression: (expression: string) => void;
  removeWatchExpression: (id: string) => void;
  evaluateExpression: (expr: string) => Promise<string>;
  appendConsoleMessage: (category: 'stdout' | 'stderr' | 'console' | 'error', text: string) => void;
  clearConsole: () => void;
}

export const useDebugStore = create<DebugState>((set, get) => ({
  breakpoints: {},
  activeSessionId: null,
  sessionState: 'stopped',
  configurations: [
    {
      name: 'Launch Current File (Node.js)',
      type: 'node',
      request: 'launch',
      program: '${file}',
    },
    {
      name: 'Launch Python File',
      type: 'python',
      request: 'launch',
      program: '${file}',
    },
    {
      name: 'Launch Swift File (LLDB)',
      type: 'swift',
      request: 'launch',
      program: '${file}',
    },
    {
      name: 'Attach to Local Process (9229)',
      type: 'node',
      request: 'attach',
      port: 9229,
    },
  ],
  selectedConfigIndex: 0,
  stackFrames: [],
  activeFrame: null,
  variablesByScope: {},
  watchExpressions: [],
  consoleMessages: [],
  initialized: false,

  initialize: () => {
    if (get().initialized) return;
    set({ initialized: true });

    if (typeof window !== 'undefined' && window.xivig?.dap) {
      window.xivig.dap.onStopped((data) => {
        set({ sessionState: 'paused' });
        get().appendConsoleMessage('console', `Paused on ${data.reason || 'breakpoint'}`);
        // Refresh stack frames & scopes
        get().selectFrame({ id: 1, name: 'paused', line: data.line || 1, column: 1 });
      });

      window.xivig.dap.onContinued(() => {
        set({ sessionState: 'running', activeFrame: null, stackFrames: [] });
      });

      window.xivig.dap.onOutput((data) => {
        get().appendConsoleMessage(data.category === 'stderr' ? 'stderr' : 'stdout', data.output || '');
      });

      window.xivig.dap.onTerminated(() => {
        set({
          sessionState: 'stopped',
          activeSessionId: null,
          stackFrames: [],
          activeFrame: null,
          variablesByScope: {},
        });
        get().appendConsoleMessage('console', 'Debug session terminated.');
      });
    }
  },

  toggleBreakpoint: (filePath, line, condition, logMessage) => {
    const norm = filePath.replace(/\\/g, '/');
    const existing = get().breakpoints[norm] || [];
    const idx = existing.findIndex((b) => b.line === line);

    let nextBreakpoints: SourceBreakpoint[];
    if (idx !== -1) {
      nextBreakpoints = existing.filter((b) => b.line !== line);
    } else {
      nextBreakpoints = [...existing, { line, condition, logMessage, verified: true }].sort((a, b) => a.line - b.line);
    }

    set((state) => ({
      breakpoints: {
        ...state.breakpoints,
        [norm]: nextBreakpoints,
      },
    }));

    // Sync to active DAP session if running
    const { activeSessionId } = get();
    if (activeSessionId && window.xivig?.dap?.setBreakpoints) {
      window.xivig.dap.setBreakpoints(activeSessionId, norm, nextBreakpoints).catch(() => {});
    }
  },

  clearAllBreakpoints: () => {
    set({ breakpoints: {} });
  },

  startDebugging: async (customConfig) => {
    const { configurations, selectedConfigIndex } = get();
    const config = customConfig || configurations[selectedConfigIndex];
    if (!config || !window.xivig?.dap?.startSession) return false;

    const sessionId = `debug-${Date.now()}`;
    get().appendConsoleMessage('console', `Starting debug session: ${config.name}...`);

    try {
      const res = await window.xivig.dap.startSession(sessionId, config);
      if (res.success) {
        set({ activeSessionId: sessionId, sessionState: 'running' });

        // Send registered breakpoints
        const { breakpoints } = get();
        for (const [file, bpList] of Object.entries(breakpoints)) {
          if (bpList.length > 0) {
            await window.xivig.dap.setBreakpoints(sessionId, file, bpList);
          }
        }

        return true;
      } else {
        get().appendConsoleMessage('error', `Debug launch failed: ${res.error}`);
        return false;
      }
    } catch (err: any) {
      get().appendConsoleMessage('error', `Failed to start debugging: ${err.message}`);
      return false;
    }
  },

  stopDebugging: async () => {
    const { activeSessionId } = get();
    if (!activeSessionId || !window.xivig?.dap?.stopSession) return;

    await window.xivig.dap.stopSession(activeSessionId);
    set({
      activeSessionId: null,
      sessionState: 'stopped',
      stackFrames: [],
      activeFrame: null,
      variablesByScope: {},
    });
  },

  continueExecution: async () => {
    const { activeSessionId } = get();
    if (!activeSessionId || !window.xivig?.dap?.sendRequest) return;
    await window.xivig.dap.sendRequest(activeSessionId, 'continue', {});
    set({ sessionState: 'running' });
  },

  pauseExecution: async () => {
    const { activeSessionId } = get();
    if (!activeSessionId || !window.xivig?.dap?.sendRequest) return;
    await window.xivig.dap.sendRequest(activeSessionId, 'pause', {});
  },

  stepOver: async () => {
    const { activeSessionId } = get();
    if (!activeSessionId || !window.xivig?.dap?.sendRequest) return;
    await window.xivig.dap.sendRequest(activeSessionId, 'next', {});
  },

  stepInto: async () => {
    const { activeSessionId } = get();
    if (!activeSessionId || !window.xivig?.dap?.sendRequest) return;
    await window.xivig.dap.sendRequest(activeSessionId, 'stepIn', {});
  },

  stepOut: async () => {
    const { activeSessionId } = get();
    if (!activeSessionId || !window.xivig?.dap?.sendRequest) return;
    await window.xivig.dap.sendRequest(activeSessionId, 'stepOut', {});
  },

  restartDebugging: async () => {
    await get().stopDebugging();
    await get().startDebugging();
  },

  selectFrame: async (frame) => {
    set({ activeFrame: frame });
    const { activeSessionId } = get();
    if (!activeSessionId || !window.xivig?.dap?.sendRequest) return;

    try {
      const scopesRes = await window.xivig.dap.sendRequest(activeSessionId, 'scopes', { frameId: frame.id });
      const scopes = scopesRes?.scopes || [];
      const varMap: Record<string, DapVariable[]> = {};

      for (const scope of scopes) {
        if (scope.variablesReference > 0) {
          const varRes = await window.xivig.dap.sendRequest(activeSessionId, 'variables', {
            variablesReference: scope.variablesReference,
          });
          varMap[scope.name] = varRes?.variables || [];
        }
      }

      set({ variablesByScope: varMap });
    } catch {
      // ignore
    }
  },

  addWatchExpression: (expression: string) => {
    if (!expression.trim()) return;
    const item: WatchExpression = {
      id: `watch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      expression: expression.trim(),
    };
    set((state) => ({ watchExpressions: [...state.watchExpressions, item] }));
    get().evaluateExpression(item.expression).then((val) => {
      set((state) => ({
        watchExpressions: state.watchExpressions.map((w) => (w.id === item.id ? { ...w, value: val } : w)),
      }));
    });
  },

  removeWatchExpression: (id: string) => {
    set((state) => ({
      watchExpressions: state.watchExpressions.filter((w) => w.id !== id),
    }));
  },

  evaluateExpression: async (expr: string) => {
    const { activeSessionId, activeFrame } = get();
    if (!activeSessionId || !window.xivig?.dap?.sendRequest) return '<not debugging>';

    try {
      const res = await window.xivig.dap.sendRequest(activeSessionId, 'evaluate', {
        expression: expr,
        frameId: activeFrame?.id,
        context: 'repl',
      });
      return res?.result || '<undefined>';
    } catch (err: any) {
      return `Error: ${err.message}`;
    }
  },

  appendConsoleMessage: (category, text) => {
    set((state) => ({
      consoleMessages: [
        ...state.consoleMessages,
        {
          id: `msg-${Date.now()}-${Math.random()}`,
          category,
          text,
          timestamp: Date.now(),
        },
      ].slice(-200),
    }));
  },

  clearConsole: () => set({ consoleMessages: [] }),
}));
