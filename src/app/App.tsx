import React, { useEffect } from 'react';
import { Titlebar } from '../components/titlebar/Titlebar';
import { Menubar } from '../components/menubar/Menubar';
import { ActivityBar } from '../components/activitybar/ActivityBar';
import { Sidebar } from '../components/sidebar/Sidebar';
import { TabBar } from '../components/tabs/TabBar';
import { Editor } from '../components/editor/Editor';
import { LinkedFileBanner } from '../components/editor/LinkedFileBanner';
import { StatusBar } from '../components/statusbar/StatusBar';
import { BottomPanel } from '../components/terminal/BottomPanel';
import { CommandPalette } from '../components/modals/CommandPalette';
import { QuickOpen } from '../components/modals/QuickOpen';
import { SearchPanel } from '../components/search/SearchPanel';
import { LanguageSelectorModal } from '../components/modals/LanguageSelectorModal';
import { KeymapModal } from '../components/modals/KeymapModal';
import { WrapWithAbbreviationModal } from '../components/modals/WrapWithAbbreviationModal';
import { useEditorStore } from '../stores/editorStore';
import { useFileStore } from '../stores/fileStore';
import { useUIStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { EditorDocument } from '../types/editor';

export const App: React.FC = () => {
  const createNewDocument = useEditorStore((state) => state.createNewDocument);
  const openDocument = useEditorStore((state) => state.openDocument);
  const activeDoc = useEditorStore((state) => state.getActiveDocument());
  const closeDocument = useEditorStore((state) => state.closeDocument);
  const markDocumentSaved = useEditorStore((state) => state.markDocumentSaved);
  const setRestoredSession = useEditorStore((state) => state.setRestoredSession);
  const splitLayout = useEditorStore((state) => state.splitLayout);
  const setSplitLayout = useEditorStore((state) => state.setSplitLayout);

  const toggleSidebar = useFileStore((state) => state.toggleSidebar);
  const setInitialSession = useFileStore((state) => state.setInitialSession);
  const refreshCurrentFolder = useFileStore((state) => state.refreshCurrentFolder);
  const loadRecentHistory = useFileStore((state) => state.loadRecentHistory);
  const setCurrentFolder = useFileStore((state) => state.setCurrentFolder);

  const toggleCommandPalette = useUIStore((state) => state.toggleCommandPalette);
  const toggleQuickOpen = useUIStore((state) => state.toggleQuickOpen);
  const openSearchPanel = useUIStore((state) => state.openSearchPanel);
  const closeSearchPanel = useUIStore((state) => state.closeSearchPanel);
  const closeCommandPalette = useUIStore((state) => state.closeCommandPalette);
  const closeQuickOpen = useUIStore((state) => state.closeQuickOpen);
  const closeLanguageSelector = useUIStore((state) => state.closeLanguageSelector);
  const toggleBottomPanel = useUIStore((state) => state.toggleBottomPanel);
  const openKeymapModal = useUIStore((state) => state.openKeymapModal);
  const closeKeymapModal = useUIStore((state) => state.closeKeymapModal);
  const openWrapWithAbbreviation = useUIStore((state) => state.openWrapWithAbbreviation);
  const closeWrapWithAbbreviation = useUIStore((state) => state.closeWrapWithAbbreviation);

  const chordRef = React.useRef<string | null>(null);
  const chordTimeoutRef = React.useRef<any>(null);

  // Restore Session and Settings on Mount
  useEffect(() => {
    // Load persisted user settings
    useSettingsStore.getState().loadSettings();

    async function initSession() {
      if (!window.xivig?.restoreSession) return;

      try {
        const session = await window.xivig.restoreSession();
        if (session && session.documents && session.documents.length > 0) {
          const restoredDocs: EditorDocument[] = session.documents.map((d) => ({
            id: d.id,
            path: d.path,
            name: d.name,
            content: d.content,
            language: d.language,
            isDirty: d.isDirty,
            cursor: { line: d.cursorLine || 1, col: d.cursorCol || 1 },
          }));

          setRestoredSession(restoredDocs, session.activeDocId);
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
      const unsubscribe = window.xivig.onWorkspaceFilesChanged(() => {
        refreshCurrentFolder();
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
        closeWrapWithAbbreviation();
        chordRef.current = null;
        return;
      }

      // Multi-key chord handling (e.g. Ctrl+K Ctrl+S, Ctrl+K Ctrl+O)
      if (chordRef.current === 'k') {
        if (isCtrlOrMeta && e.key.toLowerCase() === 's') {
          e.preventDefault();
          chordRef.current = null;
          openKeymapModal();
          return;
        } else if (isCtrlOrMeta && e.key.toLowerCase() === 'o') {
          e.preventDefault();
          chordRef.current = null;
          if (window.xivig?.openFolderDialog) {
            const res = await window.xivig.openFolderDialog();
            if (!res.canceled && res.folderPath && res.files) {
              setCurrentFolder(res.folderPath, res.files);
            }
          }
          return;
        }
        chordRef.current = null;
      }

      if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        chordRef.current = 'k';
        if (chordTimeoutRef.current) clearTimeout(chordTimeoutRef.current);
        chordTimeoutRef.current = setTimeout(() => {
          chordRef.current = null;
        }, 1500);
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
        openDocument({
          id: 'settings',
          name: 'Settings',
          content: '',
          language: 'settings',
          path: null,
        });
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
        if (activeDoc.path && window.xivig?.saveFile) {
          const res = await window.xivig.saveFile(activeDoc.path, activeDoc.content);
          if (res.success) {
            markDocumentSaved(activeDoc.id, activeDoc.path);
          }
        } else if (window.xivig?.saveFileDialog) {
          const res = await window.xivig.saveFileDialog(activeDoc.name, activeDoc.content);
          if (!res.canceled && res.filePath) {
            markDocumentSaved(activeDoc.id, res.filePath);
          }
        }
      } else if (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!activeDoc || !window.xivig?.saveFileDialog) return;
        const res = await window.xivig.saveFileDialog(activeDoc.name, activeDoc.content);
        if (!res.canceled && res.filePath) {
          markDocumentSaved(activeDoc.id, res.filePath);
        }
      } else if (isCtrlOrMeta && e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        openWrapWithAbbreviation();
      } else if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeDoc) {
          closeDocument(activeDoc.id);
        }
      } else if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      <Menubar />
      <div style={workbenchStyle}>
        <ActivityBar />
        <Sidebar />

        {/* Editor Area with Split Panes Support */}
        {splitLayout === 'single' ? (
          <main style={editorAreaStyle}>
            <TabBar pane="primary" />
            <LinkedFileBanner />
            <div style={editorSurfaceStyle}>
              <SearchPanel />
              <Editor pane="primary" />
            </div>
          </main>
        ) : splitLayout === 'two-columns' ? (
          <main style={{ ...editorAreaStyle, flexDirection: 'row' }}>
            {/* Primary Column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid var(--xivig-border-subtle)', overflow: 'hidden' }}>
              <TabBar pane="primary" />
              <LinkedFileBanner />
              <div style={editorSurfaceStyle}>
                <SearchPanel />
                <Editor pane="primary" />
              </div>
            </div>
            {/* Secondary Column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <TabBar pane="secondary" />
              <div style={editorSurfaceStyle}>
                <Editor pane="secondary" />
              </div>
            </div>
          </main>
        ) : (
          <main style={{ ...editorAreaStyle, flexDirection: 'column' }}>
            {/* Top Row */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', borderBottom: '1px solid var(--xivig-border-subtle)', overflow: 'hidden' }}>
              <TabBar pane="primary" />
              <LinkedFileBanner />
              <div style={editorSurfaceStyle}>
                <SearchPanel />
                <Editor pane="primary" />
              </div>
            </div>
            {/* Bottom Row */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
              <TabBar pane="secondary" />
              <div style={editorSurfaceStyle}>
                <Editor pane="secondary" />
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Integrated Terminal & Bottom Panel */}
      <BottomPanel />

      <StatusBar />

      {/* Floating Modals */}
      <CommandPalette />
      <QuickOpen />
      <LanguageSelectorModal />
      <KeymapModal />
      <WrapWithAbbreviationModal />
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
