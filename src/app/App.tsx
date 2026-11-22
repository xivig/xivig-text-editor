import React, { useEffect } from 'react';
import { Titlebar } from '../components/titlebar/Titlebar';
import { Menubar } from '../components/menubar/Menubar';
import { ActivityBar } from '../components/activitybar/ActivityBar';
import { Sidebar } from '../components/sidebar/Sidebar';
import { TabBar } from '../components/tabs/TabBar';
import { Editor } from '../components/editor/Editor';
import { StatusBar } from '../components/statusbar/StatusBar';
import { useEditorStore } from '../stores/editorStore';
import { useFileStore } from '../stores/fileStore';
import { EditorDocument } from '../types/editor';

export const App: React.FC = () => {
  const createNewDocument = useEditorStore((state) => state.createNewDocument);
  const openDocument = useEditorStore((state) => state.openDocument);
  const activeDoc = useEditorStore((state) => state.getActiveDocument());
  const closeDocument = useEditorStore((state) => state.closeDocument);
  const markDocumentSaved = useEditorStore((state) => state.markDocumentSaved);
  const setRestoredSession = useEditorStore((state) => state.setRestoredSession);

  const toggleSidebar = useFileStore((state) => state.toggleSidebar);
  const setInitialSession = useFileStore((state) => state.setInitialSession);
  const refreshCurrentFolder = useFileStore((state) => state.refreshCurrentFolder);
  const loadRecentHistory = useFileStore((state) => state.loadRecentHistory);
  const setCurrentFolder = useFileStore((state) => state.setCurrentFolder);

  // Restore Session on Mount
  useEffect(() => {
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

      if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'n') {
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
      } else if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeDoc) {
          closeDocument(activeDoc.id);
        }
      } else if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDoc, createNewDocument, openDocument, closeDocument, markDocumentSaved, toggleSidebar]);

  return (
    <div style={appContainerStyle}>
      <Titlebar />
      <Menubar />
      <div style={workbenchStyle}>
        <ActivityBar />
        <Sidebar />
        <main style={editorAreaStyle}>
          <TabBar />
          <div style={editorSurfaceStyle}>
            <Editor />
          </div>
        </main>
      </div>
      <StatusBar />
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
