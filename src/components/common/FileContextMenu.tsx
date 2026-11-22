import React, { useEffect, useRef } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { useBuildStore } from '../../stores/buildStore';
import { getActiveEditorView } from '../editor/editorViewRegistry';
import { beautifyActiveEditor } from '../../utils/beautify';
import { smartToggleLineComment, smartToggleBlockComment } from '../../utils/commentUtils';

export interface ContextMenuTarget {
  name: string;
  path: string;
  isDirectory?: boolean;
}

interface FileContextMenuProps {
  x: number;
  y: number;
  target: ContextMenuTarget;
  onClose: () => void;
  onRename?: (target: ContextMenuTarget) => void;
  onNewFile?: (dir: string) => void;
  onNewFolder?: (dir: string) => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  x,
  y,
  target,
  onClose,
  onRename,
  onNewFile,
  onNewFolder,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const currentFolderPath = useFileStore((state) => state.currentFolderPath);
  const refreshCurrentFolder = useFileStore((state) => state.refreshCurrentFolder);
  const openDocument = useEditorStore((state) => state.openDocument);

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
    const menuWidth = 190;
    const menuHeight = 500;
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

  // 1. New File...
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

  // 2. New Folder...
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

  // 3. Edit to Right
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

  // 4. Open / Run
  const handleOpenOrRun = async () => {
    onClose();
    if (target.isDirectory) return;

    // Open file in primary editor if not opened
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

  // 5. Open In New Window
  const handleOpenInNewWindow = () => {
    onClose();
    if (window.xivig?.openNewWindow) {
      window.xivig.openNewWindow();
    } else {
      window.open(window.location.href, '_blank');
    }
  };

  // Code Formatting & Block/Line Comments
  const handleFormatDocument = async () => {
    onClose();
    if (target.isDirectory) return;
    const activeDoc = useEditorStore.getState().getActiveDocument();
    if (!activeDoc || (activeDoc.path !== target.path && activeDoc.name !== target.name)) {
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
    }
    setTimeout(() => {
      const view = getActiveEditorView();
      if (view) {
        beautifyActiveEditor(view);
      }
    }, 60);
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

  // 6. Find & Replace...
  const handleFindAndReplace = () => {
    onClose();
    if (!target.isDirectory) {
      const doc = useEditorStore.getState().documents.find((d) => d.path === target.path);
      if (doc) {
        useEditorStore.getState().setActiveDocument(doc.id);
      }
    }
    useUIStore.getState().openSearchPanel('replace');
  };

  // 7. Find Files Named...
  const handleFindFilesNamed = () => {
    onClose();
    useUIStore.getState().openQuickOpenWithMode('file');
  };

  // 8. Cut
  const handleCut = () => {
    navigator.clipboard.writeText(target.path);
    onClose();
  };

  // 9. Copy
  const handleCopy = async () => {
    onClose();
    if (!target.isDirectory && window.xivig?.readFile) {
      const readRes = await window.xivig.readFile(target.path);
      if (readRes.success && readRes.content !== undefined) {
        navigator.clipboard.writeText(readRes.content);
        return;
      }
    }
    navigator.clipboard.writeText(target.path);
  };

  // 10. Copy Name
  const handleCopyName = () => {
    navigator.clipboard.writeText(target.name);
    onClose();
  };

  // 11. Copy Path
  const handleCopyPath = () => {
    navigator.clipboard.writeText(target.path);
    onClose();
  };

  // 12. Copy Relative Path
  const handleCopyRelativePath = () => {
    let rel = target.path;
    if (currentFolderPath) {
      const normRoot = currentFolderPath.replace(/\\/g, '/');
      const normTarget = target.path.replace(/\\/g, '/');
      if (normTarget.startsWith(normRoot)) {
        rel = normTarget.replace(normRoot, '').replace(/^\//, '');
      }
    }
    navigator.clipboard.writeText(rel);
    onClose();
  };

  // 13. Duplicate...
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

  // 14. Delete
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

  // 15. Reveal in Explorer
  const handleReveal = () => {
    onClose();
    window.xivig?.revealInExplorer?.(target.path);
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
        minWidth: '190px',
        maxHeight: 'calc(100vh - 20px)',
        overflowY: 'auto',
        boxShadow: '0 10px 28px rgba(0, 0, 0, 0.55)',
        fontSize: '12px',
        color: '#e5e7eb',
        userSelect: 'none',
        fontFamily: 'var(--xivig-font-ui, system-ui, sans-serif)',
      }}
    >
      {/* Group 1: New File / Folder */}
      <div onClick={handleNewFile} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
        <span>New File...</span>
      </div>
      <div onClick={handleNewFolder} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
        <span>New Folder...</span>
      </div>

      <div style={menuDividerStyle} />

      {/* Group 2: Edit to Right */}
      {!target.isDirectory && (
        <div onClick={handleEditToRight} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
          <span>Edit to Right</span>
        </div>
      )}

      {!target.isDirectory && <div style={menuDividerStyle} />}

      {/* Group 3: Open / Run & Open In New Window */}
      {!target.isDirectory && (
        <div onClick={handleOpenOrRun} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
          <span>Open / Run</span>
        </div>
      )}
      <div onClick={handleOpenInNewWindow} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
        <span>Open In New Window</span>
      </div>

      <div style={menuDividerStyle} />

      {/* Code Formatting & Comments for Files */}
      {!target.isDirectory && (
        <>
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
        </>
      )}

      {/* Group 4: Find & Replace / Find Files Named */}
      <div onClick={handleFindAndReplace} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
        <span>Find &amp; Replace...</span>
      </div>
      <div onClick={handleFindFilesNamed} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
        <span>Find Files Named...</span>
      </div>

      <div style={menuDividerStyle} />

      {/* Group 5: Cut / Copy */}
      <div onClick={handleCut} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
        <span>Cut</span>
      </div>
      <div onClick={handleCopy} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
        <span>Copy</span>
      </div>

      <div style={menuDividerStyle} />

      {/* Group 6: Copy Name / Copy Path / Copy Relative Path / Duplicate */}
      <div onClick={handleCopyName} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
        <span>Copy Name</span>
      </div>
      <div onClick={handleCopyPath} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
        <span>Copy Path</span>
      </div>
      <div onClick={handleCopyRelativePath} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
        <span>Copy Relative Path</span>
      </div>

      {!target.isDirectory && (
        <div onClick={handleDuplicate} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
          <span>Duplicate...</span>
        </div>
      )}

      <div style={menuDividerStyle} />

      {/* Group 7: Rename / Reveal */}
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
        </div>
      )}

      <div onClick={handleReveal} style={menuItemStyle} onMouseEnter={onHover} onMouseLeave={onUnhover}>
        <span>Reveal in File Explorer</span>
      </div>

      <div style={menuDividerStyle} />

      {/* Group 8: Delete */}
      <div
        onClick={handleDelete}
        style={{ ...menuItemStyle, color: '#ef6464' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#382024')}
        onMouseLeave={onUnhover}
      >
        <span>Delete</span>
      </div>
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
};

const shortcutStyle: React.CSSProperties = {
  marginLeft: '16px',
  color: '#8b92a2',
  fontSize: '11px',
};

const menuDividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: '#2e313b',
  margin: '4px 0',
};
