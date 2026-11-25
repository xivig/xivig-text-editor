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
  workspaceFolders: Array<{ path: string; name: string }>;
  trustedWorkspaces: Record<string, boolean>;
  currentWorkspaceFile: string | null;
  isWorkspaceUntitled: boolean;
  fileClipboard: FileClipboardItem | null;
  searchFolderFilter: string | null;
  workspaceSearchQuery: string;
  fileFilterQuery: string;

  // Actions
  openWorkspaceFromFile: (workspacePath: string, rawContent?: string) => Promise<{ success: boolean; error?: string; workspaceName?: string }>;
  addWorkspaceFolder: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
  removeWorkspaceFolder: (folderPath: string) => void;
  saveWorkspaceAs: (savePath: string) => Promise<{ success: boolean; error?: string }>;
  duplicateWorkspace: () => { success: boolean; message: string };
  clearRecentHistory: () => Promise<void>;
  setWorkspaceTrust: (folderPath: string, trusted: boolean) => void;
  isWorkspaceTrusted: (folderPath?: string) => boolean;
  collapseAllFolders: () => void;
  setFileFilterQuery: (query: string) => void;

  // Git state
  gitBranch: string;
  gitChanges: GitFileChange[];
  isGitRepo: boolean;

  setSearchFolderFilter: (folder: string | null) => void;
  setWorkspaceSearchQuery: (query: string) => void;

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
  commitGitChanges: (msg: string, amend?: boolean) => Promise<{ success: boolean; error?: string }>;
}

export const useFileStore = create<FileState>((set, get) => ({
  currentFolderPath: null,
  currentFolderName: null,
  fileTree: [],
  activeSidebarView: 'explorer',
  isSidebarOpen: true,
  recentFiles: [],
  recentWorkspaces: [],
  workspaceFolders: [],
  trustedWorkspaces: {},
  currentWorkspaceFile: null,
  isWorkspaceUntitled: false,
  fileClipboard: null,
  searchFolderFilter: null,
  workspaceSearchQuery: '',
  fileFilterQuery: '',
  gitBranch: 'main',
  gitChanges: [],
  isGitRepo: false,

  openWorkspaceFromFile: async (workspacePath: string, rawContent?: string) => {
    try {
      let content = rawContent;
      if (content === undefined && window.xivig?.readFile) {
        const res = await window.xivig.readFile(workspacePath);
        if (!res.success || res.content === undefined) {
          return { success: false, error: res.error || 'Failed to read workspace file' };
        }
        content = res.content;
      }

      if (!content) {
        return { success: false, error: 'Empty workspace file' };
      }

      const parsed = JSON.parse(content);
      const rawFolders: Array<{ path: string; name?: string }> = Array.isArray(parsed.folders)
        ? parsed.folders
        : Array.isArray(parsed)
          ? parsed
          : [];

      if (rawFolders.length === 0) {
        return { success: false, error: 'No folders found in workspace file' };
      }

      // Compute workspace directory for resolving relative paths
      const workspaceDir = workspacePath.replace(/[/\\][^/\\]+$/, '');
      const resolvedFolders = rawFolders.map((f) => {
        const p = typeof f === 'string' ? f : f.path;
        const isAbsolute = /^[/\\]|^[A-Za-z]:[/\\]/.test(p);
        const resolved = isAbsolute ? p : `${workspaceDir}/${p}`.replace(/\\/g, '/');
        const name = (typeof f === 'object' && f.name) || resolved.split(/[/\\]/).filter(Boolean).pop() || resolved;
        return { path: resolved, name };
      });

      const primaryFolder = resolvedFolders[0];
      const wsFileName = workspacePath.split(/[/\\]/).filter(Boolean).pop() || 'workspace';
      const workspaceName = wsFileName.replace(/\.(code-workspace|xivig-workspace|json)$/i, '');

      // Load primary folder file tree
      if (window.xivig?.readDir) {
        const dirRes = await window.xivig.readDir(primaryFolder.path);
        if (dirRes.success && dirRes.items) {
          get().setCurrentFolder(primaryFolder.path, dirRes.items);
        } else {
          get().setCurrentFolder(primaryFolder.path, []);
        }
      } else {
        get().setCurrentFolder(primaryFolder.path, []);
      }

      set({
        workspaceFolders: resolvedFolders,
        currentWorkspaceFile: workspacePath,
        isWorkspaceUntitled: false,
        recentWorkspaces: [
          {
            id: `ws-${Buffer.from(workspacePath).toString('base64').slice(0, 24)}`,
            name: `${workspaceName} (Workspace)`,
            path: workspacePath,
            lastOpened: new Date().toISOString(),
          },
          ...get().recentWorkspaces.filter((w) => w.path !== workspacePath),
        ].slice(0, 15),
      });

      return { success: true, workspaceName };
    } catch (err: any) {
      return { success: false, error: err.message || 'Malformed workspace JSON' };
    }
  },

  addWorkspaceFolder: async (folderPath: string) => {
    const name = folderPath.split(/[/\\]/).filter(Boolean).pop() || folderPath;
    const { workspaceFolders, currentFolderPath, currentFolderName } = get();

    // If no folder currently open, set as main folder
    if (!currentFolderPath) {
      if (window.xivig?.readDir) {
        const res = await window.xivig.readDir(folderPath);
        if (res.success && res.items) {
          get().setCurrentFolder(folderPath, res.items);
        } else {
          get().setCurrentFolder(folderPath, []);
        }
      } else {
        get().setCurrentFolder(folderPath, []);
      }
      set({ workspaceFolders: [{ path: folderPath, name }] });
      return { success: true };
    }

    // Ensure the current folder is part of workspaceFolders
    const newFolders = [...workspaceFolders];
    if (currentFolderPath && !newFolders.some((f) => f.path === currentFolderPath)) {
      newFolders.unshift({ path: currentFolderPath, name: currentFolderName || 'Root' });
    }

    if (!newFolders.some((f) => f.path === folderPath)) {
      newFolders.push({ path: folderPath, name });
    }

    set({
      workspaceFolders: newFolders,
      isWorkspaceUntitled: get().currentWorkspaceFile === null,
    });

    return { success: true };
  },

  removeWorkspaceFolder: (folderPath: string) => {
    set((state) => ({
      workspaceFolders: state.workspaceFolders.filter((f) => f.path !== folderPath),
    }));
  },

  saveWorkspaceAs: async (savePath: string) => {
    const { workspaceFolders, currentFolderPath, currentFolderName } = get();
    const foldersToSave =
      workspaceFolders.length > 0
        ? workspaceFolders
        : currentFolderPath
          ? [{ path: currentFolderPath, name: currentFolderName || 'Root' }]
          : [];

    if (foldersToSave.length === 0) {
      return { success: false, error: 'No folders to save in workspace' };
    }

    const wsContent = JSON.stringify(
      {
        folders: foldersToSave.map((f) => ({ path: f.path, name: f.name })),
        settings: {},
      },
      null,
      2
    );

    if (window.xivig?.saveFile) {
      const res = await window.xivig.saveFile(savePath, wsContent);
      if (!res.success) {
        return { success: false, error: res.error || 'Failed to write workspace file' };
      }
    }

    const wsName = savePath.split(/[/\\]/).filter(Boolean).pop() || 'workspace';
    const workspaceName = wsName.replace(/\.(code-workspace|xivig-workspace|json)$/i, '');

    set({
      currentWorkspaceFile: savePath,
      isWorkspaceUntitled: false,
      recentWorkspaces: [
        {
          id: `ws-${Buffer.from(savePath).toString('base64').slice(0, 24)}`,
          name: `${workspaceName} (Workspace)`,
          path: savePath,
          lastOpened: new Date().toISOString(),
        },
        ...get().recentWorkspaces.filter((w) => w.path !== savePath),
      ].slice(0, 15),
    });

    return { success: true };
  },

  duplicateWorkspace: () => {
    const { workspaceFolders, currentFolderPath, currentFolderName } = get();
    const duplicatedFolders =
      workspaceFolders.length > 0
        ? [...workspaceFolders]
        : currentFolderPath
          ? [{ path: currentFolderPath, name: currentFolderName || 'Root' }]
          : [];

    set({
      workspaceFolders: duplicatedFolders,
      currentWorkspaceFile: null,
      isWorkspaceUntitled: true,
    });

    return { success: true, message: 'Duplicated workspace (Untitled Workspace)' };
  },

  clearRecentHistory: async () => {
    set({ recentFiles: [], recentWorkspaces: [] });
    if (window.xivig?.clearRecentHistory) {
      await window.xivig.clearRecentHistory();
    }
  },

  setWorkspaceTrust: (folderPath: string, trusted: boolean) => {
    set((state) => ({
      trustedWorkspaces: { ...state.trustedWorkspaces, [folderPath]: trusted },
    }));
  },

  isWorkspaceTrusted: (folderPath?: string) => {
    const target = folderPath || get().currentFolderPath;
    if (!target) return true;
    return get().trustedWorkspaces[target] ?? true;
  },

  collapseAllFolders: () => {
    const collapseRec = (items: FileItem[]): FileItem[] =>
      items.map((item) => ({
        ...item,
        isExpanded: false,
        children: item.children ? collapseRec(item.children) : undefined,
      }));
    set((state) => ({ fileTree: collapseRec(state.fileTree) }));
  },

  setFileFilterQuery: (query: string) => set({ fileFilterQuery: query }),

  setSearchFolderFilter: (folder) => set({ searchFolderFilter: folder }),
  setWorkspaceSearchQuery: (query) => set({ workspaceSearchQuery: query, activeSidebarView: 'search', isSidebarOpen: true }),

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

  commitGitChanges: async (msg: string, amend?: boolean) => {
    const { currentFolderPath, loadGitStatus, refreshCurrentFolder } = get();
    if (!currentFolderPath || !window.xivig?.commitGit) {
      return { success: false, error: 'No workspace open' };
    }

    const res = await window.xivig.commitGit(currentFolderPath, msg, amend);
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
