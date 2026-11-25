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

function validateRecentItem(item: any): RecentItem | null {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.id !== 'string' || !item.id.trim()) return null;
  if (typeof item.path !== 'string' || !item.path.trim()) return null;
  if (typeof item.name !== 'string' || !item.name.trim()) return null;
  const lastOpened = typeof item.lastOpened === 'string' && !isNaN(Date.parse(item.lastOpened))
    ? item.lastOpened
    : new Date().toISOString();

  return {
    id: item.id.trim(),
    path: item.path.trim(),
    name: item.name.trim(),
    lastOpened,
  };
}

function validateSavedDocument(doc: any): SavedDocumentState | null {
  if (!doc || typeof doc !== 'object') return null;
  if (typeof doc.id !== 'string' || !doc.id.trim()) return null;
  if (typeof doc.name !== 'string') return null;

  return {
    id: doc.id.trim(),
    path: typeof doc.path === 'string' && doc.path.trim() ? doc.path.trim() : null,
    name: doc.name.trim(),
    content: typeof doc.content === 'string' ? doc.content : '',
    language: typeof doc.language === 'string' ? doc.language.trim() : 'plaintext',
    isDirty: Boolean(doc.isDirty),
    cursorLine: typeof doc.cursorLine === 'number' && doc.cursorLine >= 1 ? doc.cursorLine : 1,
    cursorCol: typeof doc.cursorCol === 'number' && doc.cursorCol >= 1 ? doc.cursorCol : 1,
    orderIndex: typeof doc.orderIndex === 'number' ? doc.orderIndex : 0,
  };
}

function validateSavedSession(rawSession: any): SavedSession | null {
  if (!rawSession || typeof rawSession !== 'object') return null;

  const documents: SavedDocumentState[] = [];
  if (Array.isArray(rawSession.documents)) {
    for (const d of rawSession.documents) {
      const validDoc = validateSavedDocument(d);
      if (validDoc) documents.push(validDoc);
    }
  }

  return {
    activeDocId: typeof rawSession.activeDocId === 'string' ? rawSession.activeDocId : null,
    activeFolder: typeof rawSession.activeFolder === 'string' ? rawSession.activeFolder : null,
    isSidebarOpen: typeof rawSession.isSidebarOpen === 'boolean' ? rawSession.isSidebarOpen : true,
    activeSidebarView: typeof rawSession.activeSidebarView === 'string' ? rawSession.activeSidebarView : 'explorer',
    documents,
  };
}

export function migrateStore(raw: any): LocalStoreSchema {
  const version = typeof raw?.version === 'number' ? raw.version : 1;

  // 1. Deeply validate settings
  const safeSettings: Record<string, string> = {};
  if (raw?.settings && typeof raw.settings === 'object' && !Array.isArray(raw.settings)) {
    for (const [k, v] of Object.entries(raw.settings)) {
      if (typeof k === 'string' && typeof v === 'string') {
        safeSettings[k] = v;
      }
    }
  }

  // 2. Deeply validate workspaces
  const safeWorkspaces: RecentItem[] = [];
  if (Array.isArray(raw?.workspaces)) {
    for (const w of raw.workspaces) {
      const validW = validateRecentItem(w);
      if (validW) safeWorkspaces.push(validW);
    }
  }

  // 3. Deeply validate recent files
  const safeRecentFiles: RecentItem[] = [];
  if (Array.isArray(raw?.recentFiles)) {
    for (const f of raw.recentFiles) {
      const validF = validateRecentItem(f);
      if (validF) safeRecentFiles.push(validF);
    }
  }

  // 4. Deeply validate saved session
  const safeSession = validateSavedSession(raw?.session);

  const migrated: LocalStoreSchema = {
    version: CURRENT_STORE_SCHEMA_VERSION,
    settings: safeSettings,
    workspaces: safeWorkspaces,
    recentFiles: safeRecentFiles,
    session: safeSession,
    lastCheckpoint: typeof raw?.lastCheckpoint === 'string' ? raw.lastCheckpoint : new Date().toISOString(),
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

export async function saveSession(session: SavedSession): Promise<boolean> {
  const safeSession = validateSavedSession(session);
  inMemoryStore.session = safeSession;
  return await schedulePersist();
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

export function clearRecentHistory(): void {
  inMemoryStore.recentFiles = [];
  inMemoryStore.workspaces = [];
  schedulePersist();
}

export function setSetting(key: string, value: string): boolean {
  if (
    typeof key !== 'string' ||
    !key.trim() ||
    key === '__proto__' ||
    key === 'constructor' ||
    key === 'prototype'
  ) {
    return false;
  }
  if (typeof value !== 'string') {
    return false;
  }
  inMemoryStore.settings[key.trim()] = value;
  schedulePersist();
  return true;
}

export function getSetting(key: string): string | null {
  return inMemoryStore.settings[key] ?? null;
}
