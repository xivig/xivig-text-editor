// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
  writeClipboardText,
  readClipboardText,
  copyEditorSelection,
  cutEditorSelection,
  pasteToEditor,
  selectAllEditor,
} from '../utils/clipboard';
import { useFileStore } from '../stores/fileStore';
import { useEditorStore } from '../stores/editorStore';

describe('Clipboard & Editor Cut/Copy/Paste Actions', () => {
  let memoryClipboard = '';

  beforeEach(() => {
    memoryClipboard = '';
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(async (text: string) => {
          memoryClipboard = text;
          return true;
        }),
        readText: vi.fn(async () => {
          return memoryClipboard;
        }),
      },
    });

    useEditorStore.setState({
      documents: [
        { id: 'doc-1', name: 'main.js', language: 'javascript', content: 'console.log("Hello World");', isDirty: false, path: '/app/main.js', cursor: { line: 1, col: 0 } },
      ],
      activeDocumentId: 'doc-1',
    });
  });

  it('reads and writes clipboard text', async () => {
    await writeClipboardText('test sample text');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test sample text');
    const read = await readClipboardText();
    expect(read).toBe('test sample text');
  });

  it('copies active text selection from editor', async () => {
    const parent = document.createElement('div');
    const state = EditorState.create({
      doc: 'First line\nSecond line\nThird line',
      selection: { anchor: 0, head: 5 }, // 'First'
    });
    const view = new EditorView({ state, parent });

    const copied = await copyEditorSelection(view);
    expect(copied).toBe(true);
    expect(memoryClipboard).toBe('First');
  });

  it('copies current line when selection is empty', async () => {
    const parent = document.createElement('div');
    const state = EditorState.create({
      doc: 'First line\nSecond line',
      selection: { anchor: 2 }, // cursor on line 1
    });
    const view = new EditorView({ state, parent });

    const copied = await copyEditorSelection(view);
    expect(copied).toBe(true);
    expect(memoryClipboard).toBe('First line\n');
  });

  it('cuts active text selection from editor', async () => {
    const parent = document.createElement('div');
    const state = EditorState.create({
      doc: 'Hello Beautiful World',
      selection: { anchor: 6, head: 15 }, // 'Beautiful'
    });
    const view = new EditorView({ state, parent });

    const cut = await cutEditorSelection(view);
    expect(cut).toBe(true);
    expect(memoryClipboard).toBe('Beautiful');
    expect(view.state.doc.toString()).toBe('Hello  World');
  });

  it('cuts current line when selection is empty', async () => {
    const parent = document.createElement('div');
    const state = EditorState.create({
      doc: 'Line 1\nLine 2\nLine 3',
      selection: { anchor: 2 }, // cursor on Line 1
    });
    const view = new EditorView({ state, parent });

    const cut = await cutEditorSelection(view);
    expect(cut).toBe(true);
    expect(memoryClipboard).toBe('Line 1\n');
    expect(view.state.doc.toString()).toBe('Line 2\nLine 3');
  });

  it('pastes clipboard text at editor cursor', async () => {
    memoryClipboard = 'PASTED_CONTENT';
    const parent = document.createElement('div');
    const state = EditorState.create({
      doc: 'Start End',
      selection: { anchor: 6 }, // between 'Start ' and 'End'
    });
    const view = new EditorView({ state, parent });

    const pasted = await pasteToEditor(view);
    expect(pasted).toBe(true);
    expect(view.state.doc.toString()).toBe('Start PASTED_CONTENTEnd');
  });

  it('pastes clipboard text and replaces active selection', async () => {
    memoryClipboard = 'REPLACED';
    const parent = document.createElement('div');
    const state = EditorState.create({
      doc: 'The quick brown fox',
      selection: { anchor: 4, head: 9 }, // 'quick'
    });
    const view = new EditorView({ state, parent });

    const pasted = await pasteToEditor(view);
    expect(pasted).toBe(true);
    expect(view.state.doc.toString()).toBe('The REPLACED brown fox');
  });

  it('selects all text in editor with selectAllEditor', () => {
    const parent = document.createElement('div');
    const state = EditorState.create({
      doc: 'Line 1\nLine 2\nLine 3',
      selection: { anchor: 0 },
    });
    const view = new EditorView({ state, parent });

    selectAllEditor(view);
    expect(view.state.selection.main.from).toBe(0);
    expect(view.state.selection.main.to).toBe(state.doc.length);
  });
});

describe('Sidebar File Clipboard Operations', () => {
  beforeEach(() => {
    useFileStore.setState({
      currentFolderPath: '/project',
      fileClipboard: null,
    });
  });

  it('sets file clipboard for cut and copy', () => {
    useFileStore.getState().setFileClipboard({
      action: 'cut',
      path: '/project/app.js',
      name: 'app.js',
      isDirectory: false,
    });
    expect(useFileStore.getState().fileClipboard).toEqual({
      action: 'cut',
      path: '/project/app.js',
      name: 'app.js',
      isDirectory: false,
    });
  });

  it('pastes file with rename when action is cut', async () => {
    const mockRename = vi.fn(async () => ({ success: true }));
    (window as any).xivig = {
      renameFileOrFolder: mockRename,
    };

    useFileStore.getState().setFileClipboard({
      action: 'cut',
      path: '/project/src/index.ts',
      name: 'index.ts',
      isDirectory: false,
    });

    const res = await useFileStore.getState().pasteFileClipboard('/project/dist');
    expect(res.success).toBe(true);
    expect(mockRename).toHaveBeenCalledWith('/project/src/index.ts', '/project/dist/index.ts');
    expect(useFileStore.getState().fileClipboard).toBeNull();
  });

  it('pastes file with duplicate when action is copy', async () => {
    const mockDuplicate = vi.fn(async () => ({ success: true }));
    (window as any).xivig = {
      duplicateFile: mockDuplicate,
    };

    useFileStore.getState().setFileClipboard({
      action: 'copy',
      path: '/project/src/style.css',
      name: 'style.css',
      isDirectory: false,
    });

    const res = await useFileStore.getState().pasteFileClipboard('/project/public');
    expect(res.success).toBe(true);
    expect(mockDuplicate).toHaveBeenCalledWith('/project/src/style.css', '/project/public/style.css');
  });
});

describe('TabBar Document Management', () => {
  beforeEach(() => {
    useEditorStore.setState({
      documents: [
        { id: 'doc-1', name: 'one.js', language: 'js', content: '1', isDirty: false, path: '/one.js', cursor: { line: 1, col: 0 } },
        { id: 'doc-2', name: 'two.js', language: 'js', content: '2', isDirty: true, path: '/two.js', cursor: { line: 1, col: 0 } },
        { id: 'doc-3', name: 'three.js', language: 'js', content: '3', isDirty: false, path: '/three.js', cursor: { line: 1, col: 0 } },
      ],
      activeDocumentId: 'doc-2',
    });
  });

  it('closes other tabs leaving only target tab open', () => {
    useEditorStore.getState().closeOtherTabs('doc-2');
    const docs = useEditorStore.getState().documents;
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe('doc-2');
    expect(useEditorStore.getState().activeDocumentId).toBe('doc-2');
  });

  it('closes tabs to the right of specified tab', () => {
    useEditorStore.getState().closeTabsToTheRight('doc-2');
    const docs = useEditorStore.getState().documents;
    expect(docs).toHaveLength(2);
    expect(docs.map((d) => d.id)).toEqual(['doc-1', 'doc-2']);
  });

  it('closes tabs to the right of active tab when no id passed', () => {
    useEditorStore.getState().setActiveDocument('doc-1');
    useEditorStore.getState().closeTabsToTheRight();
    const docs = useEditorStore.getState().documents;
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe('doc-1');
  });

  it('closes all tabs and records them in history', () => {
    useEditorStore.getState().closeAllTabs();
    expect(useEditorStore.getState().documents).toHaveLength(0);
    expect(useEditorStore.getState().activeDocumentId).toBeNull();
    expect(useEditorStore.getState().closedDocumentsHistory.length).toBeGreaterThanOrEqual(3);
  });

  it('closes active document when no id passed to closeDocument', () => {
    useEditorStore.getState().setActiveDocument('doc-2');
    useEditorStore.getState().closeDocument();
    const docs = useEditorStore.getState().documents;
    expect(docs.some((d) => d.id === 'doc-2')).toBe(false);
  });

  it('closes saved (non-dirty) tabs', () => {
    useEditorStore.getState().closeSavedTabs();
    const docs = useEditorStore.getState().documents;
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe('doc-2'); // only the dirty doc remains
  });
});
