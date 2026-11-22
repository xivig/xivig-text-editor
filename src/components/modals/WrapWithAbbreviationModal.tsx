import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useEditorStore } from '../../stores/editorStore';
import { getActiveEditorView } from '../editor/editorViewRegistry';
import { wrapSelectionWithEmmet, detectEmmetSyntax, expandEmmet } from '../editor/emmet';

export const WrapWithAbbreviationModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isWrapWithAbbreviationOpen);
  const close = useUIStore((state) => state.closeWrapWithAbbreviation);
  const activeDoc = useEditorStore((state) => state.getActiveDocument());

  const [abbr, setAbbr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAbbr('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const syntax = detectEmmetSyntax(activeDoc?.name || activeDoc?.language);
  const preview = abbr.trim() ? expandEmmet(abbr.trim(), syntax) : null;
  const cleanPreview = preview ? preview.replace(/\$\{[0-9]+(:([^}]*))?\}/g, '$2') : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!abbr.trim()) return;

    const view = getActiveEditorView();
    if (view) {
      wrapSelectionWithEmmet(view, abbr.trim(), syntax);
    }
    close();
  };

  return (
    <div style={backdropStyle} onClick={close}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--xivig-accent)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Emmet: Wrap with Abbreviation</span>
          </div>
          <button onClick={close} style={{ color: 'var(--xivig-text-dim)' }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: '12px', color: 'var(--xivig-text-muted)', marginBottom: '10px' }}>
            Enter an abbreviation to wrap the current selection (e.g. <code>div.wrapper&gt;section.hero</code>, <code>ul&gt;li*</code>).
          </p>

          <input
            ref={inputRef}
            type="text"
            value={abbr}
            onChange={(e) => setAbbr(e.target.value)}
            placeholder="e.g. div.container"
            style={inputStyle}
          />

          {cleanPreview && (
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--xivig-text-dim)', fontWeight: 600 }}>PREVIEW</span>
              <pre style={previewStyle}>{cleanPreview}</pre>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
            <button type="button" onClick={close} style={cancelBtnStyle}>
              Cancel
            </button>
            <button type="submit" style={submitBtnStyle}>
              Wrap Selection (Enter)
            </button>
          </div>
        </form>
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
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  paddingTop: '100px',
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  width: '460px',
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '6px',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 16px',
  backgroundColor: 'var(--xivig-surface-hover)',
  borderBottom: '1px solid var(--xivig-border)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: '13px',
  padding: '8px 10px',
  backgroundColor: 'var(--xivig-bg)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '4px',
  color: 'var(--xivig-text)',
  fontFamily: 'var(--xivig-font-mono)',
};

const previewStyle: React.CSSProperties = {
  margin: '4px 0 0 0',
  padding: '8px 10px',
  backgroundColor: 'var(--xivig-bg)',
  border: '1px solid var(--xivig-border-subtle)',
  borderRadius: '4px',
  fontSize: '11px',
  fontFamily: 'var(--xivig-font-mono)',
  color: 'var(--xivig-accent)',
  maxHeight: '120px',
  overflow: 'auto',
  whiteSpace: 'pre-wrap',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '4px',
  fontSize: '12px',
  color: 'var(--xivig-text-muted)',
};

const submitBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 500,
  backgroundColor: 'var(--xivig-accent)',
  color: '#ffffff',
};
