import { create } from 'zustand';
import { ActiveSidebarView, FileItem } from '../types/editor';

interface FileState {
  currentFolderPath: string | null;
  currentFolderName: string | null;
  fileTree: FileItem[];
  activeSidebarView: ActiveSidebarView;
  isSidebarOpen: boolean;

  setCurrentFolder: (folderPath: string, items: Array<{ path: string; name: string; isDirectory: boolean }>) => void;
  toggleFolderExpanded: (itemPath: string) => void;
  setFolderChildren: (folderPath: string, children: FileItem[]) => void;
  setActiveSidebarView: (view: ActiveSidebarView) => void;
  toggleSidebar: () => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  currentFolderPath: null,
  currentFolderName: null,
  fileTree: [],
  activeSidebarView: 'explorer',
  isSidebarOpen: true,

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
        // Directories first, then alphabetical
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
