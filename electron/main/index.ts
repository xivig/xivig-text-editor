import { app, BrowserWindow, ipcMain, dialog, shell, session } from 'electron';
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
import {
  startLiveServer,
  stopLiveServer,
  getLiveServerStatus,
  openLiveServerInBrowser,
  triggerLiveReload,
} from './liveserver';
import {
  validateIpcSender,
  addApprovedWorkspace,
  addApprovedFile,
  validatePathInput,
  validateContentPayload,
  assertPathAuthorized,
  atomicWriteFile,
} from './security';

process.on('uncaughtException', (error) => {
  console.error('[Xivig Main] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Xivig Main] Unhandled Rejection:', reason);
});

process.env.APP_ROOT = path.join(__dirname, '../..');

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

const openWindows = new Set<BrowserWindow>();
let activeWindow: BrowserWindow | null = null;

export function getActiveWindow(): BrowserWindow | null {
  return activeWindow || Array.from(openWindows)[0] || null;
}

const preload = path.join(__dirname, '../preload/index.js');
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = path.join(RENDERER_DIST, 'index.html');

async function createWindow() {
  const rootDir = process.env.APP_ROOT || path.resolve(__dirname, '../..');
  const iconPath = process.env.VITE_DEV_SERVER_URL
    ? path.join(rootDir, 'public/logo.png')
    : path.join(RENDERER_DIST, 'logo.png');

  const currentWin = new BrowserWindow({
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

  openWindows.add(currentWin);
  activeWindow = currentWin;

  currentWin.on('focus', () => {
    activeWindow = currentWin;
  });

  if (url) {
    currentWin.loadURL(url).catch((err) => {
      console.warn('[Xivig Main] Initial loadURL failed, retrying in 500ms...', err);
      setTimeout(() => {
        if (!currentWin.isDestroyed()) {
          currentWin.loadURL(url);
        }
      }, 500);
    });
  } else {
    currentWin.loadFile(indexHtml);
  }

  // Security: Prevent unapproved child windows and open external URLs in system browser
  currentWin.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('https:') || targetUrl.startsWith('http:') || targetUrl.startsWith('mailto:')) {
      shell.openExternal(targetUrl);
    }
    return { action: 'deny' };
  });

  // Security: Prevent top-level window from navigating to untrusted origins
  currentWin.webContents.on('will-navigate', (event, navigationUrl) => {
    const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
    if (isDev && navigationUrl.startsWith(process.env.VITE_DEV_SERVER_URL!)) {
      return;
    }
    if (!isDev && navigationUrl.startsWith('file://')) {
      return;
    }
    event.preventDefault();
    if (navigationUrl.startsWith('https:') || navigationUrl.startsWith('http:')) {
      shell.openExternal(navigationUrl);
    }
  });

  currentWin.on('maximize', () => {
    currentWin.webContents.send('window-state-changed', { isMaximized: true });
  });

  currentWin.on('unmaximize', () => {
    currentWin.webContents.send('window-state-changed', { isMaximized: false });
  });

  currentWin.on('closed', () => {
    openWindows.delete(currentWin);
    if (activeWindow === currentWin) {
      activeWindow = Array.from(openWindows)[0] || null;
    }
    // Clean up background daemon services only when all windows have closed
    if (openWindows.size === 0) {
      stopWatching();
      stopTerminal();
      stopBuildProcess();
      stopLiveServer();
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  initDatabase();
  addApprovedWorkspace(process.cwd());

  // Enforce Content-Security-Policy across all application webContents
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:*;"
        ],
      },
    });
  });

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
ipcMain.on('window:minimize', (event) => {
  if (!validateIpcSender(event)) return;
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  targetWin?.minimize();
});

ipcMain.on('window:maximize', (event) => {
  if (!validateIpcSender(event)) return;
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  if (targetWin?.isMaximized()) {
    targetWin.unmaximize();
  } else {
    targetWin?.maximize();
  }
});

ipcMain.on('window:close', (event) => {
  if (!validateIpcSender(event)) return;
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  targetWin?.close();
});

ipcMain.handle('window:isMaximized', (event) => {
  if (!validateIpcSender(event)) return false;
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  return targetWin?.isMaximized() ?? false;
});

ipcMain.handle('window:openNew', async (event) => {
  if (!validateIpcSender(event)) return { success: false, error: 'Unauthorized IPC invocation' };
  createWindow();
  return { success: true };
});

// File dialogs & System operations
ipcMain.handle('dialog:openFile', async (event) => {
  if (!validateIpcSender(event)) return { canceled: true };
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  if (!targetWin) return { canceled: true };

  const result = await dialog.showOpenDialog(targetWin, {
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
    addApprovedFile(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    const name = path.basename(filePath);
    addRecentFile(filePath, name);
    return { canceled: false, filePath, content, name };
  } catch (error: any) {
    return { canceled: false, filePath, error: error.message };
  }
});

ipcMain.handle('dialog:openFolder', async (event) => {
  if (!validateIpcSender(event)) return { canceled: true };
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  if (!targetWin) return { canceled: true };

  const result = await dialog.showOpenDialog(targetWin, {
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const folderPath = result.filePaths[0];
  try {
    addApprovedWorkspace(folderPath);
    const folderName = path.basename(folderPath) || folderPath;
    addRecentWorkspace(folderPath, folderName);
    watchWorkspace(folderPath, targetWin);

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

ipcMain.handle('file:save', async (event, { filePath, content }: { filePath: string; content: string }) => {
  if (!validateIpcSender(event)) {
    return { success: false, error: 'Unauthorized IPC invocation' };
  }

  try {
    const safePath = validatePathInput(filePath);
    const safeContent = validateContentPayload(content);
    assertPathAuthorized(safePath, 'file:save');

    await atomicWriteFile(safePath, safeContent);
    addApprovedFile(safePath);
    addRecentFile(safePath, path.basename(safePath));
    triggerLiveReload();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:saveDialog', async (event, { defaultName, content }: { defaultName?: string; content?: string }) => {
  if (!validateIpcSender(event)) return { canceled: true };
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  if (!targetWin) return { canceled: true };

  const result = await dialog.showSaveDialog(targetWin, {
    defaultPath: defaultName || 'Untitled.txt',
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  const safePath = validatePathInput(result.filePath);
  addApprovedFile(safePath);

  if (content !== undefined) {
    try {
      const safeContent = validateContentPayload(content);
      await atomicWriteFile(safePath, safeContent);
      addRecentFile(safePath, path.basename(safePath));
      triggerLiveReload();
    } catch (error: any) {
      return { canceled: false, filePath: safePath, error: error.message };
    }
  }

  return { canceled: false, filePath: safePath };
});

ipcMain.handle('file:read', async (event, filePath: string) => {
  if (!validateIpcSender(event)) {
    return { success: false, error: 'Unauthorized IPC invocation' };
  }

  try {
    const safePath = validatePathInput(filePath);
    assertPathAuthorized(safePath, 'file:read');

    const content = await fs.readFile(safePath, 'utf-8');
    addApprovedFile(safePath);
    addRecentFile(safePath, path.basename(safePath));
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:readDir', async (event, dirPath: string) => {
  if (!validateIpcSender(event)) {
    return { success: false, error: 'Unauthorized IPC invocation' };
  }

  try {
    const safePath = validatePathInput(dirPath);
    assertPathAuthorized(safePath, 'file:readDir');

    const entries = await fs.readdir(safePath, { withFileTypes: true });
    const items = entries.map((entry) => ({
      path: path.join(safePath, entry.name),
      name: entry.name,
      isDirectory: entry.isDirectory(),
    }));
    return { success: true, items };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// File Management operations (create, delete, rename)
ipcMain.handle('file:create', async (event, { targetPath, isDirectory }: { targetPath: string; isDirectory: boolean }) => {
  if (!validateIpcSender(event)) {
    return { success: false, error: 'Unauthorized IPC invocation' };
  }

  try {
    const safePath = validatePathInput(targetPath);
    assertPathAuthorized(safePath, 'file:create');

    if (isDirectory) {
      await fs.mkdir(safePath, { recursive: true });
    } else {
      const parentDir = path.dirname(safePath);
      await fs.mkdir(parentDir, { recursive: true });
      await fs.writeFile(safePath, '', { flag: 'w' });
    }
    addApprovedFile(safePath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:delete', async (event, targetPath: string) => {
  if (!validateIpcSender(event)) {
    return { success: false, error: 'Unauthorized IPC invocation' };
  }

  try {
    const safePath = validatePathInput(targetPath);
    assertPathAuthorized(safePath, 'file:delete');

    const stat = await fs.stat(safePath);
    if (stat.isDirectory()) {
      await fs.rm(safePath, { recursive: true, force: true });
    } else {
      await fs.unlink(safePath);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:rename', async (event, { oldPath, newPath }: { oldPath: string; newPath: string }) => {
  if (!validateIpcSender(event)) {
    return { success: false, error: 'Unauthorized IPC invocation' };
  }

  try {
    const safeOld = validatePathInput(oldPath);
    const safeNew = validatePathInput(newPath);
    assertPathAuthorized(safeOld, 'file:rename (source)');
    assertPathAuthorized(safeNew, 'file:rename (destination)');

    await fs.rename(safeOld, safeNew);
    addApprovedFile(safeNew);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:duplicate', async (event, { sourcePath, targetPath }: { sourcePath: string; targetPath: string }) => {
  if (!validateIpcSender(event)) {
    return { success: false, error: 'Unauthorized IPC invocation' };
  }

  try {
    const safeSource = validatePathInput(sourcePath);
    const safeTarget = validatePathInput(targetPath);
    assertPathAuthorized(safeSource, 'file:duplicate (source)');
    assertPathAuthorized(safeTarget, 'file:duplicate (destination)');

    await fs.copyFile(safeSource, safeTarget);
    addApprovedFile(safeTarget);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:revealInExplorer', async (event, targetPath: string) => {
  if (!validateIpcSender(event)) {
    return { success: false, error: 'Unauthorized IPC invocation' };
  }

  try {
    const safePath = validatePathInput(targetPath);
    assertPathAuthorized(safePath, 'file:revealInExplorer');
    shell.showItemInFolder(safePath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Database & Session IPC
ipcMain.handle('session:save', async (event, session: SavedSession) => {
  if (!validateIpcSender(event)) return false;
  return saveSession(session);
});

ipcMain.handle('session:restore', async (event) => {
  if (!validateIpcSender(event)) return null;
  const session = restoreSession();
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();

  if (session) {
    if (session.activeFolder) {
      addApprovedWorkspace(session.activeFolder);
      watchWorkspace(session.activeFolder, targetWin);
    }
    if (session.documents && Array.isArray(session.documents)) {
      session.documents.forEach((doc) => {
        if (doc.path) addApprovedFile(doc.path);
      });
    }
  }
  return session;
});

ipcMain.handle('history:getRecent', async (event) => {
  if (!validateIpcSender(event)) return { files: [], workspaces: [] };
  return {
    files: getRecentFiles(12),
    workspaces: getRecentWorkspaces(10),
  };
});

ipcMain.handle('settings:get', async (event, key: string) => {
  if (!validateIpcSender(event)) return null;
  return getSetting(key);
});

ipcMain.handle('settings:set', async (event, { key, value }: { key: string; value: string }) => {
  if (!validateIpcSender(event)) return false;
  setSetting(key, value);
  return true;
});

ipcMain.handle('workspace:watch', async (event, folderPath: string) => {
  if (!validateIpcSender(event)) return false;
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  const safePath = validatePathInput(folderPath);
  addApprovedWorkspace(safePath);
  watchWorkspace(safePath, targetWin);
  return true;
});

// Terminal IPC
ipcMain.handle('terminal:init', async (event, cwd?: string) => {
  if (!validateIpcSender(event)) return false;
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  initTerminalSession(cwd || null, targetWin);
  return true;
});

ipcMain.on('terminal:write', (event, data: string) => {
  if (!validateIpcSender(event)) return;
  writeToTerminal(data);
});

// Git IPC
ipcMain.handle('git:status', async (event, cwd: string) => {
  if (!validateIpcSender(event)) return { isRepo: false, branch: '', changes: [] };
  return getGitStatus(cwd);
});

ipcMain.handle('git:commit', async (event, { cwd, message }: { cwd: string; message: string }) => {
  if (!validateIpcSender(event)) return { success: false, error: 'Unauthorized IPC invocation' };
  return commitChanges(cwd, message);
});

// Build System & Task Runner IPC
ipcMain.handle('build:run', async (event, options: { command: string; args?: string[]; cwd?: string }) => {
  if (!validateIpcSender(event)) return { success: false, error: 'Unauthorized IPC invocation' };
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  return runBuildProcess(options, targetWin);
});

ipcMain.handle('build:stop', async (event) => {
  if (!validateIpcSender(event)) return false;
  return stopBuildProcess();
});

// Live Server & Live Reload IPC
ipcMain.handle('liveserver:start', async (event, { rootPath, port }: { rootPath: string; port?: number }) => {
  if (!validateIpcSender(event)) return { success: false, port: 0, url: '', error: 'Unauthorized' };
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  return startLiveServer(rootPath, port, targetWin);
});

ipcMain.handle('liveserver:stop', async (event) => {
  if (!validateIpcSender(event)) return false;
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  return stopLiveServer(targetWin);
});

ipcMain.handle('liveserver:status', async (event) => {
  if (!validateIpcSender(event)) return { isRunning: false, port: 0, url: '', rootPath: '' };
  return getLiveServerStatus();
});

ipcMain.handle('liveserver:openBrowser', async (event, subPath?: string) => {
  if (!validateIpcSender(event)) return false;
  openLiveServerInBrowser(subPath);
  return true;
});

ipcMain.handle('liveserver:triggerReload', async (event) => {
  if (!validateIpcSender(event)) return false;
  triggerLiveReload();
  return true;
});
