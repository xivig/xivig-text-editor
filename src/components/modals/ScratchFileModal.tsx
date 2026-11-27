import React, { useState, useEffect, useRef } from 'react';
import { FileCode, FilePlus2, Check } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useEditorStore } from '../../stores/editorStore';
import { supportedLanguages, LanguageOption } from './LanguageSelectorModal';

export const ScratchFileModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isScratchModalOpen);
  const close = useUIStore((state) => state.closeScratchModal);
  const createScratchDocument = useEditorStore((state) => state.createScratchDocument);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredLanguages = supportedLanguages.filter((l) => {
    const q = query.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q) ||
      l.extensions.some((ext) => ext.toLowerCase().includes(q))
    );
  });

  const handleSelectLanguage = (lang: LanguageOption) => {
    close();
    const ext = lang.extensions[0].replace(/^\./, '');
    createScratchDocument(lang.id, ext);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredLanguages.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredLanguages.length) % Math.max(1, filteredLanguages.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredLanguages[selectedIndex]) {
        handleSelectLanguage(filteredLanguages[selectedIndex]);
      }
    }
  };

  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div style={backdropStyle} onClick={close}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Search Input Header */}
        <div style={searchHeaderStyle}>
          <FilePlus2 size={16} color="var(--xivig-accent)" style={{ marginRight: '10px' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="New Scratch File: Select language (e.g. JavaScript, Python, JSON)..."
            style={inputStyle}
          />
        </div>

        {/* Results List */}
        <div ref={listRef} style={resultsContainerStyle}>
          {filteredLanguages.length > 0 ? (
            filteredLanguages.map((lang, idx) => {
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={lang.id}
                  onClick={() => handleSelectLanguage(lang)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    ...itemStyle,
                    backgroundColor: isSelected ? 'var(--xivig-accent-active)' : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--xivig-accent)' : '2px solid transparent',
                  }}
                >
                  <div style={itemLeftStyle}>
                    <FileCode size={14} style={{ color: 'var(--xivig-text-dim)' }} />
                    <span style={langNameStyle}>{lang.name}</span>
                    <span style={extBadgeStyle}>{lang.extensions.join(', ')}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={emptyStyle}>No matching language found</div>
          )}
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
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
  display: 'flex',
  justifyContent: 'center',
  paddingTop: '60px',
  zIndex: 10000,
  backdropFilter: 'blur(2px)',
};

const modalStyle: React.CSSProperties = {
  width: '500px',
  maxHeight: '440px',
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '8px',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const searchHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid var(--xivig-border)',
  backgroundColor: 'var(--xivig-surface)',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '14px',
  color: 'var(--xivig-text)',
  padding: 0,
};

const resultsContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '6px 0',
  maxHeight: '380px',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 16px',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
};

const itemLeftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const langNameStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--xivig-text)',
  fontWeight: 500,
};

const extBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--xivig-text-dim)',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  padding: '2px 6px',
  borderRadius: '3px',
};

const emptyStyle: React.CSSProperties = {
  padding: '24px',
  textAlign: 'center',
  color: 'var(--xivig-text-dim)',
  fontSize: '13px',
};
