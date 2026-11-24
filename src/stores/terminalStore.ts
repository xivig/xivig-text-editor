import { create } from 'zustand';

export interface TerminalTab {
  id: string;
  title: string;
  shell?: string;
  cwd?: string;
  isSplit?: boolean;
}

export interface ShellProfile {
  name: string;
  path: string;
  executable: string;
}

interface TerminalState {
  tabs: TerminalTab[];
  activeTabId: string;
  splitTabId: string | null;
  availableShells: ShellProfile[];
  searchQuery: string;
  isSearchOpen: boolean;
  fontSize: number;
  fontFamily: string;

  // Actions
  addTab: (title?: string, shell?: string, cwd?: string) => string;
  closeTab: (id: string) => void;
  renameTab: (id: string, newTitle: string) => void;
  setActiveTabId: (id: string) => void;
  setSplitTabId: (id: string | null) => void;
  loadAvailableShells: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  toggleSearch: () => void;
  setFontSize: (size: number) => void;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  tabs: [
    {
      id: 'term-default',
      title: 'Terminal 1',
    },
  ],
  activeTabId: 'term-default',
  splitTabId: null,
  availableShells: [],
  searchQuery: '',
  isSearchOpen: false,
  fontSize: 13,
  fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",

  addTab: (title, shell, cwd) => {
    const { tabs } = get();
    const id = `term-${Date.now()}`;
    const nextNum = tabs.length + 1;
    const tabTitle = title || `Terminal ${nextNum}`;

    const newTab: TerminalTab = {
      id,
      title: tabTitle,
      shell,
      cwd,
    };

    set({
      tabs: [...tabs, newTab],
      activeTabId: id,
    });

    return id;
  },

  closeTab: (id) => {
    const { tabs, activeTabId, splitTabId } = get();
    if (tabs.length <= 1) return; // Keep at least one tab

    const remaining = tabs.filter((t) => t.id !== id);
    let nextActive = activeTabId;
    if (activeTabId === id) {
      nextActive = remaining[remaining.length - 1].id;
    }

    set({
      tabs: remaining,
      activeTabId: nextActive,
      splitTabId: splitTabId === id ? null : splitTabId,
    });

    if (window.xivig?.terminalStop) {
      window.xivig.terminalStop(id).catch(() => {});
    }
  },

  renameTab: (id, newTitle) => {
    if (!newTitle.trim()) return;
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, title: newTitle.trim() } : t)),
    }));
  },

  setActiveTabId: (id) => set({ activeTabId: id }),
  setSplitTabId: (id) => set({ splitTabId: id }),

  loadAvailableShells: async () => {
    if (window.xivig?.getAvailableShells) {
      try {
        const shells = await window.xivig.getAvailableShells();
        set({ availableShells: shells || [] });
      } catch {
        // ignore
      }
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  setFontSize: (size) => set({ fontSize: Math.max(9, Math.min(24, size)) }),
}));
