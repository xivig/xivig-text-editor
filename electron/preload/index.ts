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

  // Window operations
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Database & Session operations
  saveSession: (session: any) => ipcRenderer.invoke('session:save', session),
  restoreSession: () => ipcRenderer.invoke('session:restore'),
  getRecentHistory: () => ipcRenderer.invoke('history:getRecent'),
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('settings:set', { key, value }),

  // Terminal operations
  terminalInit: (cwd?: string) => ipcRenderer.invoke('terminal:init', cwd),
  terminalWrite: (data: string) => ipcRenderer.send('terminal:write', data),
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

  // Workspace Watcher listener
  onWorkspaceFilesChanged: (callback: (data: { event: string; path: string; folderPath: string }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('workspace:files-changed', handler);
    return () => {
      ipcRenderer.removeListener('workspace:files-changed', handler);
    };
  },

  // Environment
  platform: process.platform,
};

contextBridge.exposeInMainWorld('xivig', xivigAPI);
