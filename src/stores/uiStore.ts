import { create } from 'zustand';

interface UIState {
  isCommandPaletteOpen: boolean;
  isQuickOpenOpen: boolean;
  isSearchPanelOpen: boolean;
  searchMode: 'find' | 'replace';
  isMinimapOpen: boolean;

  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  openQuickOpen: () => void;
  closeQuickOpen: () => void;
  toggleQuickOpen: () => void;

  openSearchPanel: (mode?: 'find' | 'replace') => void;
  closeSearchPanel: () => void;
  toggleSearchPanel: (mode?: 'find' | 'replace') => void;

  toggleMinimap: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isCommandPaletteOpen: false,
  isQuickOpenOpen: false,
  isSearchPanelOpen: false,
  searchMode: 'find',
  isMinimapOpen: true,

  toggleMinimap: () => set((state) => ({ isMinimapOpen: !state.isMinimapOpen })),

  openCommandPalette: () =>
    set({ isCommandPaletteOpen: true, isQuickOpenOpen: false }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleCommandPalette: () =>
    set((state) => ({
      isCommandPaletteOpen: !state.isCommandPaletteOpen,
      isQuickOpenOpen: false,
    })),

  openQuickOpen: () =>
    set({ isQuickOpenOpen: true, isCommandPaletteOpen: false }),
  closeQuickOpen: () => set({ isQuickOpenOpen: false }),
  toggleQuickOpen: () =>
    set((state) => ({
      isQuickOpenOpen: !state.isQuickOpenOpen,
      isCommandPaletteOpen: false,
    })),

  openSearchPanel: (mode = 'find') =>
    set({ isSearchPanelOpen: true, searchMode: mode }),
  closeSearchPanel: () => set({ isSearchPanelOpen: false }),
  toggleSearchPanel: (mode = 'find') =>
    set((state) => {
      if (state.isSearchPanelOpen && state.searchMode === mode) {
        return { isSearchPanelOpen: false };
      }
      return { isSearchPanelOpen: true, searchMode: mode };
    }),
}));
