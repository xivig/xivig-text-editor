import React from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  FilePlus,
  RefreshCw,
} from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { FileItem } from '../../types/editor';

export const Sidebar: React.FC = () => {
  const isSidebarOpen = useFileStore((state) => state.isSidebarOpen);
  const activeView = useFileStore((state) => state.activeSidebarView);
  const currentFolderName = useFileStore((state) => state.currentFolderName);
  const currentFolderPath = useFileStore((state) => state.currentFolderPath);
  const fileTree = useFileStore((state) => state.fileTree);
  const setCurrentFolder = useFileStore((state) => state.setCurrentFolder);
  const toggleFolderExpanded = useFileStore((state) => state.toggleFolderExpanded);
  const setFolderChildren = useFileStore((state) => state.setFolderChildren);

  const openDocument = useEditorStore((state) => state.openDocument);
  const createNewDocument = useEditorStore((state) => state.createNewDocument);

  if (!isSidebarOpen) return null;

  const handleOpenFolderDialog = async () => {
    if (window.xivig?.openFolderDialog) {
      const res = await window.xivig.openFolderDialog();
      if (!res.canceled && res.folderPath && res.files) {
        setCurrentFolder(res.folderPath, res.files);
      }
    }
  };

  const handleFileClick = async (item: FileItem) => {
    if (item.isDirectory) {
      toggleFolderExpanded(item.path);

      // If expanding and children not loaded, load them
      if (!item.isExpanded && (!item.children || item.children.length === 0)) {
        if (window.xivig?.readDir) {
          const res = await window.xivig.readDir(item.path);
          if (res.success && res.items) {
            const children: FileItem[] = res.items
              .map((c) => ({
                id: c.path,
                name: c.name,
                path: c.path,
                isDirectory: c.isDirectory,
                extension: c.name.includes('.') ? c.name.split('.').pop() : undefined,
                isExpanded: false,
                children: c.isDirectory ? [] : undefined,
              }))
              .sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
              });
            setFolderChildren(item.path, children);
          }
        }
      }
    } else {
      // Open file
      if (window.xivig?.readFile) {
        const res = await window.xivig.readFile(item.path);
        if (res.success && res.content !== undefined) {
          openDocument({
            path: item.path,
            name: item.name,
            content: res.content,
            language: item.name,
          });
        }
      }
    }
  };

  const renderTree = (items: FileItem[], depth = 0) => {
    return items.map((item) => {
      const paddingLeft = 14 + depth * 14;

      return (
        <div key={item.path}>
          <div
            onClick={() => handleFileClick(item)}
            style={{
              ...treeItemStyle,
              paddingLeft: `${paddingLeft}px`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--xivig-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {item.isDirectory ? (
              <>
                <span style={chevronIconStyle}>
                  {item.isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
                <span style={folderIconStyle}>
                  {item.isExpanded ? <FolderOpen size={14} color="#6c8cff" /> : <Folder size={14} color="#9299a8" />}
                </span>
              </>
            ) : (
              <>
                <span style={{ width: '13px' }} />
                <span style={fileIconStyle}>
                  {item.extension && ['ts', 'tsx', 'js', 'jsx', 'json', 'py', 'rs'].includes(item.extension) ? (
                    <FileCode size={13} color="#61afef" />
                  ) : (
                    <FileText size={13} color="#9299a8" />
                  )}
                </span>
              </>
            )}
            <span style={itemNameStyle}>{item.name}</span>
          </div>

          {item.isDirectory && item.isExpanded && item.children && (
            <div>{renderTree(item.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <aside style={sidebarContainerStyle}>
      {/* Header */}
      <div style={sidebarHeaderStyle}>
        <span style={sidebarTitleStyle}>
          {activeView === 'explorer' && 'EXPLORER'}
          {activeView === 'search' && 'SEARCH'}
          {activeView === 'git' && 'SOURCE CONTROL'}
          {activeView === 'extensions' && 'EXTENSIONS'}
          {activeView === 'settings' && 'SETTINGS'}
        </span>

        {activeView === 'explorer' && currentFolderPath && (
          <div style={headerActionsStyle}>
            <button
              onClick={() => createNewDocument()}
              style={actionBtnStyle}
              title="New File"
            >
              <FilePlus size={14} />
            </button>
            <button
              onClick={handleOpenFolderDialog}
              style={actionBtnStyle}
              title="Open Another Folder"
            >
              <FolderPlus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={sidebarContentStyle}>
        {activeView === 'explorer' && (
          <>
            {currentFolderPath ? (
              <div>
                <div style={projectTitleSectionStyle}>
                  <ChevronDown size={13} style={{ marginRight: '4px' }} />
                  <span style={projectNameStyle}>{currentFolderName}</span>
                </div>
                <div style={{ marginTop: '4px' }}>
                  {fileTree.length > 0 ? (
                    renderTree(fileTree)
                  ) : (
                    <div style={emptyTreeNoticeStyle}>Folder is empty</div>
                  )}
                </div>
              </div>
            ) : (
              <div style={emptyExplorerStyle}>
                <p style={emptyExplorerTextStyle}>No folder open</p>
                <button onClick={handleOpenFolderDialog} style={openFolderBtnStyle}>
                  Open Folder
                </button>
              </div>
            )}
          </>
        )}

        {activeView === 'search' && (
          <div style={{ padding: '12px' }}>
            <input
              type="text"
              placeholder="Search in files..."
              style={{ width: '100%', marginBottom: '8px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--xivig-text-dim)' }}>
              Global project regex search will be activated in Phase D.
            </p>
          </div>
        )}

        {activeView === 'git' && (
          <div style={{ padding: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--xivig-text-muted)' }}>
              No Git changes detected.
            </p>
          </div>
        )}

        {activeView === 'extensions' && (
          <div style={{ padding: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--xivig-text-muted)' }}>
              Extension Marketplace (Xivig Packages)
            </p>
          </div>
        )}

        {activeView === 'settings' && (
          <div style={{ padding: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--xivig-text-muted)' }}>
              Preferences & Keybindings
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

const sidebarContainerStyle: React.CSSProperties = {
  width: 'var(--xivig-sidebar-width)',
  backgroundColor: 'var(--xivig-sidebar)',
  borderRight: '1px solid var(--xivig-border-subtle)',
  display: 'flex',
  flexDirection: 'column',
  userSelect: 'none',
  overflow: 'hidden',
};

const sidebarHeaderStyle: React.CSSProperties = {
  height: '34px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 12px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
};

const sidebarTitleStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.8px',
  color: 'var(--xivig-text-muted)',
};

const headerActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
};

const actionBtnStyle: React.CSSProperties = {
  color: 'var(--xivig-text-muted)',
  padding: '2px',
  borderRadius: '3px',
};

const sidebarContentStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
};

const projectTitleSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '6px 10px',
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--xivig-text)',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const projectNameStyle: React.CSSProperties = {
  letterSpacing: '0.5px',
};

const treeItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '24px',
  cursor: 'pointer',
  fontSize: '12.5px',
  color: 'var(--xivig-text)',
  transition: 'background-color 0.1s ease',
};

const chevronIconStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '4px',
  color: 'var(--xivig-text-dim)',
};

const folderIconStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  marginRight: '6px',
};

const fileIconStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  marginRight: '6px',
};

const itemNameStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const emptyTreeNoticeStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '12px',
  color: 'var(--xivig-text-dim)',
  fontStyle: 'italic',
};

const emptyExplorerStyle: React.CSSProperties = {
  padding: '24px 16px',
  textAlign: 'center',
};

const emptyExplorerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--xivig-text-muted)',
  marginBottom: '12px',
};

const openFolderBtnStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  color: 'var(--xivig-text)',
  padding: '6px 12px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
};
