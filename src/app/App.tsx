import React, { useEffect, useState } from 'react';
import { Titlebar } from '../components/titlebar/Titlebar';
import { Menubar } from '../components/menubar/Menubar';
import { ActivityBar } from '../components/activitybar/ActivityBar';
import { Sidebar } from '../components/sidebar/Sidebar';
import { TabBar } from '../components/tabs/TabBar';
import { Editor } from '../components/editor/Editor';
import { LivePreviewPane } from '../components/editor/LivePreviewPane';
import { MarkdownPreviewPane } from '../components/editor/MarkdownPreviewPane';
import { LinkedFileBanner } from '../components/editor/LinkedFileBanner';
import { BreadcrumbBar } from '../components/editor/BreadcrumbBar';
import { StatusBar } from '../components/statusbar/StatusBar';
import { BottomPanel } from '../components/terminal/BottomPanel';
import { CommandPalette } from '../components/modals/CommandPalette';
import { QuickOpen } from '../components/modals/QuickOpen';
import { SearchPanel } from '../components/search/SearchPanel';
import { LanguageSelectorModal } from '../components/modals/LanguageSelectorModal';
import { KeymapModal } from '../components/modals/KeymapModal';
import { WrapWithAbbreviationModal } from '../components/modals/WrapWithAbbreviationModal';
import { BuildSystemModal } from '../components/modals/BuildSystemModal';
import { BracketsColorPickerModal } from '../components/modals/BracketsColorPickerModal';
import { LoremIpsumModal } from '../components/modals/LoremIpsumModal';
import { AboutModal } from '../components/modals/AboutModal';
import { DiffModal } from '../components/modals/DiffModal';
import { RenameSymbolModal } from '../components/modals/RenameSymbolModal';
import { PeekDefinitionModal } from '../components/modals/PeekDefinitionModal';
import { IndexingStatusModal } from '../components/modals/IndexingStatusModal';
import { RemoveLicenseModal } from '../components/modals/RemoveLicenseModal';
import { UpdateCheckModal } from '../components/modals/UpdateCheckModal';
import { ThemeEditorModal } from '../components/modals/ThemeEditorModal';
import { DevToolboxModal } from '../components/modals/DevToolboxModal';
import { DiagnosticLogModal } from '../components/modals/DiagnosticLogModal';
import { CssHelpersModal } from '../components/webToolkit/CssHelpersModal';
import { MarkdownTableEditorModal } from '../components/modals/MarkdownTableEditorModal';
import { UpdateNotificationBanner } from '../components/common/UpdateNotificationBanner';
import { useEditorStore } from '../stores/editorStore';
import { useFileStore } from '../stores/fileStore';
import { useUIStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useBuildStore } from '../stores/buildStore';
import { useExtensionStore } from '../stores/extensionStore';
import { EditorDocument } from '../types/editor';
import { getActiveEditorView } from '../components/editor/editorViewRegistry';
import {
  transformToUppercase,
  transformToLowercase,
  centerCursor,
  setMark,
  selectToMark,
  deleteToMark,
  swapWithMark,
  yankMark,
  skipAndSelectNextOccurrence,
} from '../components/editor/sublimeKeymap';
import { switchSiblingFile } from '../utils/fileSwitcher';
import { deleteToLineEnd, deleteToLineStart } from '@codemirror/commands';
import { unfoldAll } from '@codemirror/language';
import { findNext, findPrevious } from '@codemirror/search';
import { beautifyActiveEditor, autoIndentAndFormatEditor } from '../utils/beautify';
import { prepareContentForSave } from '../utils/saveUtils';
import { navigationHistory } from '../utils/navigationHistory';
import { LanguageServersModal } from '../components/modals/LanguageServersModal';
import { FormattingSettingsModal } from '../components/modals/FormattingSettingsModal';
import { ProjectSwitcherModal } from '../components/modals/ProjectSwitcherModal';
import { TasksModal } from '../components/modals/TasksModal';
import { DebugToolbar } from '../components/debug/DebugToolbar';
import { useDebugStore } from '../stores/debugStore';
import { useTaskStore } from '../stores/taskStore';
import { useFormatStore } from '../formatting/formatStore';
import {
  useLspStore,
  LspClient,
  formatDocumentWithLsp,
  requestLspCodeActions,
  executeLspCodeAction,
} from '../lsp';

export const App: React.FC = () => {
  const createNewDocument = useEditorStore((state) => state.createNewDocument);
  const openDocument = useEditorStore((state) => state.openDocument);
  const activeDoc = useEditorStore((state) =>
    state.documents.find((d) => d.id === state.activeDocumentId)
  );
  const closeDocument = useEditorStore((state) => state.closeDocument);
  const markDocumentSaved = useEditorStore((state) => state.markDocumentSaved);
  const setRestoredSession = useEditorStore((state) => state.setRestoredSession);
  const splitLayout = useEditorStore((state) => state.splitLayout);
  const setSplitLayout = useEditorStore((state) => state.setSplitLayout);
  const isPreviewOpen = useEditorStore((state) => state.isPreviewOpen);
  const previewMode = useEditorStore((state) => state.previewMode);

  const toggleSidebar = useFileStore((state) => state.toggleSidebar);
  const setInitialSession = useFileStore((state) => state.setInitialSession);
  const refreshCurrentFolder = useFileStore((state) => state.refreshCurrentFolder);
  const loadRecentHistory = useFileStore((state) => state.loadRecentHistory);
  const setCurrentFolder = useFileStore((state) => state.setCurrentFolder);
  const setActiveSidebarView = useFileStore((state) => state.setActiveSidebarView);

  const toggleCommandPalette = useUIStore((state) => state.toggleCommandPalette);
  const toggleQuickOpen = useUIStore((state) => state.toggleQuickOpen);
  const openQuickOpenWithMode = useUIStore((state) => state.openQuickOpenWithMode);
  const isDistractionFree = useUIStore((state) => state.isDistractionFree);
  const toggleDistractionFree = useUIStore((state) => state.toggleDistractionFree);
  const openSearchPanel = useUIStore((state) => state.openSearchPanel);
  const closeSearchPanel = useUIStore((state) => state.closeSearchPanel);
  const closeCommandPalette = useUIStore((state) => state.closeCommandPalette);
  const closeQuickOpen = useUIStore((state) => state.closeQuickOpen);
  const closeLanguageSelector = useUIStore((state) => state.closeLanguageSelector);
  const toggleBottomPanel = useUIStore((state) => state.toggleBottomPanel);
  const openKeymapModal = useUIStore((state) => state.openKeymapModal);
  const closeKeymapModal = useUIStore((state) => state.closeKeymapModal);
  const openBuildSystemModal = useUIStore((state) => state.openBuildSystemModal);
  const closeBuildSystemModal = useUIStore((state) => state.closeBuildSystemModal);
  const openWrapWithAbbreviation = useUIStore((state) => state.openWrapWithAbbreviation);
  const closeWrapWithAbbreviation = useUIStore((state) => state.closeWrapWithAbbreviation);

  const isThemeEditorOpen = useUIStore((state) => state.isThemeEditorOpen);
  const closeThemeEditor = useUIStore((state) => state.closeThemeEditor);
  const isDevToolboxOpen = useUIStore((state) => state.isDevToolboxOpen);
  const devToolboxInitialTab = useUIStore((state) => state.devToolboxInitialTab);
  const openDevToolbox = useUIStore((state) => state.openDevToolbox);
  const closeDevToolbox = useUIStore((state) => state.closeDevToolbox);
  const isDiagnosticLogOpen = useUIStore((state) => state.isDiagnosticLogOpen);
  const closeDiagnosticLog = useUIStore((state) => state.closeDiagnosticLog);
  const isCssHelpersOpen = useUIStore((state) => state.isCssHelpersOpen);
  const cssHelpersInitialTab = useUIStore((state) => state.cssHelpersInitialTab);
  const closeCssHelpers = useUIStore((state) => state.closeCssHelpers);
  const isMarkdownTableEditorOpen = useUIStore((state) => state.isMarkdownTableEditorOpen);
  const closeMarkdownTableEditor = useUIStore((state) => state.closeMarkdownTableEditor);

  const chordRef = React.useRef<string | null>(null);
  const chordTimeoutRef = React.useRef<any>(null);

  const [isFormattingModalOpen, setIsFormattingModalOpen] = useState(false);
  const isProjectSwitcherOpen = useUIStore((state) => state.isProjectSwitcherOpen);
  const closeProjectSwitcherModal = useUIStore((state) => state.closeProjectSwitcherModal);

  // Restore Session and Settings on Mount
  useEffect(() => {
    async function initSession() {
      // 1. Load persisted settings, extensions, LSP servers, debug, and tasks
      await useSettingsStore.getState().loadSettings();
      useExtensionStore.getState().loadInstalledExtensions();
      useLspStore.getState().initialize();
      useDebugStore.getState().initialize();
      useTaskStore.getState().initialize();
      useFormatStore.getState().loadFormatters();
      const settings = useSettingsStore.getState().settings;

      if (!window.xivig?.restoreSession) return;

      try {
        const session = await window.xivig.restoreSession();
        if (session && session.documents && session.documents.length > 0) {
          let restoredDocs: EditorDocument[] = session.documents.map((d) => ({
            id: d.id,
            path: d.path,
            name: d.name,
            content: d.content,
            language: d.language,
            isDirty: d.isDirty,
            cursor: { line: d.cursorLine || 1, col: d.cursorCol || 1 },
          }));

          // If the user disabled showWelcomeOnStartup, remove the welcome tab
          if (settings.showWelcomeOnStartup === false) {
            restoredDocs = restoredDocs.filter((d) => d.id !== 'welcome-tab');
          }

          if (restoredDocs.length > 0) {
            const nextActiveId = restoredDocs.some((d) => d.id === session.activeDocId)
              ? session.activeDocId
              : restoredDocs[0].id;

            setRestoredSession(restoredDocs, nextActiveId);
          } else {
            setRestoredSession([], null);
            useEditorStore.getState().createNewDocument();
          }

          setInitialSession(
            session.activeFolder,
            session.isSidebarOpen ?? true,
            (session.activeSidebarView as any) || 'explorer'
          );

          // If a folder was active, load its contents
          if (session.activeFolder && window.xivig.readDir) {
            const res = await window.xivig.readDir(session.activeFolder);
            if (res.success && res.items) {
              setCurrentFolder(session.activeFolder, res.items);
            }
          }
        } else {
          // If no saved session, check showWelcomeOnStartup
          if (settings.showWelcomeOnStartup === false) {
            setRestoredSession([], null);
            useEditorStore.getState().createNewDocument();
          }
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      }

      loadRecentHistory();
    }

    initSession();
  }, []);

  // Listen to Workspace file changes from chokidar
  useEffect(() => {
    if (window.xivig?.onWorkspaceFilesChanged) {
      const unsubscribe = window.xivig.onWorkspaceFilesChanged((data) => {
        refreshCurrentFolder();
        if (data && data.path && (data.event === 'change' || data.event === 'unlink')) {
          useEditorStore.getState().handleExternalFileChange(data.path);
        }
      });
      return unsubscribe;
    }
  }, []);

  // Save session on window beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const editorState = useEditorStore.getState();
      const fileState = useFileStore.getState();
      if (!window.xivig?.saveSession) return;

      window.xivig.saveSession({
        activeDocId: editorState.activeDocumentId,
        activeFolder: fileState.currentFolderPath,
        isSidebarOpen: fileState.isSidebarOpen,
        activeSidebarView: fileState.activeSidebarView || 'explorer',
        documents: editorState.documents.map((doc, idx) => ({
          id: doc.id,
          path: doc.path,
          name: doc.name,
          content: doc.content,
          language: doc.language,
          isDirty: doc.isDirty,
          cursorLine: doc.cursor.line,
          cursorCol: doc.cursor.col,
          orderIndex: idx,
        })),
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Ctrl + Mouse Wheel zoom in / zoom out
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          useSettingsStore.getState().zoomIn();
        } else if (e.deltaY > 0) {
          useSettingsStore.getState().zoomOut();
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Escape key closes modals / search
      if (e.key === 'Escape') {
        closeCommandPalette();
        closeQuickOpen();
        closeSearchPanel();
        closeLanguageSelector();
        closeKeymapModal();
        closeBuildSystemModal();
        closeWrapWithAbbreviation();
        closeThemeEditor();
        closeDevToolbox();
        closeDiagnosticLog();
        closeCssHelpers();
        closeMarkdownTableEditor();
        chordRef.current = null;
        return;
      }

      // Multi-key chord handling (Sublime Text Ctrl+K ...)
      if (chordRef.current === 'k') {
        // Ignore standalone modifier key presses so chord is NOT cancelled when holding or pressing Ctrl/Shift/Alt/Meta
        if (e.key === 'Control' || e.key === 'Shift' || e.key === 'Alt' || e.key === 'Meta') {
          return;
        }

        const k = e.key.toLowerCase();
        chordRef.current = null;
        if (chordTimeoutRef.current) clearTimeout(chordTimeoutRef.current);

        if (k === 's') {
          e.preventDefault();
          e.stopPropagation();
          openKeymapModal();
          return;
        } else if (k === 'o') {
          e.preventDefault();
          e.stopPropagation();
          if (window.xivig?.openFolderDialog) {
            const res = await window.xivig.openFolderDialog();
            if (!res.canceled && res.folderPath && res.files) {
              setCurrentFolder(res.folderPath, res.files);
            }
          }
          return;
        } else if (k === 'u') {
          e.preventDefault();
          e.stopPropagation();
          const view = getActiveEditorView();
          if (view) transformToUppercase(view);
          return;
        } else if (k === 'l') {
          e.preventDefault();
          e.stopPropagation();
          const view = getActiveEditorView();
          if (view) transformToLowercase(view);
          return;
        } else if (k === 'k') {
          e.preventDefault();
          e.stopPropagation();
          const view = getActiveEditorView();
          if (view) deleteToLineEnd(view);
          return;
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          e.stopPropagation();
          const view = getActiveEditorView();
          if (view) deleteToLineStart(view);
          return;
        } else if (k === 'c') {
          e.preventDefault();
          e.stopPropagation();
          const view = getActiveEditorView();
          if (view) centerCursor(view);
          return;
        } else if (k === 'w') {
          e.preventDefault();
          e.stopPropagation();
          const view = getActiveEditorView();
          if (view && deleteToMark(view)) {
            return;
          }
          useEditorStore.getState().closeAllTabs();
          return;
        } else if (k === 'b') {
          e.preventDefault();
          e.stopPropagation();
          toggleSidebar();
          return;
        } else if (k === '0' || k === 'j') {
          e.preventDefault();
          e.stopPropagation();
          const view = getActiveEditorView();
          if (view) unfoldAll(view);
          return;
        } else if (k === 'd') {
          e.preventDefault();
          e.stopPropagation();
          const view = getActiveEditorView();
          if (view) skipAndSelectNextOccurrence(view);
          return;
        } else if (e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          const view = getActiveEditorView();
          if (view) setMark(view);
          return;
        } else if (k === 'a') {
          e.preventDefault();
          e.stopPropagation();
          const view = getActiveEditorView();
          if (view) selectToMark(view);
          return;
        } else if (k === 'x') {
          e.preventDefault();
          e.stopPropagation();
          const view = getActiveEditorView();
          if (view) swapWithMark(view);
          return;
        } else if (k === 'y') {
          e.preventDefault();
          e.stopPropagation();
          const view = getActiveEditorView();
          if (view) yankMark(view);
          return;
        } else if (k === 'v') {
          e.preventDefault();
          e.stopPropagation();
          useEditorStore.getState().togglePreview();
          return;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          e.stopPropagation();
          setSplitLayout('two-columns');
          return;
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          e.stopPropagation();
          setSplitLayout('single');
          return;
        }
      }

      if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        chordRef.current = 'k';
        if (chordTimeoutRef.current) clearTimeout(chordTimeoutRef.current);
        chordTimeoutRef.current = setTimeout(() => {
          chordRef.current = null;
        }, 2500);
        return;
      }

      // New Window / Close Window (Ctrl+Shift+N / Ctrl+Shift+W)
      if (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        window.open(window.location.href, '_blank');
        return;
      } else if (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        window.xivig?.closeWindow?.();
        return;
      }

      // Close Tab / File (Ctrl+F4)
      if (isCtrlOrMeta && e.key === 'F4') {
        e.preventDefault();
        if (activeDoc) closeDocument(activeDoc.id);
        return;
      }

      // Switch Header / Source Sibling File (Alt+O / Alt+Shift+O)
      if (e.altKey && !e.shiftKey && !isCtrlOrMeta && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        switchSiblingFile(false);
        return;
      } else if (e.altKey && e.shiftKey && !isCtrlOrMeta && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        switchSiblingFile(true);
        return;
      }

      // Slurp Find String (Ctrl+E)
      if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        const view = getActiveEditorView();
        if (view) {
          const sel = view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to);
          if (sel) {
            openSearchPanel('find');
          }
        }
        return;
      }

      // Slurp Replace String (Ctrl+Shift+E)
      if (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        openSearchPanel('replace');
        return;
      }

      // Build / Toggle Console (F7)
      if (!isCtrlOrMeta && !e.shiftKey && e.key === 'F7') {
        e.preventDefault();
        toggleBottomPanel('terminal');
        return;
      }

      // Distraction Free Mode (Shift+F11)
      if (e.shiftKey && e.key === 'F11') {
        e.preventDefault();
        toggleDistractionFree();
        return;
      } else if (!e.shiftKey && e.key === 'F11') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        return;
      }

      // Find Next / Previous (F3 / Shift+F3)
      if (!isCtrlOrMeta && !e.shiftKey && e.key === 'F3') {
        e.preventDefault();
        const view = getActiveEditorView();
        if (view) findNext(view);
        return;
      } else if (!isCtrlOrMeta && e.shiftKey && e.key === 'F3') {
        e.preventDefault();
        const view = getActiveEditorView();
        if (view) findPrevious(view);
        return;
      }

      // Go to Line and Column (Ctrl+G)
      if (isCtrlOrMeta && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        useUIStore.getState().openQuickOpenWithMode(':');
        return;
      }

      // Reopen Closed Tab (Ctrl+Shift+T)
      if (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        useEditorStore.getState().reopenClosedTab();
        return;
      }

      // Toggle Preview (Ctrl+Shift+V)
      if (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        useEditorStore.getState().togglePreview();
        return;
      }

      // Tab Cycling (Ctrl+Tab / Ctrl+Shift+Tab, Ctrl+PageDown / Ctrl+PageUp)
      if (isCtrlOrMeta && !e.shiftKey && (e.key === 'Tab' || e.key === 'PageDown')) {
        e.preventDefault();
        useEditorStore.getState().nextTab();
        return;
      } else if (isCtrlOrMeta && e.shiftKey && (e.key === 'Tab' || e.key === 'PageUp')) {
        e.preventDefault();
        useEditorStore.getState().previousTab();
        return;
      }

      // Direct Tab Switching (Alt+1 through Alt+0)
      if (e.altKey && !e.shiftKey && !isCtrlOrMeta && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(e.key)) {
        e.preventDefault();
        const tabIndex = e.key === '0' ? 9 : parseInt(e.key, 10) - 1;
        useEditorStore.getState().switchToTab(tabIndex);
        return;
      }

      // Navigate Backward in Edit History (Alt+Left)
      if (e.altKey && !e.shiftKey && !isCtrlOrMeta && e.key === 'ArrowLeft') {
        e.preventDefault();
        navigationHistory.goBack();
        return;
      }

      // Navigate Forward in Edit History (Alt+Right)
      if (e.altKey && !e.shiftKey && !isCtrlOrMeta && e.key === 'ArrowRight') {
        e.preventDefault();
        navigationHistory.goForward();
        return;
      }

      // Go to Line (Ctrl+G)
      if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        openQuickOpenWithMode(':');
        return;
      }

      // Go to Symbol (Ctrl+R)
      if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        openQuickOpenWithMode('@');
        return;
      }

      // Go to Term in File (Ctrl+;)
      if (isCtrlOrMeta && !e.shiftKey && e.key === ';') {
        e.preventDefault();
        openQuickOpenWithMode('#');
        return;
      }

      // Focus Search in Sidebar (Ctrl+Shift+F)
      if (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setActiveSidebarView('search');
        return;
      }

      // Focus Explorer in Sidebar (Ctrl+Shift+E)
      if (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setActiveSidebarView('explorer');
        return;
      }

      // Focus Git in Sidebar (Ctrl+Shift+G)
      if (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setActiveSidebarView('git');
        return;
      }

      // Focus Sidebar (Ctrl+0)
      if (isCtrlOrMeta && (e.key === '0' || e.code === 'Digit0')) {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Alt+Shift Layouts (1=single, 2=two columns, 3=two rows, 5=two columns, 8=two rows)
      if (e.altKey && e.shiftKey && e.key === '1') {
        e.preventDefault();
        setSplitLayout('single');
        return;
      } else if (e.altKey && e.shiftKey && (e.key === '2' || e.key === '5')) {
        e.preventDefault();
        setSplitLayout('two-columns');
        return;
      } else if (e.altKey && e.shiftKey && (e.key === '3' || e.key === '8' || e.key === '9')) {
        e.preventDefault();
        setSplitLayout('two-rows');
        return;
      }

      if (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        toggleCommandPalette();
      } else if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        toggleQuickOpen();
      } else if (isCtrlOrMeta && !e.shiftKey && e.key === ',') {
        e.preventDefault();
        useEditorStore.getState().openSettings();
      } else if (isCtrlOrMeta && (e.key === '=' || e.key === '+' || e.code === 'NumpadAdd')) {
        e.preventDefault();
        useSettingsStore.getState().zoomIn();
      } else if (isCtrlOrMeta && (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract')) {
        e.preventDefault();
        useSettingsStore.getState().zoomOut();
      } else if (isCtrlOrMeta && (e.key === '0' || e.code === 'Numpad0')) {
        e.preventDefault();
        useSettingsStore.getState().resetZoom();
      } else if (isCtrlOrMeta && (e.key === '`' || e.key === '~')) {
        e.preventDefault();
        toggleBottomPanel('terminal');
      } else if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        openSearchPanel('find');
      } else if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        openSearchPanel('replace');
      } else if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNewDocument();
      } else if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
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
      } else if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
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
      } else if (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!activeDoc || !window.xivig?.saveFileDialog) return;
        const view = getActiveEditorView();
        const contentToSave = prepareContentForSave(activeDoc.content, activeDoc.name, activeDoc.language, view);

        const res = await window.xivig.saveFileDialog(activeDoc.name, contentToSave);
        if (!res.canceled && res.filePath) {
          markDocumentSaved(activeDoc.id, res.filePath);
        }
      } else if (isCtrlOrMeta && e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        openWrapWithAbbreviation();
      } else if (isCtrlOrMeta && e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        const view = getActiveEditorView();
        if (view) {
          const settings = useSettingsStore.getState().settings;
          if (activeDoc?.path) {
            formatDocumentWithLsp(view, activeDoc.path, settings.tabSize || 2, true, activeDoc.language).then((formatted) => {
              if (!formatted) beautifyActiveEditor(view);
            });
          } else {
            beautifyActiveEditor(view);
          }
        }
      } else if (isCtrlOrMeta && e.key === '.') {
        e.preventDefault();
        const view = getActiveEditorView();
        if (view && activeDoc?.path) {
          requestLspCodeActions(view, activeDoc.path, activeDoc.language).then((actions) => {
            if (actions.length > 0) {
              executeLspCodeAction(view, actions[0]);
            }
          });
        }
      } else if (isCtrlOrMeta && e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
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
      } else if (isCtrlOrMeta && e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        useUIStore.getState().openLoremIpsumModal();
      } else if (isCtrlOrMeta && e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        useUIStore.getState().openDiffModal();
      } else if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        useUIStore.getState().openProjectSwitcherModal();
      } else if (isCtrlOrMeta && e.shiftKey && (e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 't')) {
        e.preventDefault();
        useTaskStore.getState().openModal();
      } else if (isCtrlOrMeta && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        openDevToolbox();
      } else if (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        useFileStore.getState().setActiveSidebarView('debug');
      } else if (e.key === 'F5' && !isCtrlOrMeta && !e.shiftKey) {
        e.preventDefault();
        if (useDebugStore.getState().sessionState === 'paused') {
          useDebugStore.getState().continueExecution();
        } else if (useDebugStore.getState().sessionState === 'stopped') {
          useDebugStore.getState().startDebugging();
        }
      } else if (e.key === 'F5' && e.shiftKey && !isCtrlOrMeta) {
        e.preventDefault();
        useDebugStore.getState().stopDebugging();
      } else if (e.key === 'F5' && isCtrlOrMeta && e.shiftKey) {
        e.preventDefault();
        useDebugStore.getState().restartDebugging();
      } else if (e.key === 'F10' && !isCtrlOrMeta) {
        e.preventDefault();
        useDebugStore.getState().stepOver();
      } else if (e.key === 'F11' && !isCtrlOrMeta && !e.shiftKey) {
        e.preventDefault();
        useDebugStore.getState().stepInto();
      } else if (e.key === 'F11' && e.shiftKey && !isCtrlOrMeta) {
        e.preventDefault();
        useDebugStore.getState().stepOut();
      } else if (e.key === 'F9' && !isCtrlOrMeta) {
        e.preventDefault();
        const view = getActiveEditorView();
        if (view && activeDoc?.path) {
          const lineNo = view.state.doc.lineAt(view.state.selection.main.head).number;
          useDebugStore.getState().toggleBreakpoint(activeDoc.path, lineNo);
        }
      } else if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeDoc) {
          if (activeDoc.isDirty) {
            useUIStore.getState().openDirtyCloseModal(activeDoc.id);
          } else {
            closeDocument(activeDoc.id);
          }
        }
      } else if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      } else if (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        useBuildStore.getState().executeBuild();
      } else if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        toggleBottomPanel();
      } else if (e.key === 'F7') {
        e.preventDefault();
        useBuildStore.getState().executeBuild();
      } else if (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        setActiveSidebarView('extensions');
      } else if (isCtrlOrMeta && e.key === '\\') {
        e.preventDefault();
        setSplitLayout(splitLayout === 'single' ? 'two-columns' : 'single');
      } else if (e.altKey && e.shiftKey && e.key === '1') {
        e.preventDefault();
        setSplitLayout('single');
      } else if (e.altKey && e.shiftKey && e.key === '2') {
        e.preventDefault();
        setSplitLayout('two-columns');
      } else if (e.altKey && e.shiftKey && e.key === '3') {
        e.preventDefault();
        setSplitLayout('two-rows');
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [
    activeDoc,
    createNewDocument,
    openDocument,
    closeDocument,
    markDocumentSaved,
    toggleSidebar,
    toggleCommandPalette,
    toggleQuickOpen,
    openSearchPanel,
    closeSearchPanel,
    closeCommandPalette,
    closeQuickOpen,
    splitLayout,
    setSplitLayout,
  ]);

  return (
    <div style={appContainerStyle}>
      <Titlebar />
      {!isDistractionFree && <Menubar />}
      <UpdateNotificationBanner />
      <div style={{ ...workbenchStyle, justifyContent: isDistractionFree ? 'center' : 'stretch' }}>
        {!isDistractionFree && <ActivityBar />}
        {!isDistractionFree && <Sidebar />}

        {/* Editor Area with Split Panes Support & Distraction Free Mode */}
        {splitLayout === 'single' ? (
          <main style={{ ...editorAreaStyle, flexDirection: 'row', maxWidth: isDistractionFree ? '1080px' : 'none', margin: isDistractionFree ? '0 auto' : '0' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <TabBar pane="primary" />
              <LinkedFileBanner />
              <BreadcrumbBar pane="primary" />
              <div style={editorSurfaceStyle}>
                <SearchPanel />
                <Editor pane="primary" />
              </div>
            </div>
            {isPreviewOpen && (
              <div style={{ flex: 1, minWidth: '340px', height: '100%', overflow: 'hidden' }}>
                {previewMode === 'markdown' ? <MarkdownPreviewPane /> : <LivePreviewPane />}
              </div>
            )}
          </main>
        ) : splitLayout === 'two-columns' ? (
          <main style={{ ...editorAreaStyle, flexDirection: 'row' }}>
            {/* Primary Column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid var(--xivig-border-subtle)', overflow: 'hidden' }}>
              <TabBar pane="primary" />
              <LinkedFileBanner />
              <BreadcrumbBar pane="primary" />
              <div style={editorSurfaceStyle}>
                <SearchPanel />
                <Editor pane="primary" />
              </div>
            </div>
            {/* Secondary Column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {isPreviewOpen ? (
                previewMode === 'markdown' ? <MarkdownPreviewPane /> : <LivePreviewPane />
              ) : (
                <>
                  <TabBar pane="secondary" />
                  <BreadcrumbBar pane="secondary" />
                  <div style={editorSurfaceStyle}>
                    <Editor pane="secondary" />
                  </div>
                </>
              )}
            </div>
          </main>
        ) : (
          <main style={{ ...editorAreaStyle, flexDirection: 'column' }}>
            {/* Top Row */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', borderBottom: '1px solid var(--xivig-border-subtle)', overflow: 'hidden' }}>
              <TabBar pane="primary" />
              <LinkedFileBanner />
              <BreadcrumbBar pane="primary" />
              <div style={editorSurfaceStyle}>
                <SearchPanel />
                <Editor pane="primary" />
              </div>
            </div>
            {/* Bottom Row */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
              {isPreviewOpen ? (
                previewMode === 'markdown' ? <MarkdownPreviewPane /> : <LivePreviewPane />
              ) : (
                <>
                  <TabBar pane="secondary" />
                  <BreadcrumbBar pane="secondary" />
                  <div style={editorSurfaceStyle}>
                    <Editor pane="secondary" />
                  </div>
                </>
              )}
            </div>
          </main>
        )}
      </div>

      {/* Integrated Terminal & Bottom Panel */}
      <BottomPanel />

      {!isDistractionFree && <StatusBar />}

      {/* Floating Modals */}
      <CommandPalette />
      <QuickOpen />
      <LanguageSelectorModal />
      <KeymapModal />
      <WrapWithAbbreviationModal />
      <BuildSystemModal />
      <BracketsColorPickerModal />
      <LoremIpsumModal />
      <AboutModal />
      <DiffModal />
      <RenameSymbolModal />
      <PeekDefinitionModal />
      <IndexingStatusModal />
      <RemoveLicenseModal />
      <UpdateCheckModal />
      <LanguageServersModal />
      <FormattingSettingsModal isOpen={isFormattingModalOpen} onClose={() => setIsFormattingModalOpen(false)} />
      <ProjectSwitcherModal isOpen={isProjectSwitcherOpen} onClose={closeProjectSwitcherModal} />
      <TasksModal />
      <DebugToolbar />
      <ThemeEditorModal isOpen={isThemeEditorOpen} onClose={closeThemeEditor} />
      <DevToolboxModal isOpen={isDevToolboxOpen} onClose={closeDevToolbox} initialTab={devToolboxInitialTab} />
      <DiagnosticLogModal isOpen={isDiagnosticLogOpen} onClose={closeDiagnosticLog} />
      <CssHelpersModal isOpen={isCssHelpersOpen} onClose={closeCssHelpers} initialTab={cssHelpersInitialTab} />
      <MarkdownTableEditorModal isOpen={isMarkdownTableEditorOpen} onClose={closeMarkdownTableEditor} />
    </div>
  );
};

const appContainerStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: 'var(--xivig-bg)',
};

const workbenchStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  overflow: 'hidden',
};

const editorAreaStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: 'var(--xivig-editor)',
};

const editorSurfaceStyle: React.CSSProperties = {
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
};
