import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';

// The built directory structure
//
// ├─┬ dist-electron
// │ ├── main
// │ └── preload
// ├─┬ dist
// │ └── index.html

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
  win = new BrowserWindow({
    title: 'Xivig Editor',
    width: 1200,
    height: 800,
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
    // win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Handle window maximize/unmaximize
  win.on('maximize', () => {
    win?.webContents.send('window-state-changed', { isMaximized: true });
  });

  win.on('unmaximize', () => {
    win?.webContents.send('window-state-changed', { isMaximized: false });
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
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

// File system IPC
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
    } catch (error: any) {
      return { canceled: false, filePath: result.filePath, error: error.message };
    }
  }

  return { canceled: false, filePath: result.filePath };
});

ipcMain.handle('file:read', async (_, filePath: string) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
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
