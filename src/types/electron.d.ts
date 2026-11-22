export interface RecentItem {
  id: string;
  path: string;
  name: string;
  lastOpened: string;
}

export interface SavedDocumentState {
  id: string;
  path: string | null;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  cursorLine: number;
  cursorCol: number;
  orderIndex: number;
}

export interface SavedSession {
  activeDocId: string | null;
  activeFolder: string | null;
  isSidebarOpen: boolean;
  activeSidebarView: string;
  documents: SavedDocumentState[];
}

export interface XivigAPI {
  // File operations
  openFileDialog: () => Promise<{ canceled: boolean; filePath?: string; content?: string; name?: string }>;
  openFolderDialog: () => Promise<{ canceled: boolean; folderPath?: string; files?: Array<{ path: string; name: string; isDirectory: boolean }> }>;
  saveFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  saveFileDialog: (defaultName?: string, content?: string) => Promise<{ canceled: boolean; filePath?: string }>;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  readDir: (dirPath: string) => Promise<{ success: boolean; items?: Array<{ path: string; name: string; isDirectory: boolean }>; error?: string }>;
  createFileOrFolder: (targetPath: string, isDirectory: boolean) => Promise<{ success: boolean; error?: string }>;
  deleteFileOrFolder: (targetPath: string) => Promise<{ success: boolean; error?: string }>;
  renameFileOrFolder: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;

  // Window controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isMaximized: () => Promise<boolean>;

  // Database & Session
  saveSession: (session: SavedSession) => Promise<boolean>;
  restoreSession: () => Promise<SavedSession | null>;
  getRecentHistory: () => Promise<{ files: RecentItem[]; workspaces: RecentItem[] }>;
  getSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<boolean>;

  // Workspace Watcher
  onWorkspaceFilesChanged: (callback: (data: { event: string; path: string; folderPath: string }) => void) => () => void;

  // System info
  platform: string;
}

declare global {
  interface Window {
    xivig?: XivigAPI;
  }
}
