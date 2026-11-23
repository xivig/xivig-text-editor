import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../stores/editorStore';

describe('Settings Tab Deduplication and Management', () => {
  beforeEach(() => {
    // Reset store documents to a clean state
    useEditorStore.setState({
      documents: [
        {
          id: 'welcome-tab',
          path: null,
          name: 'Welcome',
          content: '',
          language: 'markdown',
          isDirty: false,
          cursor: { line: 1, col: 1 },
        },
      ],
      activeDocumentId: 'welcome-tab',
      secondaryDocumentId: null,
      activePane: 'primary',
    });
  });

  it('opens settings tab when openSettings is called', () => {
    useEditorStore.getState().openSettings();
    const state = useEditorStore.getState();

    const settingsDocs = state.documents.filter((d) => d.id === 'settings');
    expect(settingsDocs).toHaveLength(1);
    expect(state.activeDocumentId).toBe('settings');
  });

  it('does not open duplicate settings tabs when openSettings is clicked multiple times', () => {
    const store = useEditorStore.getState();

    // Click settings 3 times
    store.openSettings();
    store.openSettings();
    store.openSettings();

    const state = useEditorStore.getState();
    const settingsDocs = state.documents.filter((d) => d.id === 'settings');
    expect(settingsDocs).toHaveLength(1);
    expect(state.activeDocumentId).toBe('settings');
  });

  it('reuses existing settings tab even when openDocument is called directly with id or name', () => {
    const store = useEditorStore.getState();

    store.openSettings();
    expect(useEditorStore.getState().documents.filter((d) => d.id === 'settings')).toHaveLength(1);

    // Call openDocument directly with id: 'settings'
    store.openDocument({
      id: 'settings',
      name: 'Settings',
      content: '',
      language: 'settings',
      path: null,
    });

    // Call openDocument directly with name: 'Settings'
    store.openDocument({
      name: 'Settings',
      content: '',
      language: 'settings',
      path: null,
    });

    const state = useEditorStore.getState();
    const settingsDocs = state.documents.filter((d) => d.id === 'settings');
    expect(settingsDocs).toHaveLength(1);
    expect(state.activeDocumentId).toBe('settings');
  });

  it('cleans up duplicate settings tabs if restored from corrupted session', () => {
    // Simulate restoring a session that previously contained duplicate settings tabs
    useEditorStore.getState().setRestoredSession(
      [
        {
          id: 'settings',
          name: 'Settings',
          content: '',
          language: 'settings',
          isDirty: false,
          cursor: { line: 1, col: 1 },
          path: null,
        },
        {
          id: 'settings',
          name: 'Settings',
          content: '',
          language: 'settings',
          isDirty: false,
          cursor: { line: 1, col: 1 },
          path: null,
        },
      ],
      'settings'
    );

    const state = useEditorStore.getState();
    const settingsDocs = state.documents.filter((d) => d.id === 'settings');
    expect(settingsDocs).toHaveLength(1);
    expect(state.activeDocumentId).toBe('settings');
  });
});
