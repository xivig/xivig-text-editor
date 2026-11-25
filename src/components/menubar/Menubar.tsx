import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useBuildStore } from '../../stores/buildStore';
import { useLiveServerStore } from '../../stores/liveServerStore';
import { getActiveEditorView } from '../editor/editorViewRegistry';
import { expandEmmetCommand, detectEmmetSyntax } from '../editor/emmet';
import { beautifyActiveEditor, autoIndentAndFormatEditor } from '../../utils/beautify';
import {
  useLspStore,
  formatDocumentWithLsp,
  organizeImports,
  requestLspCodeActions,
  executeLspCodeAction,
} from '../../lsp';
import { prepareContentForSave } from '../../utils/saveUtils';
import { smartToggleLineComment, smartToggleBlockComment } from '../../utils/commentUtils';
import {
  sortLines,
  removeDuplicateLinesCommand,
  reverseLinesCommand,
  trimTrailingWhitespaceCommand,
  incrementNumberCommand,
  decrementNumberCommand,
  transformToUppercase,
  transformToLowercase,
  transformToTitleCaseCommand,
  transformToCamelCaseCommand,
  transformToSnakeCaseCommand,
  transformToKebabCaseCommand,
  transposeWordsCommand,
} from '../editor/sublimeKeymap';
import {
  goToDefinition,
  goToDeclaration,
  goToTypeDefinition,
  findImplementations,
  peekDefinition,
  findReferences,
  renameSymbol,
} from '../editor/codeIntelligence';
import { navigationHistory } from '../../utils/navigationHistory';
import { transposeChars, selectParentSyntax, cursorMatchingBracket, selectMatchingBracket } from '@codemirror/commands';

export interface MenuItem {
  label: React.ReactNode;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
  children?: MenuItem[];
}

export const Menubar: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [activeSubmenuIdx, setActiveSubmenuIdx] = useState<number | null>(null);
  const menubarRef = useRef<HTMLDivElement>(null);

  const createNewDocument = useEditorStore((state) => state.createNewDocument);
  const openDocument = useEditorStore((state) => state.openDocument);
  const activeDoc = useEditorStore((state) => state.getActiveDocument());
  const closeDocument = useEditorStore((state) => state.closeDocument);
  const closeOtherTabs = useEditorStore((state) => state.closeOtherTabs);
  const closeTabsToTheRight = useEditorStore((state) => state.closeTabsToTheRight);
  const closeSavedTabs = useEditorStore((state) => state.closeSavedTabs);
  const closeAllTabs = useEditorStore((state) => state.closeAllTabs);
  const reopenClosedTab = useEditorStore((state) => state.reopenClosedTab);
  const markDocumentSaved = useEditorStore((state) => state.markDocumentSaved);

  const setCurrentFolder = useFileStore((state) => state.setCurrentFolder);
  const toggleSidebar = useFileStore((state) => state.toggleSidebar);
  const setActiveSidebarView = useFileStore((state) => state.setActiveSidebarView);
  const recentFiles = useFileStore((state) => state.recentFiles);
  const recentWorkspaces = useFileStore((state) => state.recentWorkspaces);
  const openWorkspaceFromFile = useFileStore((state) => state.openWorkspaceFromFile);
  const addWorkspaceFolder = useFileStore((state) => state.addWorkspaceFolder);
  const saveWorkspaceAs = useFileStore((state) => state.saveWorkspaceAs);
  const duplicateWorkspace = useFileStore((state) => state.duplicateWorkspace);
  const clearRecentHistory = useFileStore((state) => state.clearRecentHistory);
  const currentFolderName = useFileStore((state) => state.currentFolderName);
  const workspaceFolders = useFileStore((state) => state.workspaceFolders);
  const setSplitLayout = useEditorStore((state) => state.setSplitLayout);

  const openSearchPanel = useUIStore((state) => state.openSearchPanel);
  const openCommandPalette = useUIStore((state) => state.openCommandPalette);
  const openQuickOpen = useUIStore((state) => state.openQuickOpen);
  const toggleMinimap = useUIStore((state) => state.toggleMinimap);
  const toggleBottomPanel = useUIStore((state) => state.toggleBottomPanel);
  const openKeymapModal = useUIStore((state) => state.openKeymapModal);
  const openBuildSystemModal = useUIStore((state) => state.openBuildSystemModal);
  const openAboutModal = useUIStore((state) => state.openAboutModal);
  const openIndexingStatusModal = useUIStore((state) => state.openIndexingStatusModal);
  const openRemoveLicenseModal = useUIStore((state) => state.openRemoveLicenseModal);
  const openUpdateCheckModal = useUIStore((state) => state.openUpdateCheckModal);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menubarRef.current && !menubarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleOpenFile = async () => {
    if (window.xivig?.openFileDialog) {
      const res = await window.xivig.openFileDialog();
      if (!res.canceled && res.filePath && res.content !== undefined) {
        openDocument({
          path: res.filePath,
          name: res.name || 'File',
          content: res.content,
          language: res.name || 'text',
        });
      }
    }
  };

  const handleOpenFolder = async () => {
    if (window.xivig?.openFolderDialog) {
      const res = await window.xivig.openFolderDialog();
      if (!res.canceled && res.folderPath && res.files) {
        setCurrentFolder(res.folderPath, res.files);
      }
    }
  };

  const handleSaveFile = async () => {
    if (!activeDoc) return;
    const view = getActiveEditorView();
    const contentToSave = prepareContentForSave(activeDoc.content, activeDoc.name, activeDoc.language, view);

    if (activeDoc.path && window.xivig?.saveFile) {
      const res = await window.xivig.saveFile(activeDoc.path, contentToSave);
      if (res.success) {
        markDocumentSaved(activeDoc.id, activeDoc.path);
      }
    } else if (window.xivig?.saveFileDialog) {
      const res = await window.xivig.saveFileDialog(activeDoc.name, contentToSave);
      if (!res.canceled && res.filePath) {
        markDocumentSaved(activeDoc.id, res.filePath);
      }
    }
  };

  const handleSaveAs = async () => {
    if (!activeDoc || !window.xivig?.saveFileDialog) return;
    const view = getActiveEditorView();
    const contentToSave = prepareContentForSave(activeDoc.content, activeDoc.name, activeDoc.language, view);

    const res = await window.xivig.saveFileDialog(activeDoc.name, contentToSave);
    if (!res.canceled && res.filePath) {
      markDocumentSaved(activeDoc.id, res.filePath);
    }
  };

  const handleOpenRecentFile = async (filePath: string, name: string) => {
    if (window.xivig?.readFile) {
      const res = await window.xivig.readFile(filePath);
      if (res.success && res.content !== undefined) {
        openDocument({
          path: filePath,
          name,
          content: res.content,
          language: name,
        });
      }
    }
  };

  const handleOpenRecentWorkspace = async (folderPath: string) => {
    if (window.xivig?.readDir) {
      const res = await window.xivig.readDir(folderPath);
      if (res.success && res.items) {
        setCurrentFolder(folderPath, res.items);
      }
    }
  };

  const handleOpenWorkspaceFromFile = async () => {
    if (window.xivig?.openWorkspaceFileDialog) {
      const res = await window.xivig.openWorkspaceFileDialog();
      if (!res.canceled && res.filePath) {
        await openWorkspaceFromFile(res.filePath, res.content);
      }
    } else if (window.xivig?.openFileDialog) {
      const res = await window.xivig.openFileDialog();
      if (!res.canceled && res.filePath) {
        await openWorkspaceFromFile(res.filePath, res.content);
      }
    }
  };

  const handleAddFolderToWorkspace = async () => {
    if (window.xivig?.openFolderDialog) {
      const res = await window.xivig.openFolderDialog();
      if (!res.canceled && res.folderPath) {
        await addWorkspaceFolder(res.folderPath);
      }
    }
  };

  const handleSaveWorkspaceAs = async () => {
    const defaultName = `${currentFolderName || 'workspace'}.code-workspace`;
    if (window.xivig?.saveWorkspaceFileDialog) {
      const res = await window.xivig.saveWorkspaceFileDialog(defaultName);
      if (!res.canceled && res.filePath) {
        await saveWorkspaceAs(res.filePath);
      }
    } else if (window.xivig?.saveFileDialog) {
      const res = await window.xivig.saveFileDialog(defaultName);
      if (!res.canceled && res.filePath) {
        await saveWorkspaceAs(res.filePath);
      }
    }
  };

  const handleDuplicateWorkspace = () => {
    duplicateWorkspace();
    if (window.xivig?.openNewWindow) {
      window.xivig.openNewWindow();
    }
  };

  const recentSubmenuItems: MenuItem[] = [
    ...(recentWorkspaces.length > 0
      ? [
          ...recentWorkspaces.slice(0, 10).map((w) => ({
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ opacity: 0.85 }}>{w.path.endsWith('.code-workspace') || w.path.endsWith('.xivig-workspace') || w.name.includes('(Workspace)') ? '📂' : '📁'}</span>
                <span>{w.name}</span>
              </span>
            ),
            action: () => {
              if (w.path.endsWith('.code-workspace') || w.path.endsWith('.xivig-workspace') || w.name.includes('(Workspace)')) {
                openWorkspaceFromFile(w.path);
              } else {
                handleOpenRecentWorkspace(w.path);
              }
            },
          })),
        ]
      : []),
    ...(recentFiles.length > 0
      ? [
          ...(recentWorkspaces.length > 0 ? [{ divider: true, label: '' }] : []),
          ...recentFiles.slice(0, 10).map((f) => ({
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ opacity: 0.85 }}>📄</span>
                <span>{f.name}</span>
              </span>
            ),
            action: () => handleOpenRecentFile(f.path, f.name),
          })),
        ]
      : []),
    ...(recentWorkspaces.length === 0 && recentFiles.length === 0
      ? [
          {
            label: <span style={{ color: 'var(--xivig-text-dim)', fontStyle: 'italic' }}>No Recent Items</span>,
          },
        ]
      : [
          { divider: true, label: '' },
          {
            label: 'Clear Recently Opened',
            action: () => clearRecentHistory(),
          },
          {
            label: 'More...',
            shortcut: 'Ctrl+R',
            action: () => useUIStore.getState().openProjectSwitcherModal(),
          },
        ]),
  ];

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'New File', shortcut: 'Ctrl+N', action: () => createNewDocument() },
      { label: 'Open File...', shortcut: 'Ctrl+O', action: handleOpenFile },
      { label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O', action: handleOpenFolder },
      { label: 'Open Workspace from File...', action: handleOpenWorkspaceFromFile },
      {
        label: 'Open Recent',
        children: recentSubmenuItems,
      },
      { divider: true, label: '' },
      { label: 'Add Folder to Workspace...', action: handleAddFolderToWorkspace },
      { label: 'Save Workspace As...', action: handleSaveWorkspaceAs },
      { label: 'Duplicate Workspace', action: handleDuplicateWorkspace },
      { divider: true, label: '' },
      { label: 'Save', shortcut: 'Ctrl+S', action: handleSaveFile },
      { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: handleSaveAs },
      { divider: true, label: '' },
      {
        label: 'Close Tab',
        shortcut: 'Ctrl+W',
        action: () => {
          if (activeDoc && activeDoc.isDirty) {
            useUIStore.getState().openDirtyCloseModal(activeDoc.id);
          } else {
            closeDocument(activeDoc?.id);
          }
        },
      },
      {
        label: 'Close Other Tabs',
        action: () => closeOtherTabs(activeDoc?.id),
      },
      {
        label: 'Close Tabs to the Right',
        action: () => closeTabsToTheRight(activeDoc?.id),
      },
      {
        label: 'Close Saved Tabs',
        action: () => closeSavedTabs(),
      },
      {
        label: 'Close All Tabs',
        action: () => closeAllTabs(),
      },
      {
        label: 'Reopen Closed Tab',
        shortcut: 'Ctrl+Shift+T',
        action: () => reopenClosedTab(),
      },
      {
        label: 'Compare File (Diff)...',
        shortcut: 'Ctrl+Alt+D',
        action: () => useUIStore.getState().openDiffModal(),
      },
      {
        label: activeDoc?.isReadOnly ? 'Make Editable' : 'Toggle Read-Only Mode',
        action: () => activeDoc && useEditorStore.getState().toggleReadOnly(activeDoc.id),
      },
      {
        label: activeDoc?.isPinned ? 'Unpin Tab' : 'Pin Tab',
        action: () => activeDoc && useEditorStore.getState().togglePinTab(activeDoc.id),
      },
      { divider: true, label: '' },
      {
        label: 'Preferences: Settings',
        shortcut: 'Ctrl+,',
        action: () => useEditorStore.getState().openSettings(),
      },
      {
        label: 'Preferences: Key Bindings',
        shortcut: 'Ctrl+K Ctrl+S',
        action: openKeymapModal,
      },
      { divider: true, label: '' },
      { label: 'Exit', action: () => window.xivig?.closeWindow?.() },
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z' },
      { label: 'Redo', shortcut: 'Ctrl+Y' },
      { divider: true, label: '' },
      { label: 'Cut', shortcut: 'Ctrl+X' },
      { label: 'Copy', shortcut: 'Ctrl+C' },
      { label: 'Paste', shortcut: 'Ctrl+V' },
      { divider: true, label: '' },
      { label: 'Find', shortcut: 'Ctrl+F', action: () => openSearchPanel('find') },
      { label: 'Replace', shortcut: 'Ctrl+H', action: () => openSearchPanel('replace') },
      { divider: true, label: '' },
      {
        label: 'Emmet: Expand Abbreviation',
        shortcut: 'Tab / Ctrl+E',
        action: () => {
          const view = getActiveEditorView();
          if (view && activeDoc) {
            expandEmmetCommand(view, detectEmmetSyntax(activeDoc.name || activeDoc.language));
          }
        },
      },
      {
        label: 'Emmet: Wrap with Abbreviation...',
        shortcut: 'Ctrl+Alt+W',
        action: () => useUIStore.getState().openWrapWithAbbreviation(),
      },
      { divider: true, label: '' },
      {
        label: 'Format Document',
        shortcut: 'Ctrl+Alt+B',
        action: () => {
          const view = getActiveEditorView();
          if (view) {
            if (activeDoc?.path) {
              formatDocumentWithLsp(view, activeDoc.path, 2, true, activeDoc.language).then((done) => {
                if (!done) beautifyActiveEditor(view);
              });
            } else {
              beautifyActiveEditor(view);
            }
          }
        },
      },
      {
        label: 'Toggle Line Comment',
        shortcut: 'Ctrl+/',
        action: () => {
          const view = getActiveEditorView();
          if (view) smartToggleLineComment(view);
        },
      },
      {
        label: 'Toggle Block Comment',
        shortcut: 'Ctrl+Shift+/',
        action: () => {
          const view = getActiveEditorView();
          if (view) smartToggleBlockComment(view);
        },
      },
      { divider: true, label: '' },
      {
        label: 'Color Picker',
        shortcut: 'Ctrl+Alt+C',
        action: () => {
          const view = getActiveEditorView();
          let colorStr = '#6c8cff';
          let range: { from: number; to: number } | null = null;
          if (view) {
            const sel = view.state.selection.main;
            if (!sel.empty) {
              colorStr = view.state.sliceDoc(sel.from, sel.to).trim();
              range = { from: sel.from, to: sel.to };
            }
          }
          useUIStore.getState().openColorPicker(colorStr, range || undefined);
        },
      },
      {
        label: 'Insert Lorem Ipsum...',
        shortcut: 'Ctrl+Alt+L',
        action: () => useUIStore.getState().openLoremIpsumModal(),
      },
      { divider: true, label: '' },
      {
        label: 'Sort Lines',
        shortcut: 'F9',
        action: () => {
          const view = getActiveEditorView();
          if (view) sortLines(false)(view);
        },
      },
      {
        label: 'Sort Lines (Case Sensitive)',
        shortcut: 'Ctrl+F9',
        action: () => {
          const view = getActiveEditorView();
          if (view) sortLines(true)(view);
        },
      },
      {
        label: 'Remove Duplicate Lines',
        action: () => {
          const view = getActiveEditorView();
          if (view) removeDuplicateLinesCommand(view);
        },
      },
      {
        label: 'Reverse Selected Lines',
        action: () => {
          const view = getActiveEditorView();
          if (view) reverseLinesCommand(view);
        },
      },
      {
        label: 'Trim Trailing Whitespace',
        action: () => {
          const view = getActiveEditorView();
          if (view) trimTrailingWhitespaceCommand(view);
        },
      },
      { divider: true, label: '' },
      {
        label: 'Transform: UPPERCASE',
        shortcut: 'Ctrl+K Ctrl+U',
        action: () => {
          const view = getActiveEditorView();
          if (view) transformToUppercase(view);
        },
      },
      {
        label: 'Transform: lowercase',
        shortcut: 'Ctrl+K Ctrl+L',
        action: () => {
          const view = getActiveEditorView();
          if (view) transformToLowercase(view);
        },
      },
      {
        label: 'Transform: Title Case',
        action: () => {
          const view = getActiveEditorView();
          if (view) transformToTitleCaseCommand(view);
        },
      },
      {
        label: 'Transform: camelCase',
        action: () => {
          const view = getActiveEditorView();
          if (view) transformToCamelCaseCommand(view);
        },
      },
      {
        label: 'Transform: snake_case',
        action: () => {
          const view = getActiveEditorView();
          if (view) transformToSnakeCaseCommand(view);
        },
      },
      {
        label: 'Transform: kebab-case',
        action: () => {
          const view = getActiveEditorView();
          if (view) transformToKebabCaseCommand(view);
        },
      },
      { divider: true, label: '' },
      {
        label: 'Transpose Characters',
        shortcut: 'Ctrl+T',
        action: () => {
          const view = getActiveEditorView();
          if (view) transposeChars(view);
        },
      },
      {
        label: 'Transpose Words',
        shortcut: 'Ctrl+Alt+T',
        action: () => {
          const view = getActiveEditorView();
          if (view) transposeWordsCommand(view);
        },
      },
    ],
    Selection: [
      { label: 'Select All', shortcut: 'Ctrl+A' },
      { label: 'Select Next Occurrence', shortcut: 'Ctrl+D' },
      { label: 'Select Line', shortcut: 'Ctrl+L' },
      {
        label: 'Expand Selection to Parent Syntax',
        shortcut: 'Ctrl+Shift+Space',
        action: () => {
          const view = getActiveEditorView();
          if (view) selectParentSyntax(view);
        },
      },
      {
        label: 'Jump to Matching Bracket',
        shortcut: 'Ctrl+M',
        action: () => {
          const view = getActiveEditorView();
          if (view) cursorMatchingBracket(view);
        },
      },
      {
        label: 'Select to Matching Bracket',
        shortcut: 'Ctrl+Shift+M',
        action: () => {
          const view = getActiveEditorView();
          if (view) selectMatchingBracket(view);
        },
      },
      { divider: true, label: '' },
      { label: 'Duplicate Line Down', shortcut: 'Shift+Alt+Down' },
      { label: 'Move Line Down', shortcut: 'Alt+Down' },
      { label: 'Move Line Up', shortcut: 'Alt+Up' },
      { divider: true, label: '' },
      {
        label: 'Toggle Line Comment',
        shortcut: 'Ctrl+/',
        action: () => {
          const view = getActiveEditorView();
          if (view) smartToggleLineComment(view);
        },
      },
      {
        label: 'Toggle Block Comment',
        shortcut: 'Ctrl+Shift+/',
        action: () => {
          const view = getActiveEditorView();
          if (view) smartToggleBlockComment(view);
        },
      },
      { label: 'Delete Line', shortcut: 'Ctrl+Shift+K' },
    ],
    Go: [
      {
        label: 'Back',
        shortcut: 'Alt+Left',
        action: () => navigationHistory.goBack(),
      },
      {
        label: 'Forward',
        shortcut: 'Alt+Right',
        action: () => navigationHistory.goForward(),
      },
      { divider: true, label: '' },
      { label: 'Go to File...', shortcut: 'Ctrl+P', action: openQuickOpen },
      {
        label: 'Go to Symbol in Document...',
        shortcut: 'Ctrl+R',
        action: () => useUIStore.getState().openQuickOpenWithMode('@'),
      },
      {
        label: 'Go to Symbol in Workspace...',
        shortcut: 'Ctrl+;',
        action: () => useUIStore.getState().openQuickOpenWithMode('#'),
      },
      {
        label: 'Go to Line/Column...',
        shortcut: 'Ctrl+G',
        action: () => useUIStore.getState().openQuickOpenWithMode(':'),
      },
      { divider: true, label: '' },
      {
        label: 'Go to Definition',
        shortcut: 'F12',
        action: () => {
          const view = getActiveEditorView();
          if (view) goToDefinition(view);
        },
      },
      {
        label: 'Go to Declaration',
        shortcut: 'Ctrl+F12',
        action: () => {
          const view = getActiveEditorView();
          if (view) goToDeclaration(view);
        },
      },
      {
        label: 'Go to Type Definition',
        action: () => {
          const view = getActiveEditorView();
          if (view) goToTypeDefinition(view);
        },
      },
      {
        label: 'Go to Implementations',
        action: () => {
          const view = getActiveEditorView();
          if (view) findImplementations(view);
        },
      },
      {
        label: 'Peek Definition',
        shortcut: 'Alt+F12',
        action: () => {
          const view = getActiveEditorView();
          if (view) peekDefinition(view);
        },
      },
      { divider: true, label: '' },
      {
        label: 'Find References',
        shortcut: 'Shift+F12',
        action: () => {
          const view = getActiveEditorView();
          if (view) findReferences(view);
        },
      },
      {
        label: 'Rename Symbol',
        shortcut: 'F2',
        action: () => {
          const view = getActiveEditorView();
          if (view) renameSymbol(view);
        },
      },
    ],
    View: [
      { label: 'Toggle Live Web Preview', shortcut: 'Ctrl+K V', action: () => useEditorStore.getState().togglePreview('live-web') },
      { label: 'Toggle Markdown Live Preview', shortcut: 'Ctrl+Shift+V', action: () => useEditorStore.getState().togglePreview('markdown') },
      { label: 'Live Server: Toggle (Go Live)', action: () => useLiveServerStore.getState().toggleServer() },
      { label: 'Live Server: Open in Browser', action: () => useLiveServerStore.getState().openInBrowser() },
      { divider: true, label: '' },
      { label: 'Toggle Sidebar', shortcut: 'Ctrl+B', action: toggleSidebar },
      { label: 'Toggle Bottom Panel', shortcut: 'Ctrl+J / Ctrl+`', action: () => toggleBottomPanel() },
      { label: 'Toggle Terminal', shortcut: 'Ctrl+`', action: () => toggleBottomPanel('terminal') },
      { label: 'Toggle Problems Panel', action: () => toggleBottomPanel('problems') },
      { label: 'Toggle Output Panel', action: () => toggleBottomPanel('output') },
      { label: 'Toggle Minimap', action: toggleMinimap },
      { label: 'Toggle Distraction-Free / Zen Mode', shortcut: 'Shift+F11', action: () => useUIStore.getState().toggleDistractionFree() },
      { label: 'Toggle Whitespace Characters', action: () => { const cur = useSettingsStore.getState().settings.renderWhitespace; useSettingsStore.getState().updateSettings({ renderWhitespace: cur === 'all' ? 'selection' : 'all' }); } },
      { label: 'Toggle Indentation Guides', action: () => { const cur = useSettingsStore.getState().settings.rainbowIndentGuides; useSettingsStore.getState().updateSettings({ rainbowIndentGuides: !cur }); } },
      { label: 'Toggle Font Ligatures', action: () => useSettingsStore.getState().toggleFontLigatures() },
      { divider: true, label: '' },
      { label: 'Layout: Single', shortcut: 'Alt+Shift+1', action: () => setSplitLayout('single') },
      { label: 'Layout: 2 Columns', shortcut: 'Alt+Shift+2', action: () => setSplitLayout('two-columns') },
      { label: 'Layout: 2 Rows', shortcut: 'Alt+Shift+3', action: () => setSplitLayout('two-rows') },
      { divider: true, label: '' },
      { label: 'Zoom In', shortcut: 'Ctrl+=', action: () => useSettingsStore.getState().zoomIn() },
      { label: 'Zoom Out', shortcut: 'Ctrl+-', action: () => useSettingsStore.getState().zoomOut() },
      { label: 'Reset Zoom', shortcut: 'Ctrl+0', action: () => useSettingsStore.getState().resetZoom() },
      { divider: true, label: '' },
      {
        label: 'Toggle Full Screen',
        shortcut: 'F11',
        action: () => {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          } else {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        },
      },
    ],
    Tools: [
      {
        label: 'Command Palette...',
        shortcut: 'Ctrl+Shift+P',
        action: openCommandPalette,
      },
      { divider: true, label: '' },
      {
        label: 'Build',
        shortcut: 'Ctrl+Shift+B / F7',
        action: () => useBuildStore.getState().executeBuild(),
      },
      {
        label: 'Build With...',
        shortcut: 'Config',
        action: openBuildSystemModal,
      },
      {
        label: 'Cancel Build',
        action: () => useBuildStore.getState().stopBuild(),
      },
      { divider: true, label: '' },
      {
        label: 'Extensions',
        shortcut: 'Ctrl+Shift+X',
        action: () => setActiveSidebarView('extensions'),
      },
      { divider: true, label: '' },
      {
        label: 'Language Servers (LSP)...',
        action: () => useLspStore.getState().openModal(),
      },
      {
        label: 'Restart Active Language Server',
        action: () => {
          const active = useLspStore.getState().activeServer;
          if (active) useLspStore.getState().restartServer(active.id);
        },
      },
      {
        label: 'Organize Imports',
        shortcut: 'Shift+Alt+O',
        action: () => {
          const view = getActiveEditorView();
          if (view && activeDoc?.path) {
            organizeImports(view, activeDoc.path, activeDoc.language);
          }
        },
      },
      {
        label: 'Code Actions / Quick Fix',
        shortcut: 'Ctrl+.',
        action: () => {
          const view = getActiveEditorView();
          if (view && activeDoc?.path) {
            requestLspCodeActions(view, activeDoc.path, activeDoc.language).then((actions) => {
              if (actions.length > 0) executeLspCodeAction(view, actions[0]);
            });
          }
        },
      },
    ],
    Help: [
      {
        label: 'Welcome',
        action: () => useEditorStore.getState().openWelcomeDocument(),
      },
      {
        label: 'Documentation',
        action: () => window.open('https://github.com/xivig/xivig-text-editor#readme', '_blank'),
      },
      {
        label: 'Report a Bug',
        action: () => window.open('https://github.com/xivig/xivig-text-editor/issues/new/choose', '_blank'),
      },
      {
        label: 'Twitter',
        action: () => window.open('https://twitter.com', '_blank'),
      },
      { divider: true, label: '' },
      {
        label: 'Indexing Status...',
        action: openIndexingStatusModal,
      },
      { divider: true, label: '' },
      {
        label: 'Remove License',
        action: openRemoveLicenseModal,
      },
      { divider: true, label: '' },
      {
        label: 'Check for Updates...',
        action: openUpdateCheckModal,
      },
      {
        label: 'Changelog...',
        action: () => window.open('https://github.com/xivig/xivig-text-editor/releases', '_blank'),
      },
      {
        label: (
          <span>
            <u>A</u>bout Xivig Text Editor
          </span>
        ),
        action: openAboutModal,
      },
    ],
  };

  return (
    <nav ref={menubarRef} style={menubarContainerStyle}>
      {Object.entries(menus).map(([menuName, items]) => {
        const isOpen = openMenu === menuName;
        return (
          <div key={menuName} style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenMenu(isOpen ? null : menuName)}
              onMouseEnter={() => {
                if (openMenu !== null) setOpenMenu(menuName);
              }}
              style={{
                ...menuTriggerStyle,
                backgroundColor: isOpen ? 'var(--xivig-surface)' : 'transparent',
                color: isOpen ? 'var(--xivig-text)' : 'var(--xivig-text-muted)',
              }}
            >
              {menuName}
            </button>

            {isOpen && (
              <div style={dropdownStyle}>
                {items.map((item, idx) => {
                  if (item.divider) {
                    return <div key={idx} style={dividerStyle} />;
                  }

                  const hasChildren = Boolean(item.children && item.children.length > 0);
                  const isSubmenuOpen = activeSubmenuIdx === idx;

                  return (
                    <div
                      key={idx}
                      style={{ position: 'relative' }}
                      onMouseEnter={() => {
                        if (hasChildren) {
                          setActiveSubmenuIdx(idx);
                        } else {
                          setActiveSubmenuIdx(null);
                        }
                      }}
                    >
                      <button
                        onClick={() => {
                          if (hasChildren) {
                            setActiveSubmenuIdx(isSubmenuOpen ? null : idx);
                          } else {
                            setOpenMenu(null);
                            setActiveSubmenuIdx(null);
                            item.action?.();
                          }
                        }}
                        style={{
                          ...dropdownItemStyle,
                          backgroundColor: isSubmenuOpen ? '#383b42' : 'transparent',
                          color: isSubmenuOpen ? '#ffffff' : '#c9ccd3',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#383b42';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSubmenuOpen) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#c9ccd3';
                          }
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{item.label}</span>
                        {hasChildren ? (
                          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                            <ChevronRight size={13} />
                          </span>
                        ) : item.shortcut ? (
                          <span style={shortcutStyle}>{item.shortcut}</span>
                        ) : null}
                      </button>

                      {/* Nested Flyout Submenu */}
                      {hasChildren && isSubmenuOpen && (
                        <div
                          style={submenuDropdownStyle}
                          onMouseLeave={() => setActiveSubmenuIdx(null)}
                        >
                          {item.children!.map((subItem, subIdx) => {
                            if (subItem.divider) {
                              return <div key={subIdx} style={dividerStyle} />;
                            }
                            return (
                              <button
                                key={subIdx}
                                onClick={() => {
                                  setOpenMenu(null);
                                  setActiveSubmenuIdx(null);
                                  subItem.action?.();
                                }}
                                style={dropdownItemStyle}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#383b42';
                                  e.currentTarget.style.color = '#ffffff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = '#c9ccd3';
                                }}
                              >
                                <span>{subItem.label}</span>
                                {subItem.shortcut && (
                                  <span style={shortcutStyle}>{subItem.shortcut}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

const menubarContainerStyle: React.CSSProperties = {
  height: 'var(--xivig-menubar-height)',
  backgroundColor: 'var(--xivig-activity-bar)',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '8px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  position: 'relative',
  zIndex: 100,
};

const menuTriggerStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '3px',
  fontSize: '12px',
  fontWeight: 400,
  transition: 'background-color 0.1s ease',
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  minWidth: '260px',
  width: 'max-content',
  maxWidth: '450px',
  backgroundColor: '#212224',
  border: '1px solid #383a40',
  borderRadius: '4px',
  padding: '4px 0',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
  zIndex: 1000,
  whiteSpace: 'nowrap',
};

const dropdownItemStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 14px',
  fontSize: '12px',
  textAlign: 'left',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#c9ccd3',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
  gap: '28px',
  boxSizing: 'border-box',
};

const shortcutStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--xivig-text-dim)',
  marginLeft: 'auto',
  paddingLeft: '20px',
  flexShrink: 0,
  whiteSpace: 'nowrap',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: '#35373d',
  margin: '4px 0',
};

const submenuDropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-4px',
  left: 'calc(100% - 2px)',
  minWidth: '240px',
  width: 'max-content',
  maxWidth: '420px',
  backgroundColor: '#212224',
  border: '1px solid #383a40',
  borderRadius: '4px',
  padding: '4px 0',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
  zIndex: 1010,
  whiteSpace: 'nowrap',
};
