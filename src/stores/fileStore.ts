import { create } from 'zustand';
import { ActiveSidebarView, FileItem } from '../types/editor';
import { RecentItem, GitFileChange } from '../types/electron';

interface FileState {
  currentFolderPath: string | null;
  currentFolderName: string | null;
  fileTree: FileItem[];
  activeSidebarView: ActiveSidebarView;
  isSidebarOpen: boolean;
  recentFiles: RecentItem[];
  recentWorkspaces: RecentItem[];

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
  loadRecentHistory: () => Promise<void>;
  loadGitStatus: () => Promise<void>;
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
  gitBranch: 'main',
  gitChanges: [],
  isGitRepo: false,

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
