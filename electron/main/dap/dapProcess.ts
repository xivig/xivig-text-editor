import { spawn, ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { DebugConfiguration } from './dapTypes';
import { encodeLspMessage, JsonRpcDecoder } from '../lsp/jsonRpcFraming';

export class DapProcess extends EventEmitter {
  private child: ChildProcess | null = null;
  private decoder = new JsonRpcDecoder();
  private seq = 1;
  private pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void; timer: NodeJS.Timeout }>();
  public isRunning = false;

  constructor(public readonly sessionId: string, public readonly config: DebugConfiguration) {
    super();
  }

  public async start(): Promise<boolean> {
    const { type, request, program, args = [], cwd } = this.config;

    // Resolve adapter command
    let command = '';
    let commandArgs: string[] = [];

    if (type === 'node' || type === 'pwa-node') {
      command = process.execPath; // Use current Node binary
      commandArgs = ['--inspect-brk=0', program || 'index.js', ...args];
    } else if (type === 'python') {
      command = 'python';
      commandArgs = ['-m', 'debugpy', '--wait-for-client', program || 'main.py', ...args];
    } else if (type === 'swift' || type === 'lldb') {
      command = 'lldb-dap';
      commandArgs = [...args];
    } else {
      command = type;
      commandArgs = [...args];
    }

    try {
      this.child = spawn(command, commandArgs, {
        cwd: cwd || process.cwd(),
        env: { ...process.env, ...this.config.env },
        shell: false,
      });

      this.isRunning = true;

      this.child.stdout?.on('data', (chunk: Buffer) => {
        const messages = this.decoder.push(chunk);
        for (const msg of messages) {
          this.handleMessage(msg);
        }
      });

      this.child.stderr?.on('data', (chunk: Buffer) => {
        const text = chunk.toString('utf8');
        this.emit('output', { category: 'stderr', output: text });
      });

      this.child.on('error', (err) => {
        this.emit('error', err);
        this.cleanup();
      });

      this.child.on('exit', (code, signal) => {
        this.isRunning = false;
        this.emit('terminated', { code, signal });
        this.cleanup();
      });

      // Send initialize request
      await this.sendRequest('initialize', {
        clientID: 'xivig',
        clientName: 'Xivig Text Editor',
        adapterID: type,
        linesStartAt1: true,
        columnsStartAt1: true,
        pathFormat: 'path',
        supportsVariableType: true,
        supportsRunInTerminalRequest: true,
      });

      return true;
    } catch (err: any) {
      this.emit('error', err);
      this.cleanup();
      return false;
    }
  }

  public sendRequest<T = any>(command: string, args?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.child || !this.isRunning) {
        return reject(new Error('DAP process is not running'));
      }

      const seq = this.seq++;
      const payload = {
        seq,
        type: 'request',
        command,
        arguments: args,
      };

      const timer = setTimeout(() => {
        this.pendingRequests.delete(seq);
        reject(new Error(`DAP request '${command}' timed out after 10000ms`));
      }, 10000);

      this.pendingRequests.set(seq, { resolve, reject, timer });

      try {
        const encoded = encodeLspMessage(payload);
        this.child.stdin?.write(encoded);
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(seq);
        reject(err);
      }
    });
  }

  private handleMessage(msg: any) {
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'response') {
      const pending = this.pendingRequests.get(msg.request_seq);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(msg.request_seq);
        if (msg.success) {
          pending.resolve(msg.body);
        } else {
          pending.reject(new Error(msg.message || `DAP response failed for command ${msg.command}`));
        }
      }
    } else if (msg.type === 'event') {
      this.emit(msg.event, msg.body);
    }
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.child || !this.isRunning) {
        return resolve();
      }

      this.sendRequest('disconnect', { restart: false })
        .catch(() => {})
        .finally(() => {
          this.cleanup();
          resolve();
        });
    });
  }

  private cleanup() {
    this.isRunning = false;
    for (const [, req] of this.pendingRequests) {
      clearTimeout(req.timer);
      req.reject(new Error('DAP process terminated'));
    }
    this.pendingRequests.clear();
    if (this.child) {
      try {
        this.child.kill();
      } catch {
        // ignore
      }
      this.child = null;
    }
  }
}
