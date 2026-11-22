import React, { useState, useEffect, useRef } from 'react';
import { Search, Hash, Code, Navigation } from 'lucide-react';
import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { useUIStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { FileItem } from '../../types/editor';
import { FileIcon } from '../common/FileIcon';
import { getActiveEditorView } from '../editor/editorViewRegistry';
import { extractDocumentSymbols, ExtractedSymbol } from '../editor/codeIntelligence';

interface FlatFile {
  path: string;
  name: string;
  relativePath: string;
  extension?: string;
}

export const QuickOpen: React.FC = () => {
  const isOpen = useUIStore((state) => state.isQuickOpenOpen);
  const close = useUIStore((state) => state.closeQuickOpen);
  const initialMode = useUIStore((state) => state.quickOpenInitialMode);

  const fileTree = useFileStore((state) => state.fileTree);
  const currentFolderPath = useFileStore((state) => state.currentFolderPath);
  const openDocument = useEditorStore((state) => state.openDocument);
  const activeDoc = useEditorStore((state) => state.getActiveDocument());

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [flatFiles, setFlatFiles] = useState<FlatFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Flatten the file tree whenever opened
  useEffect(() => {
    if (isOpen) {
      setQuery(initialMode || '');
      setSelectedIndex(0);

      const files: FlatFile[] = [];
      const traverse = (items: FileItem[]) => {
        for (const item of items) {
          if (item.isDirectory && item.children) {
            traverse(item.children);
          } else if (!item.isDirectory) {
            const rel = currentFolderPath
              ? item.path.replace(currentFolderPath, '').replace(/^[/\\]/, '')
              : item.name;
            files.push({
              path: item.path,
              name: item.name,
              relativePath: rel,
              extension: item.extension,
            });
          }
        }
      };

      traverse(fileTree);
      setFlatFiles(files);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (initialMode) {
            inputRef.current.setSelectionRange(initialMode.length, initialMode.length);
          }
        }
      }, 50);
    }
  }, [isOpen, initialMode, fileTree, currentFolderPath]);

  // Extract symbols from active document using advanced code intelligence
  const symbols: ExtractedSymbol[] = React.useMemo(() => {
    if (!activeDoc || !activeDoc.content) return [];
    return extractDocumentSymbols(activeDoc.content, activeDoc.language || 'text');
  }, [activeDoc?.content, activeDoc?.language]);

  // Jump to specific line in active editor
  const jumpToLine = (lineNum: number) => {
    const view = getActiveEditorView();
    if (view) {
      const clamped = Math.max(1, Math.min(lineNum, view.state.doc.lines));
      const line = view.state.doc.line(clamped);
      view.dispatch({
        selection: EditorSelection.cursor(line.from),
        effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
      });
      view.focus();
    }
  };

  const isLineMode = query.startsWith(':');
  const isSymbolMode = query.startsWith('@');

  const filteredSymbols = symbols.filter((s) => {
    const q = query.substring(1).trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q);
  });

  const parsedLineNumber = isLineMode ? parseInt(query.substring(1).trim(), 10) : null;

  const filteredFiles = flatFiles.filter((f) => {
    if (isLineMode || isSymbolMode) return false;
    const cleanQuery = query.split(':')[0].trim().toLowerCase();
    if (!cleanQuery) return true;
    return f.name.toLowerCase().includes(cleanQuery) || f.relativePath.toLowerCase().includes(cleanQuery);
  });

  const handleSelectFile = async (file: FlatFile, targetLine?: number) => {
    close();
    if (window.xivig?.readFile) {
      const res = await window.xivig.readFile(file.path);
      if (res.success && res.content !== undefined) {
        openDocument({
          path: file.path,
          name: file.name,
          content: res.content,
          language: file.name,
        });

        if (targetLine && targetLine > 0) {
          setTimeout(() => jumpToLine(targetLine), 60);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const count = isLineMode ? 1 : isSymbolMode ? filteredSymbols.length : filteredFiles.length;
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, count));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const count = isLineMode ? 1 : isSymbolMode ? filteredSymbols.length : filteredFiles.length;
      setSelectedIndex((prev) => (prev - 1 + count) % Math.max(1, count));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isLineMode && parsedLineNumber && !isNaN(parsedLineNumber)) {
        jumpToLine(parsedLineNumber);
        close();
      } else if (isSymbolMode && filteredSymbols[selectedIndex]) {
        jumpToLine(filteredSymbols[selectedIndex].line);
        close();
      } else if (filteredFiles[selectedIndex]) {
        const parts = query.split(':');
        const targetLine = parts.length > 1 ? parseInt(parts[1], 10) : undefined;
        handleSelectFile(filteredFiles[selectedIndex], targetLine);
      }
    }
  };

  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div style={backdropStyle} onClick={close}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Search header */}
        <div style={searchHeaderStyle}>
          {isLineMode ? (
            <Navigation size={16} color="var(--xivig-accent)" style={{ marginRight: '10px' }} />
          ) : isSymbolMode ? (
            <Code size={16} color="var(--xivig-accent)" style={{ marginRight: '10px' }} />
          ) : (
            <Search size={16} color="var(--xivig-accent)" style={{ marginRight: '10px' }} />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isLineMode
                ? 'Type line number to jump to (e.g. :42)...'
                : isSymbolMode
                ? 'Search symbol in file (e.g. @function, @class)...'
                : 'Type file name, or :line to jump, or @symbol...'
            }
            style={inputStyle}
          />
        </div>

        {/* Results list */}
        <div ref={listRef} style={resultsContainerStyle}>
          {isLineMode ? (
            <div
              onClick={() => {
                if (parsedLineNumber && !isNaN(parsedLineNumber)) {
                  jumpToLine(parsedLineNumber);
                  close();
                }
              }}
              style={{
                ...itemStyle,
                backgroundColor: 'var(--xivig-accent-active)',
                borderLeft: '2px solid var(--xivig-accent)',
              }}
            >
              <div style={itemContentStyle}>
                <Navigation size={15} color="var(--xivig-accent)" style={{ marginRight: '8px' }} />
                <span style={fileNameStyle}>
                  {parsedLineNumber && !isNaN(parsedLineNumber)
                    ? `Jump to Line ${parsedLineNumber}`
                    : 'Type line number after : (e.g. :25)'}
                </span>
                <span style={filePathStyle}>Press Enter to jump</span>
              </div>
            </div>
          ) : isSymbolMode ? (
            filteredSymbols.length > 0 ? (
              filteredSymbols.map((sym, idx) => {
                const isSelected = idx === selectedIndex;
                const kindColor =
                  sym.kind === 'function' || sym.kind === 'method'
                    ? '#b180f0'
                    : sym.kind === 'class' || sym.kind === 'interface'
                    ? '#4ec9b0'
                    : sym.kind === 'variable'
                    ? '#9cdcfe'
                    : '#ce9178';
                const kindBadge =
                  sym.kind === 'function' || sym.kind === 'method'
                    ? 'ƒ'
                    : sym.kind === 'class'
                    ? 'C'
                    : sym.kind === 'interface'
                    ? 'I'
                    : sym.kind === 'variable'
                    ? 'v'
                    : '#';

                return (
                  <div
                    key={`${sym.name}-${sym.line}-${idx}`}
                    onClick={() => {
                      jumpToLine(sym.line);
                      close();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      ...itemStyle,
                      backgroundColor: isSelected ? 'var(--xivig-accent-active)' : 'transparent',
                      borderLeft: isSelected ? '2px solid var(--xivig-accent)' : '2px solid transparent',
                    }}
                  >
                    <div style={itemContentStyle}>
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '3px',
                          backgroundColor: '#2d2d30',
                          color: kindColor,
                          fontSize: '11px',
                          fontWeight: 'bold',
                          marginRight: '8px',
                          flexShrink: 0,
                        }}
                      >
                        {kindBadge}
                      </span>
                      <span style={fileNameStyle}>{sym.name}</span>
                      {sym.detail && (
                        <span style={{ ...filePathStyle, marginRight: 'auto', marginLeft: '6px', opacity: 0.6 }}>
                          {sym.detail}
                        </span>
                      )}
                      <span style={filePathStyle}>Line {sym.line}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={emptyStyle}>No matching symbols in current file</div>
            )
          ) : filteredFiles.length > 0 ? (
            filteredFiles.map((file, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={file.path}
                  onClick={() => {
                    const parts = query.split(':');
                    const targetLine = parts.length > 1 ? parseInt(parts[1], 10) : undefined;
                    handleSelectFile(file, targetLine);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    ...itemStyle,
                    backgroundColor: isSelected ? 'var(--xivig-accent-active)' : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--xivig-accent)' : '2px solid transparent',
                  }}
                >
                  <div style={itemContentStyle}>
                    <span style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                      <FileIcon filename={file.name} size={15} />
                    </span>
                    <span style={fileNameStyle}>{file.name}</span>
                    <span style={filePathStyle}>{file.relativePath}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={emptyStyle}>
              {flatFiles.length === 0 ? 'No files in current workspace' : 'No matching files found'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  paddingTop: '60px',
  zIndex: 1000,
  backdropFilter: 'blur(3px)',
};

const modalStyle: React.CSSProperties = {
  width: '560px',
  maxHeight: '420px',
  backgroundColor: 'var(--xivig-surface)',
  borderRadius: '8px',
  border: '1px solid var(--xivig-border)',
  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const searchHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'none',
  border: 'none',
  color: 'var(--xivig-text)',
  fontSize: '14px',
  outline: 'none',
};

const resultsContainerStyle: React.CSSProperties = {
  maxHeight: '340px',
  overflowY: 'auto',
  padding: '6px 0',
};

const itemStyle: React.CSSProperties = {
  padding: '8px 16px',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
};

const itemContentStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  overflow: 'hidden',
};

const fileNameStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--xivig-text)',
  marginRight: '12px',
  whiteSpace: 'nowrap',
};

const filePathStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--xivig-text-dim)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  marginLeft: 'auto',
};

const emptyStyle: React.CSSProperties = {
  padding: '24px',
  textAlign: 'center',
  color: 'var(--xivig-text-dim)',
  fontSize: '13px',
};
