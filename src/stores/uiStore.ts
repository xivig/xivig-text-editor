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
  isBuildSystemModalOpen: boolean;
  isWrapWithAbbreviationOpen: boolean;
  isColorPickerOpen: boolean;
  colorPickerInitialColor: string;
  colorPickerRange: { from: number; to: number } | null;
  isLoremIpsumOpen: boolean;
  isAboutModalOpen: boolean;
  isIndexingStatusOpen: boolean;
  isRemoveLicenseOpen: boolean;
  isUpdateCheckOpen: boolean;
  isDistractionFree: boolean;
  quickOpenInitialMode: string;
  dirtyCloseDocId: string | null;

  openDirtyCloseModal: (docId: string) => void;
  closeDirtyCloseModal: () => void;

  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  openQuickOpen: () => void;
  openQuickOpenWithMode: (mode: string) => void;
  closeQuickOpen: () => void;
  toggleQuickOpen: () => void;

  toggleDistractionFree: () => void;

  openSearchPanel: (mode?: 'find' | 'replace') => void;
  closeSearchPanel: () => void;
  toggleSearchPanel: (mode?: 'find' | 'replace') => void;

  toggleMinimap: () => void;

  openLanguageSelector: () => void;
  closeLanguageSelector: () => void;

  openKeymapModal: () => void;
  closeKeymapModal: () => void;

  openBuildSystemModal: () => void;
  closeBuildSystemModal: () => void;
  toggleBuildSystemModal: () => void;

  openWrapWithAbbreviation: () => void;
  closeWrapWithAbbreviation: () => void;

  openColorPicker: (initialColor?: string, range?: { from: number; to: number } | null) => void;
  closeColorPicker: () => void;

  openLoremIpsumModal: () => void;
  closeLoremIpsumModal: () => void;

  openAboutModal: () => void;
  closeAboutModal: () => void;

  openIndexingStatusModal: () => void;
  closeIndexingStatusModal: () => void;

  openRemoveLicenseModal: () => void;
  closeRemoveLicenseModal: () => void;

  openUpdateCheckModal: () => void;
  closeUpdateCheckModal: () => void;

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
  isBuildSystemModalOpen: false,
  isWrapWithAbbreviationOpen: false,
  isColorPickerOpen: false,
  colorPickerInitialColor: '#6c8cff',
  colorPickerRange: null,
  isLoremIpsumOpen: false,
  isAboutModalOpen: false,
  isIndexingStatusOpen: false,
  isRemoveLicenseOpen: false,
  isUpdateCheckOpen: false,
  isDistractionFree: false,
  quickOpenInitialMode: '',
  dirtyCloseDocId: null,

  openDirtyCloseModal: (docId: string) => set({ dirtyCloseDocId: docId }),
  closeDirtyCloseModal: () => set({ dirtyCloseDocId: null }),
  isBottomPanelOpen: false,
  activeBottomTab: 'terminal',

  openBuildSystemModal: () => set({ isBuildSystemModalOpen: true }),
  closeBuildSystemModal: () => set({ isBuildSystemModalOpen: false }),
  toggleBuildSystemModal: () =>
    set((state) => ({ isBuildSystemModalOpen: !state.isBuildSystemModalOpen })),

  toggleDistractionFree: () =>
    set((state) => ({ isDistractionFree: !state.isDistractionFree })),

  openWrapWithAbbreviation: () => set({ isWrapWithAbbreviationOpen: true }),
  closeWrapWithAbbreviation: () => set({ isWrapWithAbbreviationOpen: false }),

  openColorPicker: (initialColor = '#6c8cff', range = null) =>
    set({
      isColorPickerOpen: true,
      colorPickerInitialColor: initialColor,
      colorPickerRange: range,
    }),
  closeColorPicker: () =>
    set({ isColorPickerOpen: false, colorPickerRange: null }),

  openLoremIpsumModal: () => set({ isLoremIpsumOpen: true }),
  closeLoremIpsumModal: () => set({ isLoremIpsumOpen: false }),

  openAboutModal: () => set({ isAboutModalOpen: true }),
  closeAboutModal: () => set({ isAboutModalOpen: false }),

  openIndexingStatusModal: () => set({ isIndexingStatusOpen: true }),
  closeIndexingStatusModal: () => set({ isIndexingStatusOpen: false }),

  openRemoveLicenseModal: () => set({ isRemoveLicenseOpen: true }),
  closeRemoveLicenseModal: () => set({ isRemoveLicenseOpen: false }),

  openUpdateCheckModal: () => set({ isUpdateCheckOpen: true }),
  closeUpdateCheckModal: () => set({ isUpdateCheckOpen: false }),

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
    set({ isQuickOpenOpen: true, quickOpenInitialMode: '', isCommandPaletteOpen: false }),
  openQuickOpenWithMode: (mode: string) =>
    set({ isQuickOpenOpen: true, quickOpenInitialMode: mode, isCommandPaletteOpen: false }),
  closeQuickOpen: () => set({ isQuickOpenOpen: false, quickOpenInitialMode: '' }),
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
