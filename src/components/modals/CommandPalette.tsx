import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Check } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';

interface CommandItem {
  id: string;
  category: string;
  title: string;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const isOpen = useUIStore((state) => state.isCommandPaletteOpen);
  const close = useUIStore((state) => state.closeCommandPalette);
  const openQuickOpen = useUIStore((state) => state.openQuickOpen);
  const openSearchPanel = useUIStore((state) => state.openSearchPanel);
  const toggleMinimap = useUIStore((state) => state.toggleMinimap);
  const openLanguageSelector = useUIStore((state) => state.openLanguageSelector);

  const createNewDocument = useEditorStore((state) => state.createNewDocument);
  const openDocument = useEditorStore((state) => state.openDocument);
  const activeDoc = useEditorStore((state) => state.getActiveDocument());
  const closeDocument = useEditorStore((state) => state.closeDocument);
  const markDocumentSaved = useEditorStore((state) => state.markDocumentSaved);
  const setSplitLayout = useEditorStore((state) => state.setSplitLayout);

  const toggleSidebar = useFileStore((state) => state.toggleSidebar);
  const setActiveSidebarView = useFileStore((state) => state.setActiveSidebarView);
  const setCurrentFolder = useFileStore((state) => state.setCurrentFolder);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleOpenFile = async () => {
    if (window.xivig?.openFileDialog) {
      const res = await window.xivig.openFileDialog();
      if (!res.canceled && res.filePath && res.content !== undefined) {
        openDocument({
          path: res.filePath,
          name: res.name || 'File',
          content: res.content,
          language: res.name || 'text',
        });
      }
    }
  };

  const handleOpenFolder = async () => {
    if (window.xivig?.openFolderDialog) {
      const res = await window.xivig.openFolderDialog();
      if (!res.canceled && res.folderPath && res.files) {
        setCurrentFolder(res.folderPath, res.files);
      }
    }
  };

  const handleSaveFile = async () => {
    if (!activeDoc) return;
    if (activeDoc.path && window.xivig?.saveFile) {
      const res = await window.xivig.saveFile(activeDoc.path, activeDoc.content);
      if (res.success) {
        markDocumentSaved(activeDoc.id, activeDoc.path);
      }
    } else if (window.xivig?.saveFileDialog) {
      const res = await window.xivig.saveFileDialog(activeDoc.name, activeDoc.content);
      if (!res.canceled && res.filePath) {
        markDocumentSaved(activeDoc.id, res.filePath);
      }
    }
  };

  const setLanguage = (lang: string) => {
    if (!activeDoc) return;
    useEditorStore.setState((state) => ({
      documents: state.documents.map((d) =>
        d.id === activeDoc.id ? { ...d, language: lang } : d
      ),
    }));
  };

  const commands: CommandItem[] = [
    {
      id: 'file:new',
      category: 'File',
      title: 'New File',
      shortcut: 'Ctrl+N',
      action: () => createNewDocument(),
    },
    {
      id: 'file:open',
      category: 'File',
      title: 'Open File...',
      shortcut: 'Ctrl+O',
      action: handleOpenFile,
    },
    {
      id: 'file:open-folder',
      category: 'File',
      title: 'Open Folder...',
      shortcut: 'Ctrl+K Ctrl+O',
      action: handleOpenFolder,
    },
    {
      id: 'file:save',
      category: 'File',
      title: 'Save File',
      shortcut: 'Ctrl+S',
      action: handleSaveFile,
    },
    {
      id: 'file:close',
      category: 'File',
      title: 'Close Active Tab',
      shortcut: 'Ctrl+W',
      action: () => activeDoc && closeDocument(activeDoc.id),
    },
    {
      id: 'nav:quick-open',
      category: 'Navigation',
      title: 'Go to File...',
      shortcut: 'Ctrl+P',
      action: openQuickOpen,
    },
    {
      id: 'search:find',
      category: 'Search',
      title: 'Find in Document',
      shortcut: 'Ctrl+F',
      action: () => openSearchPanel('find'),
    },
    {
      id: 'search:replace',
      category: 'Search',
      title: 'Replace in Document',
      shortcut: 'Ctrl+H',
      action: () => openSearchPanel('replace'),
    },
    {
      id: 'view:sidebar',
      category: 'View',
      title: 'Toggle Sidebar',
      shortcut: 'Ctrl+B',
      action: toggleSidebar,
    },
    {
      id: 'view:minimap',
      category: 'View',
      title: 'Toggle Minimap',
      action: toggleMinimap,
    },
    {
      id: 'view:layout-single',
      category: 'View',
      title: 'Layout: Single Column',
      shortcut: 'Alt+Shift+1',
      action: () => setSplitLayout('single'),
    },
    {
      id: 'view:layout-2col',
      category: 'View',
      title: 'Layout: Two Columns (Split Right)',
      shortcut: 'Alt+Shift+2',
      action: () => setSplitLayout('two-columns'),
    },
    {
      id: 'view:layout-2row',
      category: 'View',
      title: 'Layout: Two Rows (Split Down)',
      shortcut: 'Alt+Shift+3',
      action: () => setSplitLayout('two-rows'),
    },
    {
      id: 'view:explorer',
      category: 'View',
      title: 'Focus File Explorer',
      shortcut: 'Ctrl+Shift+E',
      action: () => setActiveSidebarView('explorer'),
    },
    {
      id: 'view:search',
      category: 'View',
      title: 'Focus Search in Files',
      shortcut: 'Ctrl+Shift+F',
      action: () => setActiveSidebarView('search'),
    },
    {
      id: 'view:git',
      category: 'View',
      title: 'Focus Source Control (Git)',
      shortcut: 'Ctrl+Shift+G',
      action: () => setActiveSidebarView('git'),
    },
    {
      id: 'lang:select',
      category: 'Language',
      title: 'Change Language Mode...',
      shortcut: 'Ctrl+K M',
      action: openLanguageSelector,
    },
    {
      id: 'lang:js',
      category: 'Language',
      title: 'Change Language Mode to JavaScript',
      action: () => setLanguage('javascript'),
    },
    {
      id: 'lang:ts',
      category: 'Language',
      title: 'Change Language Mode to TypeScript',
      action: () => setLanguage('typescript'),
    },
    {
      id: 'lang:html',
      category: 'Language',
      title: 'Change Language Mode to HTML',
      action: () => setLanguage('html'),
    },
    {
      id: 'lang:css',
      category: 'Language',
      title: 'Change Language Mode to CSS',
      action: () => setLanguage('css'),
    },
    {
      id: 'lang:json',
      category: 'Language',
      title: 'Change Language Mode to JSON',
      action: () => setLanguage('json'),
    },
    {
      id: 'lang:markdown',
      category: 'Language',
      title: 'Change Language Mode to Markdown',
      action: () => setLanguage('markdown'),
    },
    {
      id: 'lang:python',
      category: 'Language',
      title: 'Change Language Mode to Python',
      action: () => setLanguage('python'),
    },
    {
      id: 'lang:rust',
      category: 'Language',
      title: 'Change Language Mode to Rust',
      action: () => setLanguage('rust'),
    },
    {
      id: 'dev:reload',
      category: 'Developer',
      title: 'Reload Window',
      shortcut: 'Ctrl+R',
      action: () => window.location.reload(),
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    const fullText = `${cmd.category}: ${cmd.title}`.toLowerCase();
    return fullText.includes(query.toLowerCase());
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        close();
        filteredCommands[selectedIndex].action();
      }
    }
  };

  useEffect(() => {
    // Scroll selected item into view
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
        {/* Search Input */}
        <div style={searchHeaderStyle}>
          <Command size={16} color="var(--xivig-accent)" style={{ marginRight: '10px' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            style={inputStyle}
          />
        </div>

        {/* Results List */}
        <div ref={listRef} style={resultsContainerStyle}>
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    close();
                    cmd.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    ...itemStyle,
                    backgroundColor: isSelected ? 'var(--xivig-accent-active)' : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--xivig-accent)' : '2px solid transparent',
                  }}
                >
                  <div style={itemLeftStyle}>
                    <span style={categoryBadgeStyle}>{cmd.category}</span>
                    <span style={titleStyle}>{cmd.title}</span>
                  </div>
                  {cmd.shortcut && <span style={shortcutBadgeStyle}>{cmd.shortcut}</span>}
                </div>
              );
            })
          ) : (
            <div style={emptyStyle}>No matching commands found</div>
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
  width: '580px',
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
  justifyContent: 'space-between',
  padding: '8px 16px',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
};

const itemLeftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  overflow: 'hidden',
};

const categoryBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--xivig-accent)',
  fontWeight: 600,
  letterSpacing: '0.4px',
  textTransform: 'uppercase',
  backgroundColor: 'var(--xivig-accent-subtle)',
  padding: '2px 6px',
  borderRadius: '3px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--xivig-text)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const shortcutBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--xivig-text-dim)',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  padding: '2px 6px',
  borderRadius: '3px',
  border: '1px solid var(--xivig-border-subtle)',
};

const emptyStyle: React.CSSProperties = {
  padding: '24px',
  textAlign: 'center',
  color: 'var(--xivig-text-dim)',
  fontSize: '13px',
};
