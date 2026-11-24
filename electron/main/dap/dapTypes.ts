/**
 * Debug Adapter Protocol (DAP 1.58+) Core Types
 */

export interface DapSource {
  name?: string;
  path?: string;
  sourceReference?: number;
}

export interface DapBreakpoint {
  id?: number;
  verified: boolean;
  message?: string;
  source?: DapSource;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface SourceBreakpoint {
  line: number;
  column?: number;
  condition?: string;
  hitCondition?: string;
  logMessage?: string;
}

export interface DapStackFrame {
  id: number;
  name: string;
  source?: DapSource;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  canRestart?: boolean;
}

export interface DapScope {
  name: string;
  variablesReference: number;
  expensive: boolean;
  namedVariables?: number;
  indexedVariables?: number;
}

export interface DapVariable {
  name: string;
  value: string;
  type?: string;
  variablesReference: number;
  namedVariables?: number;
  indexedVariables?: number;
  memoryReference?: string;
}

export interface DapThread {
  id: number;
  name: string;
}

export interface DebugConfiguration {
  name: string;
  type: string; // 'node' | 'python' | 'go' | 'cppdbg' | 'lldb'
  request: 'launch' | 'attach';
  program?: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  stopOnEntry?: boolean;
  port?: number;
  host?: string;
  processId?: number;
  [key: string]: any;
}

export interface StoppedEventParams {
  reason: 'step' | 'breakpoint' | 'exception' | 'pause' | 'entry' | 'goto' | 'function breakpoint';
  description?: string;
  threadId?: number;
  preserveFocusHint?: boolean;
  text?: string;
  allThreadsStopped?: boolean;
}
