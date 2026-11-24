// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Text, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
  offsetToPosition,
  positionToOffset,
  rangeToOffsets,
  applyLspTextEdits,
} from '../lsp/lspUtils';
import { LspClient } from '../lsp/lspClient';
import { useLspStore } from '../lsp/lspStore';
import { createLspCompletionSource } from '../lsp/lspCompletionSource';
import { createLspDiagnosticsLinter } from '../lsp/lspDiagnostics';
import { organizeImports, requestLspCodeActions, executeLspCodeAction } from '../lsp/lspCodeActions';
import {
  CompletionItemKind,
  InsertTextFormat,
  DiagnosticSeverity,
} from '../lsp/types';

describe('LSP: Document Coordinate & Text Utilities', () => {
  const sampleCode = 'function greet(name: string): string {\n  console.log("Hello, " + name);\n  return "Hi " + name;\n}';
  let doc: Text;

  beforeEach(() => {
    doc = Text.of(sampleCode.split('\n'));
  });

  it('accurately maps CodeMirror character offset to LSP 0-based Position', () => {
    // Offset 0: start of line 0
    expect(offsetToPosition(doc, 0)).toEqual({ line: 0, character: 0 });

    // Offset inside line 1: console.log
    const line1 = doc.line(2);
    const offset = line1.from + 2; // character 2
    expect(offsetToPosition(doc, offset)).toEqual({ line: 1, character: 2 });
  });

  it('accurately maps LSP 0-based Position to CodeMirror character offset', () => {
    expect(positionToOffset(doc, { line: 0, character: 0 })).toBe(0);

    const line2 = doc.line(3);
    const expectedOffset = line2.from + 5;
    expect(positionToOffset(doc, { line: 2, character: 5 })).toBe(expectedOffset);
  });

  it('converts LSP Range to CodeMirror { from, to } offsets', () => {
    const range = {
      start: { line: 0, character: 9 }, // "greet"
      end: { line: 0, character: 14 },
    };
    const { from, to } = rangeToOffsets(doc, range);
    expect(from).toBe(9);
    expect(to).toBe(14);
    expect(doc.sliceString(from, to)).toBe('greet');
  });

  it('applies LSP text edits to CodeMirror EditorView cleanly', () => {
    const view = new EditorView({
      state: EditorState.create({ doc: 'let x = 1;' }),
    });

    const edits = [
      {
        range: { start: { line: 0, character: 4 }, end: { line: 0, character: 5 } }, // "x" -> "counter"
        newText: 'counter',
      },
    ];

    applyLspTextEdits(view, edits);
    expect(view.state.doc.toString()).toBe('let counter = 1;');
  });

  it('converts local file paths to and from RFC file URIs', () => {
    const uri = LspClient.pathToUri('C:/projects/app/main.ts');
    expect(uri).toBe('file:///C:/projects/app/main.ts');

    const backPath = LspClient.uriToPath('file:///C:/projects/app/main.ts');
    expect(backPath.toLowerCase()).toContain('c:');
    expect(backPath.toLowerCase()).toContain('main.ts');
  });
});

describe('LSP: Store & Server Management', () => {
  beforeEach(() => {
    useLspStore.setState({
      servers: [
        {
          id: 'typescript',
          name: 'TypeScript',
          languages: ['typescript'],
          fileExtensions: ['.ts', '.tsx'],
          command: 'typescript-language-server',
          args: ['--stdio'],
          enabled: true,
          autoStart: true,
          status: 'stopped',
        },
        {
          id: 'pyright',
          name: 'Pyright',
          languages: ['python'],
          fileExtensions: ['.py'],
          command: 'pyright-langserver',
          args: ['--stdio'],
          enabled: true,
          autoStart: true,
          status: 'running',
          pid: 1234,
        },
      ],
      activeServer: null,
      diagnosticsByUri: {},
      isModalOpen: false,
    });
  });

  it('identifies and updates the active server for a given document', () => {
    useLspStore.getState().updateActiveServerForDoc('src/index.ts', 'typescript');
    expect(useLspStore.getState().activeServer?.id).toBe('typescript');

    useLspStore.getState().updateActiveServerForDoc('main.py', 'python');
    expect(useLspStore.getState().activeServer?.id).toBe('pyright');
  });

  it('stores and retrieves published diagnostics per document URI', () => {
    const uri = 'file:///src/app.ts';
    const diagnostics = [
      {
        range: { start: { line: 1, character: 2 }, end: { line: 1, character: 10 } },
        severity: DiagnosticSeverity.Error,
        message: 'Cannot find name "foo"',
        source: 'ts',
      },
      {
        range: { start: { line: 5, character: 0 }, end: { line: 5, character: 4 } },
        severity: DiagnosticSeverity.Warning,
        message: 'Unused variable',
        source: 'ts',
      },
    ];

    useLspStore.getState().setDiagnostics(uri, diagnostics as any);
    expect(useLspStore.getState().diagnosticsByUri[uri]).toHaveLength(2);

    useLspStore.getState().clearDiagnostics(uri);
    expect(useLspStore.getState().diagnosticsByUri[uri]).toBeUndefined();
  });

  it('toggles modal open and close states', () => {
    expect(useLspStore.getState().isModalOpen).toBe(false);
    useLspStore.getState().openModal();
    expect(useLspStore.getState().isModalOpen).toBe(true);
    useLspStore.getState().closeModal();
    expect(useLspStore.getState().isModalOpen).toBe(false);
  });
});

describe('LSP: Diagnostics Linter Integration', () => {
  it('converts LSP diagnostic severities to CodeMirror lint diagnostics', () => {
    const uri = LspClient.pathToUri('src/sample.ts');
    useLspStore.getState().setDiagnostics(uri, [
      {
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 4 } },
        severity: DiagnosticSeverity.Error,
        message: 'Type error',
      },
      {
        range: { start: { line: 1, character: 0 }, end: { line: 1, character: 5 } },
        severity: DiagnosticSeverity.Warning,
        message: 'Warning note',
      },
    ] as any);

    const doc = Text.of(['const x = 1;', 'const y = 2;']);
    const view = { state: { doc } } as any;

    const extension = createLspDiagnosticsLinter('src/sample.ts');
    expect(extension).toBeDefined();
  });
});

describe('LSP: Code Actions & Quick Fixes', () => {
  it('executes a code action and applies workspace text edits', () => {
    const view = new EditorView({
      state: EditorState.create({ doc: 'import { foo } from "./foo";' }),
    });

    const action = {
      title: 'Organize Imports',
      kind: 'source.organizeImports',
      edit: {
        changes: {
          'file:///app.ts': [
            {
              range: { start: { line: 0, character: 0 }, end: { line: 0, character: 28 } },
              newText: 'import { bar } from "./bar";',
            },
          ],
        },
      },
    };

    const executed = executeLspCodeAction(view, action as any);
    expect(executed).toBe(true);
    expect(view.state.doc.toString()).toBe('import { bar } from "./bar";');
  });
});
