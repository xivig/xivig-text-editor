import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import {
  initDatabase,
  saveSession,
  restoreSession,
  addRecentFile,
  getRecentFiles,
  addRecentWorkspace,
  getRecentWorkspaces,
  setSetting,
  getSetting,
  SavedSession,
} from './database';
import { watchWorkspace, stopWatching } from './watcher';
import { initTerminalSession, writeToTerminal, stopTerminal } from './terminal';
import { getGitStatus, commitChanges } from './git';
import { runBuildProcess, stopBuildProcess } from './build';

process.env.APP_ROOT = path.join(__dirname, '../..');

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, '../preload/index.js');
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = path.join(RENDERER_DIST, 'index.html');

async function createWindow() {
  const iconPath = process.env.VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, 'public/logo.png')
    : path.join(RENDERER_DIST, 'logo.png');

  win = new BrowserWindow({
    title: 'Xivig Editor',
    icon: iconPath,
    width: 1280,
    height: 840,
    minWidth: 640,
    minHeight: 480,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#17191f',
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (url) {
    win.loadURL(url);
  } else {
    win.loadFile(indexHtml);
  }

  win.on('maximize', () => {
    win?.webContents.send('window-state-changed', { isMaximized: true });
  });

  win.on('unmaximize', () => {
    win?.webContents.send('window-state-changed', { isMaximized: false });
  });

  win.on('closed', () => {
    stopWatching();
    stopTerminal();
    stopBuildProcess();
    win = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopWatching();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Window controls IPC
ipcMain.on('window:minimize', () => {
  win?.minimize();
});

ipcMain.on('window:maximize', () => {
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.on('window:close', () => {
  win?.close();
});

ipcMain.handle('window:isMaximized', () => {
  return win?.isMaximized() ?? false;
});

// File dialogs & System operations
ipcMain.handle('dialog:openFile', async () => {
  if (!win) return { canceled: true };
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Code Files', extensions: ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'rs', 'c', 'cpp', 'md', 'txt'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const name = path.basename(filePath);
    addRecentFile(filePath, name);
    return { canceled: false, filePath, content, name };
  } catch (error: any) {
    return { canceled: false, filePath, error: error.message };
  }
});

ipcMain.handle('dialog:openFolder', async () => {
  if (!win) return { canceled: true };
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const folderPath = result.filePaths[0];
  try {
    const folderName = path.basename(folderPath) || folderPath;
    addRecentWorkspace(folderPath, folderName);
    watchWorkspace(folderPath, win);

    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    const files = entries.map((entry) => ({
      path: path.join(folderPath, entry.name),
      name: entry.name,
      isDirectory: entry.isDirectory(),
    }));
    return { canceled: false, folderPath, files };
  } catch (error: any) {
    return { canceled: false, folderPath, error: error.message };
  }
});

ipcMain.handle('file:save', async (_, { filePath, content }: { filePath: string; content: string }) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    addRecentFile(filePath, path.basename(filePath));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:saveDialog', async (_, { defaultName, content }: { defaultName?: string; content?: string }) => {
  if (!win) return { canceled: true };
  const result = await dialog.showSaveDialog(win, {
    defaultPath: defaultName || 'Untitled.txt',
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  if (content !== undefined) {
    try {
      await fs.writeFile(result.filePath, content, 'utf-8');
      addRecentFile(result.filePath, path.basename(result.filePath));
    } catch (error: any) {
      return { canceled: false, filePath: result.filePath, error: error.message };
    }
  }

  return { canceled: false, filePath: result.filePath };
});

ipcMain.handle('file:read', async (_, filePath: string) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    addRecentFile(filePath, path.basename(filePath));
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:readDir', async (_, dirPath: string) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const items = entries.map((entry) => ({
      path: path.join(dirPath, entry.name),
      name: entry.name,
      isDirectory: entry.isDirectory(),
    }));
    return { success: true, items };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// File Management operations (create, delete, rename)
ipcMain.handle('file:create', async (_, { targetPath, isDirectory }: { targetPath: string; isDirectory: boolean }) => {
  try {
    if (isDirectory) {
      await fs.mkdir(targetPath, { recursive: true });
    } else {
      const parentDir = path.dirname(targetPath);
      await fs.mkdir(parentDir, { recursive: true });
      await fs.writeFile(targetPath, '', { flag: 'w' });
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:delete', async (_, targetPath: string) => {
  try {
    const stat = await fs.stat(targetPath);
    if (stat.isDirectory()) {
      await fs.rm(targetPath, { recursive: true, force: true });
    } else {
      await fs.unlink(targetPath);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:rename', async (_, { oldPath, newPath }: { oldPath: string; newPath: string }) => {
  try {
    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Database & Session IPC
ipcMain.handle('session:save', async (_, session: SavedSession) => {
  return saveSession(session);
});

ipcMain.handle('session:restore', async () => {
  const session = restoreSession();
  if (session && session.activeFolder) {
    watchWorkspace(session.activeFolder, win);
  }
  return session;
});

ipcMain.handle('history:getRecent', async () => {
  return {
    files: getRecentFiles(12),
    workspaces: getRecentWorkspaces(10),
  };
});

ipcMain.handle('settings:get', async (_, key: string) => {
  return getSetting(key);
});

ipcMain.handle('settings:set', async (_, { key, value }: { key: string; value: string }) => {
  setSetting(key, value);
  return true;
});

ipcMain.handle('workspace:watch', async (_, folderPath: string) => {
  watchWorkspace(folderPath, win);
  return true;
});

// Terminal IPC
ipcMain.handle('terminal:init', async (_, cwd?: string) => {
  initTerminalSession(cwd || null, win);
  return true;
});

ipcMain.on('terminal:write', (_, data: string) => {
  writeToTerminal(data);
});

// Git IPC
ipcMain.handle('git:status', async (_, cwd: string) => {
  return getGitStatus(cwd);
});

ipcMain.handle('git:commit', async (_, { cwd, message }: { cwd: string; message: string }) => {
  return commitChanges(cwd, message);
});

// Build System & Task Runner IPC
ipcMain.handle('build:run', async (_, options: { command: string; args?: string[]; cwd?: string }) => {
  return runBuildProcess(options, win);
});

ipcMain.handle('build:stop', async () => {
  return stopBuildProcess();
});
