import { BrowserWindow } from 'electron';
import { LanguageServerProfile, TextDocumentItem } from './types';
import { DEFAULT_LANGUAGE_SERVERS, findServerProfileForFile } from './lspServerRegistry';
import { LspProcess } from './lspProcess';

export class LspManager {
  private profiles: Map<string, LanguageServerProfile> = new Map();
  private activeProcesses: Map<string, LspProcess> = new Map();
  private workspaceRoot?: string;
  private targetWindows: Set<BrowserWindow> = new Set();

  constructor() {
    for (const p of DEFAULT_LANGUAGE_SERVERS) {
      this.profiles.set(p.id, { ...p });
    }
  }

  public setWorkspaceRoot(rootPath: string): void {
    this.workspaceRoot = rootPath;
  }

  public registerWindow(win: BrowserWindow): void {
    this.targetWindows.add(win);
    win.on('closed', () => {
      this.targetWindows.delete(win);
    });
  }

  public listServers(): LanguageServerProfile[] {
    const list: LanguageServerProfile[] = [];
    for (const [, p] of this.profiles) {
      const proc = this.activeProcesses.get(p.id);
      list.push({
        ...p,
        status: proc?.profile.status || p.status,
        statusMessage: proc?.profile.statusMessage || p.statusMessage,
        pid: proc?.profile.pid,
      });
    }
    return list;
  }

  public async startServer(serverId: string, customRoot?: string): Promise<boolean> {
    const profile = this.profiles.get(serverId);
    if (!profile) return false;

    let proc = this.activeProcesses.get(serverId);
    if (proc && proc.isRunning) {
      return true;
    }

    const root = customRoot || this.workspaceRoot;
    proc = new LspProcess(
      profile,
      (method, params) => this.broadcastNotification(serverId, method, params),
      (status, message) => this.handleServerStatusChange(serverId, status, message)
    );

    this.activeProcesses.set(serverId, proc);
    const success = await proc.start(root);
    this.broadcastServerList();
    return success;
  }

  public async stopServer(serverId: string): Promise<void> {
    const proc = this.activeProcesses.get(serverId);
    if (proc) {
      await proc.stop();
      this.activeProcesses.delete(serverId);
    }
    const profile = this.profiles.get(serverId);
    if (profile) {
      profile.status = 'stopped';
      profile.statusMessage = undefined;
      profile.pid = undefined;
    }
    this.broadcastServerList();
  }

  public async restartServer(serverId: string): Promise<boolean> {
    await this.stopServer(serverId);
    return this.startServer(serverId);
  }

  public updateServerConfig(serverId: string, patch: Partial<LanguageServerProfile>): LanguageServerProfile | null {
    const existing = this.profiles.get(serverId);
    if (!existing) return null;

    Object.assign(existing, patch);
    this.broadcastServerList();
    return existing;
  }

  public getActiveProcessForFile(filePath: string, languageId?: string): LspProcess | undefined {
    const profile = findServerProfileForFile(Array.from(this.profiles.values()), filePath, languageId);
    if (!profile) return undefined;

    return this.activeProcesses.get(profile.id);
  }

  public async ensureServerForFile(filePath: string, languageId?: string): Promise<LspProcess | undefined> {
    const profile = findServerProfileForFile(Array.from(this.profiles.values()), filePath, languageId);
    if (!profile || !profile.enabled) return undefined;

    let proc = this.activeProcesses.get(profile.id);
    if (!proc || !proc.isRunning) {
      if (profile.autoStart) {
        await this.startServer(profile.id);
        proc = this.activeProcesses.get(profile.id);
      }
    }
    return proc;
  }

  public async openDocument(doc: TextDocumentItem, filePath: string): Promise<void> {
    const proc = await this.ensureServerForFile(filePath, doc.languageId);
    if (proc && proc.isRunning) {
      proc.openDocument(doc);
    }
  }

  public async changeDocument(uri: string, newText: string, filePath: string, languageId?: string): Promise<void> {
    const proc = await this.ensureServerForFile(filePath, languageId);
    if (proc && proc.isRunning) {
      proc.changeDocument(uri, newText);
    }
  }

  public async saveDocument(uri: string, filePath: string, text?: string, languageId?: string): Promise<void> {
    const proc = await this.ensureServerForFile(filePath, languageId);
    if (proc && proc.isRunning) {
      proc.saveDocument(uri, text);
    }
  }

  public async closeDocument(uri: string, filePath: string, languageId?: string): Promise<void> {
    const proc = this.getActiveProcessForFile(filePath, languageId);
    if (proc && proc.isRunning) {
      proc.closeDocument(uri);
    }
  }

  public async sendRequest(
    target: { serverId?: string; filePath?: string; languageId?: string },
    method: string,
    params: any
  ): Promise<any> {
    let proc: LspProcess | undefined;

    if (target.serverId) {
      proc = this.activeProcesses.get(target.serverId);
    } else if (target.filePath) {
      proc = await this.ensureServerForFile(target.filePath, target.languageId);
    }

    if (!proc || !proc.isRunning) {
      throw new Error(`No active language server found for target: ${JSON.stringify(target)}`);
    }

    return proc.sendRequest(method, params);
  }

  public async shutdownAll(): Promise<void> {
    const stops: Promise<void>[] = [];
    for (const [, proc] of this.activeProcesses) {
      stops.push(proc.stop());
    }
    await Promise.allSettled(stops);
    this.activeProcesses.clear();
  }

  private broadcastNotification(serverId: string, method: string, params: any): void {
    for (const win of this.targetWindows) {
      if (!win.isDestroyed()) {
        if (method === 'textDocument/publishDiagnostics') {
          win.webContents.send('lsp:diagnostics', { serverId, ...params });
        } else {
          win.webContents.send('lsp:notification', { serverId, method, params });
        }
      }
    }
  }

  private handleServerStatusChange(
    serverId: string,
    status: LanguageServerProfile['status'],
    message?: string
  ): void {
    const profile = this.profiles.get(serverId);
    if (profile) {
      profile.status = status;
      profile.statusMessage = message;
    }
    this.broadcastServerList();
  }

  private broadcastServerList(): void {
    const list = this.listServers();
    for (const win of this.targetWindows) {
      if (!win.isDestroyed()) {
        win.webContents.send('lsp:servers-changed', list);
      }
    }
  }
}

export const lspManager = new LspManager();
