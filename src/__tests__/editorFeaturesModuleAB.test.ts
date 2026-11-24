import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../stores/editorStore';
import { useSettingsStore } from '../stores/settingsStore';
import { prepareContentForSave } from '../utils/saveUtils';

describe('Module A & B Core and Advanced Features', () => {
  beforeEach(() => {
    useEditorStore.setState({
      documents: [
        {
          id: 'test-doc-1',
          path: '/test/path.js',
          name: 'path.js',
          content: 'function test() { return 1; }',
          language: 'javascript',
          isDirty: false,
          cursor: { line: 1, col: 1 },
        },
      ],
      activeDocumentId: 'test-doc-1',
    });
  });

  describe('Read-Only file mode', () => {
    it('toggles read-only mode for active document', () => {
      const store = useEditorStore.getState();
      expect(store.documents[0].isReadOnly).toBeFalsy();

      store.toggleReadOnly('test-doc-1');
      expect(useEditorStore.getState().documents[0].isReadOnly).toBe(true);

      store.toggleReadOnly('test-doc-1');
      expect(useEditorStore.getState().documents[0].isReadOnly).toBe(false);
    });

    it('sets read-only state explicitly', () => {
      const store = useEditorStore.getState();
      store.setReadOnly('test-doc-1', true);
      expect(useEditorStore.getState().documents[0].isReadOnly).toBe(true);

      store.setReadOnly('test-doc-1', false);
      expect(useEditorStore.getState().documents[0].isReadOnly).toBe(false);
    });
  });

  describe('Whitespace and save preparation', () => {
    it('trims trailing whitespace when setting is enabled', () => {
      useSettingsStore.getState().updateSettings({
        trimTrailingWhitespace: true,
        autoIndentOnSave: false,
        insertFinalNewline: false,
      });

      const raw = 'const a = 1;   \nconst b = 2;\t\t';
      const prepared = prepareContentForSave(raw, 'file.js', 'javascript', null);
      expect(prepared).toBe('const a = 1;\nconst b = 2;');
    });

    it('inserts final newline when setting is enabled', () => {
      useSettingsStore.getState().updateSettings({
        trimTrailingWhitespace: false,
        autoIndentOnSave: false,
        insertFinalNewline: true,
      });

      const raw = 'console.log("hello");';
      const prepared = prepareContentForSave(raw, 'file.js', 'javascript', null);
      expect(prepared).toBe('console.log("hello");\n');
    });

    it('allows configuring renderWhitespace in settings store', () => {
      useSettingsStore.getState().updateSettings({ renderWhitespace: 'all' });
      expect(useSettingsStore.getState().settings.renderWhitespace).toBe('all');

      useSettingsStore.getState().updateSettings({ renderWhitespace: 'trailing' });
      expect(useSettingsStore.getState().settings.renderWhitespace).toBe('trailing');
    });
  });
});
