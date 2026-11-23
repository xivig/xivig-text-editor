import { describe, it, expect } from 'vitest';
import { migrateStore, CURRENT_STORE_SCHEMA_VERSION } from '../main/database';

describe('JSON Store Deep Validation (P2 Finding)', () => {
  it('drops malformed workspace and recentFile entries', () => {
    const raw = {
      version: 1,
      workspaces: [
        { id: 'valid-1', path: '/safe/project', name: 'Safe', lastOpened: '2026-11-24T00:00:00.000Z' },
        { id: '', path: '/bad', name: 'Empty ID' },
        { id: 'no-path', name: 'No Path' },
        null,
        123,
      ],
      recentFiles: [
        { id: 'f-1', path: '/safe/doc.txt', name: 'doc.txt', lastOpened: '2026-11-24T00:00:00.000Z' },
        { path: 123 },
      ],
    };

    const migrated = migrateStore(raw);
    expect(migrated.version).toBe(CURRENT_STORE_SCHEMA_VERSION);
    expect(migrated.workspaces).toHaveLength(1);
    expect(migrated.workspaces[0].name).toBe('Safe');
    expect(migrated.recentFiles).toHaveLength(1);
    expect(migrated.recentFiles[0].id).toBe('f-1');
  });

  it('validates settings keys and values strictly as strings', () => {
    const raw = {
      settings: {
        theme: 'xivig-dark',
        tabSize: '2',
        malformedKey: 42,
        invalidNested: { dangerous: true },
      },
    };

    const migrated = migrateStore(raw);
    expect(migrated.settings.theme).toBe('xivig-dark');
    expect(migrated.settings.tabSize).toBe('2');
    expect(migrated.settings.malformedKey).toBeUndefined();
    expect(migrated.settings.invalidNested).toBeUndefined();
  });

  it('deeply validates session documents and structure', () => {
    const raw = {
      session: {
        activeDocId: 'doc-1',
        activeFolder: '/my/workspace',
        isSidebarOpen: true,
        activeSidebarView: 'explorer',
        documents: [
          {
            id: 'doc-1',
            path: '/my/workspace/app.ts',
            name: 'app.ts',
            content: 'console.log(1);',
            language: 'typescript',
            isDirty: false,
            cursorLine: 5,
            cursorCol: 10,
            orderIndex: 0,
          },
          {
            // Missing id & name
            content: 'bad doc',
          },
        ],
      },
    };

    const migrated = migrateStore(raw);
    expect(migrated.session).not.toBeNull();
    expect(migrated.session?.documents).toHaveLength(1);
    expect(migrated.session?.documents[0].id).toBe('doc-1');
    expect(migrated.session?.documents[0].cursorLine).toBe(5);
  });
});
