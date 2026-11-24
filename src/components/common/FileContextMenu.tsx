import React, { useEffect, useRef } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { useBuildStore } from '../../stores/buildStore';
import { getActiveEditorView } from '../editor/editorViewRegistry';
import { goToDefinition, peekDefinition, findReferences, renameSymbol } from '../editor/codeIntelligence';
import { beautifyActiveEditor } from '../../utils/beautify';
import { smartToggleLineComment, smartToggleBlockComment } from '../../utils/commentUtils';
import {
  writeClipboardText,
  cutEditorSelection,
  copyEditorSelection,
  pasteToEditor,
  selectAllEditor,
} from '../../utils/clipboard';

export interface ContextMenuTarget {
  name: string;
  path: string;
  isDirectory?: boolean;
  docId?: string;
}

export interface FileContextMenuProps {
  x: number;
  y: number;
  target: ContextMenuTarget;
  source?: 'editor' | 'sidebar' | 'tab';
  onClose: () => void;
  onRename?: (target: ContextMenuTarget) => void;
  onNewFile?: (dir: string) => void;
  onNewFolder?: (dir: string) => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  x,
  y,
  target,
  source,
  onClose,
  onRename,
  onNewFile,
  onNewFolder,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const currentFolderPath = useFileStore((state) => state.currentFolderPath);
  const refreshCurrentFolder = useFileStore((state) => state.refreshCurrentFolder);
  const fileClipboard = useFileStore((state) => state.fileClipboard);
  const setFileClipboard = useFileStore((state) => state.setFileClipboard);
  const pasteFileClipboard = useFileStore((state) => state.pasteFileClipboard);

  const openDocument = useEditorStore((state) => state.openDocument);
  const closeDocument = useEditorStore((state) => state.closeDocument);
  const closeOtherTabs = useEditorStore((state) => state.closeOtherTabs);
  const closeTabsToTheRight = useEditorStore((state) => state.closeTabsToTheRight);
  const closeSavedTabs = useEditorStore((state) => state.closeSavedTabs);
  const closeAllTabs = useEditorStore((state) => state.closeAllTabs);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust menu position so it stays within viewport
  const adjustedPosition = React.useMemo(() => {
    const menuWidth = 210;
    const menuHeight = 520;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let posX = x;
    let posY = y;

    if (posX + menuWidth > screenWidth) {
      posX = Math.max(8, screenWidth - menuWidth - 8);
    }
    if (posY + menuHeight > screenHeight) {
      posY = Math.max(8, screenHeight - menuHeight - 8);
    }

    return { top: posY, left: posX };
  }, [x, y]);

  const getTargetDir = () => {
    return target.isDirectory ? target.path : target.path.replace(/[/\\][^/\\]+$/, '');
  };

  // Find document corresponding to target (for tabs or active file)
  const getTargetDoc = () => {
    const docs = useEditorStore.getState().documents;
    if (target.docId) {
      const match = docs.find((d) => d.id === target.docId);
      if (match) return match;
    }
    const norm = (p: string) => p.replace(/\\/g, '/').toLowerCase();
    const targetNorm = target.path ? norm(target.path) : '';
    return (
      docs.find((d) => (d.path && norm(d.path) === targetNorm) || d.name === target.name) ||
      useEditorStore.getState().getActiveDocument()
    );
  };

  // ==========================================================================
  // CLIPBOARD OPERATIONS (CUT, COPY, PASTE, SELECT ALL)
  // ==========================================================================

  const handleCut = async () => {
    onClose();
    if (source === 'editor') {
      const view = getActiveEditorView();
      if (view) {
        await cutEditorSelection(view);
      }
      return;
    }

    // Sidebar: Cut file/folder
    setFileClipboard({
      action: 'cut',
      path: target.path,
      name: target.name,
      isDirectory: target.isDirectory,
    });
    await writeClipboardText(target.path);
  };

  const handleCopy = async () => {
    onClose();
    if (source === 'editor') {
      const view = getActiveEditorView();
      if (view) {
        await copyEditorSelection(view);
      }
      return;
    }

    // Sidebar: Copy file/folder
    setFileClipboard({
      action: 'copy',
      path: target.path,
      name: target.name,
      isDirectory: target.isDirectory,
    });
    await writeClipboardText(target.path);
  };

  const handlePaste = async () => {
    onClose();
    if (source === 'editor') {
      const view = getActiveEditorView();
      if (view) {
        await pasteToEditor(view);
      }
      return;
    }

    // Sidebar: Paste file/folder into directory
    const dir = getTargetDir();
    const res = await pasteFileClipboard(dir);
    if (!res.success && res.error) {
      alert(`Paste failed: ${res.error}`);
    }
  };

  const handleSelectAll = () => {
    onClose();
    const view = getActiveEditorView();
    if (view) {
      selectAllEditor(view);
    }
  };

  // ==========================================================================
  // FILE & DIRECTORY CREATION / RENAMING / DELETION
  // ==========================================================================

  const handleNewFile = async () => {
    onClose();
    const dir = getTargetDir();
    if (onNewFile) {
      onNewFile(dir);
      return;
    }
    const fileName = window.prompt('Enter new file name:');
    if (fileName && fileName.trim() && window.xivig?.createFileOrFolder) {
      const targetPath = `${dir}/${fileName.trim()}`;
      const res = await window.xivig.createFileOrFolder(targetPath, false);
      if (res.success) {
        await refreshCurrentFolder();
        openDocument({
          path: targetPath,
          name: fileName.trim(),
          content: '',
          language: fileName.trim(),
        });
      } else {
        alert(`Failed to create file: ${res.error}`);
      }
    }
  };

  const handleNewFolder = async () => {
    onClose();
    const dir = getTargetDir();
    if (onNewFolder) {
      onNewFolder(dir);
      return;
    }
    const folderName = window.prompt('Enter new folder name:');
    if (folderName && folderName.trim() && window.xivig?.createFileOrFolder) {
      const targetPath = `${dir}/${folderName.trim()}`;
      const res = await window.xivig.createFileOrFolder(targetPath, true);
      if (res.success) {
        await refreshCurrentFolder();
      } else {
        alert(`Failed to create folder: ${res.error}`);
      }
    }
  };

  const handleDuplicate = async () => {
    onClose();
    if (!window.xivig?.duplicateFile || target.isDirectory) return;

    const lastDotIndex = target.name.lastIndexOf('.');
    let baseName = target.name;
    let ext = '';
    if (lastDotIndex > 0) {
      baseName = target.name.substring(0, lastDotIndex);
      ext = target.name.substring(lastDotIndex);
    }

    const dir = target.path.replace(/[/\\][^/\\]+$/, '');
    let newFilename = `${baseName} copy${ext}`;
    let newPath = `${dir}/${newFilename}`;

    const res = await window.xivig.duplicateFile(target.path, newPath);
    if (res.success) {
      await refreshCurrentFolder();
      if (window.xivig?.readFile) {
        const readRes = await window.xivig.readFile(newPath);
        if (readRes.success && readRes.content !== undefined) {
          openDocument({
            path: newPath,
            name: newFilename,
            content: readRes.content,
            language: newFilename,
          });
        }
      }
    } else {
      alert(`Failed to duplicate: ${res.error}`);
    }
  };

  const handleDelete = async () => {
    onClose();
    const confirmed = confirm(`Are you sure you want to delete "${target.name}"?`);
    if (!confirmed) return;

    if (window.xivig?.deleteFileOrFolder) {
      const res = await window.xivig.deleteFileOrFolder(target.path);
      if (res.success) {
        await refreshCurrentFolder();
      } else {
        alert(`Failed to delete: ${res.error}`);
      }
    }
  };

  // ==========================================================================
  // CODE FORMATTING & EDITING ACTIONS
  // ==========================================================================

  const handleFormatDocument = () => {
    onClose();
    const view = getActiveEditorView();
    if (view) {
      beautifyActiveEditor(view);
    }
  };

  const handleToggleLineComment = () => {
    onClose();
    const view = getActiveEditorView();
    if (view) {
      smartToggleLineComment(view, target.name);
    }
  };

  const handleToggleBlockComment = () => {
    onClose();
    const view = getActiveEditorView();
    if (view) {
      smartToggleBlockComment(view, target.name);
    }
  };

  // ==========================================================================
  // NAVIGATION & SEARCH
  // ==========================================================================

  const handleFindAndReplace = () => {
    onClose();
    useUIStore.getState().openSearchPanel('replace');
  };

  const handleFindFilesNamed = () => {
    onClose();
    useUIStore.getState().openQuickOpenWithMode('file');
  };

  const handleEditToRight = async () => {
    onClose();
    if (target.isDirectory) return;

    let doc = useEditorStore.getState().documents.find((d) => d.path === target.path);
    if (!doc && window.xivig?.readFile) {
      const readRes = await window.xivig.readFile(target.path);
      if (readRes.success && readRes.content !== undefined) {
        openDocument({
          path: target.path,
          name: target.name,
          content: readRes.content,
          language: target.name,
        });
        doc = useEditorStore.getState().documents.find((d) => d.path === target.path);
      }
    }

    if (doc) {
      useEditorStore.getState().setSplitLayout('two-columns');
      useEditorStore.getState().setSecondaryDocument(doc.id);
      useEditorStore.getState().setActivePane('secondary');
    }
  };

  const handleOpenOrRun = async () => {
    onClose();
    if (target.isDirectory) return;

    let doc = useEditorStore.getState().documents.find((d) => d.path === target.path);
    if (!doc && window.xivig?.readFile) {
      const readRes = await window.xivig.readFile(target.path);
      if (readRes.success && readRes.content !== undefined) {
        openDocument({
          path: target.path,
          name: target.name,
          content: readRes.content,
          language: target.name,
        });
      }
    } else if (doc) {
      useEditorStore.getState().setActiveDocument(doc.id);
    }

    const lower = target.name.toLowerCase();
    if (lower.endsWith('.html') || lower.endsWith('.htm')) {
      useEditorStore.getState().togglePreview('live-web');
    } else {
      useBuildStore.getState().executeBuild();
    }
  };

  const handleOpenInNewWindow = () => {
    onClose();
    if (window.xivig?.openNewWindow) {
      window.xivig.openNewWindow();
    } else {
      window.open(window.location.href, '_blank');
    }
  };

  const handleGoToDefinition = () => {
    onClose();
    const view = getActiveEditorView();
    if (view) goToDefinition(view);
  };

  const handlePeekDefinition = () => {
    onClose();
    const view = getActiveEditorView();
    if (view) peekDefinition(view);
  };

  const handleFindReferences = () => {
    onClose();
    const view = getActiveEditorView();
    if (view) findReferences(view);
  };

  const handleRenameSymbol = () => {
    onClose();
    const view = getActiveEditorView();
    if (view) renameSymbol(view);
  };

  // ==========================================================================
  // PATH COPYING & REVEAL
  // ==========================================================================

  const handleCopyName = async () => {
    onClose();
    await writeClipboardText(target.name);
  };

  const handleCopyPath = async () => {
    onClose();
    await writeClipboardText(target.path);
  };

  const handleCopyRelativePath = async () => {
    onClose();
    let rel = target.path;
    if (currentFolderPath) {
      const normRoot = currentFolderPath.replace(/\\/g, '/');
      const normTarget = target.path.replace(/\\/g, '/');
      if (normTarget.startsWith(normRoot)) {
        rel = normTarget.replace(normRoot, '').replace(/^\//, '');
      }
    }
    await writeClipboardText(rel);
  };

  const handleReveal = () => {
    onClose();
    window.xivig?.revealInExplorer?.(target.path);
  };

  // ==========================================================================
  // TAB BAR ACTIONS
  // ==========================================================================

  const handleCloseThisTab = () => {
    onClose();
    const doc = getTargetDoc();
    if (doc && doc.isDirty) {
      useUIStore.getState().openDirtyCloseModal(doc.id);
    } else if (doc) {
      closeDocument(doc.id);
    } else {
      closeDocument();
    }
  };

  const handleCloseOtherTabs = () => {
    onClose();
    const doc = getTargetDoc();
    if (doc) closeOtherTabs(doc.id);
    else closeOtherTabs();
  };

  const handleCloseTabsToTheRight = () => {
    onClose();
    const doc = getTargetDoc();
    if (doc) closeTabsToTheRight(doc.id);
    else closeTabsToTheRight();
  };

  const handleCloseSavedTabs = () => {
    onClose();
    closeSavedTabs();
  };

  const handleCloseAllTabs = () => {
    onClose();
    closeAllTabs();
  };

  const handleReopenClosedTab = () => {
    onClose();
    useEditorStore.getState().reopenClosedTab();
  };

  const handleTogglePinTab = () => {
    onClose();
    const doc = getTargetDoc();
    if (doc) useEditorStore.getState().togglePinTab(doc.id);
  };

  const handleToggleReadOnly = () => {
    onClose();
    const doc = getTargetDoc();
    if (doc) useEditorStore.getState().toggleReadOnly(doc.id);
  };

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '#2c303c';
  };

  const onUnhover = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: adjustedPosition.top,
        left: adjustedPosition.left,
        zIndex: 99999,
        backgroundColor: '#202228',
        border: '1px solid #363945',
        borderRadius: '6px',
        padding: '5px 0',
        minWidth: '250px',
        width: 'max-content',
        maxWidth: '450px',
        maxHeight: 'calc(100vh - 20px)',
        overflowY: 'auto',
        boxShadow: '0 10px 28px rgba(0, 0, 0, 0.55)',
        fontSize: '12px',
        color: '#e5e7eb',
        userSelect: 'none',
        fontFamily: 'var(--xivig-font-ui, system-ui, sans-serif)',
        whiteSpace: 'nowrap',
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. EDITOR CONTEXT MENU                                        */}
      {/* ------------------------------------------------------------- */}
      {source === 'editor' && (
        <>
          <div onClick={handleCut} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Cut</span>
            <span style={shortcutStyle}>Ctrl+X</span>
          </div>
          <div onClick={handleCopy} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Copy</span>
            <span style={shortcutStyle}>Ctrl+C</span>
          </div>
          <div onClick={handlePaste} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Paste</span>
            <span style={shortcutStyle}>Ctrl+V</span>
          </div>
          <div onClick={handleSelectAll} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Select All</span>
            <span style={shortcutStyle}>Ctrl+A</span>
          </div>

          <div style={menuDividerStyle} />

          <div onClick={handleGoToDefinition} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Go to Definition</span>
            <span style={shortcutStyle}>F12</span>
          </div>
          <div onClick={handlePeekDefinition} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Peek Definition</span>
            <span style={shortcutStyle}>Alt+F12</span>
          </div>
          <div onClick={handleFindReferences} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Find All References</span>
            <span style={shortcutStyle}>Shift+F12</span>
          </div>
          <div onClick={handleRenameSymbol} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Rename Symbol</span>
            <span style={shortcutStyle}>F2</span>
          </div>

          <div style={menuDividerStyle} />

          <div onClick={handleFormatDocument} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Format Document</span>
            <span style={shortcutStyle}>Ctrl+Alt+B</span>
          </div>
          <div onClick={handleToggleLineComment} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Toggle Line Comment</span>
            <span style={shortcutStyle}>Ctrl+/</span>
          </div>
          <div onClick={handleToggleBlockComment} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Toggle Block Comment</span>
            <span style={shortcutStyle}>Ctrl+Shift+/</span>
          </div>

          <div style={menuDividerStyle} />

          <div onClick={handleFindAndReplace} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Find &amp; Replace...</span>
            <span style={shortcutStyle}>Ctrl+H</span>
          </div>
          <div onClick={handleFindFilesNamed} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Find Files Named...</span>
            <span style={shortcutStyle}>Ctrl+P</span>
          </div>

          <div style={menuDividerStyle} />

          <div onClick={handleEditToRight} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Edit to Right</span>
          </div>
          <div onClick={handleOpenOrRun} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Open / Run</span>
          </div>
          <div onClick={handleOpenInNewWindow} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Open In New Window</span>
          </div>

          <div style={menuDividerStyle} />

          <div onClick={handleCopyPath} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Copy Path</span>
          </div>
          <div onClick={handleCopyRelativePath} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Copy Relative Path</span>
          </div>
          <div onClick={handleReveal} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Reveal in File Explorer</span>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TAB BAR CONTEXT MENU                                       */}
      {/* ------------------------------------------------------------- */}
      {source === 'tab' && (
        <>
          <div onClick={handleTogglePinTab} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>{getTargetDoc()?.isPinned ? 'Unpin Tab' : 'Pin Tab'}</span>
          </div>
          <div onClick={handleToggleReadOnly} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>{getTargetDoc()?.isReadOnly ? 'Make Editable' : 'Make Read-Only'}</span>
          </div>

          <div style={menuDividerStyle} />

          <div onClick={handleCloseThisTab} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Close</span>
            <span style={shortcutStyle}>Ctrl+W</span>
          </div>
          <div onClick={handleCloseOtherTabs} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Close Others</span>
          </div>
          <div onClick={handleCloseTabsToTheRight} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Close to the Right</span>
          </div>
          <div onClick={handleCloseSavedTabs} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Close Saved</span>
          </div>
          <div onClick={handleCloseAllTabs} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Close All</span>
          </div>

          <div style={menuDividerStyle} />

          <div onClick={handleReopenClosedTab} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Reopen Closed Tab</span>
            <span style={shortcutStyle}>Ctrl+Shift+T</span>
          </div>

          <div style={menuDividerStyle} />

          <div onClick={handleEditToRight} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Edit to Right</span>
          </div>

          <div style={menuDividerStyle} />

          <div onClick={handleCopyPath} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Copy Path</span>
          </div>
          <div onClick={handleCopyRelativePath} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Copy Relative Path</span>
          </div>
          <div onClick={handleReveal} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Reveal in File Explorer</span>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. SIDEBAR / DEFAULT FILE CONTEXT MENU                        */}
      {/* ------------------------------------------------------------- */}
      {source !== 'editor' && source !== 'tab' && (
        <>
          <div onClick={handleNewFile} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>New File...</span>
          </div>
          <div onClick={handleNewFolder} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>New Folder...</span>
          </div>

          {target.isDirectory && (
            <div
              onClick={() => {
                onClose();
                useFileStore.getState().setSearchFolderFilter(target.path);
                useFileStore.getState().setActiveSidebarView('search');
              }}
              style={menuItemStyle}
              onMouseEnter={onHover}
              onMouseLeave={onUnhover}
            >
              <span>Find in Folder...</span>
              <span style={shortcutStyle}>Ctrl+Shift+F</span>
            </div>
          )}

          <div style={menuDividerStyle} />

          <div onClick={handleCut} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Cut</span>
            <span style={shortcutStyle}>Ctrl+X</span>
          </div>
          <div onClick={handleCopy} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Copy</span>
            <span style={shortcutStyle}>Ctrl+C</span>
          </div>
          <div
            onClick={fileClipboard ? handlePaste : undefined}
            style={{
              ...menuItemStyle,
              opacity: fileClipboard ? 1 : 0.45,
              cursor: fileClipboard ? 'pointer' : 'default',
            }}
            onMouseEnter={fileClipboard ? onHover : undefined}
            onMouseLeave={fileClipboard ? onUnhover : undefined}
          >
            <span>Paste</span>
            <span style={shortcutStyle}>Ctrl+V</span>
          </div>

          {!target.isDirectory && (
            <div onClick={handleDuplicate} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
              <span>Duplicate...</span>
            </div>
          )}

          <div style={menuDividerStyle} />

          {!target.isDirectory && (
            <>
              <div onClick={handleEditToRight} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
                <span>Edit to Right</span>
              </div>
              <div onClick={handleOpenOrRun} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
                <span>Open / Run</span>
              </div>
              <div style={menuDividerStyle} />
            </>
          )}

          <div onClick={handleOpenInNewWindow} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Open In New Window</span>
          </div>

          <div style={menuDividerStyle} />

          {onRename && (
            <div
              onClick={() => {
                onClose();
                onRename(target);
              }}
              style={menuItemStyle}
              onMouseEnter={onHover}
              onMouseLeave={onUnhover}
            >
              <span>Rename...</span>
              <span style={shortcutStyle}>F2</span>
            </div>
          )}

          <div
            onClick={handleDelete}
            style={{ ...menuItemStyle, color: '#ef6464' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#382024')}
            onMouseLeave={onUnhover}
          >
            <span>Delete</span>
            <span style={{ ...shortcutStyle, color: '#ef6464' }}>Del</span>
          </div>

          <div style={menuDividerStyle} />

          <div onClick={handleCopyName} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Copy Name</span>
          </div>
          <div onClick={handleCopyPath} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Copy Path</span>
          </div>
          <div onClick={handleCopyRelativePath} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Copy Relative Path</span>
          </div>
          <div onClick={handleReveal} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
            <span>Reveal in File Explorer</span>
          </div>
        </>
      )}
    </div>
  );
};

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 16px',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
  fontSize: '12px',
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
  gap: '28px',
  boxSizing: 'border-box',
};

const shortcutStyle: React.CSSProperties = {
  marginLeft: 'auto',
  paddingLeft: '20px',
  color: '#8b92a2',
  fontSize: '11px',
  flexShrink: 0,
  whiteSpace: 'nowrap',
};

const menuDividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: '#2e313b',
  margin: '4px 0',
};
