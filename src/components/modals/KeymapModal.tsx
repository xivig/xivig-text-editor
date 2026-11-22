import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, Search, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface KeyShortcut {
  category: string;
  command: string;
  keys: string;
}

const shortcuts: KeyShortcut[] = [
  // General
  { category: 'General', command: 'Command Palette', keys: 'Ctrl + Shift + P' },
  { category: 'General', command: 'Go to File / Quick Open', keys: 'Ctrl + P' },
  { category: 'General', command: 'New File', keys: 'Ctrl + N' },
  { category: 'General', command: 'Open File...', keys: 'Ctrl + O' },
  { category: 'General', command: 'Open Folder...', keys: 'Ctrl + K Ctrl + O' },
  { category: 'General', command: 'Save File', keys: 'Ctrl + S' },
  { category: 'General', command: 'Save As...', keys: 'Ctrl + Shift + S' },
  { category: 'General', command: 'Close Tab', keys: 'Ctrl + W' },
  { category: 'General', command: 'Open Settings', keys: 'Ctrl + ,' },
  { category: 'General', command: 'Keyboard Shortcuts Cheat Sheet', keys: 'Ctrl + K Ctrl + S' },

  // Navigation & Views
  { category: 'Navigation & View', command: 'Toggle Sidebar', keys: 'Ctrl + B' },
  { category: 'Navigation & View', command: 'Toggle Integrated Terminal', keys: 'Ctrl + `' },
  { category: 'Navigation & View', command: 'Toggle Minimap', keys: 'View Menu' },
  { category: 'Navigation & View', command: 'Focus Explorer', keys: 'Ctrl + Shift + E' },
  { category: 'Navigation & View', command: 'Focus Search', keys: 'Ctrl + Shift + F' },
  { category: 'Navigation & View', command: 'Focus Source Control (Git)', keys: 'Ctrl + Shift + G' },

  // Split Panes
  { category: 'Split Panes', command: 'Toggle Two Columns Split', keys: 'Ctrl + \\' },
  { category: 'Split Panes', command: 'Layout: Single Pane', keys: 'Alt + Shift + 1' },
  { category: 'Split Panes', command: 'Layout: Two Columns', keys: 'Alt + Shift + 2' },
  { category: 'Split Panes', command: 'Layout: Two Rows', keys: 'Alt + Shift + 3' },

  // Sublime Text Editing
  { category: 'Sublime Editing', command: 'Select Next Occurrence (Multi-Cursor)', keys: 'Ctrl + D' },
  { category: 'Sublime Editing', command: 'Move Line Down', keys: 'Alt + Down' },
  { category: 'Sublime Editing', command: 'Move Line Up', keys: 'Alt + Up' },
  { category: 'Sublime Editing', command: 'Duplicate Line Down', keys: 'Shift + Alt + Down' },
  { category: 'Sublime Editing', command: 'Duplicate Line Up', keys: 'Shift + Alt + Up' },
  { category: 'Sublime Editing', command: 'Toggle Line Comment', keys: 'Ctrl + /' },
  { category: 'Sublime Editing', command: 'Delete Entire Line', keys: 'Ctrl + Shift + K' },
  { category: 'Sublime Editing', command: 'Select Entire Line', keys: 'Ctrl + L' },
  { category: 'Sublime Editing', command: 'Insert Line Below', keys: 'Ctrl + Enter' },
  { category: 'Sublime Editing', command: 'Add Cursor Above', keys: 'Ctrl + Alt + Up' },
  { category: 'Sublime Editing', command: 'Add Cursor Below', keys: 'Ctrl + Alt + Down' },
  { category: 'Sublime Editing', command: 'Undo Selection', keys: 'Ctrl + U' },

  // Search & Replace
  { category: 'Search & Replace', command: 'Find in Document', keys: 'Ctrl + F' },
  { category: 'Search & Replace', command: 'Replace in Document', keys: 'Ctrl + H' },
  { category: 'Search & Replace', command: 'Find Next Match', keys: 'Enter' },
  { category: 'Search & Replace', command: 'Find Previous Match', keys: 'Shift + Enter' },

  // Code Folding
  { category: 'Code Folding', command: 'Fold Code Block', keys: 'Ctrl + Shift + [' },
  { category: 'Code Folding', command: 'Unfold Code Block', keys: 'Ctrl + Shift + ]' },
  { category: 'Code Folding', command: 'Fold All Blocks', keys: 'Ctrl + Alt + [' },
  { category: 'Code Folding', command: 'Unfold All Blocks', keys: 'Ctrl + Alt + ]' },

  // Emmet
  { category: 'Emmet', command: 'Expand Abbreviation', keys: 'Tab / Ctrl + E' },
  { category: 'Emmet', command: 'Wrap with Abbreviation', keys: 'Ctrl + Alt + W' },
];

export const KeymapModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isKeymapModalOpen);
  const close = useUIStore((state) => state.closeKeymapModal);

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredShortcuts = shortcuts.filter((s) => {
    const q = query.toLowerCase();
    return s.command.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.keys.toLowerCase().includes(q);
  });

  if (!isOpen) return null;

  return (
    <div style={backdropStyle} onClick={close}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Keyboard size={18} color="var(--xivig-accent)" />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Keyboard Shortcuts</span>
          </div>
          <button onClick={close} style={{ color: 'var(--xivig-text-dim)' }}>
            <X size={16} />
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
            placeholder="Type to search shortcuts..."
            style={inputStyle}
          />
        </div>

        {/* Shortcuts Table */}
        <div style={listContainerStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--xivig-border-subtle)', textAlign: 'left', color: 'var(--xivig-text-dim)' }}>
                <th style={{ padding: '8px 16px', fontWeight: 600 }}>Command</th>
                <th style={{ padding: '8px 16px', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '8px 16px', fontWeight: 600, textAlign: 'right' }}>Keybinding</th>
              </tr>
            </thead>
            <tbody>
              {filteredShortcuts.map((s, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid var(--xivig-border-subtle)',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--xivig-surface)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '8px 16px', color: 'var(--xivig-text)', fontWeight: 500 }}>
                    {s.command}
                  </td>
                  <td style={{ padding: '8px 16px', color: 'var(--xivig-text-muted)', fontSize: '11px' }}>
                    {s.category}
                  </td>
                  <td style={{ padding: '8px 16px', textAlign: 'right' }}>
                    <span style={keyBadgeStyle}>{s.keys}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  paddingTop: '60px',
  zIndex: 10000,
  backdropFilter: 'blur(2px)',
};

const modalStyle: React.CSSProperties = {
  width: '680px',
  maxHeight: '520px',
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '8px',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid var(--xivig-border)',
  backgroundColor: 'var(--xivig-activity-bar)',
};

const searchWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '13px',
  color: 'var(--xivig-text)',
  padding: 0,
};

const listContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
};

const keyBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  fontFamily: 'var(--xivig-font-mono)',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid var(--xivig-border-subtle)',
  borderRadius: '4px',
  padding: '2px 8px',
  color: 'var(--xivig-accent)',
  display: 'inline-block',
};
