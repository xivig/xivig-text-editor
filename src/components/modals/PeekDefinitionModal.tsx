import React, { useEffect } from 'react';
import { Eye, ExternalLink, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useEditorStore } from '../../stores/editorStore';
import { getActiveEditorView } from '../editor/editorViewRegistry';
import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export const PeekDefinitionModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isPeekDefinitionOpen);
  const data = useUIStore((state) => state.peekDefinitionData);
  const onClose = useUIStore((state) => state.closePeekDefinitionModal);
  const openDocument = useEditorStore((state) => state.openDocument);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const handleJump = async () => {
    onClose();
    if (data.filePath && window.xivig?.readFile) {
      const res = await window.xivig.readFile(data.filePath);
      if (res.success && res.content !== undefined) {
        openDocument({
          path: data.filePath,
          name: data.fileName,
          content: res.content,
          language: data.fileName,
        });

        setTimeout(() => {
          const view = getActiveEditorView();
          if (view) {
            try {
              const targetLine = view.state.doc.line(data.line);
              const pos = targetLine.from + data.col - 1;
              view.dispatch({
                selection: EditorSelection.cursor(pos),
                effects: EditorView.scrollIntoView(pos, { y: 'center' }),
              });
              view.focus();
            } catch {}
          }
        }, 80);
      }
    } else {
      const view = getActiveEditorView();
      if (view) {
        try {
          const targetLine = view.state.doc.line(data.line);
          const pos = targetLine.from + data.col - 1;
          view.dispatch({
            selection: EditorSelection.cursor(pos),
            effects: EditorView.scrollIntoView(pos, { y: 'center' }),
          });
          view.focus();
        } catch {}
      }
    }
  };

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={15} color="var(--xivig-accent, #6c8cff)" />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>
              Peek Definition: <code style={symbolStyle}>{data.symbol}</code>
            </span>
            <span style={{ fontSize: '11px', color: 'var(--xivig-text-muted, #999)', marginLeft: '8px' }}>
              {data.fileName}:{data.line}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={handleJump} style={jumpBtnStyle} title="Open definition in editor">
              <ExternalLink size={12} style={{ marginRight: '4px' }} />
              Go to Definition
            </button>
            <button onClick={onClose} style={closeBtnStyle} title="Close (Esc)">
              <X size={14} />
            </button>
          </div>
        </div>

        <div style={codeContainerStyle}>
          <pre style={preStyle}>
            <code>{data.previewCode}</code>
          </pre>
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
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-bg-panel, #21222c)',
  border: '1px solid var(--xivig-border-subtle, #343746)',
  borderRadius: '6px',
  width: '680px',
  maxWidth: '90vw',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '8px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: 'var(--xivig-bg-activity, #1e1f29)',
  borderBottom: '1px solid var(--xivig-border-subtle, #343746)',
  color: 'var(--xivig-text, #f8f8f2)',
};

const symbolStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  color: 'var(--xivig-accent, #6c8cff)',
  padding: '1px 5px',
  borderRadius: '3px',
  fontFamily: 'monospace',
};

const jumpBtnStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid var(--xivig-accent, #6c8cff)',
  color: 'var(--xivig-accent, #6c8cff)',
  borderRadius: '4px',
  padding: '3px 8px',
  fontSize: '11px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--xivig-text-muted, #999)',
  cursor: 'pointer',
  padding: '2px',
};

const codeContainerStyle: React.CSSProperties = {
  maxHeight: '340px',
  overflow: 'auto',
  backgroundColor: '#191a21',
  padding: '10px 14px',
};

const preStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--xivig-font-mono, monospace)',
  fontSize: '12px',
  lineHeight: 1.5,
  color: '#f8f8f2',
  whiteSpace: 'pre',
};
