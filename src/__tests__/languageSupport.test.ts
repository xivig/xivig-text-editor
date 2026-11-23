import { describe, it, expect, beforeEach } from 'vitest';
import { EditorState } from '@codemirror/state';
import { syntaxTree, indentRange } from '@codemirror/language';
import { getLanguageExtension, detectLanguageName } from '../components/editor/languageSupport';
import { autoIndentAndFormatEditor, beautifyCode } from '../utils/beautify';
import { useEditorStore } from '../stores/editorStore';
import { useSettingsStore } from '../stores/settingsStore';

describe('Language Support and Syntax Highlighting', () => {
  it('detects language names correctly for various file types and language ids', () => {
    expect(detectLanguageName('App.java')).toBe('Java');
    expect(detectLanguageName('main.c')).toBe('C');
    expect(detectLanguageName('main.cpp')).toBe('C++');
    expect(detectLanguageName('Program.cs')).toBe('C#');
    expect(detectLanguageName('script.py')).toBe('Python');
    expect(detectLanguageName('query.sql')).toBe('SQL');
    expect(detectLanguageName('config.yaml')).toBe('YAML');
    expect(detectLanguageName('service.go')).toBe('Go');
    expect(detectLanguageName('index.php')).toBe('PHP');
    expect(detectLanguageName('deploy.sh')).toBe('Shell Script');
    expect(detectLanguageName('index.html')).toBe('HTML');
    expect(detectLanguageName('style.css')).toBe('CSS');
    expect(detectLanguageName('index.js')).toBe('JavaScript');
    expect(detectLanguageName('index.ts')).toBe('TypeScript');
    expect(detectLanguageName('notes.txt')).toBe('Plain Text');
  });

  it('provides active CodeMirror language extension for Java and builds syntax tree', () => {
    const javaExt = getLanguageExtension('java', 'App.java');
    expect(javaExt).toBeDefined();

    const state = EditorState.create({
      doc: 'package com.example;\n\npublic class App {\n  public static void main(String[] args) {\n    System.out.println("Hello Java");\n  }\n}',
      extensions: [javaExt],
    });

    expect(state.doc.lines).toBe(7);

    const tree = syntaxTree(state);
    expect(tree).toBeDefined();
    expect(tree.length).toBeGreaterThan(0);
  });

  it('provides active CodeMirror language extension for C and C++', () => {
    const cExt = getLanguageExtension('c', 'main.c');
    expect(cExt).toBeDefined();

    const cppExt = getLanguageExtension('cpp', 'main.cpp');
    expect(cppExt).toBeDefined();

    const state = EditorState.create({
      doc: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello C++" << endl;\n  return 0;\n}',
      extensions: [cppExt],
    });

    expect(state.doc.lines).toBe(7);
    const tree = syntaxTree(state);
    expect(tree).toBeDefined();
  });

  it('respects language selection even when filename is generic (e.g. Untitled-1)', () => {
    const ext = getLanguageExtension('java', 'Untitled-1');
    expect(ext).toBeDefined();

    const state = EditorState.create({
      doc: 'public class Test {}',
      extensions: [ext],
    });

    expect(state.doc.lines).toBe(1);
    expect(detectLanguageName('Untitled-1', 'java')).toBe('Java');
  });

  it('supports indentation calculations with indentRange for C-like languages', () => {
    const javaExt = getLanguageExtension('java', 'App.java');
    const state = EditorState.create({
      doc: 'public class App {\npublic static void main() {\nint x = 1;\n}\n}',
      extensions: [javaExt],
    });

    const tx = indentRange(state, 0, state.doc.length);
    expect(tx).toBeDefined();
  });
});

describe('Auto-Indent on Save and Settings', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: {
        fontSize: 14,
        fontFamily: 'monospace',
        lineHeight: 1.6,
        tabSize: 2,
        wordWrap: false,
        lineNumbers: true,
        minimap: true,
        theme: 'xivig-dark',
        autoSave: true,
        fontLigatures: true,
        showWelcomeOnStartup: true,
        autoIndentOnSave: true,
      },
    });

    useEditorStore.setState({
      documents: [
        {
          id: 'doc-java',
          name: 'Main.java',
          content: 'public class Main{\npublic static void main(String[] args){\nSystem.out.println("hello");\n}\n}',
          language: 'java',
          path: '/path/Main.java',
          isDirty: true,
          cursor: { line: 1, col: 1 },
        },
      ],
      activeDocumentId: 'doc-java',
      secondaryDocumentId: null,
      activePane: 'primary',
    });
  });

  it('verifies autoIndentOnSave defaults to true and can be toggled', () => {
    expect(useSettingsStore.getState().settings.autoIndentOnSave).toBe(true);
    useSettingsStore.getState().updateSettings({ autoIndentOnSave: false });
    expect(useSettingsStore.getState().settings.autoIndentOnSave).toBe(false);
  });

  it('auto-indents and formats Java code according to tabSize', () => {
    let currentDoc = 'public class Main{\npublic static void main(String[] args){\nSystem.out.println("hello");\n}\n}';
    const mockView = {
      state: {
        doc: {
          length: currentDoc.length,
          toString: () => currentDoc,
        },
      },
      dispatch: (action: any) => {
        if (action.changes?.insert) {
          currentDoc = action.changes.insert;
        }
      },
    } as any;

    const formatted = autoIndentAndFormatEditor(mockView, 'Main.java', 'java');
    expect(formatted).toContain('public class Main {');
    expect(formatted).toContain('  public static void main(String[] args) {');
    expect(formatted).toContain('    System.out.println("hello");');
    expect(formatted).toContain('  }');
    expect(formatted).toContain('}');
  });

  it('safely handles Python code without corrupting python block indentation', () => {
    const pythonCode = 'def calculate(x, y):\n    total = x + y\n    if total > 10:\n        return total * 2\n    return total\n';
    const mockView = {
      state: {
        doc: {
          length: pythonCode.length,
          toString: () => pythonCode,
        },
      },
      dispatch: () => {},
    } as any;

    const result = autoIndentAndFormatEditor(mockView, 'script.py', 'python');
    expect(result).toBe(pythonCode);
  });

  it('preserves plain text and markdown without arbitrary mangling', () => {
    const notes = '# My Notes\n\n- Item 1\n  - Subitem 1.1\n    - Subitem 1.1.1\n';
    const mockView = {
      state: {
        doc: {
          length: notes.length,
          toString: () => notes,
        },
      },
      dispatch: () => {},
    } as any;

    const result = autoIndentAndFormatEditor(mockView, 'notes.md', 'markdown');
    expect(result).toBe(notes);
  });
});
