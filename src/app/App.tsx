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

export const App: React.FC = () => {
  const createNewDocument = useEditorStore((state) => state.createNewDocument);
  const openDocument = useEditorStore((state) => state.openDocument);
  const activeDoc = useEditorStore((state) => state.getActiveDocument());
  const closeDocument = useEditorStore((state) => state.closeDocument);
  const markDocumentSaved = useEditorStore((state) => state.markDocumentSaved);
  const toggleSidebar = useFileStore((state) => state.toggleSidebar);

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
      {/* Window Titlebar */}
      <Titlebar />

      {/* Menubar */}
      <Menubar />

      {/* Main Workbench Layout */}
      <div style={workbenchStyle}>
        <ActivityBar />
        <Sidebar />

        {/* Editor Area */}
        <main style={editorAreaStyle}>
          <TabBar />
          <div style={editorSurfaceStyle}>
            <Editor />
          </div>
        </main>
      </div>

      {/* Bottom Status Bar */}
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
