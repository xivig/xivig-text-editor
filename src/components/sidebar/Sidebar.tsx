import React, { useState } from 'react';
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
  Clock,
  Trash2,
  X,
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
  const recentWorkspaces = useFileStore((state) => state.recentWorkspaces);
  const recentFiles = useFileStore((state) => state.recentFiles);
  const setCurrentFolder = useFileStore((state) => state.setCurrentFolder);
  const refreshCurrentFolder = useFileStore((state) => state.refreshCurrentFolder);
  const toggleFolderExpanded = useFileStore((state) => state.toggleFolderExpanded);
  const setFolderChildren = useFileStore((state) => state.setFolderChildren);
  const gitChanges = useFileStore((state) => state.gitChanges);
  const isGitRepo = useFileStore((state) => state.isGitRepo);
  const commitGitChanges = useFileStore((state) => state.commitGitChanges);
  const loadGitStatus = useFileStore((state) => state.loadGitStatus);

  const openDocument = useEditorStore((state) => state.openDocument);
  const createNewDocument = useEditorStore((state) => state.createNewDocument);

  // New file / folder inline prompt modal state
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [promptType, setPromptType] = useState<'file' | 'folder'>('file');
  const [promptTargetDir, setPromptTargetDir] = useState<string>('');
  const [promptInput, setPromptInput] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);

  if (!isSidebarOpen) return null;

  const handleOpenFolderDialog = async () => {
    if (window.xivig?.openFolderDialog) {
      const res = await window.xivig.openFolderDialog();
      if (!res.canceled && res.folderPath && res.files) {
        setCurrentFolder(res.folderPath, res.files);
      }
    }
  };

  const handleOpenRecentWorkspace = async (folderPath: string) => {
    if (window.xivig?.readDir) {
      const res = await window.xivig.readDir(folderPath);
      if (res.success && res.items) {
        setCurrentFolder(folderPath, res.items);
      }
    }
  };

  const handleOpenRecentFile = async (filePath: string, name: string) => {
    if (window.xivig?.readFile) {
      const res = await window.xivig.readFile(filePath);
      if (res.success && res.content !== undefined) {
        openDocument({
          path: filePath,
          name,
          content: res.content,
          language: name,
        });
      }
    }
  };

  const handleCreatePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || !window.xivig?.createFileOrFolder) return;

    const baseDir = promptTargetDir || currentFolderPath;
    if (!baseDir) return;

    const targetPath = `${baseDir}/${promptInput.trim()}`;
    const res = await window.xivig.createFileOrFolder(targetPath, promptType === 'folder');

    if (res.success) {
      setIsPromptOpen(false);
      setPromptInput('');
      await refreshCurrentFolder();

      if (promptType === 'file') {
        openDocument({
          path: targetPath,
          name: promptInput.trim(),
          content: '',
          language: promptInput.trim(),
        });
      }
    } else {
      alert(`Failed to create ${promptType}: ${res.error}`);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, item: FileItem) => {
    e.stopPropagation();
    const confirmed = confirm(`Are you sure you want to delete "${item.name}"?`);
    if (confirmed && window.xivig?.deleteFileOrFolder) {
      const res = await window.xivig.deleteFileOrFolder(item.path);
      if (res.success) {
        await refreshCurrentFolder();
      } else {
        alert(`Failed to delete: ${res.error}`);
      }
    }
  };

  const handleFileClick = async (item: FileItem) => {
    if (item.isDirectory) {
      toggleFolderExpanded(item.path);

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
        <div key={item.path} className="tree-row-wrapper" style={{ position: 'relative' }}>
          <div
            onClick={() => handleFileClick(item)}
            style={{
              ...treeItemStyle,
              paddingLeft: `${paddingLeft}px`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--xivig-surface-hover)';
              const btn = e.currentTarget.querySelector('.item-action-delete') as HTMLElement;
              if (btn) btn.style.display = 'flex';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              const btn = e.currentTarget.querySelector('.item-action-delete') as HTMLElement;
              if (btn) btn.style.display = 'none';
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

            {/* Git status badge */}
            {!item.isDirectory && (() => {
              const change = gitChanges.find((c) =>
                item.path.endsWith(c.path.replace(/\//g, '\\')) || item.path.endsWith(c.path) || c.path.endsWith(item.name)
              );
              if (!change) return null;
              const color = change.status === 'M' ? '#e6ad45' : change.status === 'D' ? '#ef6464' : '#35b779';
              return (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color,
                    marginRight: '6px',
                    padding: '1px 4px',
                  }}
                  title={`Git: ${change.status === 'M' ? 'Modified' : change.status === 'D' ? 'Deleted' : 'Untracked/Added'}`}
                >
                  {change.status === '?' ? 'U' : change.status}
                </span>
              );
            })()}

            {/* Quick delete button */}
            <button
              className="item-action-delete"
              onClick={(e) => handleDeleteItem(e, item)}
              title={`Delete ${item.name}`}
              style={deleteItemBtnStyle}
            >
              <Trash2 size={11} />
            </button>
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
              onClick={() => {
                setPromptType('file');
                setPromptTargetDir(currentFolderPath);
                setIsPromptOpen(true);
              }}
              style={actionBtnStyle}
              title="New File in Root"
            >
              <FilePlus size={14} />
            </button>
            <button
              onClick={() => {
                setPromptType('folder');
                setPromptTargetDir(currentFolderPath);
                setIsPromptOpen(true);
              }}
              style={actionBtnStyle}
              title="New Folder in Root"
            >
              <FolderPlus size={14} />
            </button>
            <button
              onClick={() => refreshCurrentFolder()}
              style={actionBtnStyle}
              title="Refresh Workspace"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Inline Create Prompt */}
      {isPromptOpen && (
        <form onSubmit={handleCreatePromptSubmit} style={promptContainerStyle}>
          <div style={promptHeaderStyle}>
            <span style={{ fontSize: '11px', fontWeight: 600 }}>
              New {promptType === 'file' ? 'File' : 'Folder'}
            </span>
            <button
              type="button"
              onClick={() => setIsPromptOpen(false)}
              style={{ color: 'var(--xivig-text-dim)' }}
            >
              <X size={12} />
            </button>
          </div>
          <input
            autoFocus
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder={promptType === 'file' ? 'filename.ts' : 'folder-name'}
            style={promptInputStyle}
          />
        </form>
      )}

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
                <div style={{ marginTop: '2px' }}>
                  {fileTree.length > 0 ? (
                    renderTree(fileTree)
                  ) : (
                    <div style={emptyTreeNoticeStyle}>Folder is empty</div>
                  )}
                </div>
              </div>
            ) : (
              <div style={emptyExplorerStyle}>
                <p style={emptyExplorerTextStyle}>No workspace folder open</p>
                <button onClick={handleOpenFolderDialog} style={openFolderBtnStyle}>
                  Open Folder
                </button>

                {/* Recent Workspaces section */}
                {recentWorkspaces.length > 0 && (
                  <div style={recentSectionStyle}>
                    <div style={recentHeaderStyle}>
                      <Clock size={12} style={{ marginRight: '6px' }} />
                      <span>Recent Workspaces</span>
                    </div>
                    {recentWorkspaces.slice(0, 5).map((ws) => (
                      <div
                        key={ws.id}
                        onClick={() => handleOpenRecentWorkspace(ws.path)}
                        style={recentItemStyle}
                        title={ws.path}
                      >
                        <Folder size={13} color="#6c8cff" style={{ marginRight: '6px', flexShrink: 0 }} />
                        <span style={recentNameStyle}>{ws.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent Files section */}
                {recentFiles.length > 0 && (
                  <div style={recentSectionStyle}>
                    <div style={recentHeaderStyle}>
                      <Clock size={12} style={{ marginRight: '6px' }} />
                      <span>Recent Files</span>
                    </div>
                    {recentFiles.slice(0, 5).map((rf) => (
                      <div
                        key={rf.id}
                        onClick={() => handleOpenRecentFile(rf.path, rf.name)}
                        style={recentItemStyle}
                        title={rf.path}
                      >
                        <FileText size={13} color="#9299a8" style={{ marginRight: '6px', flexShrink: 0 }} />
                        <span style={recentNameStyle}>{rf.name}</span>
                      </div>
                    ))}
                  </div>
                )}
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
              Project-wide regex search engine will activate in Phase D.
            </p>
          </div>
        )}

        {activeView === 'git' && (
          <div style={{ padding: '12px' }}>
            {!isGitRepo ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ fontSize: '12px', color: 'var(--xivig-text-muted)', marginBottom: '8px' }}>
                  No Git repository detected in this workspace.
                </p>
              </div>
            ) : (
              <div>
                {/* Commit Box */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!commitMessage.trim()) return;
                    setIsCommitting(true);
                    const res = await commitGitChanges(commitMessage);
                    setIsCommitting(false);
                    if (res.success) {
                      setCommitMessage('');
                    } else {
                      alert(`Commit failed: ${res.error}`);
                    }
                  }}
                  style={{ marginBottom: '16px' }}
                >
                  <textarea
                    rows={3}
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Message (Ctrl+Enter to commit)"
                    style={{
                      width: '100%',
                      resize: 'none',
                      fontSize: '12px',
                      marginBottom: '8px',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isCommitting || !commitMessage.trim() || gitChanges.length === 0}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      backgroundColor:
                        gitChanges.length > 0 && commitMessage.trim()
                          ? 'var(--xivig-accent)'
                          : 'rgba(108, 140, 255, 0.3)',
                      color: '#ffffff',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: gitChanges.length > 0 && commitMessage.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {isCommitting ? 'Committing...' : 'Commit Changes'}
                  </button>
                </form>

                {/* Changes List Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--xivig-text-muted)', textTransform: 'uppercase' }}>
                    Changes ({gitChanges.length})
                  </span>
                  <button onClick={() => loadGitStatus()} style={{ color: 'var(--xivig-text-dim)', padding: '2px' }} title="Refresh Git Status">
                    <RefreshCw size={12} />
                  </button>
                </div>

                {/* Changed Files */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {gitChanges.length > 0 ? (
                    gitChanges.map((change) => {
                      const fileName = change.path.split(/[/\\]/).pop() || change.path;
                      const color = change.status === 'M' ? '#e6ad45' : change.status === 'D' ? '#ef6464' : '#35b779';
                      const fullPath = currentFolderPath ? `${currentFolderPath}/${change.path}` : change.path;

                      return (
                        <div
                          key={change.path}
                          onClick={async () => {
                            if (window.xivig?.readFile) {
                              const res = await window.xivig.readFile(fullPath);
                              if (res.success && res.content !== undefined) {
                                openDocument({
                                  path: fullPath,
                                  name: fileName,
                                  content: res.content,
                                  language: fileName,
                                });
                              }
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 6px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            transition: 'background-color 0.1s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--xivig-surface-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          title={change.path}
                        >
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                            <span style={{ color: 'var(--xivig-text)', marginRight: '6px' }}>{fileName}</span>
                            <span style={{ fontSize: '11px', color: 'var(--xivig-text-dim)' }}>{change.path}</span>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color }}>
                            {change.status === '?' ? 'U' : change.status}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ fontSize: '12px', color: 'var(--xivig-text-dim)', fontStyle: 'italic', padding: '8px 0' }}>
                      Working tree clean
                    </p>
                  )}
                </div>
              </div>
            )}
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
            <p style={{ fontSize: '12px', color: 'var(--xivig-text-muted)', marginBottom: '8px' }}>
              Preferences & Storage
            </p>
            <p style={{ fontSize: '11px', color: 'var(--xivig-text-dim)' }}>
              Metadata & sessions persist via SQLite database.
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

const promptContainerStyle: React.CSSProperties = {
  padding: '8px 12px',
  backgroundColor: 'var(--xivig-surface)',
  borderBottom: '1px solid var(--xivig-border)',
};

const promptHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px',
};

const promptInputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: '12px',
  padding: '4px 6px',
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
  position: 'relative',
};

const deleteItemBtnStyle: React.CSSProperties = {
  display: 'none',
  position: 'absolute',
  right: '8px',
  top: '4px',
  color: 'var(--xivig-text-dim)',
  padding: '2px',
  borderRadius: '2px',
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
  flex: 1,
  paddingRight: '20px',
};

const emptyTreeNoticeStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '12px',
  color: 'var(--xivig-text-dim)',
  fontStyle: 'italic',
};

const emptyExplorerStyle: React.CSSProperties = {
  padding: '20px 14px',
  textAlign: 'center',
};

const emptyExplorerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--xivig-text-muted)',
  marginBottom: '10px',
};

const openFolderBtnStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  color: 'var(--xivig-text)',
  padding: '6px 14px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  marginBottom: '20px',
};

const recentSectionStyle: React.CSSProperties = {
  textAlign: 'left',
  marginTop: '16px',
  borderTop: '1px solid var(--xivig-border-subtle)',
  paddingTop: '12px',
};

const recentHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--xivig-text-dim)',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const recentItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '5px 6px',
  borderRadius: '3px',
  cursor: 'pointer',
  fontSize: '12px',
  color: 'var(--xivig-text)',
  transition: 'background-color 0.1s ease',
};

const recentNameStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
