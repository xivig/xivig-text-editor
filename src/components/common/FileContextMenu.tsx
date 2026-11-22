import React, { useEffect, useRef } from 'react';
import {
  Copy,
  FileText,
  Files,
  FolderOpen,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';

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
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  x,
  y,
  target,
  onClose,
  onRename,
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
    const menuHeight = 230;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let posX = x;
    let posY = y;

    if (posX + menuWidth > screenWidth) {
      posX = screenWidth - menuWidth - 8;
    }
    if (posY + menuHeight > screenHeight) {
      posY = screenHeight - menuHeight - 8;
    }

    return { top: posY, left: posX };
  }, [x, y]);

  // 1. Copy Filename
  const handleCopyFilename = () => {
    navigator.clipboard.writeText(target.name);
    onClose();
  };

  // 2. Copy Relative Path
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

  // 3. Copy Absolute Path
  const handleCopyAbsolutePath = () => {
    navigator.clipboard.writeText(target.path);
    onClose();
  };

  // 4. Duplicate...
  const handleDuplicate = async () => {
    onClose();
    if (!window.xivig?.duplicateFile || target.isDirectory) return;

    // Generate duplicate filename: e.g. "name.ext" -> "name copy.ext" or "name copy 2.ext"
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

      // Open the duplicated file in editor
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

  // 5. Delete
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

  // 6. Reveal in Explorer
  const handleReveal = () => {
    onClose();
    window.xivig?.revealInExplorer?.(target.path);
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
        padding: '4px 0',
        minWidth: '180px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        fontSize: '12px',
        color: '#e5e7eb',
        userSelect: 'none',
        fontFamily: 'var(--xivig-font-ui, system-ui, sans-serif)',
      }}
    >
      <div
        onClick={handleCopyFilename}
        style={menuItemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2d313d')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span>Copy Filename</span>
      </div>

      <div
        onClick={handleCopyRelativePath}
        style={menuItemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2d313d')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span>Copy Relative Path</span>
      </div>

      <div
        onClick={handleCopyAbsolutePath}
        style={menuItemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2d313d')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span>Copy Absolute Path</span>
      </div>

      {!target.isDirectory && (
        <div
          onClick={handleDuplicate}
          style={menuItemStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2d313d')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <span>Duplicate...</span>
        </div>
      )}

      <div style={menuDividerStyle} />

      {onRename && (
        <div
          onClick={() => {
            onClose();
            onRename(target);
          }}
          style={menuItemStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2d313d')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <span>Rename...</span>
        </div>
      )}

      <div
        onClick={handleReveal}
        style={menuItemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2d313d')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span>Reveal in File Explorer</span>
      </div>

      <div style={menuDividerStyle} />

      <div
        onClick={handleDelete}
        style={{ ...menuItemStyle, color: '#ef6464' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#382024')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span>Delete</span>
      </div>
    </div>
  );
};

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '6px 14px',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
  fontSize: '12px',
};

const menuDividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: '#30343f',
  margin: '4px 0',
};
