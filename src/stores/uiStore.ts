import { create } from 'zustand';

interface UIState {
  isCommandPaletteOpen: boolean;
  isQuickOpenOpen: boolean;
  isSearchPanelOpen: boolean;
  searchMode: 'find' | 'replace';
  isMinimapOpen: boolean;
  isLanguageSelectorOpen: boolean;
  isBottomPanelOpen: boolean;
  activeBottomTab: 'terminal' | 'output' | 'problems';
  isKeymapModalOpen: boolean;
  isWrapWithAbbreviationOpen: boolean;

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

  openLanguageSelector: () => void;
  closeLanguageSelector: () => void;

  openKeymapModal: () => void;
  closeKeymapModal: () => void;

  openWrapWithAbbreviation: () => void;
  closeWrapWithAbbreviation: () => void;

  toggleBottomPanel: (tab?: 'terminal' | 'output' | 'problems') => void;
  setBottomTab: (tab: 'terminal' | 'output' | 'problems') => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isCommandPaletteOpen: false,
  isQuickOpenOpen: false,
  isSearchPanelOpen: false,
  searchMode: 'find',
  isMinimapOpen: true,
  isLanguageSelectorOpen: false,
  isKeymapModalOpen: false,
  isWrapWithAbbreviationOpen: false,
  isBottomPanelOpen: false,
  activeBottomTab: 'terminal',

  openWrapWithAbbreviation: () => set({ isWrapWithAbbreviationOpen: true }),
  closeWrapWithAbbreviation: () => set({ isWrapWithAbbreviationOpen: false }),

  openKeymapModal: () => set({ isKeymapModalOpen: true }),
  closeKeymapModal: () => set({ isKeymapModalOpen: false }),

  toggleBottomPanel: (tab = 'terminal') =>
    set((state) => {
      if (state.isBottomPanelOpen && state.activeBottomTab === tab) {
        return { isBottomPanelOpen: false };
      }
      return { isBottomPanelOpen: true, activeBottomTab: tab };
    }),

  setBottomTab: (tab) => set({ activeBottomTab: tab }),

  openLanguageSelector: () =>
    set({ isLanguageSelectorOpen: true, isCommandPaletteOpen: false, isQuickOpenOpen: false }),
  closeLanguageSelector: () => set({ isLanguageSelectorOpen: false }),

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
