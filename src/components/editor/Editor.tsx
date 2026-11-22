import React, { useEffect, useRef } from 'react';
import {
  EditorView,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  keymap,
} from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import {
  foldGutter,
  foldKeymap,
  codeFolding,
  indentOnInput,
  bracketMatching,
} from '@codemirror/language';
import {
  history,
  defaultKeymap,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import {
  autocompletion,
  completionKeymap,
  completeAnyWord,
  closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete';

import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getEditorTheme } from './editorThemes';
import { getLanguageExtension } from './languageSupport';
import { setActiveEditorView } from './editorViewRegistry';
import { sublimeKeybindings } from './sublimeKeymap';
import { getCustomSnippetSource } from './snippets';
import { expandEmmetCommand, createEmmetCompletionSource, detectEmmetSyntax } from './emmet';
import { Minimap } from './Minimap';
import { SettingsView } from '../settings/SettingsView';
import logoUrl from '../../assets/logo.png';

interface EditorProps {
  pane?: 'primary' | 'secondary';
}

export const Editor: React.FC<EditorProps> = ({ pane = 'primary' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const theme = useSettingsStore((state) => state.settings.theme);
  const lineNumbersEnabled = useSettingsStore((state) => state.settings.lineNumbers);
  const wordWrapEnabled = useSettingsStore((state) => state.settings.wordWrap);
  const tabSize = useSettingsStore((state) => state.settings.tabSize);

  const themeCompartmentRef = useRef<Compartment>(new Compartment());
  const lineNumbersCompartmentRef = useRef<Compartment>(new Compartment());
  const wordWrapCompartmentRef = useRef<Compartment>(new Compartment());
  const tabSizeCompartmentRef = useRef<Compartment>(new Compartment());

  const activeDoc = useEditorStore((state) =>
    pane === 'secondary' ? state.getSecondaryDocument() : state.getActiveDocument()
  );
  const activeDocumentId = activeDoc?.id || null;
  const updateDocumentContent = useEditorStore((state) => state.updateDocumentContent);
  const updateCursor = useEditorStore((state) => state.updateCursor);
  const setActivePane = useEditorStore((state) => state.setActivePane);

  // Maintain active document ID in ref for updateListener
  const docIdRef = useRef(activeDocumentId);
  docIdRef.current = activeDocumentId;

  // Initialize or recreate Editor when active document changes
  useEffect(() => {
    if (!containerRef.current || !activeDoc) {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      return;
    }

    // Destroy existing view
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const langExtension = getLanguageExtension(activeDoc.name || activeDoc.language);

    const startState = EditorState.create({
      doc: activeDoc.content,
      extensions: [
        themeCompartmentRef.current.of(getEditorTheme(theme)),
        lineNumbersCompartmentRef.current.of(
          lineNumbersEnabled ? [lineNumbers(), highlightActiveLineGutter()] : []
        ),
        wordWrapCompartmentRef.current.of(
          wordWrapEnabled ? EditorView.lineWrapping : []
        ),
        tabSizeCompartmentRef.current.of(
          EditorState.tabSize.of(tabSize)
        ),
        highlightSpecialChars(),
        history(),
        codeFolding(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion({
          override: [
            createEmmetCompletionSource(() => detectEmmetSyntax(activeDoc.name || activeDoc.language)),
            getCustomSnippetSource(activeDoc.language || activeDoc.name),
            completeAnyWord,
          ],
          defaultKeymap: true,
        }),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        langExtension,
        keymap.of([
          {
            key: 'Tab',
            run: (v) => expandEmmetCommand(v, detectEmmetSyntax(activeDoc.name || activeDoc.language)),
          },
          {
            key: 'Ctrl-e',
            run: (v) => expandEmmetCommand(v, detectEmmetSyntax(activeDoc.name || activeDoc.language)),
          },
          ...sublimeKeybindings,
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),
        EditorView.updateListener.of((update) => {
          if (!docIdRef.current) return;

          // Track cursor position
          if (update.selectionSet || update.docChanged) {
            const head = update.state.selection.main.head;
            const line = update.state.doc.lineAt(head);
            const lineNum = line.number;
            const colNum = head - line.from + 1;
            updateCursor(docIdRef.current, lineNum, colNum);
          }

          // Track content changes
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            updateDocumentContent(docIdRef.current, newContent);
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;
    setActiveEditorView(view);

    return () => {
      view.destroy();
      viewRef.current = null;
      setActiveEditorView(null);
    };
  }, [activeDocumentId]);

  // Dynamically reconfigure theme when user switches themes in Settings
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: themeCompartmentRef.current.reconfigure(getEditorTheme(theme)),
      });
    }
  }, [theme]);

  // Dynamically reconfigure line numbers
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: lineNumbersCompartmentRef.current.reconfigure(
          lineNumbersEnabled ? [lineNumbers(), highlightActiveLineGutter()] : []
        ),
      });
    }
  }, [lineNumbersEnabled]);

  // Dynamically reconfigure word wrap
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: wordWrapCompartmentRef.current.reconfigure(
          wordWrapEnabled ? EditorView.lineWrapping : []
        ),
      });
    }
  }, [wordWrapEnabled]);

  // Dynamically reconfigure tab size
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: tabSizeCompartmentRef.current.reconfigure(
          EditorState.tabSize.of(tabSize)
        ),
      });
    }
  }, [tabSize]);

  if (activeDoc?.id === 'settings') {
    return <SettingsView />;
  }

  if (!activeDoc) {
    return (
      <div style={emptyContainerStyle}>
        <div style={emptyContentStyle}>
          <img
            src={logoUrl}
            alt="Xivig Logo"
            style={{ width: '56px', height: '56px', marginBottom: '16px', objectFit: 'contain' }}
          />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--xivig-text)', marginBottom: '8px' }}>
            No Open Documents
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--xivig-text-muted)', marginBottom: '20px' }}>
            Open a file, folder, or create a new file to start editing.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => useEditorStore.getState().createNewDocument()}
              style={actionButtonStyle}
            >
              New File (Ctrl+N)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseDown={() => {
        setActivePane(pane);
        if (viewRef.current) setActiveEditorView(viewRef.current);
      }}
      style={{ width: '100%', height: '100%', display: 'flex', overflow: 'hidden' }}
    >
      <div
        ref={containerRef}
        style={{
          flex: 1,
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      />
      <Minimap view={viewRef.current} content={activeDoc.content} />
    </div>
  );
};

const emptyContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'var(--xivig-editor)',
};

const emptyContentStyle: React.CSSProperties = {
  textAlign: 'center',
  maxWidth: '400px',
  padding: '32px',
};

const actionButtonStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-accent)',
  color: '#ffffff',
  padding: '8px 16px',
  borderRadius: '4px',
  fontWeight: 500,
  fontSize: '13px',
};
