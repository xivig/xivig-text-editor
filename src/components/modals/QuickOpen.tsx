import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { FileItem } from '../../types/editor';
import { FileIcon } from '../common/FileIcon';

interface FlatFile {
  path: string;
  name: string;
  relativePath: string;
  extension?: string;
}

export const QuickOpen: React.FC = () => {
  const isOpen = useUIStore((state) => state.isQuickOpenOpen);
  const close = useUIStore((state) => state.closeQuickOpen);

  const fileTree = useFileStore((state) => state.fileTree);
  const currentFolderPath = useFileStore((state) => state.currentFolderPath);
  const openDocument = useEditorStore((state) => state.openDocument);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [flatFiles, setFlatFiles] = useState<FlatFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Flatten the file tree whenever opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
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
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, fileTree, currentFolderPath]);

  const filteredFiles = flatFiles.filter((f) => {
    const q = query.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.relativePath.toLowerCase().includes(q);
  });

  const handleSelectFile = async (file: FlatFile) => {
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
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredFiles.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredFiles.length) % Math.max(1, filteredFiles.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredFiles[selectedIndex]) {
        handleSelectFile(filteredFiles[selectedIndex]);
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
          <Search size={16} color="var(--xivig-accent)" style={{ marginRight: '10px' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search files by name (e.g. App.tsx, styles)..."
            style={inputStyle}
          />
        </div>

        {/* Results list */}
        <div ref={listRef} style={resultsContainerStyle}>
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file, idx) => {
              const isSelected = idx === selectedIndex;
              const isCode = file.extension && ['ts', 'tsx', 'js', 'jsx', 'json', 'py', 'rs'].includes(file.extension);

              return (
                <div
                  key={file.path}
                  onClick={() => handleSelectFile(file)}
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
  paddingTop: '60px',
  zIndex: 10000,
  backdropFilter: 'blur(2px)',
};

const modalStyle: React.CSSProperties = {
  width: '560px',
  maxHeight: '440px',
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '8px',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const searchHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid var(--xivig-border)',
  backgroundColor: 'var(--xivig-surface)',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '14px',
  color: 'var(--xivig-text)',
  padding: 0,
};

const resultsContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '6px 0',
  maxHeight: '380px',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
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
  color: 'var(--xivig-text)',
  fontWeight: 500,
  marginRight: '12px',
  flexShrink: 0,
};

const filePathStyle: React.CSSProperties = {
  fontSize: '11.5px',
  color: 'var(--xivig-text-dim)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const emptyStyle: React.CSSProperties = {
  padding: '24px',
  textAlign: 'center',
  color: 'var(--xivig-text-dim)',
  fontSize: '13px',
};
