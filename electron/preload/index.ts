import { contextBridge, ipcRenderer } from 'electron';

const xivigAPI = {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  saveFile: (filePath: string, content: string) => ipcRenderer.invoke('file:save', { filePath, content }),
  saveFileDialog: (defaultName?: string, content?: string) => ipcRenderer.invoke('file:saveDialog', { defaultName, content }),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  readDir: (dirPath: string) => ipcRenderer.invoke('file:readDir', dirPath),
  createFileOrFolder: (targetPath: string, isDirectory: boolean) =>
    ipcRenderer.invoke('file:create', { targetPath, isDirectory }),
  deleteFileOrFolder: (targetPath: string) =>
    ipcRenderer.invoke('file:delete', targetPath),
  renameFileOrFolder: (oldPath: string, newPath: string) =>
    ipcRenderer.invoke('file:rename', { oldPath, newPath }),
  duplicateFile: (sourcePath: string, targetPath: string) =>
    ipcRenderer.invoke('file:duplicate', { sourcePath, targetPath }),
  revealInExplorer: (targetPath: string) =>
    ipcRenderer.invoke('file:revealInExplorer', targetPath),
  clipboardReadText: () => ipcRenderer.invoke('clipboard:readText'),
  clipboardWriteText: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),

  // Window operations
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  openNewWindow: () => ipcRenderer.invoke('window:openNew'),

  // Database & Session operations
  saveSession: (session: any) => ipcRenderer.invoke('session:save', session),
  restoreSession: () => ipcRenderer.invoke('session:restore'),
  getRecentHistory: () => ipcRenderer.invoke('history:getRecent'),
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('settings:set', { key, value }),

  // Terminal operations
  terminalInit: (options?: string | { cwd?: string; shell?: string; cols?: number; rows?: number; terminalId?: string }) =>
    ipcRenderer.invoke('terminal:init', options),
  terminalWrite: (data: string | { data: string; terminalId?: string }) => ipcRenderer.send('terminal:write', data),
  terminalResize: (options: { cols: number; rows: number; terminalId?: string }) =>
    ipcRenderer.invoke('terminal:resize', options),
  getAvailableShells: () => ipcRenderer.invoke('terminal:shells'),
  onTerminalData: (callback: (data: string) => void) => {
    const handler = (_: any, data: string) => callback(data);
    ipcRenderer.on('terminal:data', handler);
    return () => {
      ipcRenderer.removeListener('terminal:data', handler);
    };
  },

  // Git operations
  getGitStatus: (cwd: string) => ipcRenderer.invoke('git:status', cwd),
  commitGit: (cwd: string, message: string) => ipcRenderer.invoke('git:commit', { cwd, message }),
  stageGitFile: (cwd: string, filePath: string) => ipcRenderer.invoke('git:stage', { cwd, filePath }),
  unstageGitFile: (cwd: string, filePath: string) => ipcRenderer.invoke('git:unstage', { cwd, filePath }),
  stageAllGit: (cwd: string) => ipcRenderer.invoke('git:stageAll', cwd),
  unstageAllGit: (cwd: string) => ipcRenderer.invoke('git:unstageAll', cwd),
  discardGitChanges: (cwd: string, filePath: string) => ipcRenderer.invoke('git:discard', { cwd, filePath }),
  getGitDiff: (cwd: string, filePath?: string, staged?: boolean) =>
    ipcRenderer.invoke('git:diff', { cwd, filePath, staged }),
  closeWorkspace: (folderPath?: string) => ipcRenderer.invoke('workspace:close', folderPath),

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
  }) => ipcRenderer.invoke('build:run', options),
  buildStop: () => ipcRenderer.invoke('build:stop'),
  onBuildStart: (callback: (data: { command: string; args: string[]; cwd: string; timestamp: string }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('build:start', handler);
    return () => {
      ipcRenderer.removeListener('build:start', handler);
    };
  },
  onBuildData: (callback: (data: { type: 'stdout' | 'stderr'; text: string }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('build:data', handler);
    return () => {
      ipcRenderer.removeListener('build:data', handler);
    };
  },
  onBuildDone: (callback: (data: { exitCode: number; durationMs: number }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('build:done', handler);
    return () => {
      ipcRenderer.removeListener('build:done', handler);
    };
  },

  // Live Server & Live Reload
  liveServerStart: (rootPath: string, port?: number) =>
    ipcRenderer.invoke('liveserver:start', { rootPath, port }),
  liveServerStop: () => ipcRenderer.invoke('liveserver:stop'),
  liveServerStatus: () => ipcRenderer.invoke('liveserver:status'),
  liveServerOpenBrowser: (subPath?: string) =>
    ipcRenderer.invoke('liveserver:openBrowser', subPath),
  liveServerTriggerReload: () => ipcRenderer.invoke('liveserver:triggerReload'),
  onLiveServerChanged: (callback: (data: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('liveserver:changed', handler);
    return () => {
      ipcRenderer.removeListener('liveserver:changed', handler);
    };
  },

  // Workspace Watcher listener
  onWorkspaceFilesChanged: (callback: (data: { event: string; path: string; folderPath: string }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('workspace:files-changed', handler);
    return () => {
      ipcRenderer.removeListener('workspace:files-changed', handler);
    };
  },

  // Update Notification & Seamless Reload
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  startUpdateDownload: () => ipcRenderer.invoke('updater:download'),
  applyUpdateAndRestart: () => ipcRenderer.invoke('updater:apply-and-restart'),
  getDownloadedUpdateInfo: () => ipcRenderer.invoke('updater:status'),
  openReleasePage: (url?: string) => ipcRenderer.invoke('updater:openRelease', url),
  onUpdateAvailable: (callback: (info: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('updater:available', handler);
    return () => {
      ipcRenderer.removeListener('updater:available', handler);
    };
  },
  onUpdateDownloadProgress: (callback: (progress: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('updater:download-progress', handler);
    return () => {
      ipcRenderer.removeListener('updater:download-progress', handler);
    };
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('updater:downloaded', handler);
    return () => {
      ipcRenderer.removeListener('updater:downloaded', handler);
    };
  },

  // Application Metadata
  getAppInfo: () => ipcRenderer.invoke('app:info'),

  // Language Server Protocol (LSP)
  lsp: {
    listServers: () => ipcRenderer.invoke('lsp:list-servers'),
    startServer: (serverId: string, rootPath?: string) =>
      ipcRenderer.invoke('lsp:start-server', { serverId, rootPath }),
    stopServer: (serverId: string) => ipcRenderer.invoke('lsp:stop-server', serverId),
    restartServer: (serverId: string) => ipcRenderer.invoke('lsp:restart-server', serverId),
    updateConfig: (serverId: string, patch: any) =>
      ipcRenderer.invoke('lsp:update-config', { serverId, patch }),
    setWorkspaceRoot: (rootPath: string) =>
      ipcRenderer.invoke('lsp:set-workspace-root', rootPath),
    openDocument: (doc: any, filePath: string) =>
      ipcRenderer.invoke('lsp:open-document', { doc, filePath }),
    changeDocument: (uri: string, text: string, filePath: string, languageId?: string) =>
      ipcRenderer.invoke('lsp:change-document', { uri, text, filePath, languageId }),
    saveDocument: (uri: string, filePath: string, text?: string, languageId?: string) =>
      ipcRenderer.invoke('lsp:save-document', { uri, filePath, text, languageId }),
    closeDocument: (uri: string, filePath: string, languageId?: string) =>
      ipcRenderer.invoke('lsp:close-document', { uri, filePath, languageId }),
    sendRequest: (target: any, method: string, params: any) =>
      ipcRenderer.invoke('lsp:send-request', { target, method, params }),
    onDiagnostics: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on('lsp:diagnostics', handler);
      return () => {
        ipcRenderer.removeListener('lsp:diagnostics', handler);
      };
    },
    onServersChanged: (callback: (servers: any[]) => void) => {
      const handler = (_: any, data: any[]) => callback(data);
      ipcRenderer.on('lsp:servers-changed', handler);
      return () => {
        ipcRenderer.removeListener('lsp:servers-changed', handler);
      };
    },
    onNotification: (callback: (notification: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on('lsp:notification', handler);
      return () => {
        ipcRenderer.removeListener('lsp:notification', handler);
      };
    },
  },

  // Environment
  platform: process.platform,
};

contextBridge.exposeInMainWorld('xivig', xivigAPI);
