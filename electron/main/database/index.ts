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

let sqliteDb: any = null;
let fallbackFile: string = '';
let inMemoryStore: LocalStoreSchema = {
  settings: {},
  workspaces: [],
  recentFiles: [],
  session: null,
};

function loadFallbackStore(): void {
  try {
    if (fs.existsSync(fallbackFile)) {
      const data = fs.readFileSync(fallbackFile, 'utf-8');
      inMemoryStore = JSON.parse(data);
    }
  } catch (err) {
    console.error('[Xivig Store] Failed to load store file:', err);
  }
}

function persistFallbackStore(): void {
  try {
    const tmp = `${fallbackFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(inMemoryStore, null, 2), 'utf-8');
    fs.renameSync(tmp, fallbackFile);
  } catch (err) {
    console.error('[Xivig Store] Failed to persist store file:', err);
  }
}

export function initDatabase(): void {
  try {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    fallbackFile = path.join(userDataPath, 'xivig-store.json');
    loadFallbackStore();

    // Try loading native SQLite
    try {
      const Database = require('better-sqlite3');
      const dbPath = path.join(userDataPath, 'xivig-editor.db');
      sqliteDb = new Database(dbPath);
      sqliteDb.pragma('journal_mode = WAL');
      sqliteDb.pragma('synchronous = NORMAL');

      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS workspaces (
          id TEXT PRIMARY KEY,
          path TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          last_opened DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS recent_files (
          id TEXT PRIMARY KEY,
          path TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          last_opened DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS editor_sessions (
          id TEXT PRIMARY KEY,
          active_doc_id TEXT,
          active_folder TEXT,
          is_sidebar_open INTEGER DEFAULT 1,
          active_sidebar_view TEXT DEFAULT 'explorer',
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS document_states (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          path TEXT,
          name TEXT NOT NULL,
          content TEXT NOT NULL,
          language TEXT NOT NULL,
          is_dirty INTEGER DEFAULT 0,
          cursor_line INTEGER DEFAULT 1,
          cursor_col INTEGER DEFAULT 1,
          order_index INTEGER DEFAULT 0,
          FOREIGN KEY (session_id) REFERENCES editor_sessions(id) ON DELETE CASCADE
        );
      `);
      console.log('[Xivig DB] SQLite backend initialized successfully.');
    } catch (sqliteErr: any) {
      console.warn('[Xivig DB] Native SQLite unavailable, active storage using resilient JSON backend:', sqliteErr?.message);
      sqliteDb = null;
    }
  } catch (err) {
    console.error('[Xivig DB] Storage initialization error:', err);
  }
}

export function saveSession(session: SavedSession): boolean {
  if (sqliteDb) {
    try {
      const sessionId = 'default-session';
      const insertSession = sqliteDb.prepare(`
        INSERT INTO editor_sessions (id, active_doc_id, active_folder, is_sidebar_open, active_sidebar_view, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          active_doc_id = excluded.active_doc_id,
          active_folder = excluded.active_folder,
          is_sidebar_open = excluded.is_sidebar_open,
          active_sidebar_view = excluded.active_sidebar_view,
          updated_at = CURRENT_TIMESTAMP
      `);
      const deleteOldDocs = sqliteDb.prepare(`DELETE FROM document_states WHERE session_id = ?`);
      const insertDoc = sqliteDb.prepare(`
        INSERT INTO document_states (id, session_id, path, name, content, language, is_dirty, cursor_line, cursor_col, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const tx = sqliteDb.transaction(() => {
        insertSession.run(
          sessionId,
          session.activeDocId,
          session.activeFolder,
          session.isSidebarOpen ? 1 : 0,
          session.activeSidebarView
        );
        deleteOldDocs.run(sessionId);
        session.documents.forEach((doc, idx) => {
          insertDoc.run(
            doc.id,
            sessionId,
            doc.path,
            doc.name,
            doc.content,
            doc.language,
            doc.isDirty ? 1 : 0,
            doc.cursorLine,
            doc.cursorCol,
            idx
          );
        });
      });
      tx();
      return true;
    } catch (err) {
      console.error('[Xivig DB] SQLite saveSession error, falling back:', err);
    }
  }

  // Fallback engine
  inMemoryStore.session = session;
  persistFallbackStore();
  return true;
}

export function restoreSession(): SavedSession | null {
  if (sqliteDb) {
    try {
      const sessionRow = sqliteDb
        .prepare(`SELECT * FROM editor_sessions WHERE id = 'default-session'`)
        .get() as any;

      if (sessionRow) {
        const docs = sqliteDb
          .prepare(`SELECT * FROM document_states WHERE session_id = 'default-session' ORDER BY order_index ASC`)
          .all() as any[];

        return {
          activeDocId: sessionRow.active_doc_id,
          activeFolder: sessionRow.active_folder,
          isSidebarOpen: Boolean(sessionRow.is_sidebar_open),
          activeSidebarView: sessionRow.active_sidebar_view || 'explorer',
          documents: docs.map((d) => ({
            id: d.id,
            path: d.path,
            name: d.name,
            content: d.content,
            language: d.language,
            isDirty: Boolean(d.is_dirty),
            cursorLine: d.cursor_line,
            cursorCol: d.cursor_col,
            orderIndex: d.order_index,
          })),
        };
      }
    } catch (err) {
      console.error('[Xivig DB] SQLite restoreSession error, checking fallback store:', err);
    }
  }

  return inMemoryStore.session || null;
}

export function addRecentFile(filePath: string, name: string): void {
  const item: RecentItem = {
    id: `file-${Buffer.from(filePath).toString('base64url').slice(0, 32)}`,
    path: filePath,
    name,
    lastOpened: new Date().toISOString(),
  };

  if (sqliteDb) {
    try {
      sqliteDb.prepare(`
        INSERT INTO recent_files (id, path, name, last_opened)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(path) DO UPDATE SET
          name = excluded.name,
          last_opened = CURRENT_TIMESTAMP
      `).run(item.id, filePath, name);
    } catch (err) {
      console.error('[Xivig DB] SQLite addRecentFile error:', err);
    }
  }

  // Fallback
  inMemoryStore.recentFiles = [
    item,
    ...inMemoryStore.recentFiles.filter((f) => f.path !== filePath),
  ].slice(0, 20);
  persistFallbackStore();
}

export function getRecentFiles(limit = 10): RecentItem[] {
  if (sqliteDb) {
    try {
      return sqliteDb
        .prepare(`SELECT id, path, name, last_opened as lastOpened FROM recent_files ORDER BY last_opened DESC LIMIT ?`)
        .all(limit) as RecentItem[];
    } catch (err) {
      console.error('[Xivig DB] SQLite getRecentFiles error:', err);
    }
  }

  return inMemoryStore.recentFiles.slice(0, limit);
}

export function addRecentWorkspace(folderPath: string, name: string): void {
  const item: RecentItem = {
    id: `ws-${Buffer.from(folderPath).toString('base64url').slice(0, 32)}`,
    path: folderPath,
    name,
    lastOpened: new Date().toISOString(),
  };

  if (sqliteDb) {
    try {
      sqliteDb.prepare(`
        INSERT INTO workspaces (id, path, name, last_opened)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(path) DO UPDATE SET
          name = excluded.name,
          last_opened = CURRENT_TIMESTAMP
      `).run(item.id, folderPath, name);
    } catch (err) {
      console.error('[Xivig DB] SQLite addRecentWorkspace error:', err);
    }
  }

  // Fallback
  inMemoryStore.workspaces = [
    item,
    ...inMemoryStore.workspaces.filter((w) => w.path !== folderPath),
  ].slice(0, 15);
  persistFallbackStore();
}

export function getRecentWorkspaces(limit = 10): RecentItem[] {
  if (sqliteDb) {
    try {
      return sqliteDb
        .prepare(`SELECT id, path, name, last_opened as lastOpened FROM workspaces ORDER BY last_opened DESC LIMIT ?`)
        .all(limit) as RecentItem[];
    } catch (err) {
      console.error('[Xivig DB] SQLite getRecentWorkspaces error:', err);
    }
  }

  return inMemoryStore.workspaces.slice(0, limit);
}

export function setSetting(key: string, value: string): void {
  if (sqliteDb) {
    try {
      sqliteDb.prepare(`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP
      `).run(key, value);
    } catch (err) {
      console.error('[Xivig DB] SQLite setSetting error:', err);
    }
  }

  inMemoryStore.settings[key] = value;
  persistFallbackStore();
}

export function getSetting(key: string): string | null {
  if (sqliteDb) {
    try {
      const row = sqliteDb.prepare(`SELECT value FROM app_settings WHERE key = ?`).get(key) as any;
      if (row) return row.value;
    } catch (err) {
      console.error('[Xivig DB] SQLite getSetting error:', err);
    }
  }

  return inMemoryStore.settings[key] ?? null;
}
