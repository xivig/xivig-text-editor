import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';

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
  version: number;
  settings: Record<string, string>;
  workspaces: RecentItem[];
  recentFiles: RecentItem[];
  session: SavedSession | null;
  lastCheckpoint?: string;
}

export const CURRENT_STORE_SCHEMA_VERSION = 2;

let storeFile: string = '';
let backupFile: string = '';
let inMemoryStore: LocalStoreSchema = {
  version: CURRENT_STORE_SCHEMA_VERSION,
  settings: {},
  workspaces: [],
  recentFiles: [],
  session: null,
};

let persistPromise: Promise<boolean> | null = null;
let pendingPersist = false;

function migrateStore(raw: any): LocalStoreSchema {
  const version = typeof raw?.version === 'number' ? raw.version : 1;
  const migrated: LocalStoreSchema = {
    version: CURRENT_STORE_SCHEMA_VERSION,
    settings: (raw?.settings && typeof raw.settings === 'object') ? raw.settings : {},
    workspaces: Array.isArray(raw?.workspaces) ? raw.workspaces : [],
    recentFiles: Array.isArray(raw?.recentFiles) ? raw.recentFiles : [],
    session: (raw?.session && typeof raw.session === 'object') ? raw.session : null,
    lastCheckpoint: raw?.lastCheckpoint || new Date().toISOString(),
  };

  if (version < CURRENT_STORE_SCHEMA_VERSION) {
    console.log(`[Xivig Store] Upgraded schema from v${version} to v${CURRENT_STORE_SCHEMA_VERSION}`);
  }

  return migrated;
}

function loadStore(): void {
  try {
    if (fs.existsSync(storeFile)) {
      const data = fs.readFileSync(storeFile, 'utf-8');
      const parsed = JSON.parse(data);
      inMemoryStore = migrateStore(parsed);
      return;
    }
  } catch (err) {
    console.error('[Xivig Store] Failed to load store file, trying backup:', err);
  }

  // Fallback to recovery checkpoint if primary was corrupted
  try {
    if (backupFile && fs.existsSync(backupFile)) {
      const backupData = fs.readFileSync(backupFile, 'utf-8');
      const parsedBackup = JSON.parse(backupData);
      inMemoryStore = migrateStore(parsedBackup);
      console.log('[Xivig Store] Restored from backup checkpoint.');
      return;
    }
  } catch (backupErr) {
    console.error('[Xivig Store] Backup checkpoint load failed:', backupErr);
  }
}

/**
 * Asynchronously persists the in-memory store using atomic write-then-rename
 * and maintains a reliable recovery checkpoint.
 */
async function schedulePersist(): Promise<boolean> {
  if (persistPromise) {
    pendingPersist = true;
    return persistPromise;
  }

  persistPromise = (async () => {
    try {
      if (!storeFile) return false;
      const parentDir = path.dirname(storeFile);
      await fsPromises.mkdir(parentDir, { recursive: true });

      inMemoryStore.lastCheckpoint = new Date().toISOString();
      const payload = JSON.stringify(inMemoryStore, null, 2);
      const tmp = `${storeFile}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;

      await fsPromises.writeFile(tmp, payload, 'utf-8');

      // Create backup copy of previous valid store before atomic replace
      if (fs.existsSync(storeFile)) {
        try {
          await fsPromises.copyFile(storeFile, backupFile);
        } catch {
          // Ignore copy error
        }
      }

      await fsPromises.rename(tmp, storeFile);
      return true;
    } catch (err) {
      console.error('[Xivig Store] Asynchronous persist error:', err);
      return false;
    } finally {
      persistPromise = null;
      if (pendingPersist) {
        pendingPersist = false;
        schedulePersist();
      }
    }
  })();

  return persistPromise;
}

export function initDatabase(): void {
  try {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    storeFile = path.join(userDataPath, 'xivig-store.json');
    backupFile = path.join(userDataPath, 'xivig-store.backup.json');
    loadStore();
    console.log('[Xivig DB] Storage initialized at:', storeFile);
  } catch (err) {
    console.error('[Xivig DB] Storage initialization error:', err);
  }
}

export function saveSession(session: SavedSession): boolean {
  inMemoryStore.session = session;
  schedulePersist();
  return true;
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
  schedulePersist();
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
  schedulePersist();
}

export function getRecentWorkspaces(limit = 10): RecentItem[] {
  return inMemoryStore.workspaces.slice(0, limit);
}

export function setSetting(key: string, value: string): boolean {
  inMemoryStore.settings[key] = value;
  schedulePersist();
  return true;
}

export function getSetting(key: string): string | null {
  return inMemoryStore.settings[key] ?? null;
}
