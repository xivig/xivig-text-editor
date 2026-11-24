import { BrowserWindow } from 'electron';
import { DapProcess } from './dapProcess';
import { DebugConfiguration, SourceBreakpoint } from './dapTypes';

export class DapManager {
  private sessions = new Map<string, DapProcess>();
  private windowSessions = new Map<number, Set<string>>();

  public async startSession(
    win: BrowserWindow,
    sessionId: string,
    config: DebugConfiguration
  ): Promise<{ success: boolean; error?: string }> {
    if (this.sessions.has(sessionId)) {
      await this.stopSession(sessionId);
    }

    const process = new DapProcess(sessionId, config);

    // Forward events to window
    process.on('stopped', (body) => {
      if (!win.isDestroyed()) {
        win.webContents.send('dap:stopped', { sessionId, ...body });
      }
    });

    process.on('continued', (body) => {
      if (!win.isDestroyed()) {
        win.webContents.send('dap:continued', { sessionId, ...body });
      }
    });

    process.on('output', (body) => {
      if (!win.isDestroyed()) {
        win.webContents.send('dap:output', { sessionId, ...body });
      }
    });

    process.on('terminated', (body) => {
      if (!win.isDestroyed()) {
        win.webContents.send('dap:terminated', { sessionId, ...body });
      }
      this.sessions.delete(sessionId);
    });

    const started = await process.start();
    if (!started) {
      return { success: false, error: 'Failed to launch debug adapter' };
    }

    this.sessions.set(sessionId, process);

    if (!this.windowSessions.has(win.id)) {
      this.windowSessions.set(win.id, new Set());
    }
    this.windowSessions.get(win.id)!.add(sessionId);

    return { success: true };
  }

  public async sendRequest(sessionId: string, command: string, args?: any): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session '${sessionId}' not found`);
    }
    return session.sendRequest(command, args);
  }

  public async setBreakpoints(
    sessionId: string,
    filePath: string,
    breakpoints: SourceBreakpoint[]
  ): Promise<any> {
    return this.sendRequest(sessionId, 'setBreakpoints', {
      source: { path: filePath },
      breakpoints,
    });
  }

  public async stopSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.stop();
      this.sessions.delete(sessionId);
    }
  }

  public async stopAllForWindow(winId: number): Promise<void> {
    const sessionIds = this.windowSessions.get(winId);
    if (sessionIds) {
      for (const id of sessionIds) {
        await this.stopSession(id);
      }
      this.windowSessions.delete(winId);
    }
  }
}

export const dapManager = new DapManager();
