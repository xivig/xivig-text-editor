import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

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

export interface RecentItem {
  id: string;
  path: string;
  name: string;
  lastOpened: string;
}

interface LocalStoreSchema {
  settings: Record<string, string>;
  workspaces: RecentItem[];
  recentFiles: RecentItem[];
  session: SavedSession | null;
}

let fallbackFile: string = '';
let inMemoryStore: LocalStoreSchema = {
  settings: {},
  workspaces: [],
  recentFiles: [],
  session: null,
};

function loadStore(): void {
  try {
    if (fs.existsSync(fallbackFile)) {
      const data = fs.readFileSync(fallbackFile, 'utf-8');
      inMemoryStore = JSON.parse(data);
    }
  } catch (err) {
    console.error('[Xivig Store] Failed to load store file:', err);
  }
}

function persistStore(): boolean {
  if (!fallbackFile) return false;
  try {
    const parentDir = path.dirname(fallbackFile);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    const tmp = `${fallbackFile}.tmp.${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(inMemoryStore, null, 2), 'utf-8');
    fs.renameSync(tmp, fallbackFile);
    return true;
  } catch (err) {
    console.error('[Xivig Store] Failed to persist store file:', err);
    return false;
  }
}

export function initDatabase(): void {
  try {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    fallbackFile = path.join(userDataPath, 'xivig-store.json');
    loadStore();
    console.log('[Xivig DB] Persistent storage initialized at:', fallbackFile);
  } catch (err) {
    console.error('[Xivig DB] Storage initialization error:', err);
  }
}

export function saveSession(session: SavedSession): boolean {
  inMemoryStore.session = session;
  return persistStore();
}

export function restoreSession(): SavedSession | null {
  return inMemoryStore.session || null;
}

export function addRecentFile(filePath: string, name: string): void {
  const item: RecentItem = {
    id: `file-${Buffer.from(filePath).toString('base64url').slice(0, 32)}`,
    path: filePath,
    name,
    lastOpened: new Date().toISOString(),
  };

  inMemoryStore.recentFiles = [
    item,
    ...inMemoryStore.recentFiles.filter((f) => f.path !== filePath),
  ].slice(0, 20);
  persistStore();
}

export function getRecentFiles(limit = 10): RecentItem[] {
  return inMemoryStore.recentFiles.slice(0, limit);
}

export function addRecentWorkspace(folderPath: string, name: string): void {
  const item: RecentItem = {
    id: `ws-${Buffer.from(folderPath).toString('base64url').slice(0, 32)}`,
    path: folderPath,
    name,
    lastOpened: new Date().toISOString(),
  };

  inMemoryStore.workspaces = [
    item,
    ...inMemoryStore.workspaces.filter((w) => w.path !== folderPath),
  ].slice(0, 15);
  persistStore();
}

export function getRecentWorkspaces(limit = 10): RecentItem[] {
  return inMemoryStore.workspaces.slice(0, limit);
}

export function setSetting(key: string, value: string): boolean {
  inMemoryStore.settings[key] = value;
  return persistStore();
}

export function getSetting(key: string): string | null {
  return inMemoryStore.settings[key] ?? null;
}
