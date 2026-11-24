import { spawn, ChildProcess } from 'child_process';
import { LanguageServerProfile, TextDocumentItem, PublishDiagnosticsParams } from './types';
import { encodeLspMessage, JsonRpcDecoder, JsonRpcMessage } from './jsonRpcFraming';

export type LspNotificationHandler = (method: string, params: any) => void;
export type LspStatusChangeHandler = (status: LanguageServerProfile['status'], message?: string) => void;

export class LspProcess {
  public profile: LanguageServerProfile;
  private childProcess: ChildProcess | null = null;
  private decoder = new JsonRpcDecoder();
  private requestIdCounter = 1;
  private pendingRequests = new Map<
    number | string,
    { resolve: (val: any) => void; reject: (err: any) => void; timer: NodeJS.Timeout }
  >();
  private openDocuments = new Map<string, { version: number; languageId: string }>();
  public serverCapabilities: any = null;

  constructor(
    profile: LanguageServerProfile,
    private onNotification?: LspNotificationHandler,
    private onStatusChange?: LspStatusChangeHandler
  ) {
    this.profile = { ...profile };
  }

  public get isRunning(): boolean {
    return this.profile.status === 'running' && this.childProcess !== null && !this.childProcess.killed;
  }

  public async start(workspaceRootPath?: string): Promise<boolean> {
    if (this.isRunning) return true;

    this.setStatus('starting', 'Initializing language server...');
    const rootUri = workspaceRootPath ? `file:///${workspaceRootPath.replace(/\\/g, '/')}` : null;

    try {
      this.childProcess = spawn(this.profile.command, this.profile.args, {
        cwd: workspaceRootPath || process.cwd(),
        shell: process.platform === 'win32',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          ...(this.profile.env || {}),
        },
      });

      this.profile.pid = this.childProcess.pid;

      this.childProcess.stdout?.on('data', (chunk: Buffer) => {
        const messages = this.decoder.push(chunk);
        for (const msg of messages) {
          this.handleIncomingMessage(msg);
        }
      });

      this.childProcess.stderr?.on('data', (errChunk: Buffer) => {
        const errText = errChunk.toString('utf-8').trim();
        if (errText) {
          console.debug(`[LSP:${this.profile.id} stderr]`, errText);
        }
      });

      this.childProcess.on('error', (err) => {
        console.warn(`[LSP:${this.profile.id}] Process execution error:`, err.message);
        this.setStatus('error', `Not installed or failed to start: ${this.profile.installGuide || err.message}`);
        this.cleanupPendingRequests(err);
      });

      this.childProcess.on('close', (code, signal) => {
        if (code !== 0 && this.profile.status === 'starting') {
          this.setStatus(
            'error',
            `Server exited with code ${code ?? signal}. Install: ${this.profile.installGuide || 'check server installation'}`
          );
        } else {
          this.setStatus('stopped', `Process exited (code ${code ?? signal})`);
        }
        this.childProcess = null;
        this.cleanupPendingRequests(new Error(`Server closed with code ${code ?? signal}`));
      });

      // Send standard LSP initialize handshake
      const initResult = await this.sendRequest('initialize', {
        processId: process.pid,
        rootUri,
        rootPath: workspaceRootPath || null,
        workspaceFolders: rootUri ? [{ uri: rootUri, name: 'Workspace' }] : null,
        capabilities: this.getClientCapabilities(),
        clientInfo: {
          name: 'Xivig Text Editor',
          version: '1.4.0',
        },
        initializationOptions: {},
      }, 12000);

      this.serverCapabilities = initResult?.capabilities || {};
      this.sendNotification('initialized', {});
      this.setStatus('running', 'Active and responsive');
      return true;
    } catch (err: any) {
      console.warn(`[LSP:${this.profile.id}] Start handshake failed:`, err.message);
      this.setStatus(
        'error',
        `Start failed: ${err.message}. ${this.profile.installGuide ? `Install via: ${this.profile.installGuide}` : ''}`
      );
      this.stop(true);
      return false;
    }
  }

  public async sendRequest(method: string, params: any, timeoutMs = 12000): Promise<any> {
    if (!this.childProcess || !this.childProcess.stdin?.writable) {
      throw new Error(`Language server ${this.profile.name} is not running or stdin is closed.`);
    }

    const id = this.requestIdCounter++;
    const message: JsonRpcMessage = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`LSP Request '${method}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });

      try {
        const payload = encodeLspMessage(message);
        this.childProcess?.stdin?.write(payload);
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(err);
      }
    });
  }

  public sendNotification(method: string, params: any): void {
    if (!this.childProcess || !this.childProcess.stdin?.writable) return;

    try {
      const message: JsonRpcMessage = {
        jsonrpc: '2.0',
        method,
        params,
      };
      this.childProcess.stdin.write(encodeLspMessage(message));
    } catch (err) {
      console.error(`[LSP:${this.profile.id}] Error writing notification '${method}':`, err);
    }
  }

  public openDocument(doc: TextDocumentItem): void {
    this.openDocuments.set(doc.uri, { version: doc.version, languageId: doc.languageId });
    this.sendNotification('textDocument/didOpen', {
      textDocument: doc,
    });
  }

  public changeDocument(uri: string, newText: string, explicitVersion?: number): void {
    const existing = this.openDocuments.get(uri);
    const version = explicitVersion ?? (existing ? existing.version + 1 : 1);
    this.openDocuments.set(uri, { version, languageId: existing?.languageId || 'plaintext' });

    this.sendNotification('textDocument/didChange', {
      textDocument: { uri, version },
      contentChanges: [{ text: newText }],
    });
  }

  public saveDocument(uri: string, text?: string): void {
    this.sendNotification('textDocument/didSave', {
      textDocument: { uri },
      text: text ?? undefined,
    });
  }

  public closeDocument(uri: string): void {
    this.openDocuments.delete(uri);
    this.sendNotification('textDocument/didClose', {
      textDocument: { uri },
    });
  }

  public async stop(preserveStatus = false): Promise<void> {
    if (!this.childProcess) {
      if (!preserveStatus && this.profile.status !== 'error') {
        this.setStatus('stopped', 'Server stopped');
      }
      return;
    }

    try {
      // Graceful shutdown attempt
      await Promise.race([
        this.sendRequest('shutdown', {}, 2000).then(() => this.sendNotification('exit', {})),
        new Promise((resolve) => setTimeout(resolve, 2200)),
      ]);
    } catch {
      // Ignore shutdown errors
    } finally {
      if (this.childProcess) {
        try {
          this.childProcess.kill();
        } catch {}
        this.childProcess = null;
      }
      this.decoder.reset();
      this.openDocuments.clear();
      this.cleanupPendingRequests(new Error('Language server stopped'));
      if (!preserveStatus && this.profile.status !== 'error') {
        this.setStatus('stopped', 'Server stopped');
      }
    }
  }

  private handleIncomingMessage(msg: JsonRpcMessage): void {
    // 1. Response to our pending request
    if (msg.id !== undefined && this.pendingRequests.has(msg.id)) {
      const pending = this.pendingRequests.get(msg.id)!;
      clearTimeout(pending.timer);
      this.pendingRequests.delete(msg.id);

      if (msg.error) {
        pending.reject(new Error(msg.error.message || `LSP Error ${msg.error.code}`));
      } else {
        pending.resolve(msg.result);
      }
      return;
    }

    // 2. Server Request to Client (e.g. workspace/configuration, client/registerCapability)
    if (msg.id !== undefined && msg.method) {
      this.handleServerRequest(msg.id, msg.method, msg.params);
      return;
    }

    // 3. Server Notification to Client (e.g. textDocument/publishDiagnostics, window/showMessage)
    if (msg.method) {
      if (this.onNotification) {
        this.onNotification(msg.method, msg.params);
      }
    }
  }

  private handleServerRequest(id: string | number, method: string, params: any): void {
    let result: any = null;

    if (method === 'workspace/configuration') {
      result = (params?.items || []).map(() => ({}));
    } else if (method === 'workspace/workspaceFolders') {
      result = [];
    }

    try {
      const response: JsonRpcMessage = {
        jsonrpc: '2.0',
        id,
        result,
      };
      this.childProcess?.stdin?.write(encodeLspMessage(response));
    } catch (err) {
      console.error(`[LSP:${this.profile.id}] Failed to answer server request ${method}:`, err);
    }
  }

  private setStatus(status: LanguageServerProfile['status'], message?: string): void {
    this.profile.status = status;
    this.profile.statusMessage = message;
    if (this.onStatusChange) {
      this.onStatusChange(status, message);
    }
  }

  private cleanupPendingRequests(reason: Error): void {
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(reason);
    }
    this.pendingRequests.clear();
  }

  private getClientCapabilities(): any {
    return {
      workspace: {
        applyEdit: true,
        workspaceEdit: { documentChanges: true },
        symbol: { dynamicRegistration: true },
        didChangeWatchedFiles: { dynamicRegistration: true },
      },
      textDocument: {
        synchronization: {
          dynamicRegistration: true,
          willSave: false,
          willSaveWaitUntil: false,
          didSave: true,
        },
        completion: {
          dynamicRegistration: true,
          completionItem: {
            snippetSupport: true,
            commitCharactersSupport: true,
            documentationFormat: ['markdown', 'plaintext'],
            deprecatedSupport: true,
            preselectSupport: true,
            tagSupport: { valueSet: [1] },
            insertReplaceSupport: true,
          },
          completionItemKind: {
            valueSet: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
          },
        },
        hover: {
          dynamicRegistration: true,
          contentFormat: ['markdown', 'plaintext'],
        },
        signatureHelp: {
          dynamicRegistration: true,
          signatureInformation: {
            documentationFormat: ['markdown', 'plaintext'],
            parameterInformation: { labelOffsetSupport: true },
          },
        },
        definition: { dynamicRegistration: true, linkSupport: true },
        references: { dynamicRegistration: true },
        documentSymbol: {
          dynamicRegistration: true,
          hierarchicalDocumentSymbolSupport: true,
        },
        codeAction: {
          dynamicRegistration: true,
          codeActionLiteralSupport: {
            codeActionKind: {
              valueSet: [
                '',
                'quickfix',
                'refactor',
                'refactor.extract',
                'refactor.inline',
                'refactor.rewrite',
                'source',
                'source.organizeImports',
              ],
            },
          },
          isPreferredSupport: true,
        },
        codeLens: { dynamicRegistration: true },
        formatting: { dynamicRegistration: true },
        rangeFormatting: { dynamicRegistration: true },
        rename: { dynamicRegistration: true, prepareSupport: true },
        publishDiagnostics: {
          relatedInformation: true,
          tagSupport: { valueSet: [1, 2] },
        },
        foldingRange: {
          dynamicRegistration: true,
          rangeLimit: 5000,
          lineFoldingOnly: true,
        },
        inlayHint: { dynamicRegistration: true },
        semanticTokens: {
          dynamicRegistration: true,
          requests: { range: false, full: { delta: false } },
          tokenTypes: [
            'type', 'class', 'enum', 'interface', 'struct', 'typeParameter',
            'parameter', 'variable', 'property', 'enumMember', 'event', 'function',
            'method', 'macro', 'keyword', 'modifier', 'comment', 'string', 'number',
            'regexp', 'operator', 'decorator',
          ],
          tokenModifiers: [
            'declaration', 'definition', 'readonly', 'static', 'deprecated',
            'abstract', 'async', 'modification', 'documentation', 'defaultLibrary',
          ],
          formats: ['relative'],
        },
      },
    };
  }
}
