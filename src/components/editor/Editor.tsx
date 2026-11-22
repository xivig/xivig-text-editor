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
import { EditorState } from '@codemirror/state';
import {
  foldGutter,
  foldKeymap,
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
  closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete';

import { useEditorStore } from '../../stores/editorStore';
import { xivigSyntaxTheme } from './xivigTheme';
import { getLanguageExtension } from './languageSupport';
import { setActiveEditorView } from './editorViewRegistry';
import { sublimeKeybindings } from './sublimeKeymap';
import { Minimap } from './Minimap';
import logoUrl from '../../assets/logo.png';

interface EditorProps {
  pane?: 'primary' | 'secondary';
}

export const Editor: React.FC<EditorProps> = ({ pane = 'primary' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

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
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        xivigSyntaxTheme,
        langExtension,
        keymap.of([
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
