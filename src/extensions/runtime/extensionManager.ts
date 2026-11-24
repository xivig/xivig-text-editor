import { Extension as CodeMirrorExtension } from '@codemirror/state';
import {
  BuiltinExtensionModule,
  Disposable,
  ExtensionContext,
  ExtensionRuntimeState,
} from '../api/types';
import { BUILTIN_EXTENSIONS } from '../builtin/index';
import { contributionRegistry } from './contributionRegistry';
import { activationManager } from './activationManager';

type ChangeListener = () => void;

export class ExtensionManager {
  private runtimeStates = new Map<string, ExtensionRuntimeState>();
  private contextExtensions = new Map<string, CodeMirrorExtension[]>();
  private listeners = new Set<ChangeListener>();
  private settingsStore = new Map<string, any>();
  private isInitialized = false;

  constructor() {
    this.registerBuiltins();
  }

  private registerBuiltins() {
    for (const [id, module] of Object.entries(BUILTIN_EXTENSIONS)) {
      this.runtimeStates.set(id, {
        id,
        manifest: module.manifest,
        status: 'installed',
      });

      if (module.manifest.activationEvents) {
        for (const evt of module.manifest.activationEvents) {
          activationManager.registerActivationEvent(id, evt);
        }
      }
    }
  }

  /**
   * Initializes the extension manager with installed and enabled extension IDs.
   */
  async init(installedIds: string[] = [], enabledIds: string[] = []) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Register any installed ID in state
    for (const id of installedIds) {
      if (!this.runtimeStates.has(id)) {
        const builtin = BUILTIN_EXTENSIONS[id];
        if (builtin) {
          this.runtimeStates.set(id, {
            id,
            manifest: builtin.manifest,
            status: 'installed',
          });
        }
      }
    }

    // Activate all initially enabled extensions that have onEditorCreated or onStartup
    for (const id of enabledIds) {
      const state = this.runtimeStates.get(id);
      if (state) {
        await this.activateExtension(id);
      }
    }
  }

  /**
   * Activates an extension by ID.
   */
  async activateExtension(id: string): Promise<boolean> {
    const module = BUILTIN_EXTENSIONS[id];
    if (!module) return false;

    let state = this.runtimeStates.get(id);
    if (!state) {
      state = { id, manifest: module.manifest, status: 'installed' };
      this.runtimeStates.set(id, state);
    }

    if (state.status === 'enabled') {
      return true;
    }

    try {
      state.status = 'activating';
      contributionRegistry.registerManifestContributions(id, module.manifest);

      const subscriptions: Disposable[] = [];
      const context: ExtensionContext = {
        extensionId: id,
        subscriptions,
        registerCodeMirrorExtension: (ext: CodeMirrorExtension) => {
          const list = this.contextExtensions.get(id) || [];
          list.push(ext);
          this.contextExtensions.set(id, list);
          this.notifyListeners();
        },
        getSetting: <T = any>(key: string, defaultValue?: T): T => {
          return this.getSetting(key, defaultValue);
        },
      };

      state.context = context;
      await module.activate(context);

      state.status = 'enabled';
      this.notifyListeners();
      return true;
    } catch (err: any) {
      state.status = 'error';
      state.error = err?.message || String(err);
      this.notifyListeners();
      return false;
    }
  }

  /**
   * Deactivates an extension by ID.
   */
  async deactivateExtension(id: string): Promise<void> {
    const state = this.runtimeStates.get(id);
    if (!state || state.status !== 'enabled') {
      return;
    }

    const module = BUILTIN_EXTENSIONS[id];
    if (module?.deactivate) {
      try {
        await module.deactivate();
      } catch (err) {
        console.error(`Error deactivating extension ${id}:`, err);
      }
    }

    // Dispose subscriptions
    if (state.context?.subscriptions) {
      for (const sub of state.context.subscriptions) {
        try {
          sub.dispose();
        } catch (err) {
          console.error(`Error disposing subscription in ${id}:`, err);
        }
      }
      state.context.subscriptions = [];
    }

    this.contextExtensions.delete(id);
    contributionRegistry.unregisterContributions(id);
    state.status = 'disabled';
    this.notifyListeners();
  }

  /**
   * Handles activation event triggers (e.g. 'onEditorCreated').
   */
  async triggerActivationEvent(event: string) {
    activationManager.recordEvent(event);
    const extensionIds = activationManager.getExtensionsForEvent(event);
    for (const id of extensionIds) {
      const state = this.runtimeStates.get(id);
      if (state && (state.status === 'installed' || state.status === 'enabled')) {
        await this.activateExtension(id);
      }
    }
  }

  /**
   * Returns all CodeMirror extensions contributed by currently enabled extensions.
   */
  getActiveCodeMirrorExtensions(): CodeMirrorExtension[] {
    const extensions: CodeMirrorExtension[] = [];

    // Track processed modules to prevent duplicate entries if an extension has aliases
    const processedModules = new Set<BuiltinExtensionModule>();

    for (const [id, state] of this.runtimeStates.entries()) {
      if (state.status === 'enabled') {
        const module = BUILTIN_EXTENSIONS[id];
        if (module && !processedModules.has(module)) {
          processedModules.add(module);
          if (module.getCodeMirrorExtensions) {
            try {
              const exts = module.getCodeMirrorExtensions();
              extensions.push(...exts);
            } catch (err) {
              console.error(`Error getting CodeMirror extensions for ${id}:`, err);
            }
          }
        }

        const registered = this.contextExtensions.get(id);
        if (registered) {
          extensions.push(...registered);
        }
      }
    }

    return extensions;
  }

  /**
   * Returns all code snippets contributed by currently enabled extensions.
   */
  getActiveSnippets(language?: string): any[] {
    const snippets: any[] = [];
    const processedModules = new Set<BuiltinExtensionModule>();

    for (const [id, state] of this.runtimeStates.entries()) {
      if (state.status === 'enabled') {
        const module = BUILTIN_EXTENSIONS[id];
        if (module && !processedModules.has(module)) {
          processedModules.add(module);
          if (typeof module.getSnippets === 'function') {
            try {
              const list = module.getSnippets(language);
              if (Array.isArray(list)) {
                snippets.push(...list);
              }
            } catch (err) {
              console.error(`Error getting snippets for ${id}:`, err);
            }
          }
        }
      }
    }

    return snippets;
  }

  /**
   * Checks whether an extension is currently enabled and active.
   */
  isExtensionActive(id: string): boolean {
    return this.runtimeStates.get(id)?.status === 'enabled';
  }

  /**
   * Get an extension setting with fallback to default.
   */
  getSetting<T = any>(key: string, defaultValue?: T): T {
    if (this.settingsStore.has(key)) {
      return this.settingsStore.get(key) as T;
    }
    return defaultValue as T;
  }

  /**
   * Update an extension setting and notify active extensions.
   */
  setSetting(key: string, value: any) {
    this.settingsStore.set(key, value);
    // If setting belongs to rainbow brackets, update module settings directly
    if (key.startsWith('rainbow.')) {
      const field = key.replace('rainbow.', '');
      const rainbow = BUILTIN_EXTENSIONS['xivig-tool-rainbow'] as any;
      if (rainbow && typeof rainbow.updateSettings === 'function') {
        rainbow.updateSettings({ [field]: value });
      }
    }
    // If setting belongs to bootstrap 5 / font awesome, update module settings directly
    if (key.startsWith('bootstrap5.')) {
      const field = key.replace('bootstrap5.', '');
      const bootstrap = BUILTIN_EXTENSIONS['xivig-tool-bootstrap5'] as any;
      if (bootstrap && typeof bootstrap.updateSettings === 'function') {
        bootstrap.updateSettings({ [field]: value });
      }
    }
    this.notifyListeners();
  }

  /**
   * Subscribe to extension state changes (enabling, disabling, settings updates).
   */
  subscribe(listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('Error in extension manager change listener:', err);
      }
    }
  }

  /**
   * Returns list of runtime states for debugging/UI inspection.
   */
  getAllExtensionStates(): ExtensionRuntimeState[] {
    return Array.from(this.runtimeStates.values());
  }
}

export const extensionManager = new ExtensionManager();
