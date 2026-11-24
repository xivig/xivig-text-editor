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

  // Jump to specific line and column in active editor
  const jumpToLineAndCol = (lineNum: number, colNum: number = 1) => {
    const view = getActiveEditorView();
    if (view) {
      const clampedLine = Math.max(1, Math.min(lineNum, view.state.doc.lines));
      const line = view.state.doc.line(clampedLine);
      const clampedCol = Math.max(1, Math.min(colNum, line.length + 1));
      const pos = line.from + clampedCol - 1;
      view.dispatch({
        selection: EditorSelection.cursor(pos),
        effects: EditorView.scrollIntoView(pos, { y: 'center' }),
      });
      view.focus();
    }
  };

  const isLineMode = query.startsWith(':');
  const isSymbolMode = query.startsWith('@');
  const isWorkspaceSymbolMode = query.startsWith('#');

  const parsedLineAndCol = React.useMemo(() => {
    if (!isLineMode) return null;
    const match = query.substring(1).trim().match(/^(\d+)(?:[:,\s](\d+))?/);
    if (!match) return null;
    return {
      line: parseInt(match[1], 10),
      col: match[2] ? parseInt(match[2], 10) : 1,
    };
  }, [isLineMode, query]);

  const workspaceSymbols = React.useMemo(() => {
    if (!isWorkspaceSymbolMode) return [];
    const syms: Array<ExtractedSymbol & { fileName: string; filePath: string }> = [];
    const docs = useEditorStore.getState().documents;

    for (const d of docs) {
      if (d.content) {
        const fileSyms = extractDocumentSymbols(d.content, d.language || d.name);
        for (const s of fileSyms) {
          syms.push({ ...s, fileName: d.name, filePath: d.path || d.name });
        }
      }
    }
    return syms;
  }, [isWorkspaceSymbolMode, isOpen]);

  const filteredWorkspaceSymbols = React.useMemo(() => {
    if (!isWorkspaceSymbolMode) return [];
    const q = query.substring(1).trim().toLowerCase();
    if (!q) return workspaceSymbols.slice(0, 50);
    return workspaceSymbols
      .filter((s) => s.name.toLowerCase().includes(q) || (s.fileName && s.fileName.toLowerCase().includes(q)))
      .slice(0, 50);
  }, [isWorkspaceSymbolMode, query, workspaceSymbols]);

  const filteredSymbols = symbols.filter((s) => {
    const q = query.substring(1).trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q);
  });

  const filteredFiles = flatFiles.filter((f) => {
    if (isLineMode || isSymbolMode || isWorkspaceSymbolMode) return false;
    const cleanQuery = query.split(/[:,\s]/)[0].trim().toLowerCase();
    if (!cleanQuery) return true;
    return f.name.toLowerCase().includes(cleanQuery) || f.relativePath.toLowerCase().includes(cleanQuery);
  });

  const handleSelectFile = async (file: FlatFile, targetLine?: number, targetCol?: number) => {
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
          setTimeout(() => jumpToLineAndCol(targetLine, targetCol || 1), 60);
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
      const count = isLineMode
        ? 1
        : isWorkspaceSymbolMode
        ? filteredWorkspaceSymbols.length
        : isSymbolMode
        ? filteredSymbols.length
        : filteredFiles.length;
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, count));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const count = isLineMode
        ? 1
        : isWorkspaceSymbolMode
        ? filteredWorkspaceSymbols.length
        : isSymbolMode
        ? filteredSymbols.length
        : filteredFiles.length;
      setSelectedIndex((prev) => (prev - 1 + count) % Math.max(1, count));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isLineMode && parsedLineAndCol) {
        jumpToLineAndCol(parsedLineAndCol.line, parsedLineAndCol.col);
        close();
      } else if (isWorkspaceSymbolMode && filteredWorkspaceSymbols[selectedIndex]) {
        const sym = filteredWorkspaceSymbols[selectedIndex];
        handleSelectFile({ path: sym.filePath, name: sym.fileName, relativePath: sym.fileName }, sym.line, sym.col);
      } else if (isSymbolMode && filteredSymbols[selectedIndex]) {
        jumpToLineAndCol(filteredSymbols[selectedIndex].line, filteredSymbols[selectedIndex].col);
        close();
      } else if (filteredFiles[selectedIndex]) {
        const match = query.match(/[:,\s](\d+)(?:[:,\s](\d+))?/);
        const targetLine = match ? parseInt(match[1], 10) : undefined;
        const targetCol = match && match[2] ? parseInt(match[2], 10) : undefined;
        handleSelectFile(filteredFiles[selectedIndex], targetLine, targetCol);
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
          ) : isWorkspaceSymbolMode ? (
            <Hash size={16} color="var(--xivig-accent)" style={{ marginRight: '10px' }} />
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
                ? 'Type line:col to jump to (e.g. :42:15)...'
                : isWorkspaceSymbolMode
                ? 'Search symbol across workspace (#function, #class)...'
                : isSymbolMode
                ? 'Search document symbol or outline (@function, @class)...'
                : 'Type file name, or :line:col to jump, or @symbol, or #workspace-symbol...'
            }
            style={inputStyle}
          />
        </div>

        {/* Results list */}
        <div ref={listRef} style={resultsContainerStyle}>
          {isLineMode ? (
            <div
              onClick={() => {
                if (parsedLineAndCol) {
                  jumpToLineAndCol(parsedLineAndCol.line, parsedLineAndCol.col);
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
                  {parsedLineAndCol
                    ? `Jump to Line ${parsedLineAndCol.line}${parsedLineAndCol.col > 1 ? `, Column ${parsedLineAndCol.col}` : ''}`
                    : 'Type line number after : (e.g. :42 or :42:10)'}
                </span>
                <span style={filePathStyle}>Press Enter to jump</span>
              </div>
            </div>
          ) : isWorkspaceSymbolMode ? (
            filteredWorkspaceSymbols.length > 0 ? (
              filteredWorkspaceSymbols.map((sym, idx) => {
                const isSelected = idx === selectedIndex;
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
                    key={`${sym.filePath}-${sym.name}-${sym.line}-${idx}`}
                    onClick={() => {
                      handleSelectFile(
                        { path: sym.filePath, name: sym.fileName, relativePath: sym.fileName },
                        sym.line,
                        sym.col
                      );
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
                          color: '#b180f0',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          marginRight: '8px',
                          flexShrink: 0,
                        }}
                      >
                        {kindBadge}
                      </span>
                      <span style={fileNameStyle}>{sym.name}</span>
                      <span style={{ ...filePathStyle, marginRight: 'auto', marginLeft: '8px', opacity: 0.6 }}>
                        {sym.fileName}
                      </span>
                      <span style={filePathStyle}>Line {sym.line}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={emptyStyle}>No matching symbols in workspace</div>
            )
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
                      jumpToLineAndCol(sym.line, sym.col || 1);
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
