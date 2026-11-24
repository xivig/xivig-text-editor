import { create } from 'zustand';
import { ActiveSidebarView, FileItem } from '../types/editor';
import { RecentItem, GitFileChange } from '../types/electron';
import { useEditorStore } from './editorStore';

export interface FileClipboardItem {
  action: 'cut' | 'copy';
  path: string;
  name: string;
  isDirectory?: boolean;
}

interface FileState {
  currentFolderPath: string | null;
  currentFolderName: string | null;
  fileTree: FileItem[];
  activeSidebarView: ActiveSidebarView;
  isSidebarOpen: boolean;
  recentFiles: RecentItem[];
  recentWorkspaces: RecentItem[];
  fileClipboard: FileClipboardItem | null;

  // Git state
  gitBranch: string;
  gitChanges: GitFileChange[];
  isGitRepo: boolean;

  setCurrentFolder: (folderPath: string, items: Array<{ path: string; name: string; isDirectory: boolean }>) => void;
  closeCurrentFolder: () => void;
  refreshCurrentFolder: () => Promise<void>;
  toggleFolderExpanded: (itemPath: string) => void;
  setFolderChildren: (folderPath: string, children: FileItem[]) => void;
  setActiveSidebarView: (view: ActiveSidebarView) => void;
  toggleSidebar: () => void;
  setInitialSession: (folderPath: string | null, isSidebarOpen: boolean, view: ActiveSidebarView) => void;
  setFileClipboard: (item: FileClipboardItem | null) => void;
  pasteFileClipboard: (destinationDir: string) => Promise<{ success: boolean; error?: string }>;
  loadRecentHistory: () => Promise<void>;
  loadGitStatus: () => Promise<void>;
  stageGitFile: (filePath: string) => Promise<void>;
  unstageGitFile: (filePath: string) => Promise<void>;
  stageAllGit: () => Promise<void>;
  unstageAllGit: () => Promise<void>;
  discardGitFile: (filePath: string) => Promise<void>;
  commitGitChanges: (msg: string) => Promise<{ success: boolean; error?: string }>;
}

export const useFileStore = create<FileState>((set, get) => ({
  currentFolderPath: null,
  currentFolderName: null,
  fileTree: [],
  activeSidebarView: 'explorer',
  isSidebarOpen: true,
  recentFiles: [],
  recentWorkspaces: [],
  fileClipboard: null,
  gitBranch: 'main',
  gitChanges: [],
  isGitRepo: false,

  setFileClipboard: (item) => set({ fileClipboard: item }),

  pasteFileClipboard: async (destinationDir: string) => {
    const { fileClipboard, refreshCurrentFolder } = get();
    if (!fileClipboard) return { success: false, error: 'Clipboard is empty' };

    const cleanDest = destinationDir.replace(/[/\\]+$/, '');
    const cleanSource = fileClipboard.path.replace(/[/\\]+$/, '');

    if (cleanDest === cleanSource) {
      return { success: false, error: 'Cannot paste item into itself' };
    }

    let targetPath = `${cleanDest}/${fileClipboard.name}`;

    try {
      if (fileClipboard.action === 'cut') {
        if (!window.xivig?.renameFileOrFolder) {
          return { success: false, error: 'Rename/Move API not available' };
        }
        const res = await window.xivig.renameFileOrFolder(cleanSource, targetPath);
        if (res.success) {
          set({ fileClipboard: null });
          await refreshCurrentFolder();
          return { success: true };
        }
        return res;
      } else {
        if (!window.xivig?.duplicateFile) {
          return { success: false, error: 'Duplicate API not available' };
        }
        if (cleanDest === cleanSource.replace(/[/\\][^/\\]+$/, '')) {
          const parts = fileClipboard.name.split('.');
          if (parts.length > 1 && !fileClipboard.isDirectory) {
            const ext = parts.pop();
            targetPath = `${cleanDest}/${parts.join('.')}-copy.${ext}`;
          } else {
            targetPath = `${cleanDest}/${fileClipboard.name}-copy`;
          }
        }
        const res = await window.xivig.duplicateFile(cleanSource, targetPath);
        if (res.success) {
          await refreshCurrentFolder();
          return { success: true };
        }
        return res;
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to paste file' };
    }
  },

  loadGitStatus: async () => {
    const { currentFolderPath } = get();
    if (!currentFolderPath || !window.xivig?.getGitStatus) return;

    try {
      const res = await window.xivig.getGitStatus(currentFolderPath);
      set({
        isGitRepo: res.isRepo,
        gitBranch: res.branch || 'main',
        gitChanges: res.changes || [],
      });
    } catch {
      set({ isGitRepo: false, gitChanges: [] });
    }
  },

  stageGitFile: async (filePath: string) => {
    const { currentFolderPath, loadGitStatus } = get();
    if (!currentFolderPath || !window.xivig?.stageGitFile) return;
    await window.xivig.stageGitFile(currentFolderPath, filePath);
    await loadGitStatus();
  },

  unstageGitFile: async (filePath: string) => {
    const { currentFolderPath, loadGitStatus } = get();
    if (!currentFolderPath || !window.xivig?.unstageGitFile) return;
    await window.xivig.unstageGitFile(currentFolderPath, filePath);
    await loadGitStatus();
  },

  stageAllGit: async () => {
    const { currentFolderPath, loadGitStatus } = get();
    if (!currentFolderPath || !window.xivig?.stageAllGit) return;
    await window.xivig.stageAllGit(currentFolderPath);
    await loadGitStatus();
  },

  unstageAllGit: async () => {
    const { currentFolderPath, loadGitStatus } = get();
    if (!currentFolderPath || !window.xivig?.unstageAllGit) return;
    await window.xivig.unstageAllGit(currentFolderPath);
    await loadGitStatus();
  },

  discardGitFile: async (filePath: string) => {
    const { currentFolderPath, loadGitStatus, refreshCurrentFolder } = get();
    if (!currentFolderPath || !window.xivig?.discardGitChanges) return;
    await window.xivig.discardGitChanges(currentFolderPath, filePath);
    await loadGitStatus();
    await refreshCurrentFolder();
  },

  commitGitChanges: async (msg: string) => {
    const { currentFolderPath, loadGitStatus, refreshCurrentFolder } = get();
    if (!currentFolderPath || !window.xivig?.commitGit) {
      return { success: false, error: 'No workspace open' };
    }

    const res = await window.xivig.commitGit(currentFolderPath, msg);
    if (res.success) {
      await loadGitStatus();
      await refreshCurrentFolder();
    }
    return res;
  },

  loadRecentHistory: async () => {
    if (window.xivig?.getRecentHistory) {
      const res = await window.xivig.getRecentHistory();
      set({
        recentFiles: res.files || [],
        recentWorkspaces: res.workspaces || [],
      });
    }
  },

  setInitialSession: (folderPath, isSidebarOpen, view) => {
    set({
      currentFolderPath: folderPath,
      currentFolderName: folderPath ? folderPath.split(/[/\\]/).filter(Boolean).pop() || folderPath : null,
      isSidebarOpen,
      activeSidebarView: view,
    });
  },

  closeCurrentFolder: () => {
    set({
      currentFolderPath: null,
      currentFolderName: null,
      fileTree: [],
    });
  },

  refreshCurrentFolder: async () => {
    const { currentFolderPath } = get();
    if (!currentFolderPath || !window.xivig?.readDir) return;

    const res = await window.xivig.readDir(currentFolderPath);
    if (res.success && res.items) {
      const items: FileItem[] = res.items
        .map((item) => ({
          id: item.path,
          name: item.name,
          path: item.path,
          isDirectory: item.isDirectory,
          extension: item.name.includes('.') ? item.name.split('.').pop() : undefined,
          isExpanded: false,
          children: item.isDirectory ? [] : undefined,
        }))
        .sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });

      set({ fileTree: items });
      get().loadGitStatus();
    }
  },

  setCurrentFolder: (folderPath, rawItems) => {
    const folderName = folderPath.split(/[/\\]/).filter(Boolean).pop() || folderPath;
    const items: FileItem[] = rawItems
      .map((item) => ({
        id: item.path,
        name: item.name,
        path: item.path,
        isDirectory: item.isDirectory,
        extension: item.name.includes('.') ? item.name.split('.').pop() : undefined,
        isExpanded: false,
        children: item.isDirectory ? [] : undefined,
      }))
      .sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

    set({
      currentFolderPath: folderPath,
      currentFolderName: folderName,
      fileTree: items,
      activeSidebarView: 'explorer',
      isSidebarOpen: true,
    });

    get().loadRecentHistory();
    get().loadGitStatus();

    // Automatically open primary entrypoint file if no project document is currently open
    try {
      const editorStore = useEditorStore.getState();
      const currentDocs = editorStore.documents;
      const hasProjectDoc = currentDocs.some((d) => d.path && (d.path.startsWith(folderPath) || d.path.includes(folderName)));

      if (!hasProjectDoc) {
        const filesOnly = items.filter((i) => !i.isDirectory);
        if (filesOnly.length > 0) {
          const preferredNames = [
            'index.html',
            'index.htm',
            'index.js',
            'index.ts',
            'main.js',
            'main.ts',
            'app.js',
            'app.ts',
            'main.py',
            'app.py',
            'README.md',
            'readme.md',
            'package.json',
          ];

          let targetFile = filesOnly.find((f) => preferredNames.includes(f.name.toLowerCase()));
          if (!targetFile) {
            targetFile = filesOnly[0];
          }

          if (targetFile && window.xivig?.readFile) {
            window.xivig.readFile(targetFile.path).then((res) => {
              if (res.success && res.content !== undefined) {
                // If only welcome-tab was open, close it
                const docsNow = useEditorStore.getState().documents;
                if (docsNow.length === 1 && docsNow[0].id === 'welcome-tab') {
                  useEditorStore.getState().closeDocument('welcome-tab');
                }
                useEditorStore.getState().openDocument({
                  path: targetFile.path,
                  name: targetFile.name,
                  content: res.content,
                  language: targetFile.name,
                });
              }
            }).catch(() => {});
          }
        }
      }
    } catch {}
  },

  toggleFolderExpanded: (itemPath) => {
    const updateRecursive = (items: FileItem[]): FileItem[] => {
      return items.map((item) => {
        if (item.path === itemPath && item.isDirectory) {
          return { ...item, isExpanded: !item.isExpanded };
        }
        if (item.children) {
          return { ...item, children: updateRecursive(item.children) };
        }
        return item;
      });
    };

    set({ fileTree: updateRecursive(get().fileTree) });
  },

  setFolderChildren: (folderPath, children) => {
    const updateRecursive = (items: FileItem[]): FileItem[] => {
      return items.map((item) => {
        if (item.path === folderPath) {
          return { ...item, children, isExpanded: true };
        }
        if (item.children) {
          return { ...item, children: updateRecursive(item.children) };
        }
        return item;
      });
    };

    set({ fileTree: updateRecursive(get().fileTree) });
  },

  setActiveSidebarView: (view) => {
    const { activeSidebarView, isSidebarOpen } = get();
    if (activeSidebarView === view && isSidebarOpen) {
      set({ isSidebarOpen: false });
    } else {
      set({ activeSidebarView: view, isSidebarOpen: true });
    }
  },

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
