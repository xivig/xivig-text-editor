import React, { useEffect, useRef, useState } from 'react';
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
  highlightWhitespace,
  highlightTrailingWhitespace,
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
  acceptCompletion,
} from '@codemirror/autocomplete';

import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getEditorTheme } from './editorThemes';
import { getLanguageExtension } from './languageSupport';
import { setActiveEditorView } from './editorViewRegistry';
import { sublimeKeybindings } from './sublimeKeymap';
import { bookmarkField, bookmarkGutter } from './bookmarks';
import { autoRenameTagExtension } from './autoRenameTag';
import { cssColorHighlighterExtension } from './colorHighlighter';
import { getCustomSnippetSource } from './snippets';
import { createLanguageCompletionSource } from './completions';
import { expandEmmetCommand, createEmmetCompletionSource, detectEmmetSyntax } from './emmet';
import { htmlLinkedFilesTooltip } from './htmlLinkedFiles';
import { createDiagnosticsLinter } from './diagnosticsLinter';
import { hoverDocsExtension, parameterHintsExtension, codeIntelligenceKeymap } from './codeIntelligence';
import {
  createLspSyncExtension,
  createLspCompletionSource,
  createLspHoverExtension,
  createLspSignatureHelpExtension,
  createLspDiagnosticsLinter,
  createLspInlayHintsExtension,
  createLspCodeLensExtension,
  createLspSemanticTokensExtension,
  useLspStore,
} from '../../lsp';
import { beautifyActiveEditor } from '../../utils/beautify';
import { extensionManager } from '../../extensions/runtime/extensionManager';
import { Minimap } from './Minimap';
import { SettingsView } from '../settings/SettingsView';
import { WelcomeView } from '../welcome/WelcomeView';
import { FileContextMenu } from '../common/FileContextMenu';
import { navigationHistory } from '../../utils/navigationHistory';
import { FileIcon } from '../common/FileIcon';
import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';
import { AlertTriangle, Zap, FolderOpen, Search, Sparkles } from 'lucide-react';
import logoUrl from '../../assets/logo.png';

interface EditorProps {
  pane?: 'primary' | 'secondary';
}

export const Editor: React.FC<EditorProps> = ({ pane = 'primary' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const theme = useSettingsStore((state) => state.settings.theme);
  const lineNumbersEnabled = useSettingsStore((state) => state.settings.lineNumbers);
  const wordWrapEnabled = useSettingsStore((state) => state.settings.wordWrap);
  const tabSize = useSettingsStore((state) => state.settings.tabSize);
  const renderWhitespace = useSettingsStore((state) => state.settings.renderWhitespace || 'selection');

  const themeCompartmentRef = useRef<Compartment>(new Compartment());
  const lineNumbersCompartmentRef = useRef<Compartment>(new Compartment());
  const wordWrapCompartmentRef = useRef<Compartment>(new Compartment());
  const tabSizeCompartmentRef = useRef<Compartment>(new Compartment());
  const languageCompartmentRef = useRef<Compartment>(new Compartment());
  const extensionCompartmentRef = useRef<Compartment>(new Compartment());
  const readOnlyCompartmentRef = useRef<Compartment>(new Compartment());
  const whitespaceCompartmentRef = useRef<Compartment>(new Compartment());

  const activeDoc = useEditorStore((state) =>
    pane === 'secondary' ? state.getSecondaryDocument() : state.getActiveDocument()
  );
  const activeDocumentId = activeDoc?.id || null;
  const updateDocumentContent = useEditorStore((state) => state.updateDocumentContent);
  const updateCursor = useEditorStore((state) => state.updateCursor);
  const setActivePane = useEditorStore((state) => state.setActivePane);
  const conflictDocId = useEditorStore((state) => state.externalConflictDocId);
  const reloadDocumentFromDisk = useEditorStore((state) => state.reloadDocumentFromDisk);
  const dismissConflict = useEditorStore((state) => state.dismissConflict);

  const currentFolderPath = useFileStore((state) => state.currentFolderPath);
  const fileTree = useFileStore((state) => state.fileTree);
  const currentFolderName = currentFolderPath
    ? currentFolderPath.split(/[/\\]/).filter(Boolean).pop() || currentFolderPath
    : null;

  const isConflict = conflictDocId === activeDoc?.id;
  const isLargeFile = (activeDoc?.content?.length || 0) > 1_500_000;

  useEffect(() => {
    useLspStore.getState().updateActiveServerForDoc(activeDoc?.path || undefined, activeDoc?.language);
  }, [activeDoc?.path, activeDoc?.language]);

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

    const langExtension = getLanguageExtension(activeDoc.language, activeDoc.name);

    let initialSelection: { anchor: number } | undefined = undefined;
    if (activeDoc.cursor && (activeDoc.cursor.line > 1 || activeDoc.cursor.col > 1)) {
      try {
        const lines = activeDoc.content.split('\n');
        const targetLine = Math.min(activeDoc.cursor.line, lines.length);
        let pos = 0;
        for (let i = 0; i < targetLine - 1; i++) {
          pos += lines[i].length + 1;
        }
        const colOffset = Math.max(0, Math.min(activeDoc.cursor.col - 1, (lines[targetLine - 1] || '').length));
        pos += colOffset;
        if (pos <= activeDoc.content.length) {
          initialSelection = { anchor: pos };
        }
      } catch (e) {}
    }

    const whitespaceExt =
      renderWhitespace === 'all' || renderWhitespace === 'boundary'
        ? highlightWhitespace()
        : renderWhitespace === 'trailing'
        ? highlightTrailingWhitespace()
        : [];

    const startState = EditorState.create({
      doc: activeDoc.content,
      selection: initialSelection,
      extensions: [
        readOnlyCompartmentRef.current.of(EditorState.readOnly.of(Boolean(activeDoc.isReadOnly))),
        whitespaceCompartmentRef.current.of(whitespaceExt),
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
        bookmarkField,
        bookmarkGutter,
        ...(!isLargeFile ? [
          autoRenameTagExtension,
          cssColorHighlighterExtension,
          createLspSyncExtension(activeDoc.path || '', activeDoc.language || ''),
          createLspHoverExtension(activeDoc.path || '', activeDoc.language || ''),
          createLspSignatureHelpExtension(activeDoc.path || '', activeDoc.language || ''),
          createLspDiagnosticsLinter(activeDoc.path || ''),
          createLspInlayHintsExtension(activeDoc.path || '', activeDoc.language || ''),
          createLspCodeLensExtension(activeDoc.path || '', activeDoc.language || ''),
          createLspSemanticTokensExtension(activeDoc.path || '', activeDoc.language || ''),
        ] : []),
        ...(!isLargeFile ? createDiagnosticsLinter(activeDoc.id, activeDoc.path, activeDoc.name) : []),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion({
          override: [
            createLspCompletionSource(activeDoc.path || '', activeDoc.language || ''),
            createEmmetCompletionSource(() => detectEmmetSyntax(activeDoc.name || activeDoc.language)),
            createLanguageCompletionSource(() => activeDoc.name || activeDoc.language),
            getCustomSnippetSource(activeDoc.language || activeDoc.name),
            completeAnyWord,
          ],
          defaultKeymap: true,
        }),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        htmlLinkedFilesTooltip,
        hoverDocsExtension,
        parameterHintsExtension,
        codeIntelligenceKeymap,
        languageCompartmentRef.current.of(langExtension),
        extensionCompartmentRef.current.of(extensionManager.getActiveCodeMirrorExtensions()),
        keymap.of([
          {
            key: 'Tab',
            run: (v) => {
              if (acceptCompletion(v)) return true;
              return expandEmmetCommand(v, detectEmmetSyntax(activeDoc.name || activeDoc.language));
            },
          },
          {
            key: 'Ctrl-e',
            run: (v) => expandEmmetCommand(v, detectEmmetSyntax(activeDoc.name || activeDoc.language)),
          },
          {
            key: 'Ctrl-Alt-b',
            run: beautifyActiveEditor,
          },
          {
            key: 'Alt-Shift-f',
            run: beautifyActiveEditor,
          },
          {
            key: 'Ctrl-Shift-h',
            run: beautifyActiveEditor,
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
            navigationHistory.pushLocation({
              docId: docIdRef.current,
              path: activeDoc.path || undefined,
              line: lineNum,
              col: colNum,
            });
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
    if (initialSelection) {
      try {
        view.dispatch({ scrollIntoView: true });
      } catch (e) {}
    }
    setActiveEditorView(view, pane);
    extensionManager.triggerActivationEvent('onEditorCreated');

    return () => {
      view.destroy();
      viewRef.current = null;
      setActiveEditorView(null, pane);
    };
  }, [activeDocumentId]);

  // Keep editor view in sync if document content is updated externally (e.g. disk reload, line endings)
  useEffect(() => {
    if (viewRef.current && activeDoc) {
      const currentText = viewRef.current.state.doc.toString();
      if (currentText !== activeDoc.content) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentText.length, insert: activeDoc.content },
        });
      }
    }
  }, [activeDoc?.content]);

  // Dynamically reconfigure theme when user switches themes in Settings
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: themeCompartmentRef.current.reconfigure(getEditorTheme(theme)),
      });
    }
  }, [theme]);

  // Dynamically reconfigure read-only mode
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: readOnlyCompartmentRef.current.reconfigure(
          EditorState.readOnly.of(Boolean(activeDoc?.isReadOnly))
        ),
      });
    }
  }, [activeDoc?.isReadOnly]);

  // Dynamically reconfigure whitespace highlighting
  useEffect(() => {
    if (viewRef.current) {
      const whitespaceExt =
        renderWhitespace === 'all' || renderWhitespace === 'boundary'
          ? highlightWhitespace()
          : renderWhitespace === 'trailing'
          ? highlightTrailingWhitespace()
          : [];
      viewRef.current.dispatch({
        effects: whitespaceCompartmentRef.current.reconfigure(whitespaceExt),
      });
    }
  }, [renderWhitespace]);

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

  // Dynamically reconfigure language parser and syntax highlighting when document language or file name changes
  useEffect(() => {
    if (viewRef.current && activeDoc) {
      viewRef.current.dispatch({
        effects: languageCompartmentRef.current.reconfigure(
          getLanguageExtension(activeDoc.language, activeDoc.name)
        ),
      });
    }
  }, [activeDoc?.language, activeDoc?.name]);

  // Dynamically reconfigure runtime extensions (e.g. rainbow brackets toggled)
  useEffect(() => {
    const unsubscribe = extensionManager.subscribe(() => {
      if (viewRef.current) {
        viewRef.current.dispatch({
          effects: extensionCompartmentRef.current.reconfigure(
            extensionManager.getActiveCodeMirrorExtensions()
          ),
        });
      }
    });
    return unsubscribe;
  }, []);

  // Sync tab size setting with rainbow extension
  useEffect(() => {
    extensionManager.setSetting('rainbow.tabSize', tabSize);
  }, [tabSize]);

  if (activeDoc?.id === 'settings') {
    return <SettingsView />;
  }

  if (activeDoc?.id === 'welcome-tab') {
    return <WelcomeView />;
  }

  const handleOpenProjectFile = async (filePath: string, fileName: string) => {
    if (window.xivig?.readFile) {
      const res = await window.xivig.readFile(filePath);
      if (res.success && res.content !== undefined) {
        const currentDocs = useEditorStore.getState().documents;
        if (currentDocs.length === 1 && currentDocs[0].id === 'welcome-tab') {
          useEditorStore.getState().closeDocument('welcome-tab');
        }
        useEditorStore.getState().openDocument({
          path: filePath,
          name: fileName,
          content: res.content,
          language: fileName,
        });
      }
    }
  };

  const handleOpenFolder = async () => {
    if (window.xivig?.openFolderDialog) {
      const res = await window.xivig.openFolderDialog();
      if (!res.canceled && res.folderPath && res.files) {
        useFileStore.getState().setCurrentFolder(res.folderPath, res.files);
      }
    }
  };

  const handleOpenWelcome = () => {
    useEditorStore.getState().openDocument({
      id: 'welcome-tab',
      name: 'Welcome',
      path: '',
      content: '',
      language: 'markdown',
    });
  };

  if (!activeDoc) {
    if (currentFolderPath) {
      const projectFiles = fileTree.filter((f) => !f.isDirectory).slice(0, 10);
      return (
        <div style={emptyContainerStyle}>
          <div style={{ ...emptyContentStyle, maxWidth: '520px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                backgroundColor: 'var(--xivig-sidebar)',
                border: '1px solid var(--xivig-border)',
                marginBottom: '16px',
              }}
            >
              <FolderOpen size={16} color="var(--xivig-accent)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--xivig-text)' }}>
                {currentFolderName}
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--xivig-text)', marginBottom: '8px' }}>
              Workspace Active
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--xivig-text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
              Choose a file from your project below or select one from the explorer sidebar to begin editing.
            </p>

            {projectFiles.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--xivig-text-muted)',
                    marginBottom: '10px',
                  }}
                >
                  Project Files
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {projectFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => handleOpenProjectFile(file.path, file.name)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--xivig-sidebar)',
                        border: '1px solid var(--xivig-border)',
                        color: 'var(--xivig-text)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--xivig-accent)';
                        e.currentTarget.style.backgroundColor = 'var(--xivig-activity-bar)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--xivig-border)';
                        e.currentTarget.style.backgroundColor = 'var(--xivig-sidebar)';
                      }}
                    >
                      <FileIcon filename={file.name} size={14} />
                      <span>{file.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => useUIStore.getState().openQuickOpen()}
                style={actionButtonStyle}
              >
                Quick Open (Ctrl+P)
              </button>
              <button
                onClick={() => useEditorStore.getState().createNewDocument()}
                style={{
                  ...actionButtonStyle,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--xivig-border)',
                  color: 'var(--xivig-text)',
                }}
              >
                New File (Ctrl+N)
              </button>
            </div>
          </div>
        </div>
      );
    }

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
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => useEditorStore.getState().createNewDocument()}
              style={actionButtonStyle}
            >
              New File (Ctrl+N)
            </button>
            <button
              onClick={handleOpenFolder}
              style={{
                ...actionButtonStyle,
                backgroundColor: 'transparent',
                border: '1px solid var(--xivig-border)',
                color: 'var(--xivig-text)',
              }}
            >
              Open Folder
            </button>
            <button
              onClick={handleOpenWelcome}
              style={{
                ...actionButtonStyle,
                backgroundColor: 'transparent',
                border: '1px solid var(--xivig-border)',
                color: 'var(--xivig-text-muted)',
              }}
            >
              Welcome Page
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
        if (viewRef.current) setActiveEditorView(viewRef.current, pane);
      }}
      onContextMenu={(e) => {
        if (activeDoc) {
          e.preventDefault();
          const view = viewRef.current;
          if (view) {
            const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
            if (pos !== null) {
              const { from, to } = view.state.selection.main;
              const isInsideSelection = from !== to && pos >= from && pos <= to;
              if (!isInsideSelection) {
                view.dispatch({ selection: { anchor: pos } });
              }
            }
          }
          setContextMenu({ x: e.clientX, y: e.clientY });
        }
      }}
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* External Modification Conflict Banner */}
      {isConflict && (
        <div style={conflictBannerStyle}>
          <AlertTriangle size={14} color="#e6ad45" style={{ marginRight: '8px', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: '#e5e7eb', flex: 1 }}>
            This document was modified externally on disk. What would you like to do?
          </span>
          <button
            onClick={() => reloadDocumentFromDisk(activeDoc.id)}
            style={conflictActionBtnStyle}
            title="Discard unsaved local changes and reload from disk"
          >
            Reload from Disk
          </button>
          <button
            onClick={() => dismissConflict(activeDoc.id)}
            style={{ ...conflictActionBtnStyle, backgroundColor: 'transparent', color: '#9ca3af', border: '1px solid #444' }}
            title="Keep in-memory edits and dismiss conflict warning"
          >
            Keep Local Edits
          </button>
        </div>
      )}

      {/* Large File Performance Mode Indicator */}
      {isLargeFile && (
        <div style={largeFileBannerStyle}>
          <Zap size={12} color="#4ec9b0" style={{ marginRight: '6px' }} />
          <span>Large File Velocity Mode: Heavy extensions are paused to preserve ultra-fast 120 FPS typing.</span>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
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

      {contextMenu && activeDoc && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          source="editor"
          target={{
            name: activeDoc.name,
            path: activeDoc.path || activeDoc.name,
            isDirectory: false,
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
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

const conflictBannerStyle: React.CSSProperties = {
  backgroundColor: '#2d2416',
  borderBottom: '1px solid #735118',
  padding: '6px 12px',
  display: 'flex',
  alignItems: 'center',
  userSelect: 'none',
  zIndex: 10,
};

const conflictActionBtnStyle: React.CSSProperties = {
  backgroundColor: '#e6ad45',
  color: '#111',
  fontWeight: 600,
  fontSize: '11px',
  padding: '3px 8px',
  borderRadius: '3px',
  marginLeft: '8px',
  cursor: 'pointer',
};

const largeFileBannerStyle: React.CSSProperties = {
  backgroundColor: '#1b2a2e',
  borderBottom: '1px solid #234b52',
  padding: '4px 12px',
  display: 'flex',
  alignItems: 'center',
  fontSize: '11px',
  color: '#a7f3d0',
  userSelect: 'none',
  zIndex: 9,
};
