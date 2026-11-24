import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useEditorStore } from '../../stores/editorStore';

interface DirtyCloseModalProps {
  docId: string | null;
  onClose: () => void;
  onSaveAndClose: (docId: string) => Promise<void>;
  onDiscardAndClose: (docId: string) => void;
}

export const DirtyCloseModal: React.FC<DirtyCloseModalProps> = ({
  docId,
  onClose,
  onSaveAndClose,
  onDiscardAndClose,
}) => {
  const doc = useEditorStore((state) =>
    docId ? state.documents.find((d) => d.id === docId) : null
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' || e.key.toLowerCase() === 's') {
        if (docId) {
          e.preventDefault();
          onSaveAndClose(docId);
        }
      } else if (e.key.toLowerCase() === 'd') {
        if (docId) {
          e.preventDefault();
          onDiscardAndClose(docId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [docId, onClose, onSaveAndClose, onDiscardAndClose]);

  if (!docId || !doc) return null;

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={iconContainerStyle}>
            <AlertTriangle size={20} color="#e5c07b" />
          </div>
          <div>
            <h3 style={titleStyle}>Save changes to "{doc.name}"?</h3>
            <p style={subtitleStyle}>
              Your changes will be lost if you close without saving.
            </p>
          </div>
        </div>

        <div style={footerStyle}>
          <button onClick={onClose} style={btnSecondaryStyle}>
            Cancel (Esc)
          </button>
          <button
            onClick={() => onDiscardAndClose(docId)}
            style={btnDangerStyle}
          >
            Don't Save (D)
          </button>
          <button
            onClick={() => onSaveAndClose(docId)}
            style={btnPrimaryStyle}
            autoFocus
          >
            Save (S)
          </button>
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
  backgroundColor: 'rgba(0, 0, 0, 0.65)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999999,
  backdropFilter: 'blur(2px)',
};

const modalStyle: React.CSSProperties = {
  width: '420px',
  backgroundColor: '#202228',
  border: '1px solid #363945',
  borderRadius: '8px',
  boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7)',
  padding: '20px',
  fontFamily: 'var(--xivig-font-ui, system-ui, sans-serif)',
  color: '#e5e7eb',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '14px',
};

const iconContainerStyle: React.CSSProperties = {
  marginTop: '2px',
  padding: '8px',
  backgroundColor: 'rgba(229, 192, 123, 0.12)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 6px 0',
  fontSize: '14px',
  fontWeight: 600,
  color: '#ffffff',
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#9ca3af',
  lineHeight: 1.45,
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '20px',
};

const btnBaseStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.12s ease',
  outline: 'none',
  border: 'none',
};

const btnSecondaryStyle: React.CSSProperties = {
  ...btnBaseStyle,
  backgroundColor: 'transparent',
  border: '1px solid #3e4451',
  color: '#abb2bf',
};

const btnDangerStyle: React.CSSProperties = {
  ...btnBaseStyle,
  backgroundColor: 'rgba(239, 100, 100, 0.15)',
  border: '1px solid rgba(239, 100, 100, 0.3)',
  color: '#ef6464',
};

const btnPrimaryStyle: React.CSSProperties = {
  ...btnBaseStyle,
  backgroundColor: 'var(--xivig-accent, #6c8cff)',
  color: '#ffffff',
  fontWeight: 600,
};
