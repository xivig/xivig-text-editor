import React, { useState, useMemo, useEffect } from 'react';
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
  Plus,
  Minus,
  RotateCcw,
  FoldVertical,
  Filter,
  GitBranch,
  DownloadCloud,
  UploadCloud,
  Archive,
} from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { useGitStore } from '../../stores/gitStore';
import { useEditorStore } from '../../stores/editorStore';
import { FileItem } from '../../types/editor';
import { FileIcon, FolderIcon } from '../common/FileIcon';
import { ExtensionsView } from '../extensions/ExtensionsView';
import { ProjectSearchView } from '../search/ProjectSearchView';
import { DebugPanel } from '../debug/DebugPanel';
import { FileContextMenu, ContextMenuTarget } from '../common/FileContextMenu';

function filterFileTree(items: FileItem[], query: string): FileItem[] {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();

  function itemMatches(item: FileItem): FileItem | null {
    if (item.isDirectory) {
      const filteredChildren = (item.children || [])
        .map(itemMatches)
        .filter((child): child is FileItem => child !== null);
      if (item.name.toLowerCase().includes(q) || filteredChildren.length > 0) {
        return {
          ...item,
          isExpanded: true,
          children: filteredChildren,
        };
      }
      return null;
    }
    if (item.name.toLowerCase().includes(q)) {
      return item;
    }
    return null;
  }

  return items.map(itemMatches).filter((item): item is FileItem => item !== null);
}

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
  const collapseAllFolders = useFileStore((state) => state.collapseAllFolders);
  const fileFilterQuery = useFileStore((state) => state.fileFilterQuery);
  const setFileFilterQuery = useFileStore((state) => state.setFileFilterQuery);
  const gitChanges = useFileStore((state) => state.gitChanges);
  const isGitRepo = useFileStore((state) => state.isGitRepo);
  const commitGitChanges = useFileStore((state) => state.commitGitChanges);
  const loadGitStatus = useFileStore((state) => state.loadGitStatus);
  const stageGitFile = useFileStore((state) => state.stageGitFile);
  const unstageGitFile = useFileStore((state) => state.unstageGitFile);
  const stageAllGit = useFileStore((state) => state.stageAllGit);
  const unstageAllGit = useFileStore((state) => state.unstageAllGit);
  const discardGitFile = useFileStore((state) => state.discardGitFile);

  // Extended Git store
  const branches = useGitStore((state) => state.branches);
  const currentBranch = useGitStore((state) => state.currentBranch);
  const loadBranches = useGitStore((state) => state.loadBranches);
  const switchBranch = useGitStore((state) => state.switchBranch);
  const createBranch = useGitStore((state) => state.createBranch);
  const remotePull = useGitStore((state) => state.remotePull);
  const remotePush = useGitStore((state) => state.remotePush);
  const saveStash = useGitStore((state) => state.saveStash);
  const isAmending = useGitStore((state) => state.isAmending);
  const setIsAmending = useGitStore((state) => state.setIsAmending);
  const cycleCommitHistory = useGitStore((state) => state.cycleCommitHistory);

  const openDocument = useEditorStore((state) => state.openDocument);
  const createNewDocument = useEditorStore((state) => state.createNewDocument);

  // New file / folder inline prompt modal state
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [promptType, setPromptType] = useState<'file' | 'folder'>('file');
  const [promptTargetDir, setPromptTargetDir] = useState<string>('');
  const [promptInput, setPromptInput] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; target: ContextMenuTarget } | null>(null);
  const [renameTarget, setRenameTarget] = useState<ContextMenuTarget | null>(null);
  const [renameInput, setRenameInput] = useState('');

  useEffect(() => {
    if (activeView === 'git' && isGitRepo) {
      loadBranches();
    }
  }, [activeView, isGitRepo]);

  const visibleTree = useMemo(() => {
    return filterFileTree(fileTree, fileFilterQuery);
  }, [fileTree, fileFilterQuery]);

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

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameInput.trim() || !window.xivig?.renameFileOrFolder) return;
    const parentDir = renameTarget.path.replace(/[/\\][^/\\]+$/, '');
    const newPath = `${parentDir}/${renameInput.trim()}`;
    const res = await window.xivig.renameFileOrFolder(renameTarget.path, newPath);
    if (res.success) {
      setRenameTarget(null);
      setRenameInput('');
      await refreshCurrentFolder();
    } else {
      alert(`Rename failed: ${res.error}`);
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
          // If only welcome-tab was open, close it
          const currentDocs = useEditorStore.getState().documents;
          if (currentDocs.length === 1 && currentDocs[0].id === 'welcome-tab') {
            useEditorStore.getState().closeDocument('welcome-tab');
          }
          openDocument({
            path: item.path,
            name: item.name,
            content: res.content,
            language: item.name,
          });
        } else if (!res.success && res.error) {
          console.warn('[Sidebar] Failed to read file:', res.error);
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
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                target: { name: item.name, path: item.path, isDirectory: item.isDirectory },
              });
            }}
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
                  <FolderIcon folderName={item.name} isOpen={item.isExpanded} size={14} />
                </span>
              </>
            ) : (
              <>
                <span style={{ width: '13px' }} />
                <span style={fileIconStyle}>
                  <FileIcon filename={item.name} size={14} />
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
            <button
              onClick={() => collapseAllFolders()}
              style={actionBtnStyle}
              title="Collapse All Folders"
            >
              <FoldVertical size={13} />
            </button>
            <button
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              style={{
                ...actionBtnStyle,
                color: isFilterVisible || fileFilterQuery ? 'var(--xivig-accent)' : undefined,
              }}
              title="Filter Files"
            >
              <Filter size={13} />
            </button>
          </div>
        )}
      </div>

      {/* File Filter Input Bar */}
      {activeView === 'explorer' && currentFolderPath && (isFilterVisible || Boolean(fileFilterQuery)) && (
        <div style={{ padding: '4px 10px 8px 10px', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              value={fileFilterQuery}
              onChange={(e) => setFileFilterQuery(e.target.value)}
              placeholder="Filter files (e.g. .ts, component)..."
              style={{
                width: '100%',
                padding: '4px 22px 4px 8px',
                fontSize: '11px',
                backgroundColor: 'var(--xivig-surface)',
                border: '1px solid var(--xivig-border)',
                borderRadius: '4px',
                color: 'var(--xivig-text)',
                outline: 'none',
              }}
            />
            {fileFilterQuery && (
              <button
                type="button"
                onClick={() => setFileFilterQuery('')}
                style={{
                  position: 'absolute',
                  right: '5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--xivig-text-dim)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>
      )}

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
                  {visibleTree.length > 0 ? (
                    renderTree(visibleTree)
                  ) : (
                    <div style={emptyTreeNoticeStyle}>
                      {fileFilterQuery ? 'No matching files found' : 'Folder is empty'}
                    </div>
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
                        <FolderIcon folderName={ws.name} size={14} style={{ marginRight: '6px', flexShrink: 0 }} />
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
                        <FileIcon filename={rf.name} size={14} style={{ marginRight: '6px', flexShrink: 0 }} />
                        <span style={recentNameStyle}>{rf.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeView === 'search' && <ProjectSearchView />}

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
                {/* Branch Switcher & Remote Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    padding: '4px 8px',
                    backgroundColor: 'var(--xivig-surface)',
                    border: '1px solid var(--xivig-border)',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                    <GitBranch size={13} style={{ color: 'var(--xivig-accent)', flexShrink: 0 }} />
                    <select
                      value={currentBranch}
                      onChange={async (e) => {
                        const target = e.target.value;
                        if (target === '__new__') {
                          const name = prompt('Enter new branch name:');
                          if (name && name.trim()) {
                            await createBranch(name.trim(), true);
                            await loadBranches();
                            await loadGitStatus();
                          }
                        } else {
                          await switchBranch(target);
                          await loadBranches();
                          await loadGitStatus();
                        }
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--xivig-text)',
                        fontSize: '11px',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      <option value={currentBranch}>{currentBranch}</option>
                      {branches
                        .filter((b) => b.name !== currentBranch && !b.isRemote)
                        .map((b) => (
                          <option key={b.name} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      <option value="__new__">+ New Branch...</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        await remotePull();
                        await loadGitStatus();
                      }}
                      title="Pull from Remote"
                      style={actionBtnStyle}
                    >
                      <DownloadCloud size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await remotePush();
                        await loadGitStatus();
                      }}
                      title="Push to Remote"
                      style={actionBtnStyle}
                    >
                      <UploadCloud size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const msg = prompt('Enter stash message (optional):');
                        if (msg !== null) {
                          await saveStash(msg);
                          await loadGitStatus();
                        }
                      }}
                      title="Git Stash"
                      style={actionBtnStyle}
                    >
                      <Archive size={13} />
                    </button>
                  </div>
                </div>

                {/* Commit Box */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!commitMessage.trim()) return;
                    setIsCommitting(true);
                    const res = await commitGitChanges(commitMessage, isAmending);
                    setIsCommitting(false);
                    if (res.success) {
                      setCommitMessage('');
                      setIsAmending(false);
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        const stagedCount = gitChanges.filter((c) => c.staged).length;
                        if ((stagedCount > 0 || isAmending) && commitMessage.trim()) {
                          (e.currentTarget.form as HTMLFormElement)?.requestSubmit();
                        }
                      } else if (
                        e.key === 'ArrowUp' &&
                        e.currentTarget.selectionStart === 0 &&
                        e.currentTarget.selectionEnd === 0
                      ) {
                        e.preventDefault();
                        cycleCommitHistory('up');
                      } else if (
                        e.key === 'ArrowDown' &&
                        e.currentTarget.selectionStart === e.currentTarget.value.length
                      ) {
                        e.preventDefault();
                        cycleCommitHistory('down');
                      }
                    }}
                    placeholder="Message (Ctrl+Enter to commit, Up/Down for history)"
                    style={{
                      width: '100%',
                      resize: 'none',
                      fontSize: '12px',
                      marginBottom: '6px',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--xivig-text-dim)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isAmending}
                        onChange={(e) => setIsAmending(e.target.checked)}
                      />
                      Amend Commit
                    </label>
                  </div>
                  {(() => {
                    const stagedCount = gitChanges.filter((c) => c.staged).length;
                    const canCommit = (stagedCount > 0 || isAmending) && Boolean(commitMessage.trim());
                    return (
                      <button
                        type="submit"
                        disabled={isCommitting || !canCommit}
                        style={{
                          width: '100%',
                          padding: '6px 12px',
                          backgroundColor: canCommit ? 'var(--xivig-accent)' : 'rgba(108, 140, 255, 0.25)',
                          color: '#ffffff',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: canCommit ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {isCommitting
                          ? 'Committing...'
                          : isAmending
                          ? 'Amend Last Commit'
                          : stagedCount > 0
                          ? `Commit Staged (${stagedCount})`
                          : 'Stage Changes to Commit'}
                      </button>
                    );
                  })()}
                </form>

                {/* Staged Changes Section */}
                {(() => {
                  const stagedFiles = gitChanges.filter((c) => c.staged);
                  if (stagedFiles.length === 0) return null;
                  return (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#35b779', textTransform: 'uppercase' }}>
                          Staged Changes ({stagedFiles.length})
                        </span>
                        <button
                          onClick={() => unstageAllGit()}
                          style={{ color: 'var(--xivig-text-dim)', padding: '2px', fontSize: '10px' }}
                          title="Unstage All Changes"
                        >
                          <Minus size={12} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {stagedFiles.map((change) => {
                          const fileName = change.path.split(/[/\\]/).pop() || change.path;
                          const color = change.status === 'M' ? '#e6ad45' : change.status === 'D' ? '#ef6464' : '#35b779';
                          const fullPath = currentFolderPath ? `${currentFolderPath}/${change.path}` : change.path;

                          return (
                            <div
                              key={`staged-${change.path}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '4px 6px',
                                borderRadius: '3px',
                                fontSize: '12px',
                                transition: 'background-color 0.1s',
                              }}
                              className="group hover:bg-[#252528]"
                            >
                              <div
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
                                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, cursor: 'pointer' }}
                                title={change.path}
                              >
                                <span style={{ color: 'var(--xivig-text)', marginRight: '6px' }}>{fileName}</span>
                                <span style={{ fontSize: '11px', color: 'var(--xivig-text-dim)' }}>{change.path}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    unstageGitFile(change.path);
                                  }}
                                  title="Unstage File"
                                  style={{ color: 'var(--xivig-text-dim)', padding: '2px' }}
                                >
                                  <Minus size={11} />
                                </button>
                                <span style={{ fontSize: '11px', fontWeight: 700, color }}>
                                  {change.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Unstaged Changes Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--xivig-text-muted)', textTransform: 'uppercase' }}>
                      Changes ({gitChanges.filter((c) => !c.staged).length})
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => stageAllGit()} style={{ color: 'var(--xivig-text-dim)', padding: '2px' }} title="Stage All Changes">
                        <Plus size={12} />
                      </button>
                      <button onClick={() => loadGitStatus()} style={{ color: 'var(--xivig-text-dim)', padding: '2px' }} title="Refresh Git Status">
                        <RefreshCw size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Changed Files */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {gitChanges.filter((c) => !c.staged).length > 0 ? (
                      gitChanges
                        .filter((c) => !c.staged)
                        .map((change) => {
                          const fileName = change.path.split(/[/\\]/).pop() || change.path;
                          const color = change.status === 'M' ? '#e6ad45' : change.status === 'D' ? '#ef6464' : '#35b779';
                          const fullPath = currentFolderPath ? `${currentFolderPath}/${change.path}` : change.path;

                          return (
                            <div
                              key={`unstaged-${change.path}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '4px 6px',
                                borderRadius: '3px',
                                fontSize: '12px',
                                transition: 'background-color 0.1s',
                              }}
                              className="group hover:bg-[#252528]"
                            >
                              <div
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
                                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, cursor: 'pointer' }}
                                title={change.path}
                              >
                                <span style={{ color: 'var(--xivig-text)', marginRight: '6px' }}>{fileName}</span>
                                <span style={{ fontSize: '11px', color: 'var(--xivig-text-dim)' }}>{change.path}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    discardGitFile(change.path);
                                  }}
                                  title="Discard Changes"
                                  style={{ color: '#ef6464', padding: '2px' }}
                                >
                                  <RotateCcw size={11} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    stageGitFile(change.path);
                                  }}
                                  title="Stage File"
                                  style={{ color: 'var(--xivig-accent)', padding: '2px' }}
                                >
                                  <Plus size={12} />
                                </button>
                                <span style={{ fontSize: '11px', fontWeight: 700, color }}>
                                  {change.status === '?' ? 'U' : change.status}
                                </span>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <p style={{ fontSize: '12px', color: 'var(--xivig-text-dim)', fontStyle: 'italic', padding: '8px 0' }}>
                        {gitChanges.length > 0 ? 'All changes staged' : 'Working tree clean'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'extensions' && <ExtensionsView />}

        {activeView === 'settings' && (
          <div style={{ padding: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--xivig-text)', marginBottom: '8px' }}>
              Preferences & Themes
            </p>
            <p style={{ fontSize: '12px', color: 'var(--xivig-text-muted)', marginBottom: '16px' }}>
              Customize font sizes, line height, tab spacing, and themes.
            </p>
            <button
              onClick={() => {
                useEditorStore.getState().openSettings();
              }}
              style={openFolderBtnStyle}
            >
              Open Settings (Ctrl+,)
            </button>
          </div>
        )}

        {activeView === 'debug' && <DebugPanel />}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          target={contextMenu.target}
          source="sidebar"
          onClose={() => setContextMenu(null)}
          onRename={(target) => {
            setRenameTarget(target);
            setRenameInput(target.name);
          }}
          onNewFile={(dir) => {
            setPromptType('file');
            setPromptTargetDir(dir);
            setIsPromptOpen(true);
          }}
          onNewFolder={(dir) => {
            setPromptType('folder');
            setPromptTargetDir(dir);
            setIsPromptOpen(true);
          }}
        />
      )}

      {/* Rename Prompt Modal */}
      {renameTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setRenameTarget(null)}
        >
          <form
            onSubmit={handleRenameSubmit}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#202228',
              border: '1px solid #363945',
              borderRadius: '6px',
              padding: '16px',
              width: '320px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Rename File</span>
              <button type="button" onClick={() => setRenameTarget(null)} style={{ color: '#888' }}>
                <X size={14} />
              </button>
            </div>
            <input
              autoFocus
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#17191f',
                border: '1px solid #3c404d',
                borderRadius: '4px',
                padding: '6px 10px',
                color: '#fff',
                fontSize: '12px',
                marginBottom: '12px',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  color: '#aaa',
                  fontSize: '12px',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '5px 14px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--xivig-accent)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                Rename
              </button>
            </div>
          </form>
        </div>
      )}
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
