import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
}

export const Menubar: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menubarRef = useRef<HTMLDivElement>(null);

  const createNewDocument = useEditorStore((state) => state.createNewDocument);
  const openDocument = useEditorStore((state) => state.openDocument);
  const activeDoc = useEditorStore((state) => state.getActiveDocument());
  const closeDocument = useEditorStore((state) => state.closeDocument);
  const markDocumentSaved = useEditorStore((state) => state.markDocumentSaved);

  const setCurrentFolder = useFileStore((state) => state.setCurrentFolder);
  const toggleSidebar = useFileStore((state) => state.toggleSidebar);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menubarRef.current && !menubarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

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

  const handleSaveAs = async () => {
    if (!activeDoc || !window.xivig?.saveFileDialog) return;
    const res = await window.xivig.saveFileDialog(activeDoc.name, activeDoc.content);
    if (!res.canceled && res.filePath) {
      markDocumentSaved(activeDoc.id, res.filePath);
    }
  };

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'New File', shortcut: 'Ctrl+N', action: () => createNewDocument() },
      { label: 'Open File...', shortcut: 'Ctrl+O', action: handleOpenFile },
      { label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O', action: handleOpenFolder },
      { divider: true, label: '' },
      { label: 'Save', shortcut: 'Ctrl+S', action: handleSaveFile },
      { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: handleSaveAs },
      { divider: true, label: '' },
      {
        label: 'Close Tab',
        shortcut: 'Ctrl+W',
        action: () => activeDoc && closeDocument(activeDoc.id),
      },
      { divider: true, label: '' },
      { label: 'Exit', action: () => window.xivig?.closeWindow?.() },
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z' },
      { label: 'Redo', shortcut: 'Ctrl+Y' },
      { divider: true, label: '' },
      { label: 'Cut', shortcut: 'Ctrl+X' },
      { label: 'Copy', shortcut: 'Ctrl+C' },
      { label: 'Paste', shortcut: 'Ctrl+V' },
      { divider: true, label: '' },
      { label: 'Find', shortcut: 'Ctrl+F' },
      { label: 'Replace', shortcut: 'Ctrl+H' },
    ],
    Selection: [
      { label: 'Select All', shortcut: 'Ctrl+A' },
      { label: 'Expand Selection', shortcut: 'Shift+Alt+Right' },
      { label: 'Shrink Selection', shortcut: 'Shift+Alt+Left' },
    ],
    View: [
      { label: 'Toggle Sidebar', shortcut: 'Ctrl+B', action: toggleSidebar },
      { label: 'Toggle Full Screen', shortcut: 'F11' },
    ],
    Help: [
      {
        label: 'About Xivig Editor',
        action: () => alert('Xivig Editor v0.1.0\nSublime Text inspired fast desktop code editor.'),
      },
    ],
  };

  return (
    <nav ref={menubarRef} style={menubarContainerStyle}>
      {Object.entries(menus).map(([menuName, items]) => {
        const isOpen = openMenu === menuName;
        return (
          <div key={menuName} style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenMenu(isOpen ? null : menuName)}
              onMouseEnter={() => {
                if (openMenu !== null) setOpenMenu(menuName);
              }}
              style={{
                ...menuTriggerStyle,
                backgroundColor: isOpen ? 'var(--xivig-surface)' : 'transparent',
                color: isOpen ? 'var(--xivig-text)' : 'var(--xivig-text-muted)',
              }}
            >
              {menuName}
            </button>

            {isOpen && (
              <div style={dropdownStyle}>
                {items.map((item, idx) => {
                  if (item.divider) {
                    return <div key={idx} style={dividerStyle} />;
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setOpenMenu(null);
                        item.action?.();
                      }}
                      style={dropdownItemStyle}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--xivig-accent-active)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--xivig-text)';
                      }}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span style={shortcutStyle}>{item.shortcut}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

const menubarContainerStyle: React.CSSProperties = {
  height: 'var(--xivig-menubar-height)',
  backgroundColor: 'var(--xivig-activity-bar)',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '8px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  position: 'relative',
  zIndex: 100,
};

const menuTriggerStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '3px',
  fontSize: '12px',
  fontWeight: 400,
  transition: 'background-color 0.1s ease',
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  minWidth: '200px',
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '4px',
  padding: '4px 0',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
  zIndex: 1000,
};

const dropdownItemStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 12px',
  fontSize: '12px',
  textAlign: 'left',
};

const shortcutStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--xivig-text-dim)',
  marginLeft: '16px',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'var(--xivig-border-subtle)',
  margin: '4px 0',
};
