/**
 * Isolated Extension Host & Permission Sandbox
 * Runs third-party and community extensions inside a restricted sandbox environment
 * with explicit capability-based security (permissions) and safe message passing.
 */

export type ExtensionPermission =
  | 'workspace.read'
  | 'workspace.write'
  | 'ui.notifications'
  | 'ui.statusbar'
  | 'commands.register'
  | 'network.fetch';

export interface SandboxExtensionContext {
  extensionId: string;
  permissions: Set<ExtensionPermission>;
  subscriptions: Array<() => void>;
}

export interface SandboxCommandRegistration {
  id: string;
  extensionId: string;
  handler: (...args: any[]) => any;
}

export interface SandboxStatusBarItem {
  id: string;
  extensionId: string;
  text: string;
  tooltip?: string;
  command?: string;
}

export class IsolatedExtensionHost {
  private static instance: IsolatedExtensionHost;
  private activeExtensions = new Map<string, SandboxExtensionContext>();
  private registeredCommands = new Map<string, SandboxCommandRegistration>();
  private registeredStatusBarItems = new Map<string, SandboxStatusBarItem>();
  private logs: Array<{ timestamp: string; extensionId: string; message: string; level: 'info' | 'warn' | 'error' }> = [];

  private constructor() {}

  public static getInstance(): IsolatedExtensionHost {
    if (!IsolatedExtensionHost.instance) {
      IsolatedExtensionHost.instance = new IsolatedExtensionHost();
    }
    return IsolatedExtensionHost.instance;
  }

  /**
   * Registers and executes an extension within the capability sandbox.
   */
  public activateExtension(
    extensionId: string,
    permissions: ExtensionPermission[],
    extensionFactory: (api: any) => void | { deactivate?: () => void }
  ): { success: boolean; error?: string } {
    try {
      const permSet = new Set(permissions);
      const context: SandboxExtensionContext = {
        extensionId,
        permissions: permSet,
        subscriptions: [],
      };

      // Construct scoped, capability-checked API
      const scopedApi = this.createScopedApi(context);

      // Execute factory in sandbox
      const result = extensionFactory(scopedApi);
      if (result && typeof result.deactivate === 'function') {
        context.subscriptions.push(result.deactivate);
      }

      this.activeExtensions.set(extensionId, context);
      this.log(extensionId, 'info', `Extension activated successfully with ${permissions.length} granted permissions.`);
      return { success: true };
    } catch (err: any) {
      this.log(extensionId, 'error', `Activation failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  public deactivateExtension(extensionId: string): void {
    const ctx = this.activeExtensions.get(extensionId);
    if (ctx) {
      ctx.subscriptions.forEach((cleanup) => {
        try {
          cleanup();
        } catch (e) {
          console.error(`[ExtensionHost:${extensionId}] Cleanup error:`, e);
        }
      });
      // Remove commands & status bar items registered by this extension
      for (const [cmdId, cmd] of Array.from(this.registeredCommands.entries())) {
        if (cmd.extensionId === extensionId) {
          this.registeredCommands.delete(cmdId);
        }
      }
      for (const [sbId, sb] of Array.from(this.registeredStatusBarItems.entries())) {
        if (sb.extensionId === extensionId) {
          this.registeredStatusBarItems.delete(sbId);
        }
      }
      this.activeExtensions.delete(extensionId);
      this.log(extensionId, 'info', 'Extension deactivated and resources cleaned up.');
    }
  }

  public executeCommand(commandId: string, ...args: any[]): any {
    const reg = this.registeredCommands.get(commandId);
    if (!reg) {
      throw new Error(`Command "${commandId}" is not registered in the extension host.`);
    }
    try {
      return reg.handler(...args);
    } catch (err: any) {
      this.log(reg.extensionId, 'error', `Command execution error on "${commandId}": ${err.message}`);
      throw err;
    }
  }

  public getStatusBarItems(): SandboxStatusBarItem[] {
    return Array.from(this.registeredStatusBarItems.values());
  }

  public getLogs() {
    return [...this.logs];
  }

  public clear(): void {
    for (const id of Array.from(this.activeExtensions.keys())) {
      this.deactivateExtension(id);
    }
    this.registeredCommands.clear();
    this.registeredStatusBarItems.clear();
    this.logs = [];
  }

  private createScopedApi(ctx: SandboxExtensionContext) {
    const assertPermission = (perm: ExtensionPermission) => {
      if (!ctx.permissions.has(perm)) {
        throw new Error(
          `Permission Denied: Extension "${ctx.extensionId}" requested capability "${perm}" which was not granted.`
        );
      }
    };

    return {
      commands: {
        registerCommand: (id: string, handler: (...args: any[]) => any) => {
          assertPermission('commands.register');
          this.registeredCommands.set(id, { id, extensionId: ctx.extensionId, handler });
          ctx.subscriptions.push(() => this.registeredCommands.delete(id));
        },
      },
      window: {
        showInformationMessage: (message: string) => {
          assertPermission('ui.notifications');
          console.info(`[${ctx.extensionId}] ${message}`);
        },
        showErrorMessage: (message: string) => {
          assertPermission('ui.notifications');
          console.error(`[${ctx.extensionId}] ${message}`);
        },
        createStatusBarItem: (id: string, text: string, tooltip?: string, command?: string) => {
          assertPermission('ui.statusbar');
          const item: SandboxStatusBarItem = { id, extensionId: ctx.extensionId, text, tooltip, command };
          this.registeredStatusBarItems.set(id, item);
          ctx.subscriptions.push(() => this.registeredStatusBarItems.delete(id));
        },
      },
      network: {
        fetch: async (url: string, options?: RequestInit) => {
          assertPermission('network.fetch');
          return fetch(url, options);
        },
      },
    };
  }

  private log(extensionId: string, level: 'info' | 'warn' | 'error', message: string) {
    this.logs.push({
      timestamp: new Date().toLocaleTimeString(),
      extensionId,
      level,
      message,
    });
    if (this.logs.length > 200) {
      this.logs.shift();
    }
  }
}

export const isolatedExtensionHost = IsolatedExtensionHost.getInstance();
