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
  openFileDialog: () => Promise<{ canceled: boolean; filePath?: string; content?: string; name?: string; isBinary?: boolean }>;
  openFolderDialog: () => Promise<{ canceled: boolean; folderPath?: string; files?: Array<{ path: string; name: string; isDirectory: boolean }> }>;
  openWorkspaceFileDialog?: () => Promise<{ canceled: boolean; filePath?: string; content?: string; name?: string; isBinary?: boolean }>;
  saveFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  saveFileDialog: (defaultName?: string, content?: string) => Promise<{ canceled: boolean; filePath?: string }>;
  saveWorkspaceFileDialog?: (defaultName?: string, content?: string) => Promise<{ canceled: boolean; filePath?: string; name?: string }>;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string; isBinary?: boolean; dataUrl?: string }>;
  readDir: (dirPath: string) => Promise<{ success: boolean; items?: Array<{ path: string; name: string; isDirectory: boolean }>; error?: string }>;
  createFileOrFolder: (targetPath: string, isDirectory: boolean) => Promise<{ success: boolean; error?: string }>;
  deleteFileOrFolder: (targetPath: string) => Promise<{ success: boolean; error?: string }>;
  renameFileOrFolder: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
  duplicateFile: (sourcePath: string, targetPath: string) => Promise<{ success: boolean; error?: string }>;
  revealInExplorer: (targetPath: string) => Promise<{ success: boolean; error?: string }>;
  clipboardReadText?: () => Promise<string>;
  clipboardWriteText?: (text: string) => Promise<boolean>;

  // Command-line & External Open with
  getStartupPath?: () => Promise<{
    type: 'file' | 'folder';
    path: string;
    name?: string;
    content?: string;
    isBinary?: boolean;
    files?: Array<{ path: string; name: string; isDirectory: boolean }>;
  } | null>;
  onOpenPath?: (callback: (data: {
    type: 'file' | 'folder';
    path: string;
    name?: string;
    content?: string;
    isBinary?: boolean;
    files?: Array<{ path: string; name: string; isDirectory: boolean }>;
  }) => void) => () => void;

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
  clearRecentHistory?: () => Promise<boolean>;
  getSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<boolean>;

  // Terminal
  terminalInit: (options?: string | { cwd?: string; shell?: string; cols?: number; rows?: number; terminalId?: string }) => Promise<boolean>;
  terminalWrite: (data: string | { data: string; terminalId?: string }) => void;
  terminalResize?: (options: { cols: number; rows: number; terminalId?: string }) => Promise<boolean>;
  terminalStop?: (terminalId?: string) => Promise<boolean>;
  getAvailableShells?: () => Promise<Array<{ name: string; path: string; executable: string }>>;
  onTerminalData: (callback: (data: string) => void) => () => void;

  // Git
  getGitStatus: (cwd: string) => Promise<GitStatusResult>;
  commitGit: (cwd: string, message: string, amend?: boolean) => Promise<{ success: boolean; output?: string; error?: string }>;
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

  // Language Server Protocol (LSP)
  lsp?: {
    listServers: () => Promise<any[]>;
    startServer: (serverId: string, rootPath?: string) => Promise<boolean>;
    stopServer: (serverId: string) => Promise<boolean>;
    restartServer: (serverId: string) => Promise<boolean>;
    updateConfig: (serverId: string, patch: any) => Promise<any>;
    setWorkspaceRoot: (rootPath: string) => Promise<boolean>;
    openDocument: (doc: any, filePath: string) => Promise<void>;
    changeDocument: (uri: string, text: string, filePath: string, languageId?: string) => Promise<void>;
    saveDocument: (uri: string, filePath: string, text?: string, languageId?: string) => Promise<void>;
    closeDocument: (uri: string, filePath: string, languageId?: string) => Promise<void>;
    sendRequest: (target: any, method: string, params: any) => Promise<any>;
    onDiagnostics: (callback: (data: any) => void) => () => void;
    onServersChanged: (callback: (servers: any[]) => void) => () => void;
    onNotification: (callback: (notification: any) => void) => () => void;
  };

  // Formatters & Code Quality
  formatter?: {
    listAvailable: (workspaceRoot?: string) => Promise<any[]>;
    formatSourceCode: (text: string, options: any) => Promise<any>;
    lintAndFix: (text: string, linterId: string, filePath?: string) => Promise<any>;
  };

  // Extended Git
  gitBranches?: (cwd: string) => Promise<{ success: boolean; branches: any[]; currentBranch: string; error?: string }>;
  gitCreateBranch?: (cwd: string, branchName: string, checkout?: boolean) => Promise<{ success: boolean; error?: string }>;
  gitDeleteBranch?: (cwd: string, branchName: string, force?: boolean) => Promise<{ success: boolean; error?: string }>;
  gitSwitchBranch?: (cwd: string, branchName: string) => Promise<{ success: boolean; error?: string }>;
  gitMergeBranch?: (cwd: string, branchName: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  gitRebaseBranch?: (cwd: string, branchName: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  gitStash?: (cwd: string, action: 'save' | 'pop' | 'list', msg?: string) => Promise<{ success: boolean; stashes?: any[]; error?: string }>;
  gitLog?: (cwd: string, maxCount?: number, filePath?: string) => Promise<{ success: boolean; commits: any[]; error?: string }>;
  gitBlame?: (cwd: string, filePath: string) => Promise<{ success: boolean; lines: any[]; error?: string }>;
  gitRemoteOperation?: (cwd: string, op: 'fetch' | 'pull' | 'push', remote?: string, branch?: string) => Promise<{ success: boolean; output?: string; error?: string }>;

  // Debug Adapter Protocol (DAP)
  dap?: {
    startSession: (sessionId: string, config: any) => Promise<{ success: boolean; error?: string }>;
    stopSession: (sessionId: string) => Promise<void>;
    sendRequest: (sessionId: string, command: string, args?: any) => Promise<any>;
    setBreakpoints: (sessionId: string, filePath: string, breakpoints: any[]) => Promise<any>;
    onStopped: (callback: (data: any) => void) => () => void;
    onContinued: (callback: (data: any) => void) => () => void;
    onOutput: (callback: (data: any) => void) => () => void;
    onTerminated: (callback: (data: any) => void) => () => void;
  };

  // Workspace Tasks Runner
  tasks?: {
    loadTasks: (workspaceRoot: string) => Promise<any[]>;
    runTask: (workspaceRoot: string, task: any) => Promise<{ success: boolean; taskId: string; error?: string }>;
    stopTask: (taskId: string) => Promise<boolean>;
    onOutput: (callback: (data: any) => void) => () => void;
    onProblem: (callback: (data: any) => void) => () => void;
    onCompleted: (callback: (data: any) => void) => () => void;
  };

  // System info
  platform: string;
}

declare global {
  interface Window {
    xivig?: XivigAPI;
  }
}
