import { create } from 'zustand';
import { EditorDocument } from '../types/editor';
import { useFileStore } from './fileStore';

interface EditorState {
  documents: EditorDocument[];
  activeDocumentId: string | null;
  untitledCount: number;

  openDocument: (doc: Omit<EditorDocument, 'id' | 'isDirty' | 'cursor'> & { id?: string }) => void;
  closeDocument: (id: string) => void;
  setActiveDocument: (id: string) => void;
  updateDocumentContent: (id: string, content: string) => void;
  markDocumentSaved: (id: string, newPath?: string) => void;
  updateCursor: (id: string, line: number, col: number) => void;
  createNewDocument: (language?: string) => void;
  getActiveDocument: () => EditorDocument | undefined;
  setRestoredSession: (docs: EditorDocument[], activeId: string | null) => void;
  persistSessionDebounced: () => void;
}

let saveDebounceTimer: NodeJS.Timeout | null = null;

function triggerAutoSave() {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    if (!window.xivig?.saveSession) return;

    const editorState = useEditorStore.getState();
    const fileState = useFileStore.getState();

    const sessionPayload = {
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
    };

    window.xivig.saveSession(sessionPayload);
  }, 1000);
}

export const useEditorStore = create<EditorState>((set, get) => ({
  documents: [
    {
      id: 'welcome-tab',
      path: null,
      name: 'Welcome.md',
      content: `# Xivig Editor ⚡\n\nA modern, lightweight, high-performance desktop code editor inspired by Sublime Text.\n\n### 🚀 Quick Start Shortcuts\n* **Ctrl + N**: New File\n* **Ctrl + O**: Open File\n* **Ctrl + S**: Save File\n* **Ctrl + Shift + S**: Save As\n* **Ctrl + W**: Close Tab\n\n### 🛠️ Built with:\n* **Electron 34** + **Node.js**\n* **SQLite** (Session persistence & workspace metadata)\n* **React 18** + **TypeScript**\n* **CodeMirror 6** (Modern transaction-based editor core)\n* **Vite** (Instant hot module reload)\n* **Zustand** (Predictable reactive state)\n\n*Start typing or open a folder to explore your project!*`,
      language: 'markdown',
      isDirty: false,
      cursor: { line: 1, col: 1 },
    },
  ],
  activeDocumentId: 'welcome-tab',
  untitledCount: 1,

  persistSessionDebounced: triggerAutoSave,

  getActiveDocument: () => {
    const { documents, activeDocumentId } = get();
    return documents.find((doc) => doc.id === activeDocumentId);
  },

  setRestoredSession: (docs, activeId) => {
    set({
      documents: docs,
      activeDocumentId: activeId,
    });
  },

  openDocument: (doc) => {
    const { documents } = get();
    if (doc.path) {
      const existing = documents.find((d) => d.path === doc.path);
      if (existing) {
        set({ activeDocumentId: existing.id });
        triggerAutoSave();
        return;
      }
    }

    const id = doc.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDoc: EditorDocument = {
      id,
      path: doc.path,
      name: doc.name,
      content: doc.content,
      language: doc.language || 'text',
      isDirty: false,
      cursor: { line: 1, col: 1 },
    };

    set({
      documents: [...documents, newDoc],
      activeDocumentId: id,
    });
    triggerAutoSave();
  },

  closeDocument: (id) => {
    const { documents, activeDocumentId } = get();
    const index = documents.findIndex((d) => d.id === id);
    if (index === -1) return;

    const newDocs = documents.filter((d) => d.id !== id);
    let nextActiveId = activeDocumentId;

    if (activeDocumentId === id) {
      if (newDocs.length === 0) {
        nextActiveId = null;
      } else {
        const nextIndex = Math.min(index, newDocs.length - 1);
        nextActiveId = newDocs[nextIndex].id;
      }
    }

    set({
      documents: newDocs,
      activeDocumentId: nextActiveId,
    });
    triggerAutoSave();
  },

  setActiveDocument: (id) => {
    set({ activeDocumentId: id });
    triggerAutoSave();
  },

  updateDocumentContent: (id, content) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, content, isDirty: true } : d
      ),
    }));
    triggerAutoSave();
  },

  markDocumentSaved: (id, newPath) => {
    set((state) => ({
      documents: state.documents.map((d) => {
        if (d.id !== id) return d;
        const updatedName = newPath ? newPath.split(/[/\\]/).pop() || d.name : d.name;
        return {
          ...d,
          path: newPath || d.path,
          name: updatedName,
          isDirty: false,
        };
      }),
    }));
    triggerAutoSave();
  },

  updateCursor: (id, line, col) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, cursor: { line, col } } : d
      ),
    }));
  },

  createNewDocument: (language = 'text') => {
    const { documents, untitledCount } = get();
    const id = `untitled-${untitledCount}`;
    const newDoc: EditorDocument = {
      id,
      path: null,
      name: `Untitled-${untitledCount}.${language === 'markdown' ? 'md' : language === 'javascript' ? 'js' : 'txt'}`,
      content: '',
      language,
      isDirty: false,
      cursor: { line: 1, col: 1 },
    };

    set({
      documents: [...documents, newDoc],
      activeDocumentId: id,
      untitledCount: untitledCount + 1,
    });
    triggerAutoSave();
  },
}));
