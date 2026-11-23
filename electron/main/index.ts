import { app, BrowserWindow, ipcMain, dialog, shell, session } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
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
import {
  getGitStatus,
  commitChanges,
  stageFile,
  unstageFile,
  stageAll,
  unstageAll,
  discardChanges,
  getGitDiff,
} from './git';
import { runBuildProcess, stopBuildProcess, stopAllBuildProcesses } from './build';
import {
  startLiveServer,
  stopLiveServer,
  getLiveServerStatus,
  openLiveServerInBrowser,
  triggerLiveReload,
} from './liveserver';
import {
  checkGitHubRelease,
  openReleaseUrl,
  startDownloadUpdate,
  applyUpdateAndRestart,
  getDownloadedUpdateInfo,
} from './updater';
import {
  validateIpcSender,
  setExpectedRendererDist,
  addApprovedWorkspace,
  removeApprovedWorkspace,
  addApprovedFile,
  validatePathInput,
  validateContentPayload,
  isPathAuthorized,
  assertPathAuthorized,
  assertImmediateDestructiveAuthorization,
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

  // Security: Strict navigation controls preventing arbitrary local or external navigations
  currentWin.webContents.on('will-navigate', (event, navigationUrl) => {
    const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

    if (isDev) {
      try {
        const expectedOrigin = new URL(process.env.VITE_DEV_SERVER_URL!).origin;
        const targetOrigin = new URL(navigationUrl).origin;
        if (targetOrigin === expectedOrigin) {
          return;
        }
      } catch {
        // Fall through to deny
      }
    } else {
      // In production, navigation is strictly limited to the packaged index.html URL
      try {
        const expectedHref = pathToFileURL(indexHtml).href;
        if (navigationUrl === expectedHref) {
          return;
        }
      } catch {
        // Fall through to deny
      }
    }

    event.preventDefault();
    if (navigationUrl.startsWith('https:') || navigationUrl.startsWith('http:') || navigationUrl.startsWith('mailto:')) {
      shell.openExternal(navigationUrl);
    }
  });

  currentWin.on('maximize', () => {
    currentWin.webContents.send('window-state-changed', { isMaximized: true });
  });

  currentWin.on('unmaximize', () => {
    currentWin.webContents.send('window-state-changed', { isMaximized: false });
  });

  // Background update check and auto-update flow for installed editor
  const performBackgroundUpdateCheck = async () => {
    if (!currentWin || currentWin.isDestroyed()) return;
    try {
      const updateInfo = await checkGitHubRelease();
      if (updateInfo.updateAvailable && !currentWin.isDestroyed()) {
        currentWin.webContents.send('updater:available', updateInfo);
        // Automatically download update package in background if available
        if (updateInfo.downloadUrl) {
          startDownloadUpdate(currentWin).catch(() => {});
        }
      }
    } catch {
      // Silently ignore background check errors
    }
  };

  setTimeout(performBackgroundUpdateCheck, 4500);
  const updateInterval = setInterval(performBackgroundUpdateCheck, 30 * 60 * 1000);

  // Clean up per-window background services when THIS window closes
  currentWin.on('closed', () => {
    clearInterval(updateInterval);
    stopWatching(currentWin.id);
    stopTerminal(currentWin.id);
    stopBuildProcess(currentWin);
    stopLiveServer(currentWin);

    openWindows.delete(currentWin);
    if (activeWindow === currentWin) {
      activeWindow = Array.from(openWindows)[0] || null;
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  setExpectedRendererDist(RENDERER_DIST);
  initDatabase();

  const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

  // Content-Security-Policy enforcement
  // Production policy eliminates 'unsafe-inline' from script-src to prevent script injection.
  const cspHeader = isDev
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:* ws://localhost:*;"
    : "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:*;";

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspHeader],
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
  stopTerminal();
  stopAllBuildProcesses();
  stopLiveServer();
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

// File dialogs & System operations (Only explicit user selection approves paths)
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
    // Explicit user approval through native folder dialog
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
    assertImmediateDestructiveAuthorization(safePath, 'file:save');

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
  // Explicit user approval through native save dialog
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

// File Management operations (create, delete, rename, duplicate)
ipcMain.handle('file:create', async (event, { targetPath, isDirectory }: { targetPath: string; isDirectory: boolean }) => {
  if (!validateIpcSender(event)) {
    return { success: false, error: 'Unauthorized IPC invocation' };
  }

  try {
    const safePath = validatePathInput(targetPath);
    assertImmediateDestructiveAuthorization(safePath, 'file:create');

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
    assertImmediateDestructiveAuthorization(safePath, 'file:delete');

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
    assertImmediateDestructiveAuthorization(safeOld, 'file:rename (source)');
    assertImmediateDestructiveAuthorization(safeNew, 'file:rename (destination)');

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
    assertImmediateDestructiveAuthorization(safeTarget, 'file:duplicate (destination)');

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

// Finding 1 fix: Session restoration never automatically grants workspace authorization.
ipcMain.handle('session:restore', async (event) => {
  if (!validateIpcSender(event)) return null;
  const session = restoreSession();
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();

  if (session && targetWin) {
    // Only watch if this path is already an approved workspace
    if (session.activeFolder && isPathAuthorized(session.activeFolder)) {
      watchWorkspace(session.activeFolder, targetWin);
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

// Finding 1 fix: watchWorkspace is strictly separated from addApprovedWorkspace.
ipcMain.handle('workspace:watch', async (event, folderPath: string) => {
  if (!validateIpcSender(event)) return false;
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  const safePath = validatePathInput(folderPath);

  // Require path to already be authorized
  assertPathAuthorized(safePath, 'workspace:watch');
  watchWorkspace(safePath, targetWin);
  return true;
});

ipcMain.handle('workspace:close', async (event, folderPath?: string) => {
  if (!validateIpcSender(event)) return false;
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  if (targetWin) {
    stopWatching(targetWin.id);
  }
  if (folderPath) {
    removeApprovedWorkspace(folderPath);
  }
  return true;
});

// Terminal IPC (Per-window session management)
ipcMain.handle('terminal:init', async (event, cwd?: string) => {
  if (!validateIpcSender(event)) return false;
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  return initTerminalSession(cwd || null, targetWin);
});

ipcMain.on('terminal:write', (event, data: string) => {
  if (!validateIpcSender(event)) return;
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  if (targetWin) {
    writeToTerminal(targetWin.id, data);
  }
});

// Git IPC (Selective staging, diffing, and safe commit)
ipcMain.handle('git:status', async (event, cwd: string) => {
  if (!validateIpcSender(event)) return { isRepo: false, branch: '', changes: [] };
  return getGitStatus(cwd);
});

ipcMain.handle('git:stage', async (event, { cwd, filePath }: { cwd: string; filePath: string }) => {
  if (!validateIpcSender(event)) return { success: false, error: 'Unauthorized IPC invocation' };
  return stageFile(cwd, filePath);
});

ipcMain.handle('git:unstage', async (event, { cwd, filePath }: { cwd: string; filePath: string }) => {
  if (!validateIpcSender(event)) return { success: false, error: 'Unauthorized IPC invocation' };
  return unstageFile(cwd, filePath);
});

ipcMain.handle('git:stageAll', async (event, cwd: string) => {
  if (!validateIpcSender(event)) return { success: false, error: 'Unauthorized IPC invocation' };
  return stageAll(cwd);
});

ipcMain.handle('git:unstageAll', async (event, cwd: string) => {
  if (!validateIpcSender(event)) return { success: false, error: 'Unauthorized IPC invocation' };
  return unstageAll(cwd);
});

ipcMain.handle('git:discard', async (event, { cwd, filePath }: { cwd: string; filePath: string }) => {
  if (!validateIpcSender(event)) return { success: false, error: 'Unauthorized IPC invocation' };
  return discardChanges(cwd, filePath);
});

ipcMain.handle('git:diff', async (event, { cwd, filePath, staged }: { cwd: string; filePath?: string; staged?: boolean }) => {
  if (!validateIpcSender(event)) return { success: false, error: 'Unauthorized IPC invocation' };
  return getGitDiff(cwd, filePath, staged);
});

ipcMain.handle('git:commit', async (event, { cwd, message }: { cwd: string; message: string }) => {
  if (!validateIpcSender(event)) return { success: false, error: 'Unauthorized IPC invocation' };
  return commitChanges(cwd, message);
});

// Build System & Task Runner IPC (Per-window tracking & safe Windows execution)
ipcMain.handle('build:run', async (event, options: { command: string; args?: string[]; cwd?: string }) => {
  if (!validateIpcSender(event)) return { success: false, error: 'Unauthorized IPC invocation' };
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  return runBuildProcess(options, targetWin);
});

ipcMain.handle('build:stop', async (event) => {
  if (!validateIpcSender(event)) return false;
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  return stopBuildProcess(targetWin);
});

// Live Server & Live Reload IPC (Per-window instances, session tokens, sensitive files denylist)
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
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  return getLiveServerStatus(targetWin?.id);
});

ipcMain.handle('liveserver:openBrowser', async (event, subPath?: string) => {
  if (!validateIpcSender(event)) return false;
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  openLiveServerInBrowser(targetWin?.id, subPath);
  return true;
});

ipcMain.handle('liveserver:triggerReload', async (event) => {
  if (!validateIpcSender(event)) return false;
  const targetWin = BrowserWindow.fromWebContents(event.sender) || getActiveWindow();
  triggerLiveReload(targetWin?.id);
  return true;
});

// Update Notification IPC (Check releases, download packages, and apply seamless reload updates)
ipcMain.handle('updater:check', async (event) => {
  if (!validateIpcSender(event)) {
    return {
      updateAvailable: false,
      currentVersion: app.getVersion() || '1.1.0',
      latestVersion: app.getVersion() || '1.1.0',
      error: 'Unauthorized IPC invocation',
    };
  }
  return checkGitHubRelease();
});

ipcMain.handle('updater:download', async (event) => {
  if (!validateIpcSender(event)) return { success: false, error: 'Unauthorized IPC' };
  const win = BrowserWindow.fromWebContents(event.sender);
  return startDownloadUpdate(win);
});

ipcMain.handle('updater:apply-and-restart', async (event) => {
  if (!validateIpcSender(event)) return { success: false, error: 'Unauthorized IPC' };
  return applyUpdateAndRestart();
});

ipcMain.handle('updater:status', async (event) => {
  if (!validateIpcSender(event)) return null;
  return getDownloadedUpdateInfo();
});

ipcMain.handle('updater:openRelease', async (event, releaseUrl?: string) => {
  if (!validateIpcSender(event)) return false;
  openReleaseUrl(releaseUrl);
  return true;
});

// Application Metadata IPC
ipcMain.handle('app:info', async (event) => {
  if (!validateIpcSender(event)) return null;
  return {
    name: app.getName() || 'Xivig Text Editor',
    version: app.getVersion() || '1.1.0',
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
    platform: process.platform,
  };
});
