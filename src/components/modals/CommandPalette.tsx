import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Check } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useBuildStore } from '../../stores/buildStore';
import { useExtensionStore } from '../../stores/extensionStore';
import { useLiveServerStore } from '../../stores/liveServerStore';
import { useUpdateStore } from '../../stores/updateStore';
import { getActiveEditorView } from '../editor/editorViewRegistry';
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
import { beautifyActiveEditor, autoIndentAndFormatEditor } from '../../utils/beautify';
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
import { transposeChars, selectParentSyntax, cursorMatchingBracket, selectMatchingBracket } from '@codemirror/commands';
import { expandEmmetCommand, detectEmmetSyntax } from '../editor/emmet';
import {
  extractHtmlLinks,
  resolveLinkPath,
  checkFileExists,
  createAndOpenLinkedFile,
} from '../editor/htmlLinkedFiles';

interface CommandItem {
  id: string;
  category: string;
  title: string;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const isOpen = useUIStore((state) => state.isCommandPaletteOpen);
  const close = useUIStore((state) => state.closeCommandPalette);
  const openQuickOpen = useUIStore((state) => state.openQuickOpen);
  const openSearchPanel = useUIStore((state) => state.openSearchPanel);
  const toggleMinimap = useUIStore((state) => state.toggleMinimap);
  const openLanguageSelector = useUIStore((state) => state.openLanguageSelector);
  const openAboutModal = useUIStore((state) => state.openAboutModal);
  const openUpdateCheckModal = useUIStore((state) => state.openUpdateCheckModal);
  const toggleBottomPanel = useUIStore((state) => state.toggleBottomPanel);
  const openKeymapModal = useUIStore((state) => state.openKeymapModal);
  const openBuildSystemModal = useUIStore((state) => state.openBuildSystemModal);
  const openWrapWithAbbreviation = useUIStore((state) => state.openWrapWithAbbreviation);

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
  const setSplitLayout = useEditorStore((state) => state.setSplitLayout);

  const toggleSidebar = useFileStore((state) => state.toggleSidebar);
  const setActiveSidebarView = useFileStore((state) => state.setActiveSidebarView);
  const setCurrentFolder = useFileStore((state) => state.setCurrentFolder);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

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
    const autoIndentOnSave = useSettingsStore.getState().settings.autoIndentOnSave !== false;
    const view = getActiveEditorView();
    const contentToSave = autoIndentOnSave
      ? autoIndentAndFormatEditor(view, activeDoc.name, activeDoc.language)
      : (view ? view.state.doc.toString() : activeDoc.content);

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

  const setLanguage = (lang: string) => {
    if (!activeDoc) return;
    useEditorStore.setState((state) => ({
      documents: state.documents.map((d) =>
        d.id === activeDoc.id ? { ...d, language: lang } : d
      ),
    }));
  };

  const commands: CommandItem[] = [
    {
      id: 'file:new',
      category: 'File',
      title: 'New File',
      shortcut: 'Ctrl+N',
      action: () => createNewDocument(),
    },
    {
      id: 'file:open',
      category: 'File',
      title: 'Open File...',
      shortcut: 'Ctrl+O',
      action: handleOpenFile,
    },
    {
      id: 'file:open-folder',
      category: 'File',
      title: 'Open Folder...',
      shortcut: 'Ctrl+K Ctrl+O',
      action: handleOpenFolder,
    },
    {
      id: 'file:save',
      category: 'File',
      title: 'Save File',
      shortcut: 'Ctrl+S',
      action: handleSaveFile,
    },
    {
      id: 'file:close',
      category: 'File',
      title: 'Close Active Tab',
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
      id: 'file:close-others',
      category: 'File',
      title: 'Close Other Tabs',
      action: () => closeOtherTabs(activeDoc?.id),
    },
    {
      id: 'file:close-to-the-right',
      category: 'File',
      title: 'Close Tabs to the Right',
      action: () => closeTabsToTheRight(activeDoc?.id),
    },
    {
      id: 'file:close-saved',
      category: 'File',
      title: 'Close Saved Tabs',
      action: () => closeSavedTabs(),
    },
    {
      id: 'file:close-all',
      category: 'File',
      title: 'Close All Tabs',
      action: () => closeAllTabs(),
    },
    {
      id: 'file:reopen-closed-tab',
      category: 'File',
      title: 'Reopen Closed Tab',
      shortcut: 'Ctrl+Shift+T',
      action: () => reopenClosedTab(),
    },
    {
      id: 'file:toggle-readonly',
      category: 'File',
      title: 'Toggle Read-Only Mode',
      action: () => {
        if (activeDoc) {
          useEditorStore.getState().toggleReadOnly(activeDoc.id);
        }
      },
    },
    {
      id: 'file:toggle-pin',
      category: 'File',
      title: 'Toggle Pin Tab',
      action: () => {
        if (activeDoc) {
          useEditorStore.getState().togglePinTab(activeDoc.id);
        }
      },
    },
    {
      id: 'file:diff-compare',
      category: 'File',
      title: 'Compare Active File (Diff)...',
      shortcut: 'Ctrl+Alt+D',
      action: () => useUIStore.getState().openDiffModal(),
    },
    {
      id: 'nav:quick-open',
      category: 'Navigation',
      title: 'Go to File...',
      shortcut: 'Ctrl+P',
      action: openQuickOpen,
    },
    {
      id: 'search:find',
      category: 'Search',
      title: 'Find in Document',
      shortcut: 'Ctrl+F',
      action: () => openSearchPanel('find'),
    },
    {
      id: 'search:replace',
      category: 'Search',
      title: 'Replace in Document',
      shortcut: 'Ctrl+H',
      action: () => openSearchPanel('replace'),
    },
    {
      id: 'emmet:expand',
      category: 'Emmet',
      title: 'Emmet: Expand Abbreviation',
      shortcut: 'Tab / Ctrl+E',
      action: () => {
        const view = getActiveEditorView();
        if (view && activeDoc) {
          expandEmmetCommand(view, detectEmmetSyntax(activeDoc.name || activeDoc.language));
        }
      },
    },
    {
      id: 'emmet:wrap',
      category: 'Emmet',
      title: 'Emmet: Wrap with Abbreviation',
      shortcut: 'Ctrl+Alt+W',
      action: openWrapWithAbbreviation,
    },
    {
      id: 'html:create-linked-css',
      category: 'HTML',
      title: 'HTML: Create Missing Linked Stylesheet (CSS)',
      action: async () => {
        if (!activeDoc) return;
        const links = extractHtmlLinks(activeDoc.content);
        const currentPath = activeDoc.path || null;
        const workspaceRoot = useFileStore.getState().currentFolderPath || null;

        for (const link of links) {
          const resolved = resolveLinkPath(link.url, currentPath, workspaceRoot);
          const exists = await checkFileExists(resolved);
          if (!exists) {
            await createAndOpenLinkedFile(link.url, currentPath, workspaceRoot);
            break;
          }
        }
      },
    },
    {
      id: 'pref:settings',
      category: 'Preferences',
      title: 'Open Settings (Preferences)',
      shortcut: 'Ctrl+,',
      action: () => useEditorStore.getState().openSettings(),
    },
    {
      id: 'build:run',
      category: 'Build',
      title: 'Build: Run Active File / Default Target',
      shortcut: 'Ctrl+B / F7',
      action: () => useBuildStore.getState().executeBuild(),
    },
    {
      id: 'build:select',
      category: 'Build',
      title: 'Build: Select Build System & Task...',
      shortcut: 'Ctrl+Shift+B',
      action: openBuildSystemModal,
    },
    {
      id: 'build:stop',
      category: 'Build',
      title: 'Build: Cancel / Stop Running Build',
      action: () => useBuildStore.getState().stopBuild(),
    },
    {
      id: 'pkg:marketplace',
      category: 'Package Control',
      title: 'Package Control: Browse Extensions & Packages',
      shortcut: 'Ctrl+Shift+X',
      action: () => setActiveSidebarView('extensions'),
    },
    {
      id: 'pkg:install',
      category: 'Package Control',
      title: 'Package Control: Install Package...',
      shortcut: 'Ctrl+Shift+X',
      action: () => setActiveSidebarView('extensions'),
    },
    {
      id: 'view:problems',
      category: 'View',
      title: 'Toggle Problems Panel',
      action: () => toggleBottomPanel('problems'),
    },
    {
      id: 'view:output',
      category: 'View',
      title: 'Toggle Output Panel (Build & Logs)',
      action: () => toggleBottomPanel('output'),
    },
    {
      id: 'help:keymap',
      category: 'Help',
      title: 'Keyboard Shortcuts Cheat Sheet',
      shortcut: 'Ctrl+K Ctrl+S',
      action: openKeymapModal,
    },
    {
      id: 'help:about',
      category: 'Help',
      title: 'About Xivig Text Editor',
      action: openAboutModal,
    },
    {
      id: 'help:update',
      category: 'Help',
      title: 'Help: Check for Updates...',
      action: () => {
        openUpdateCheckModal();
        useUpdateStore.getState().checkForUpdates(true);
      },
    },
    {
      id: 'help:restart-update',
      category: 'Help',
      title: 'Help: Restart to Update (Apply Downloaded Update)',
      action: () => {
        useUpdateStore.getState().applyAndRestart();
      },
    },
    {
      id: 'view:sidebar',
      category: 'View',
      title: 'Toggle Sidebar',
      shortcut: 'Ctrl+B',
      action: toggleSidebar,
    },
    {
      id: 'view:terminal',
      category: 'View',
      title: 'Toggle Integrated Terminal',
      shortcut: 'Ctrl+`',
      action: () => toggleBottomPanel('terminal'),
    },
    {
      id: 'view:minimap',
      category: 'View',
      title: 'Toggle Minimap',
      action: toggleMinimap,
    },
    {
      id: 'view:toggle-distraction-free',
      category: 'View',
      title: 'Toggle Distraction-Free / Zen Mode',
      shortcut: 'Shift+F11',
      action: () => useUIStore.getState().toggleDistractionFree(),
    },
    {
      id: 'view:toggle-fullscreen',
      category: 'View',
      title: 'Toggle Full Screen',
      shortcut: 'F11',
      action: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      },
    },
    {
      id: 'view:toggle-whitespace',
      category: 'View',
      title: 'Toggle Whitespace Characters',
      action: () => {
        const current = useSettingsStore.getState().settings.renderWhitespace;
        const next = current === 'all' ? 'selection' : 'all';
        useSettingsStore.getState().updateSettings({ renderWhitespace: next });
      },
    },
    {
      id: 'view:toggle-indent-guides',
      category: 'View',
      title: 'Toggle Indentation Guides',
      action: () => {
        const current = useSettingsStore.getState().settings.rainbowIndentGuides;
        useSettingsStore.getState().updateSettings({ rainbowIndentGuides: !current });
      },
    },
    {
      id: 'view:layout-single',
      category: 'View',
      title: 'Layout: Single Column',
      shortcut: 'Alt+Shift+1',
      action: () => setSplitLayout('single'),
    },
    {
      id: 'view:layout-2col',
      category: 'View',
      title: 'Layout: Two Columns (Split Right)',
      shortcut: 'Alt+Shift+2',
      action: () => setSplitLayout('two-columns'),
    },
    {
      id: 'view:layout-2row',
      category: 'View',
      title: 'Layout: Two Rows (Split Down)',
      shortcut: 'Alt+Shift+3',
      action: () => setSplitLayout('two-rows'),
    },
    {
      id: 'view:zoom-in',
      category: 'View',
      title: 'Zoom In (Enlarge Text)',
      shortcut: 'Ctrl+=',
      action: () => useSettingsStore.getState().zoomIn(),
    },
    {
      id: 'view:zoom-out',
      category: 'View',
      title: 'Zoom Out (Shrink Text)',
      shortcut: 'Ctrl+-',
      action: () => useSettingsStore.getState().zoomOut(),
    },
    {
      id: 'view:reset-zoom',
      category: 'View',
      title: 'Reset Zoom (Default Text Size)',
      shortcut: 'Ctrl+0',
      action: () => useSettingsStore.getState().resetZoom(),
    },
    {
      id: 'view:explorer',
      category: 'View',
      title: 'Focus File Explorer',
      shortcut: 'Ctrl+Shift+E',
      action: () => setActiveSidebarView('explorer'),
    },
    {
      id: 'view:search',
      category: 'View',
      title: 'Focus Search in Files',
      shortcut: 'Ctrl+Shift+F',
      action: () => setActiveSidebarView('search'),
    },
    {
      id: 'view:git',
      category: 'View',
      title: 'Focus Source Control (Git)',
      shortcut: 'Ctrl+Shift+G',
      action: () => setActiveSidebarView('git'),
    },
    {
      id: 'live:toggle-server',
      category: 'Live Server',
      title: 'Live Server: Toggle (Go Live / Stop)',
      action: () => useLiveServerStore.getState().toggleServer(),
    },
    {
      id: 'live:open-browser',
      category: 'Live Server',
      title: 'Live Server: Open in Default Browser',
      action: () => useLiveServerStore.getState().openInBrowser(),
    },
    {
      id: 'preview:toggle-live',
      category: 'Preview',
      title: 'Live Preview: Toggle Web Preview Pane',
      shortcut: 'Ctrl+K V',
      action: () => useEditorStore.getState().togglePreview('live-web'),
    },
    {
      id: 'preview:toggle-markdown',
      category: 'Preview',
      title: 'Markdown: Toggle Live Preview',
      shortcut: 'Ctrl+Shift+V',
      action: () => useEditorStore.getState().togglePreview('markdown'),
    },
    {
      id: 'goto:symbol',
      category: 'Navigation',
      title: 'Go to Symbol in Current File...',
      shortcut: 'Ctrl+R',
      action: () => useUIStore.getState().openQuickOpenWithMode('@'),
    },
    {
      id: 'goto:workspace-symbol',
      category: 'Navigation',
      title: 'Go to Symbol in Workspace...',
      shortcut: 'Ctrl+;',
      action: () => useUIStore.getState().openQuickOpenWithMode('#'),
    },
    {
      id: 'goto:line-col',
      category: 'Navigation',
      title: 'Go to Line and Column...',
      shortcut: 'Ctrl+G',
      action: () => useUIStore.getState().openQuickOpenWithMode(':'),
    },
    {
      id: 'goto:definition',
      category: 'Navigation',
      title: 'Go to Definition',
      shortcut: 'F12',
      action: () => {
        const view = getActiveEditorView();
        if (view) {
          goToDefinition(view);
        }
      },
    },
    {
      id: 'goto:declaration',
      category: 'Navigation',
      title: 'Go to Declaration',
      shortcut: 'Ctrl+F12',
      action: () => {
        const view = getActiveEditorView();
        if (view) {
          goToDeclaration(view);
        }
      },
    },
    {
      id: 'goto:type-definition',
      category: 'Navigation',
      title: 'Go to Type Definition',
      action: () => {
        const view = getActiveEditorView();
        if (view) {
          goToTypeDefinition(view);
        }
      },
    },
    {
      id: 'goto:implementations',
      category: 'Navigation',
      title: 'Go to Implementations',
      action: () => {
        const view = getActiveEditorView();
        if (view) {
          findImplementations(view);
        }
      },
    },
    {
      id: 'goto:peek-definition',
      category: 'Navigation',
      title: 'Peek Definition',
      shortcut: 'Alt+F12',
      action: () => {
        const view = getActiveEditorView();
        if (view) {
          peekDefinition(view);
        }
      },
    },
    {
      id: 'goto:find-references',
      category: 'Navigation',
      title: 'Find All References',
      shortcut: 'Shift+F12',
      action: () => {
        const view = getActiveEditorView();
        if (view) {
          findReferences(view);
        }
      },
    },
    {
      id: 'edit:rename-symbol',
      category: 'Edit',
      title: 'Rename Symbol',
      shortcut: 'F2',
      action: () => {
        const view = getActiveEditorView();
        if (view) {
          renameSymbol(view);
        }
      },
    },
    {
      id: 'navigate:back',
      category: 'Navigation',
      title: 'Navigate Backward in Edit Locations',
      shortcut: 'Alt+Left',
      action: () => navigationHistory.goBack(),
    },
    {
      id: 'navigate:forward',
      category: 'Navigation',
      title: 'Navigate Forward in Edit Locations',
      shortcut: 'Alt+Right',
      action: () => navigationHistory.goForward(),
    },
    {
      id: 'format:beautify',
      category: 'Format',
      title: 'Format Document (Beautify Code)',
      shortcut: 'Ctrl+Alt+B',
      action: () => {
        const view = getActiveEditorView();
        if (view) {
          beautifyActiveEditor(view);
        }
      },
    },
    {
      id: 'view:toggle-ligatures',
      category: 'Preferences',
      title: 'Preferences: Toggle Font Ligatures',
      action: () => {
        useSettingsStore.getState().toggleFontLigatures();
      },
    },
    {
      id: 'edit:toggle-comment',
      category: 'Edit',
      title: 'Toggle Line Comment',
      shortcut: 'Ctrl+/',
      action: () => {
        const view = getActiveEditorView();
        if (view) smartToggleLineComment(view);
      },
    },
    {
      id: 'edit:toggle-block-comment',
      category: 'Edit',
      title: 'Toggle Block Comment',
      shortcut: 'Ctrl+Shift+/',
      action: () => {
        const view = getActiveEditorView();
        if (view) smartToggleBlockComment(view);
      },
    },
    {
      id: 'edit:color-picker',
      category: 'Edit',
      title: 'Color Picker',
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
      id: 'edit:lorem-ipsum',
      category: 'Edit',
      title: 'Insert Lorem Ipsum...',
      shortcut: 'Ctrl+Alt+L',
      action: () => useUIStore.getState().openLoremIpsumModal(),
    },
    {
      id: 'edit:increment-number',
      category: 'Edit',
      title: 'Increment Number Under Cursor',
      shortcut: 'Ctrl+Alt+=',
      action: () => {
        const view = getActiveEditorView();
        if (view) incrementNumberCommand(view);
      },
    },
    {
      id: 'edit:decrement-number',
      category: 'Edit',
      title: 'Decrement Number Under Cursor',
      shortcut: 'Ctrl+Alt+-',
      action: () => {
        const view = getActiveEditorView();
        if (view) decrementNumberCommand(view);
      },
    },
    {
      id: 'edit:sort-lines',
      category: 'Edit',
      title: 'Sort Lines',
      shortcut: 'F9',
      action: () => {
        const view = getActiveEditorView();
        if (view) sortLines(false)(view);
      },
    },
    {
      id: 'edit:sort-lines-case-sensitive',
      category: 'Edit',
      title: 'Sort Lines (Case Sensitive)',
      shortcut: 'Ctrl+F9',
      action: () => {
        const view = getActiveEditorView();
        if (view) sortLines(true)(view);
      },
    },
    {
      id: 'edit:remove-duplicate-lines',
      category: 'Edit',
      title: 'Remove Duplicate Lines',
      action: () => {
        const view = getActiveEditorView();
        if (view) removeDuplicateLinesCommand(view);
      },
    },
    {
      id: 'edit:reverse-lines',
      category: 'Edit',
      title: 'Reverse Selected Lines',
      action: () => {
        const view = getActiveEditorView();
        if (view) reverseLinesCommand(view);
      },
    },
    {
      id: 'edit:trim-trailing-whitespace',
      category: 'Edit',
      title: 'Trim Trailing Whitespace',
      action: () => {
        const view = getActiveEditorView();
        if (view) trimTrailingWhitespaceCommand(view);
      },
    },
    {
      id: 'edit:to-uppercase',
      category: 'Edit',
      title: 'Transform to UPPERCASE',
      shortcut: 'Ctrl+K Ctrl+U',
      action: () => {
        const view = getActiveEditorView();
        if (view) transformToUppercase(view);
      },
    },
    {
      id: 'edit:to-lowercase',
      category: 'Edit',
      title: 'Transform to lowercase',
      shortcut: 'Ctrl+K Ctrl+L',
      action: () => {
        const view = getActiveEditorView();
        if (view) transformToLowercase(view);
      },
    },
    {
      id: 'edit:to-title-case',
      category: 'Edit',
      title: 'Transform to Title Case',
      action: () => {
        const view = getActiveEditorView();
        if (view) transformToTitleCaseCommand(view);
      },
    },
    {
      id: 'edit:to-camel-case',
      category: 'Edit',
      title: 'Transform to camelCase',
      action: () => {
        const view = getActiveEditorView();
        if (view) transformToCamelCaseCommand(view);
      },
    },
    {
      id: 'edit:to-snake-case',
      category: 'Edit',
      title: 'Transform to snake_case',
      action: () => {
        const view = getActiveEditorView();
        if (view) transformToSnakeCaseCommand(view);
      },
    },
    {
      id: 'edit:to-kebab-case',
      category: 'Edit',
      title: 'Transform to kebab-case',
      action: () => {
        const view = getActiveEditorView();
        if (view) transformToKebabCaseCommand(view);
      },
    },
    {
      id: 'edit:transpose-chars',
      category: 'Edit',
      title: 'Transpose Characters',
      shortcut: 'Ctrl+T',
      action: () => {
        const view = getActiveEditorView();
        if (view) transposeChars(view);
      },
    },
    {
      id: 'edit:transpose-words',
      category: 'Edit',
      title: 'Transpose Words',
      shortcut: 'Ctrl+Alt+T',
      action: () => {
        const view = getActiveEditorView();
        if (view) transposeWordsCommand(view);
      },
    },
    {
      id: 'selection:expand-syntax',
      category: 'Selection',
      title: 'Expand Selection to Parent Syntax',
      shortcut: 'Ctrl+Shift+Space',
      action: () => {
        const view = getActiveEditorView();
        if (view) selectParentSyntax(view);
      },
    },
    {
      id: 'selection:jump-matching-bracket',
      category: 'Selection',
      title: 'Jump to Matching Bracket',
      shortcut: 'Ctrl+M',
      action: () => {
        const view = getActiveEditorView();
        if (view) cursorMatchingBracket(view);
      },
    },
    {
      id: 'selection:select-matching-bracket',
      category: 'Selection',
      title: 'Select to Matching Bracket',
      shortcut: 'Ctrl+Shift+M',
      action: () => {
        const view = getActiveEditorView();
        if (view) selectMatchingBracket(view);
      },
    },
    {
      id: 'lang:select',
      category: 'Language',
      title: 'Change Language Mode...',
      shortcut: 'Ctrl+K M',
      action: openLanguageSelector,
    },
    {
      id: 'lang:js',
      category: 'Language',
      title: 'Change Language Mode to JavaScript',
      action: () => setLanguage('javascript'),
    },
    {
      id: 'lang:ts',
      category: 'Language',
      title: 'Change Language Mode to TypeScript',
      action: () => setLanguage('typescript'),
    },
    {
      id: 'lang:html',
      category: 'Language',
      title: 'Change Language Mode to HTML',
      action: () => setLanguage('html'),
    },
    {
      id: 'lang:css',
      category: 'Language',
      title: 'Change Language Mode to CSS',
      action: () => setLanguage('css'),
    },
    {
      id: 'lang:json',
      category: 'Language',
      title: 'Change Language Mode to JSON',
      action: () => setLanguage('json'),
    },
    {
      id: 'lang:markdown',
      category: 'Language',
      title: 'Change Language Mode to Markdown',
      action: () => setLanguage('markdown'),
    },
    {
      id: 'lang:python',
      category: 'Language',
      title: 'Change Language Mode to Python',
      action: () => setLanguage('python'),
    },
    {
      id: 'lang:java',
      category: 'Language',
      title: 'Change Language Mode to Java',
      action: () => setLanguage('java'),
    },
    {
      id: 'lang:c',
      category: 'Language',
      title: 'Change Language Mode to C',
      action: () => setLanguage('c'),
    },
    {
      id: 'lang:cpp',
      category: 'Language',
      title: 'Change Language Mode to C++',
      action: () => setLanguage('cpp'),
    },
    {
      id: 'lang:csharp',
      category: 'Language',
      title: 'Change Language Mode to C#',
      action: () => setLanguage('csharp'),
    },
    {
      id: 'lang:go',
      category: 'Language',
      title: 'Change Language Mode to Go',
      action: () => setLanguage('go'),
    },
    {
      id: 'lang:php',
      category: 'Language',
      title: 'Change Language Mode to PHP',
      action: () => setLanguage('php'),
    },
    {
      id: 'lang:sql',
      category: 'Language',
      title: 'Change Language Mode to SQL',
      action: () => setLanguage('sql'),
    },
    {
      id: 'lang:yaml',
      category: 'Language',
      title: 'Change Language Mode to YAML',
      action: () => setLanguage('yaml'),
    },
    {
      id: 'lang:shell',
      category: 'Language',
      title: 'Change Language Mode to Shell Script',
      action: () => setLanguage('shell'),
    },
    {
      id: 'lang:swift',
      category: 'Language',
      title: 'Change Language Mode to Swift',
      action: () => setLanguage('swift'),
    },
    {
      id: 'lang:kotlin',
      category: 'Language',
      title: 'Change Language Mode to Kotlin',
      action: () => setLanguage('kotlin'),
    },
    {
      id: 'lang:bat',
      category: 'Language',
      title: 'Change Language Mode to Batch Script (CMD)',
      action: () => setLanguage('bat'),
    },
    {
      id: 'lang:rust',
      category: 'Language',
      title: 'Change Language Mode to Rust',
      action: () => setLanguage('rust'),
    },
    {
      id: 'dev:reload',
      category: 'Developer',
      title: 'Reload Window',
      shortcut: 'Ctrl+R',
      action: () => window.location.reload(),
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    const fullText = `${cmd.category}: ${cmd.title}`.toLowerCase();
    return fullText.includes(query.toLowerCase());
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        close();
        filteredCommands[selectedIndex].action();
      }
    }
  };

  useEffect(() => {
    // Scroll selected item into view
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div style={backdropStyle} onClick={close}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div style={searchHeaderStyle}>
          <Command size={16} color="var(--xivig-accent)" style={{ marginRight: '10px' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            style={inputStyle}
          />
        </div>

        {/* Results List */}
        <div ref={listRef} style={resultsContainerStyle}>
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    close();
                    cmd.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    ...itemStyle,
                    backgroundColor: isSelected ? 'var(--xivig-accent-active)' : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--xivig-accent)' : '2px solid transparent',
                  }}
                >
                  <div style={itemLeftStyle}>
                    <span style={categoryBadgeStyle}>{cmd.category}</span>
                    <span style={titleStyle}>{cmd.title}</span>
                  </div>
                  {cmd.shortcut && <span style={shortcutBadgeStyle}>{cmd.shortcut}</span>}
                </div>
              );
            })
          ) : (
            <div style={emptyStyle}>No matching commands found</div>
          )}
        </div>
      </div>
    </div>
  );
};

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
  display: 'flex',
  justifyContent: 'center',
  paddingTop: '60px',
  zIndex: 10000,
  backdropFilter: 'blur(2px)',
};

const modalStyle: React.CSSProperties = {
  width: '580px',
  maxHeight: '440px',
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '8px',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const searchHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid var(--xivig-border)',
  backgroundColor: 'var(--xivig-surface)',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '14px',
  color: 'var(--xivig-text)',
  padding: 0,
};

const resultsContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '6px 0',
  maxHeight: '380px',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 16px',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
};

const itemLeftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  overflow: 'hidden',
};

const categoryBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--xivig-accent)',
  fontWeight: 600,
  letterSpacing: '0.4px',
  textTransform: 'uppercase',
  backgroundColor: 'var(--xivig-accent-subtle)',
  padding: '2px 6px',
  borderRadius: '3px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--xivig-text)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const shortcutBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--xivig-text-dim)',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  padding: '2px 6px',
  borderRadius: '3px',
  border: '1px solid var(--xivig-border-subtle)',
};

const emptyStyle: React.CSSProperties = {
  padding: '24px',
  textAlign: 'center',
  color: 'var(--xivig-text-dim)',
  fontSize: '13px',
};
