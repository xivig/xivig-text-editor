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
  closeDocument: (id?: string) => void;
  closeOtherTabs: (id?: string) => void;
  closeTabsToTheRight: (id?: string) => void;
  closeSavedTabs: () => void;
  closeAllTabs: () => void;
  reopenClosedTab: () => void;
  reorderTabs: (sourceId: string, targetId: string) => void;
  togglePinTab: (id?: string) => void;
  toggleReadOnly: (id?: string) => void;
  setReadOnly: (id: string, isReadOnly: boolean) => void;
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
  scratchCount: number;
  createScratchDocument: (language?: string, extension?: string) => void;
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
  openSettings: () => void;
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

  saveDebounceTimer = setTimeout(async () => {
    let settings: any = null;
    try {
      const settingsMod = await import('./settingsStore');
      settings = settingsMod.useSettingsStore.getState().settings;
    } catch {}

    const editorState = useEditorStore.getState();
    const fileState = useFileStore.getState();

    // Auto-save dirty files to disk if autoSave is enabled
    const api = typeof window !== 'undefined' ? window.xivig : undefined;
    if (settings?.autoSave && api?.saveFile) {
      editorState.documents.forEach(async (doc) => {
        if (doc.isDirty && doc.path && !doc.isReadOnly) {
          try {
            const res = await api.saveFile(doc.path, doc.content);
            if (res?.success) {
              useEditorStore.getState().markDocumentSaved(doc.id, doc.path);
            }
          } catch (e) {}
        }
      });
    }

    if (!api?.saveSession) return;

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
        isPinned: doc.isPinned,
        isReadOnly: doc.isReadOnly,
        cursorLine: doc.cursor.line,
        cursorCol: doc.cursor.col,
        orderIndex: idx,
      })),
    };

    api.saveSession(sessionPayload);
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
  scratchCount: 1,
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

  openSettings: () => {
    const { documents } = get();
    const existing = documents.find(
      (d) => d.id === 'settings' || d.name?.toLowerCase() === 'settings' || d.language === 'settings'
    );
    if (existing) {
      // Clean up any extraneous duplicate settings tabs if they somehow exist
      const cleaned = documents.filter((d) => d === existing || (d.id !== 'settings' && d.language !== 'settings'));
      if (get().activePane === 'secondary') {
        set({ documents: cleaned, secondaryDocumentId: existing.id });
      } else {
        set({ documents: cleaned, activeDocumentId: existing.id });
      }
      triggerAutoSave();
      return;
    }

    const settingsDoc: EditorDocument = {
      id: 'settings',
      path: null,
      name: 'Settings',
      content: '',
      language: 'settings',
      isDirty: false,
      cursor: { line: 1, col: 1 },
    };

    set({
      documents: [...documents, settingsDoc],
      ...(get().activePane === 'secondary'
        ? { secondaryDocumentId: 'settings' }
        : { activeDocumentId: 'settings' }),
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
    // Deduplicate documents by ID and path
    const seenIds = new Set<string>();
    const seenPaths = new Set<string>();
    const uniqueDocs = docs.filter((d) => {
      if (d.id) {
        if (seenIds.has(d.id)) return false;
        seenIds.add(d.id);
      }
      if (d.path) {
        if (seenPaths.has(d.path)) return false;
        seenPaths.add(d.path);
      }
      return true;
    });

    const validActiveId = uniqueDocs.some((d) => d.id === activeId)
      ? activeId
      : uniqueDocs[0]?.id || null;

    set({
      documents: uniqueDocs,
      activeDocumentId: validActiveId,
    });
  },

  openDocument: (doc) => {
    const { documents } = get();

    // 1. If document matches an existing tab by unique ID (e.g. 'settings' or 'welcome-tab')
    if (doc.id) {
      const existing = documents.find((d) => d.id === doc.id);
      if (existing) {
        // Clean up any extra duplicates with this same ID if they somehow exist
        const cleaned = documents.filter((d) => d === existing || d.id !== doc.id);
        if (get().activePane === 'secondary') {
          set({ documents: cleaned, secondaryDocumentId: existing.id });
        } else {
          set({ documents: cleaned, activeDocumentId: existing.id });
        }
        triggerAutoSave();
        return;
      }
    }

    // 2. If it's settings (by id, name, or language)
    if (doc.id === 'settings' || doc.name?.toLowerCase() === 'settings' || doc.language === 'settings') {
      const existing = documents.find(
        (d) => d.id === 'settings' || d.name?.toLowerCase() === 'settings' || d.language === 'settings'
      );
      if (existing) {
        const cleaned = documents.filter((d) => d === existing || (d.id !== 'settings' && d.language !== 'settings'));
        if (get().activePane === 'secondary') {
          set({ documents: cleaned, secondaryDocumentId: existing.id });
        } else {
          set({ documents: cleaned, activeDocumentId: existing.id });
        }
        triggerAutoSave();
        return;
      }
    }

    // 3. If document has a file path, check if already open by path
    if (doc.path) {
      const existingIndex = documents.findIndex((d) => d.path === doc.path);
      if (existingIndex !== -1) {
        const existing = documents[existingIndex];
        const updatedDocs = [...documents];
        // If new content is supplied and differs (e.g. fresh binary image dataUrl or reloaded content), update tab content
        if (doc.content && (!existing.content || (!existing.isDirty && existing.content !== doc.content))) {
          updatedDocs[existingIndex] = {
            ...existing,
            content: doc.content,
            name: doc.name || existing.name,
            language: doc.language || existing.language,
          };
        }
        if (get().activePane === 'secondary') {
          set({ documents: updatedDocs, secondaryDocumentId: existing.id });
        } else {
          set({ documents: updatedDocs, activeDocumentId: existing.id });
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

  closeDocument: (id?: string) => {
    const { documents, activeDocumentId, secondaryDocumentId, closedDocumentsHistory } = get();
    const targetId = id || activeDocumentId;
    if (!targetId) return;
    const index = documents.findIndex((d) => d.id === targetId);
    if (index === -1) return;

    const closedDoc = documents[index];
    const newDocs = documents.filter((d) => d.id !== targetId);
    let nextActiveId = activeDocumentId;

    if (activeDocumentId === targetId) {
      if (newDocs.length === 0) {
        nextActiveId = null;
      } else {
        const nextIndex = Math.min(index, newDocs.length - 1);
        nextActiveId = newDocs[nextIndex].id;
      }
    }

    let nextSecondaryId = secondaryDocumentId;
    if (secondaryDocumentId === targetId) {
      nextSecondaryId = newDocs.length > 0 ? newDocs[Math.min(index, newDocs.length - 1)].id : null;
    }

    set({
      documents: newDocs,
      activeDocumentId: nextActiveId,
      secondaryDocumentId: nextSecondaryId,
      closedDocumentsHistory: [...closedDocumentsHistory.slice(-20), closedDoc],
    });
    triggerAutoSave();
  },

  closeOtherTabs: (id?: string) => {
    const { documents, activeDocumentId, closedDocumentsHistory } = get();
    const targetId = id || activeDocumentId;
    if (!targetId) return;
    const kept = documents.filter((d) => d.id === targetId || d.isPinned);
    const closed = documents.filter((d) => d.id !== targetId && !d.isPinned);
    set({
      documents: kept,
      activeDocumentId: targetId,
      secondaryDocumentId: targetId,
      closedDocumentsHistory: [...closedDocumentsHistory.slice(-20), ...closed],
    });
    triggerAutoSave();
  },

  closeTabsToTheRight: (id?: string) => {
    const { documents, activeDocumentId, secondaryDocumentId, closedDocumentsHistory } = get();
    const targetId = id || activeDocumentId;
    if (!targetId) return;
    const index = documents.findIndex((d) => d.id === targetId);
    if (index === -1) return;
    const kept = documents.slice(0, index + 1).concat(documents.slice(index + 1).filter((d) => d.isPinned));
    const closed = documents.slice(index + 1).filter((d) => !d.isPinned);
    let nextActiveId = activeDocumentId;
    if (!kept.some((d) => d.id === activeDocumentId)) {
      nextActiveId = targetId;
    }
    let nextSecondaryId = secondaryDocumentId;
    if (!kept.some((d) => d.id === secondaryDocumentId)) {
      nextSecondaryId = kept.length > 0 ? kept[kept.length - 1].id : null;
    }
    set({
      documents: kept,
      activeDocumentId: nextActiveId,
      secondaryDocumentId: nextSecondaryId,
      closedDocumentsHistory: [...closedDocumentsHistory.slice(-20), ...closed],
    });
    triggerAutoSave();
  },

  reorderTabs: (sourceId: string, targetId: string) => {
    const { documents } = get();
    if (sourceId === targetId) return;
    const sourceIndex = documents.findIndex((d) => d.id === sourceId);
    const targetIndex = documents.findIndex((d) => d.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const newDocs = [...documents];
    const [dragged] = newDocs.splice(sourceIndex, 1);
    newDocs.splice(targetIndex, 0, dragged);

    set({ documents: newDocs });
    triggerAutoSave();
  },

  toggleReadOnly: (id?: string) => {
    const { documents, activeDocumentId } = get();
    const targetId = id || activeDocumentId;
    if (!targetId) return;

    const newDocs = documents.map((d) => {
      if (d.id === targetId) {
        return { ...d, isReadOnly: !d.isReadOnly };
      }
      return d;
    });

    set({ documents: newDocs });
    triggerAutoSave();
  },

  setReadOnly: (id: string, isReadOnly: boolean) => {
    const { documents } = get();
    const newDocs = documents.map((d) => {
      if (d.id === id) {
        return { ...d, isReadOnly };
      }
      return d;
    });

    set({ documents: newDocs });
    triggerAutoSave();
  },

  togglePinTab: (id?: string) => {
    const { documents, activeDocumentId } = get();
    const targetId = id || activeDocumentId;
    if (!targetId) return;

    const newDocs = documents.map((d) => {
      if (d.id === targetId) {
        return { ...d, isPinned: !d.isPinned };
      }
      return d;
    });

    set({ documents: newDocs });
    triggerAutoSave();
  },

  closeSavedTabs: () => {
    const { documents, activeDocumentId, secondaryDocumentId, closedDocumentsHistory } = get();
    const kept = documents.filter((d) => d.isDirty);
    const closed = documents.filter((d) => !d.isDirty);
    let nextActiveId = activeDocumentId;
    if (kept.length === 0) {
      nextActiveId = null;
    } else if (!kept.some((d) => d.id === activeDocumentId)) {
      nextActiveId = kept[0].id;
    }
    let nextSecondaryId = secondaryDocumentId;
    if (!kept.some((d) => d.id === secondaryDocumentId)) {
      nextSecondaryId = kept.length > 0 ? kept[0].id : null;
    }
    set({
      documents: kept,
      activeDocumentId: nextActiveId,
      secondaryDocumentId: nextSecondaryId,
      closedDocumentsHistory: [...closedDocumentsHistory.slice(-20), ...closed],
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

  createScratchDocument: (language = 'javascript', extension?: string) => {
    const { documents, scratchCount } = get();
    const ext = extension
      ? extension.replace(/^\./, '')
      : language === 'javascript' ? 'js'
      : language === 'typescript' ? 'ts'
      : language === 'json' ? 'json'
      : language === 'markdown' ? 'md'
      : language === 'html' ? 'html'
      : language === 'css' ? 'css'
      : language === 'python' ? 'py'
      : language === 'sql' ? 'sql'
      : language === 'xml' ? 'xml'
      : language === 'yaml' ? 'yaml'
      : language === 'rust' ? 'rs'
      : language === 'cpp' ? 'cpp'
      : 'txt';

    const id = `scratch-${scratchCount}`;
    const name = `scratch-${scratchCount}.${ext}`;
    const newDoc: EditorDocument = {
      id,
      path: null,
      name,
      content: '',
      language,
      isDirty: false,
      cursor: { line: 1, col: 1 },
    };

    set({
      documents: [...documents, newDoc],
      activeDocumentId: id,
      scratchCount: scratchCount + 1,
    });
    triggerAutoSave();
  },

  togglePreview: (mode) => {
    const { isPreviewOpen, previewMode, getActiveDocument } = get();
    const doc = getActiveDocument();
    const isDocMarkdown =
      doc?.name?.toLowerCase().endsWith('.md') ||
      doc?.name?.toLowerCase().endsWith('.markdown') ||
      doc?.language === 'markdown';
    const defaultMode: PreviewMode = isDocMarkdown ? 'markdown' : 'live-web';
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
    const isDocMarkdown =
      doc?.name?.toLowerCase().endsWith('.md') ||
      doc?.name?.toLowerCase().endsWith('.markdown') ||
      doc?.language === 'markdown';
    const defaultMode: PreviewMode = isDocMarkdown ? 'markdown' : 'live-web';
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
