import { create } from 'zustand';
import { EditorDocument } from '../types/editor';
import { useFileStore } from './fileStore';
import { useLiveServerStore } from './liveServerStore';

export type SplitLayout = 'single' | 'two-columns' | 'two-rows';
export type PreviewMode = 'live-web' | 'markdown';

interface EditorState {
  documents: EditorDocument[];
  activeDocumentId: string | null;
  secondaryDocumentId: string | null;
  splitLayout: SplitLayout;
  activePane: 'primary' | 'secondary';
  untitledCount: number;
  closedDocumentsHistory: EditorDocument[];
  isPreviewOpen: boolean;
  previewMode: PreviewMode;
  externalConflictDocId: string | null;

  openDocument: (doc: Omit<EditorDocument, 'id' | 'isDirty' | 'cursor'> & { id?: string }) => void;
  closeDocument: (id: string) => void;
  closeAllTabs: () => void;
  reopenClosedTab: () => void;
  nextTab: () => void;
  previousTab: () => void;
  switchToTab: (index: number) => void;
  setActiveDocument: (id: string) => void;
  setSecondaryDocument: (id: string | null) => void;
  setSplitLayout: (layout: SplitLayout) => void;
  setActivePane: (pane: 'primary' | 'secondary') => void;
  updateDocumentContent: (id: string, content: string) => void;
  markDocumentSaved: (id: string, newPath?: string) => void;
  updateCursor: (id: string, line: number, col: number) => void;
  createNewDocument: (language?: string) => void;
  getActiveDocument: () => EditorDocument | undefined;
  getSecondaryDocument: () => EditorDocument | undefined;
  setRestoredSession: (docs: EditorDocument[], activeId: string | null) => void;
  persistSessionDebounced: () => void;
  togglePreview: (mode?: PreviewMode) => void;
  openPreview: (mode?: PreviewMode) => void;
  closePreview: () => void;
  handleExternalFileChange: (filePath: string) => Promise<void>;
  reloadDocumentFromDisk: (docId: string) => Promise<void>;
  dismissConflict: (docId: string) => void;
  openWelcomeDocument: () => void;
}

export const WELCOME_MARKDOWN_CONTENT = `# Xivig Editor

A modern, lightweight, high-performance desktop code editor inspired by Sublime Text.

### 🚀 Keyboard Shortcuts
* **Ctrl + Shift + P**: Command Palette
* **Ctrl + P**: Quick Open File
* **Ctrl + F**: Find / Search
* **Ctrl + H**: Replace
* **Ctrl + N**: New File
* **Ctrl + O**: Open File
* **Ctrl + S**: Save File
* **Ctrl + Shift + S**: Save As
* **Ctrl + W**: Close Tab
* **Ctrl + B**: Toggle Sidebar
* **Ctrl + \`**: Toggle Terminal
* **Ctrl + Shift + B**: Select Build Target

### 🛠️ Architecture:
* **Electron 45** + **Node.js**
* **SQLite & Session Persistence**
* **React 18** + **TypeScript**
* **CodeMirror 6** (Multi-cursor, syntax highlighting & transactions)
* **Vite** (Ultra-fast HMR)
* **Zustand** (UI & Document State)
* **Seamless In-Place Auto-Updater**

*Start editing or open a folder to explore your project!*`;

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
      name: 'Welcome',
      content: WELCOME_MARKDOWN_CONTENT,
      language: 'markdown',
      isDirty: false,
      cursor: { line: 1, col: 1 },
    },
  ],
  activeDocumentId: 'welcome-tab',
  secondaryDocumentId: null,
  splitLayout: 'single',
  activePane: 'primary',
  untitledCount: 1,
  closedDocumentsHistory: [],
  isPreviewOpen: false,
  previewMode: 'live-web',
  externalConflictDocId: null,

  openWelcomeDocument: () => {
    const { documents } = get();
    const existing = documents.find((d) => d.id === 'welcome-tab');
    if (existing) {
      set({ activeDocumentId: 'welcome-tab' });
      return;
    }
    const welcomeDoc: EditorDocument = {
      id: 'welcome-tab',
      path: null,
      name: 'Welcome',
      content: WELCOME_MARKDOWN_CONTENT,
      language: 'markdown',
      isDirty: false,
      cursor: { line: 1, col: 1 },
    };
    set({
      documents: [welcomeDoc, ...documents],
      activeDocumentId: 'welcome-tab',
    });
    triggerAutoSave();
  },

  persistSessionDebounced: triggerAutoSave,

  getActiveDocument: () => {
    const { documents, activeDocumentId } = get();
    return documents.find((doc) => doc.id === activeDocumentId);
  },

  getSecondaryDocument: () => {
    const { documents, secondaryDocumentId, activeDocumentId } = get();
    if (secondaryDocumentId) {
      return documents.find((doc) => doc.id === secondaryDocumentId);
    }
    // Fallback: pick another document or active
    return documents.find((doc) => doc.id !== activeDocumentId) || documents.find((doc) => doc.id === activeDocumentId);
  },

  setSplitLayout: (layout) => {
    const { documents, activeDocumentId, secondaryDocumentId } = get();
    let nextSecondary = secondaryDocumentId;
    if (layout !== 'single' && !nextSecondary) {
      // Automatically choose another tab for second pane if available
      const other = documents.find((d) => d.id !== activeDocumentId);
      nextSecondary = other ? other.id : activeDocumentId;
    }
    set({ splitLayout: layout, secondaryDocumentId: nextSecondary });
    triggerAutoSave();
  },

  setActivePane: (pane) => set({ activePane: pane }),
  setSecondaryDocument: (id) => {
    set({ secondaryDocumentId: id });
    triggerAutoSave();
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
        if (get().activePane === 'secondary') {
          set({ secondaryDocumentId: existing.id });
        } else {
          set({ activeDocumentId: existing.id });
        }
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
      ...(get().activePane === 'secondary'
        ? { secondaryDocumentId: id }
        : { activeDocumentId: id }),
    });
    triggerAutoSave();
  },

  closeDocument: (id) => {
    const { documents, activeDocumentId, closedDocumentsHistory } = get();
    const index = documents.findIndex((d) => d.id === id);
    if (index === -1) return;

    const closedDoc = documents[index];
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
      closedDocumentsHistory: [...closedDocumentsHistory.slice(-20), closedDoc],
    });
    triggerAutoSave();
  },

  closeAllTabs: () => {
    const { documents, closedDocumentsHistory } = get();
    set({
      documents: [],
      activeDocumentId: null,
      secondaryDocumentId: null,
      closedDocumentsHistory: [...closedDocumentsHistory.slice(-20), ...documents],
    });
    triggerAutoSave();
  },

  reopenClosedTab: () => {
    const { closedDocumentsHistory } = get();
    if (closedDocumentsHistory.length === 0) return;
    const last = closedDocumentsHistory[closedDocumentsHistory.length - 1];
    set({
      closedDocumentsHistory: closedDocumentsHistory.slice(0, -1),
    });
    get().openDocument({
      id: last.id,
      path: last.path,
      name: last.name,
      content: last.content,
      language: last.language,
    });
  },

  nextTab: () => {
    const { documents, activeDocumentId } = get();
    if (documents.length <= 1) return;
    const idx = documents.findIndex((d) => d.id === activeDocumentId);
    const nextIdx = (idx + 1) % documents.length;
    set({ activeDocumentId: documents[nextIdx].id });
  },

  previousTab: () => {
    const { documents, activeDocumentId } = get();
    if (documents.length <= 1) return;
    const idx = documents.findIndex((d) => d.id === activeDocumentId);
    const prevIdx = (idx - 1 + documents.length) % documents.length;
    set({ activeDocumentId: documents[prevIdx].id });
  },

  switchToTab: (index: number) => {
    const { documents } = get();
    if (index >= 0 && index < documents.length) {
      set({ activeDocumentId: documents[index].id });
    }
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
    try {
      useLiveServerStore.getState().notifyReload();
    } catch {}
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

  togglePreview: (mode) => {
    const { isPreviewOpen, previewMode, getActiveDocument } = get();
    const doc = getActiveDocument();
    const defaultMode: PreviewMode = doc?.language === 'markdown' ? 'markdown' : 'live-web';
    const targetMode = mode || defaultMode;

    if (isPreviewOpen && (!mode || previewMode === mode)) {
      set({ isPreviewOpen: false });
    } else {
      set({ isPreviewOpen: true, previewMode: targetMode });
    }
  },

  openPreview: (mode) => {
    const { getActiveDocument } = get();
    const doc = getActiveDocument();
    const defaultMode: PreviewMode = doc?.language === 'markdown' ? 'markdown' : 'live-web';
    set({ isPreviewOpen: true, previewMode: mode || defaultMode });
  },

  closePreview: () => {
    set({ isPreviewOpen: false });
  },

  handleExternalFileChange: async (filePath) => {
    const normTarget = filePath.replace(/\\/g, '/').toLowerCase();
    const doc = get().documents.find(
      (d) => d.path && d.path.replace(/\\/g, '/').toLowerCase() === normTarget
    );
    if (!doc) return;

    if (!doc.isDirty) {
      // Clean buffer: silently sync with latest disk changes
      if (window.xivig?.readFile && doc.path) {
        const res = await window.xivig.readFile(doc.path);
        if (res.success && res.content !== undefined && res.content !== doc.content) {
          set((state) => ({
            documents: state.documents.map((d) =>
              d.id === doc.id ? { ...d, content: res.content! } : d
            ),
          }));
        }
      }
    } else {
      // Dirty buffer: record conflict to warn user and prevent accidental overwrite
      set({ externalConflictDocId: doc.id });
    }
  },

  reloadDocumentFromDisk: async (docId) => {
    const doc = get().documents.find((d) => d.id === docId);
    if (!doc || !doc.path || !window.xivig?.readFile) return;

    const res = await window.xivig.readFile(doc.path);
    if (res.success && res.content !== undefined) {
      set((state) => ({
        externalConflictDocId: state.externalConflictDocId === docId ? null : state.externalConflictDocId,
        documents: state.documents.map((d) =>
          d.id === docId ? { ...d, content: res.content!, isDirty: false } : d
        ),
      }));
    }
  },

  dismissConflict: (docId) => {
    set((state) => ({
      externalConflictDocId: state.externalConflictDocId === docId ? null : state.externalConflictDocId,
    }));
  },
}));
