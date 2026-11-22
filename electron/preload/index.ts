import { contextBridge, ipcRenderer } from 'electron';

const xivigAPI = {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  saveFile: (filePath: string, content: string) => ipcRenderer.invoke('file:save', { filePath, content }),
  saveFileDialog: (defaultName?: string, content?: string) => ipcRenderer.invoke('file:saveDialog', { defaultName, content }),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  readDir: (dirPath: string) => ipcRenderer.invoke('file:readDir', dirPath),

  // Window operations
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Environment
  platform: process.platform,
};

contextBridge.exposeInMainWorld('xivig', xivigAPI);
