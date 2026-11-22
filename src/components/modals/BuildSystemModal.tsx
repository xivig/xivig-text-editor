import React, { useState, useEffect, useRef } from 'react';
import { Play, Terminal, X, Search, Check, Cpu } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useBuildStore, BuildTarget } from '../../stores/buildStore';

export const BuildSystemModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isBuildSystemModalOpen);
  const close = useUIStore((state) => state.closeBuildSystemModal);
  const getAvailableTargets = useBuildStore((state) => state.getAvailableTargets);
  const executeBuild = useBuildStore((state) => state.executeBuild);
  const activeTarget = useBuildStore((state) => state.activeTarget);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const targets = getAvailableTargets();
  const filteredTargets = targets.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.command.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (target: BuildTarget) => {
    close();
    executeBuild(target);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredTargets.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? Math.max(0, filteredTargets.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTargets[selectedIndex]) {
        handleSelect(filteredTargets[selectedIndex]);
      }
    }
  };

  return (
    <div style={backdropStyle} onClick={close}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="var(--xivig-accent)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Select Build System & Task (Ctrl+Shift+B)</span>
          </div>
          <button onClick={close} style={{ color: 'var(--xivig-text-dim)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div style={searchWrapperStyle}>
          <Search size={14} color="var(--xivig-text-dim)" style={{ marginRight: '8px' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search build targets (e.g. Node, Python, npm, Cargo)..."
            style={inputStyle}
          />
        </div>

        {/* List of Targets */}
        <div style={listContainerStyle}>
          {filteredTargets.length > 0 ? (
            filteredTargets.map((target, idx) => {
              const isSelected = idx === selectedIndex;
              const isActive = activeTarget?.id === target.id;

              return (
                <div
                  key={target.id}
                  onClick={() => handleSelect(target)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    ...itemStyle,
                    backgroundColor: isSelected ? 'var(--xivig-surface-hover)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--xivig-accent)' : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(108, 140, 255, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--xivig-accent)',
                        flexShrink: 0,
                      }}
                    >
                      <Play size={13} fill="currentColor" />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--xivig-text)', fontSize: '13px' }}>
                          {target.name}
                        </span>
                        {isActive && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              backgroundColor: 'rgba(53, 183, 121, 0.2)',
                              color: '#35b779',
                              borderRadius: '3px',
                              fontWeight: 600,
                            }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: 'var(--xivig-text-dim)',
                          marginTop: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {target.description}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                    <code
                      style={{
                        fontSize: '11px',
                        backgroundColor: 'var(--xivig-surface)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        color: 'var(--xivig-text-muted)',
                      }}
                    >
                      {target.command} {target.args.slice(0, 2).join(' ')}
                    </code>
                    {isSelected && (
                      <span style={{ fontSize: '11px', color: 'var(--xivig-accent)', fontWeight: 600 }}>
                        Enter ↵
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--xivig-text-dim)', fontSize: '12.5px' }}>
              No matching build systems found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <span>Use <b>↑ ↓</b> to navigate, <b>Enter</b> to execute, <b>Esc</b> to dismiss</span>
          <span style={{ color: 'var(--xivig-accent)' }}>Default: <b>Ctrl+B</b></span>
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
  paddingTop: '80px',
  zIndex: 9999,
  backdropFilter: 'blur(2px)',
};

const modalStyle: React.CSSProperties = {
  width: '560px',
  maxHeight: '480px',
  backgroundColor: 'var(--xivig-surface)',
  borderRadius: '8px',
  border: '1px solid var(--xivig-border)',
  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
};

const searchWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 14px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'var(--xivig-text)',
  fontSize: '13px',
};

const listContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  maxHeight: '340px',
  padding: '4px 0',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 14px',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 14px',
  borderTop: '1px solid var(--xivig-border-subtle)',
  backgroundColor: 'var(--xivig-activity-bar)',
  fontSize: '11px',
  color: 'var(--xivig-text-dim)',
};
