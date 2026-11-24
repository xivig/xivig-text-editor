import { describe, it, expect } from 'vitest';
import { migrateStore, CURRENT_STORE_SCHEMA_VERSION } from '../main/database';

describe('Session & Store: Corrupted JSON Recovery', () => {
  it('recovers cleanly when the raw store input is completely corrupted or not an object', () => {
    const corruptInputs = [
      null,
      undefined,
      'truncated json string {{{',
      42,
      true,
      [],
      NaN,
    ];

    for (const input of corruptInputs) {
      const recovered = migrateStore(input);
      expect(recovered).toBeDefined();
      expect(recovered.version).toBe(CURRENT_STORE_SCHEMA_VERSION);
      expect(recovered.settings).toEqual({});
      expect(recovered.workspaces).toEqual([]);
      expect(recovered.recentFiles).toEqual([]);
      expect(recovered.session).toBeNull();
    }
  });

  it('recovers when session document items are partially truncated or have missing required fields', () => {
    const corruptSessionStore = {
      version: 2,
      session: {
        activeDocId: 'valid-doc',
        activeFolder: 'E:/workspace',
        isSidebarOpen: true,
        documents: [
          // Corrupt 1: missing name
          { id: 'bad-1', content: 'test' },
          // Corrupt 2: non-string id
          { id: 1234, name: 'bad.ts' },
          // Corrupt 3: completely null
          null,
          // Corrupt 4: invalid line/col types
          {
            id: 'valid-doc',
            name: 'app.ts',
            cursorLine: 'invalid-string',
            cursorCol: -10,
          },
        ],
      },
    };

    const recovered = migrateStore(corruptSessionStore);
    expect(recovered.session).not.toBeNull();
    expect(recovered.session?.documents).toHaveLength(1);

    const doc = recovered.session!.documents[0];
    expect(doc.id).toBe('valid-doc');
    expect(doc.name).toBe('app.ts');
    // Sanity defaults applied
    expect(doc.cursorLine).toBe(1);
    expect(doc.cursorCol).toBe(1);
    expect(doc.isDirty).toBe(false);
  });

  it('safely recovers when settings contain corrupted prototypes or nested injections', () => {
    const maliciousStore = {
      version: 1,
      settings: {
        '__proto__': 'polluted',
        'theme': 'nord',
        'tabSize': '4',
        'badObject': { eval: 'code' },
        'badArray': ['one', 'two'],
      },
    };

    const recovered = migrateStore(maliciousStore);
    expect(recovered.settings.theme).toBe('nord');
    expect(recovered.settings.tabSize).toBe('4');
    // Non-string values filtered out
    expect(recovered.settings.badObject).toBeUndefined();
    expect(recovered.settings.badArray).toBeUndefined();
  });

  it('filters out corrupt workspace entries with invalid types or empty paths', () => {
    const store = {
      version: 2,
      workspaces: [
        { id: 'ws-1', path: 'E:/valid/project', name: 'Valid Project' },
        { id: 'ws-2', path: '   ', name: 'Spaces only' },
        { id: 'ws-3', path: 12345, name: 'Number path' },
        { path: 'E:/no-id', name: 'No ID' },
      ],
    };

    const recovered = migrateStore(store);
    expect(recovered.workspaces).toHaveLength(1);
    expect(recovered.workspaces[0].id).toBe('ws-1');
  });
});
