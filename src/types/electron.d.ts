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

export interface GitFileChange {
  path: string;
  status: 'M' | 'A' | 'D' | 'U' | '?';
  staged: boolean;
}

export interface GitStatusResult {
  isRepo: boolean;
  branch: string;
  changes: GitFileChange[];
}

export interface AppInfo {
  name: string;
  version: string;
  electron?: string;
  node?: string;
  chrome?: string;
  platform?: string;
}

export interface UpdateProgress {
  percent: number;
  transferred: number;
  total: number;
}

export interface DownloadedUpdateInfo {
  version: string;
  filePath: string;
  assetName: string;
  releaseName?: string;
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName?: string;
  releaseNotes?: string;
  publishedAt?: string;
  downloadUrl?: string;
  assetName?: string;
  assetSize?: number;
  htmlUrl?: string;
  error?: string;
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
  duplicateFile: (sourcePath: string, targetPath: string) => Promise<{ success: boolean; error?: string }>;
  revealInExplorer: (targetPath: string) => Promise<{ success: boolean; error?: string }>;
  clipboardReadText?: () => Promise<string>;
  clipboardWriteText?: (text: string) => Promise<boolean>;

  // Window controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isMaximized: () => Promise<boolean>;
  openNewWindow?: () => Promise<{ success: boolean; error?: string }>;

  // Database & Session
  saveSession: (session: SavedSession) => Promise<boolean>;
  restoreSession: () => Promise<SavedSession | null>;
  getRecentHistory: () => Promise<{ files: RecentItem[]; workspaces: RecentItem[] }>;
  getSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<boolean>;

  // Terminal
  terminalInit: (options?: string | { cwd?: string; shell?: string; cols?: number; rows?: number; terminalId?: string }) => Promise<boolean>;
  terminalWrite: (data: string | { data: string; terminalId?: string }) => void;
  terminalResize?: (options: { cols: number; rows: number; terminalId?: string }) => Promise<boolean>;
  getAvailableShells?: () => Promise<Array<{ name: string; path: string; executable: string }>>;
  onTerminalData: (callback: (data: string) => void) => () => void;

  // Git
  getGitStatus: (cwd: string) => Promise<GitStatusResult>;
  commitGit: (cwd: string, message: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  stageGitFile?: (cwd: string, filePath: string) => Promise<{ success: boolean; error?: string }>;
  unstageGitFile?: (cwd: string, filePath: string) => Promise<{ success: boolean; error?: string }>;
  stageAllGit?: (cwd: string) => Promise<{ success: boolean; error?: string }>;
  unstageAllGit?: (cwd: string) => Promise<{ success: boolean; error?: string }>;
  discardGitChanges?: (cwd: string, filePath: string) => Promise<{ success: boolean; error?: string }>;
  getGitDiff?: (cwd: string, filePath?: string, staged?: boolean) => Promise<{ success: boolean; diff?: string; error?: string }>;
  closeWorkspace?: (folderPath?: string) => Promise<boolean>;

  // Workspace Watcher
  onWorkspaceFilesChanged: (callback: (data: { event: string; path: string; folderPath: string }) => void) => () => void;

  // Build System & Task Runner
  buildRun: (options: {
    command?: string;
    program?: string;
    args?: string[];
    cwd?: string;
    secondaryCommand?: {
      command?: string;
      program?: string;
      args?: string[];
      cwd?: string;
    };
  }) => Promise<{ success: boolean; error?: string }>;
  buildStop: () => Promise<boolean>;
  onBuildStart: (callback: (data: { command: string; args: string[]; cwd: string; timestamp: string }) => void) => () => void;
  onBuildData: (callback: (data: { type: 'stdout' | 'stderr'; text: string }) => void) => () => void;
  onBuildDone: (callback: (data: { exitCode: number; durationMs: number }) => void) => () => void;

  // Live Server & Live Reload
  liveServerStart: (rootPath: string, port?: number) => Promise<{ success: boolean; port: number; url: string; error?: string }>;
  liveServerStop: () => Promise<boolean>;
  liveServerStatus: () => Promise<{ isRunning: boolean; port: number; url: string; rootPath: string }>;
  liveServerOpenBrowser: (subPath?: string) => Promise<boolean>;
  liveServerTriggerReload: () => Promise<boolean>;
  onLiveServerChanged: (callback: (data: { isRunning: boolean; port: number; url: string; rootPath: string }) => void) => () => void;

  // Update Notification & Seamless In-Place Reload
  checkForUpdates?: () => Promise<UpdateCheckResult>;
  startUpdateDownload?: () => Promise<{ success: boolean; error?: string }>;
  applyUpdateAndRestart?: () => Promise<{ success: boolean; error?: string }>;
  getDownloadedUpdateInfo?: () => Promise<DownloadedUpdateInfo | null>;
  openReleasePage?: (url?: string) => Promise<boolean>;
  onUpdateAvailable?: (callback: (info: UpdateCheckResult) => void) => () => void;
  onUpdateDownloadProgress?: (callback: (progress: UpdateProgress) => void) => () => void;
  onUpdateDownloaded?: (callback: (info: DownloadedUpdateInfo) => void) => () => void;

  // Application info
  getAppInfo?: () => Promise<AppInfo | null>;

  // System info
  platform: string;
}

declare global {
  interface Window {
    xivig?: XivigAPI;
  }
}
