import { create } from 'zustand';

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface DiagnosticItem {
  id: string;
  docId: string;
  filePath: string;
  fileName: string;
  line: number;
  col: number;
  from: number;
  to: number;
  message: string;
  severity: DiagnosticSeverity;
  source: string;
}

interface DiagnosticsState {
  diagnosticsByDoc: Record<string, DiagnosticItem[]>;
  setDiagnostics: (docId: string, items: DiagnosticItem[]) => void;
  clearDiagnostics: (docId: string) => void;
  clearAll: () => void;
  getAllDiagnostics: () => DiagnosticItem[];
  getTotalErrors: () => number;
  getTotalWarnings: () => number;
}

export const useDiagnosticsStore = create<DiagnosticsState>((set, get) => ({
  diagnosticsByDoc: {},

  setDiagnostics: (docId, items) => {
    set((state) => ({
      diagnosticsByDoc: {
        ...state.diagnosticsByDoc,
        [docId]: items,
      },
    }));
  },

  clearDiagnostics: (docId) => {
    set((state) => {
      const next = { ...state.diagnosticsByDoc };
      delete next[docId];
      return { diagnosticsByDoc: next };
    });
  },

  clearAll: () => set({ diagnosticsByDoc: {} }),

  getAllDiagnostics: () => {
    const map = get().diagnosticsByDoc;
    return Object.values(map).flat();
  },

  getTotalErrors: () => {
    const all = get().getAllDiagnostics();
    return all.filter((d) => d.severity === 'error').length;
  },

  getTotalWarnings: () => {
    const all = get().getAllDiagnostics();
    return all.filter((d) => d.severity === 'warning').length;
  },
}));
