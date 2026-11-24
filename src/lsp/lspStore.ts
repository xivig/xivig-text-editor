import { create } from 'zustand';
import { LanguageServerProfile, Diagnostic } from './types';
import { LspClient } from './lspClient';
import { findServerProfileForFile } from './defaultServers';

interface LspState {
  servers: LanguageServerProfile[];
  activeServer: LanguageServerProfile | null;
  diagnosticsByUri: Record<string, Diagnostic[]>;
  isModalOpen: boolean;
  isLoading: boolean;
  initialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  loadServers: () => Promise<void>;
  startServer: (id: string) => Promise<boolean>;
  stopServer: (id: string) => Promise<boolean>;
  restartServer: (id: string) => Promise<boolean>;
  updateConfig: (id: string, patch: Partial<LanguageServerProfile>) => Promise<void>;
  updateActiveServerForDoc: (filePath?: string, languageId?: string) => void;
  setDiagnostics: (uri: string, diagnostics: Diagnostic[]) => void;
  clearDiagnostics: (uri?: string) => void;
  openModal: () => void;
  closeModal: () => void;
}

export const useLspStore = create<LspState>((set, get) => ({
  servers: [],
  activeServer: null,
  diagnosticsByUri: {},
  isModalOpen: false,
  isLoading: false,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    set({ initialized: true });

    await get().loadServers();

    if (LspClient.isAvailable() && window.xivig?.lsp) {
      // Listen to server status changes
      window.xivig.lsp.onServersChanged((servers) => {
        set({ servers });
        // Refresh active server reference
        const currentActive = get().activeServer;
        if (currentActive) {
          const updated = servers.find((s) => s.id === currentActive.id);
          if (updated) set({ activeServer: updated });
        }
      });

      // Listen to push diagnostics from servers
      window.xivig.lsp.onDiagnostics((data) => {
        if (data && data.uri) {
          get().setDiagnostics(data.uri, data.diagnostics || []);
        }
      });
    }
  },

  loadServers: async () => {
    set({ isLoading: true });
    try {
      const servers = await LspClient.listServers();
      set({ servers, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  startServer: async (id: string) => {
    const success = await LspClient.startServer(id);
    await get().loadServers();
    return success;
  },

  stopServer: async (id: string) => {
    const success = await LspClient.stopServer(id);
    await get().loadServers();
    return success;
  },

  restartServer: async (id: string) => {
    const success = await LspClient.restartServer(id);
    await get().loadServers();
    return success;
  },

  updateConfig: async (id: string, patch: Partial<LanguageServerProfile>) => {
    await LspClient.updateConfig(id, patch);
    await get().loadServers();
  },

  updateActiveServerForDoc: (filePath?: string, languageId?: string) => {
    if (!filePath && !languageId) {
      set({ activeServer: null });
      return;
    }
    const servers = get().servers;
    const match = findServerProfileForFile(servers, filePath || '', languageId);
    set({ activeServer: match || null });
  },

  setDiagnostics: (uri: string, diagnostics: Diagnostic[]) => {
    set((state) => ({
      diagnosticsByUri: {
        ...state.diagnosticsByUri,
        [uri]: diagnostics,
      },
    }));
  },

  clearDiagnostics: (uri?: string) => {
    if (uri) {
      set((state) => {
        const next = { ...state.diagnosticsByUri };
        delete next[uri];
        return { diagnosticsByUri: next };
      });
    } else {
      set({ diagnosticsByUri: {} });
    }
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));
