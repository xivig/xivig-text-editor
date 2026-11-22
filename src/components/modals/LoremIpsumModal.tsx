import React, { useState, useMemo } from 'react';
import { X, Copy, Check, FileText } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { getActiveEditorView } from '../editor/editorViewRegistry';
import { generateLorem, LoremType } from '../../utils/loremIpsum';

export const LoremIpsumModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isLoremIpsumOpen);
  const close = useUIStore((state) => state.closeLoremIpsumModal);

  const [count, setCount] = useState<number>(3);
  const [type, setType] = useState<LoremType>('html-paragraphs');
  const [startWithLorem, setStartWithLorem] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate preview text live
  const generatedText = useMemo(() => {
    return generateLorem({ count, type, startWithLorem });
  }, [count, type, startWithLorem]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleInsert = () => {
    const view = getActiveEditorView();
    if (view) {
      const sel = view.state.selection.main;
      view.dispatch({
        changes: {
          from: sel.from,
          to: sel.to,
          insert: generatedText,
        },
      });
      view.focus();
    }
    close();
  };

  if (!isOpen) return null;

  return (
    <div
      style={backdropStyle}
      onClick={close}
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleInsert();
      }}
    >
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="var(--xivig-accent, #6c8cff)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
              Lorem Ipsum Generator
            </span>
          </div>
          <button onClick={close} style={closeBtnStyle}>
            <X size={15} />
          </button>
        </div>

        {/* Controls Grid */}
        <div style={bodyStyle}>
          <div style={controlsRowStyle}>
            {/* Count */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={labelStyle}>Amount</label>
              <input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                style={numberInputStyle}
              />
            </div>

            {/* Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <label style={labelStyle}>Unit</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LoremType)}
                style={selectStyle}
              >
                <option value="html-paragraphs">HTML Paragraphs (&lt;p&gt;...&lt;/p&gt;)</option>
                <option value="paragraphs">Plain Text Paragraphs</option>
                <option value="sentences">Sentences</option>
                <option value="words">Words</option>
                <option value="list-items">HTML List Items (&lt;li&gt;...&lt;/li&gt;)</option>
              </select>
            </div>
          </div>

          {/* Start with Lorem checkbox */}
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="startWithLoremCheck"
              checked={startWithLorem}
              onChange={(e) => setStartWithLorem(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="startWithLoremCheck" style={{ fontSize: '12px', color: '#ccc', cursor: 'pointer' }}>
              Start with "Lorem ipsum dolor sit amet..."
            </label>
          </div>

          {/* Preview Box */}
          <div style={{ marginTop: '14px' }}>
            <label style={labelStyle}>Preview Output</label>
            <textarea
              readOnly
              value={generatedText}
              style={previewAreaStyle}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button onClick={handleCopy} style={copyBtnStyle}>
            {copied ? <Check size={13} color="#22c55e" style={{ marginRight: '5px' }} /> : <Copy size={13} style={{ marginRight: '5px' }} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={close} style={cancelBtnStyle}>
              Cancel
            </button>
            <button onClick={handleInsert} style={insertBtnStyle}>
              Insert at Cursor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 99999,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#1f2229',
  border: '1px solid #363a45',
  borderRadius: '8px',
  width: '460px',
  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid #2d313b',
  backgroundColor: '#252932',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#888',
  cursor: 'pointer',
  padding: '2px',
};

const bodyStyle: React.CSSProperties = {
  padding: '16px',
};

const controlsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const numberInputStyle: React.CSSProperties = {
  width: '80px',
  backgroundColor: '#17191f',
  border: '1px solid #363a45',
  borderRadius: '4px',
  padding: '6px 10px',
  fontSize: '12px',
  color: '#ffffff',
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  backgroundColor: '#17191f',
  border: '1px solid #363a45',
  borderRadius: '4px',
  padding: '6px 10px',
  fontSize: '12px',
  color: '#ffffff',
  outline: 'none',
};

const previewAreaStyle: React.CSSProperties = {
  width: '100%',
  height: '130px',
  marginTop: '6px',
  backgroundColor: '#17191f',
  border: '1px solid #363a45',
  borderRadius: '4px',
  padding: '8px 10px',
  fontSize: '11px',
  fontFamily: 'monospace',
  color: '#d4d4d4',
  resize: 'none',
  outline: 'none',
  lineHeight: 1.4,
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  backgroundColor: '#252932',
  borderTop: '1px solid #2d313b',
};

const copyBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '6px 12px',
  backgroundColor: '#2b2f3a',
  border: '1px solid #3c4250',
  borderRadius: '4px',
  color: '#e5e7eb',
  fontSize: '12px',
  cursor: 'pointer',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  backgroundColor: 'transparent',
  border: '1px solid #363a45',
  borderRadius: '4px',
  color: '#9ca3af',
  fontSize: '12px',
  cursor: 'pointer',
};

const insertBtnStyle: React.CSSProperties = {
  padding: '6px 16px',
  backgroundColor: 'var(--xivig-accent, #6c8cff)',
  border: 'none',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};
