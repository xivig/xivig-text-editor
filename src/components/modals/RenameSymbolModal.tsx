import React, { useState, useEffect, useRef } from 'react';
import { Type, AlertCircle, Check, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { getActiveEditorView } from '../editor/editorViewRegistry';

export const RenameSymbolModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isRenameSymbolOpen);
  const target = useUIStore((state) => state.renameSymbolTarget);
  const onClose = useUIStore((state) => state.closeRenameSymbolModal);

  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && target) {
      setNewName(target.oldName);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, target]);

  const handleRename = () => {
    if (!target || !newName.trim() || newName.trim() === target.oldName) {
      onClose();
      return;
    }

    const view = getActiveEditorView();
    if (!view) {
      onClose();
      return;
    }

    const oldName = target.oldName;
    const replacement = newName.trim();
    const docText = view.state.doc.toString();

    // Word boundary regex for symbol replacement
    const regex = new RegExp(`\\b${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    const changes: { from: number; to: number; insert: string }[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(docText)) !== null) {
      changes.push({
        from: match.index,
        to: match.index + oldName.length,
        insert: replacement,
      });
    }

    if (changes.length > 0) {
      view.dispatch({
        changes,
        userEvent: 'input.rename',
      });
      view.focus();
    }

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleRename();
    }
  };

  if (!isOpen || !target) return null;

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Type size={16} color="var(--xivig-accent, #6c8cff)" />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>Rename Symbol (F2)</span>
          </div>
          <button onClick={onClose} style={closeBtnStyle} title="Cancel (Esc)">
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--xivig-text-muted, #999)', marginBottom: '8px' }}>
            Enter new name for <code style={codeBadgeStyle}>{target.oldName}</code>:
          </div>

          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            style={inputStyle}
          />

          <div style={actionsRowStyle}>
            <button onClick={onClose} style={cancelBtnStyle}>
              Cancel
            </button>
            <button onClick={handleRename} style={submitBtnStyle}>
              Rename
            </button>
          </div>
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
  backgroundColor: 'rgba(0, 0, 0, 0.45)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '18vh',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-bg-panel, #21222c)',
  border: '1px solid var(--xivig-border-subtle, #343746)',
  borderRadius: '6px',
  width: '380px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '8px 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: 'var(--xivig-bg-activity, #1e1f29)',
  borderBottom: '1px solid var(--xivig-border-subtle, #343746)',
  color: 'var(--xivig-text, #f8f8f2)',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--xivig-text-muted, #999)',
  cursor: 'pointer',
  padding: '2px',
};

const codeBadgeStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  color: 'var(--xivig-accent, #6c8cff)',
  padding: '1px 5px',
  borderRadius: '3px',
  fontFamily: 'monospace',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--xivig-bg-input, #282a36)',
  border: '1px solid var(--xivig-border, #44475a)',
  borderRadius: '4px',
  color: 'var(--xivig-text, #f8f8f2)',
  fontSize: '13px',
  padding: '6px 8px',
  outline: 'none',
};

const actionsRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '12px',
};

const cancelBtnStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid var(--xivig-border-subtle, #44475a)',
  color: 'var(--xivig-text-muted, #999)',
  borderRadius: '4px',
  padding: '4px 10px',
  fontSize: '12px',
  cursor: 'pointer',
};

const submitBtnStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-accent, #6c8cff)',
  border: 'none',
  color: '#fff',
  borderRadius: '4px',
  padding: '4px 12px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};
