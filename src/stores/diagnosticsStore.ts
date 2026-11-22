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
  allDiagnostics: DiagnosticItem[];
  totalErrors: number;
  totalWarnings: number;
  setDiagnostics: (docId: string, items: DiagnosticItem[]) => void;
  clearDiagnostics: (docId: string) => void;
  clearAll: () => void;
  getAllDiagnostics: () => DiagnosticItem[];
  getTotalErrors: () => number;
  getTotalWarnings: () => number;
}

function computeAggregates(map: Record<string, DiagnosticItem[]>) {
  const allDiagnostics = Object.values(map).flat();
  let totalErrors = 0;
  let totalWarnings = 0;
  for (let i = 0; i < allDiagnostics.length; i++) {
    const s = allDiagnostics[i].severity;
    if (s === 'error') totalErrors++;
    else if (s === 'warning') totalWarnings++;
  }
  return { allDiagnostics, totalErrors, totalWarnings };
}

export const useDiagnosticsStore = create<DiagnosticsState>((set, get) => ({
  diagnosticsByDoc: {},
  allDiagnostics: [],
  totalErrors: 0,
  totalWarnings: 0,

  setDiagnostics: (docId, items) => {
    set((state) => {
      // If nothing changed for this doc, avoid creating new references
      const current = state.diagnosticsByDoc[docId] || [];
      if (current.length === items.length) {
        let isSame = true;
        for (let i = 0; i < items.length; i++) {
          if (
            current[i].message !== items[i].message ||
            current[i].line !== items[i].line ||
            current[i].col !== items[i].col ||
            current[i].severity !== items[i].severity
          ) {
            isSame = false;
            break;
          }
        }
        if (isSame) return state;
      }

      const nextMap = {
        ...state.diagnosticsByDoc,
        [docId]: items,
      };
      const { allDiagnostics, totalErrors, totalWarnings } = computeAggregates(nextMap);
      return {
        diagnosticsByDoc: nextMap,
        allDiagnostics,
        totalErrors,
        totalWarnings,
      };
    });
  },

  clearDiagnostics: (docId) => {
    set((state) => {
      if (!state.diagnosticsByDoc[docId]) return state;
      const nextMap = { ...state.diagnosticsByDoc };
      delete nextMap[docId];
      const { allDiagnostics, totalErrors, totalWarnings } = computeAggregates(nextMap);
      return {
        diagnosticsByDoc: nextMap,
        allDiagnostics,
        totalErrors,
        totalWarnings,
      };
    });
  },

  clearAll: () =>
    set({
      diagnosticsByDoc: {},
      allDiagnostics: [],
      totalErrors: 0,
      totalWarnings: 0,
    }),

  getAllDiagnostics: () => get().allDiagnostics,
  getTotalErrors: () => get().totalErrors,
  getTotalWarnings: () => get().totalWarnings,
}));
