import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, Search, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface KeyShortcut {
  category: string;
  command: string;
  keys: string;
}

const shortcuts: KeyShortcut[] = [
  // Sublime Multi-Cursor & Selection
  { category: 'Multi-Cursor & Selection', command: 'Select Next Occurrence', keys: 'Ctrl + D' },
  { category: 'Multi-Cursor & Selection', command: 'Select All Occurrences (Quick Find All)', keys: 'Alt + F3 / Ctrl + Alt + G' },
  { category: 'Multi-Cursor & Selection', command: 'Split Selection into Lines', keys: 'Ctrl + Shift + L' },
  { category: 'Multi-Cursor & Selection', command: 'Select Entire Line', keys: 'Ctrl + L' },
  { category: 'Multi-Cursor & Selection', command: 'Expand Selection to Scope / Parent', keys: 'Ctrl + Shift + Space' },
  { category: 'Multi-Cursor & Selection', command: 'Select Content Inside Brackets', keys: 'Ctrl + Shift + M' },
  { category: 'Multi-Cursor & Selection', command: 'Jump to Matching Bracket', keys: 'Ctrl + M' },
  { category: 'Multi-Cursor & Selection', command: 'Add Cursor Above', keys: 'Ctrl + Alt + Up' },
  { category: 'Multi-Cursor & Selection', command: 'Add Cursor Below', keys: 'Ctrl + Alt + Down' },
  { category: 'Multi-Cursor & Selection', command: 'Undo Selection (Soft Undo)', keys: 'Ctrl + U' },
  { category: 'Multi-Cursor & Selection', command: 'Redo Selection (Soft Redo)', keys: 'Ctrl + Shift + U' },

  // Line Editing & Manipulation
  { category: 'Line Editing', command: 'Duplicate Line or Selection', keys: 'Ctrl + Shift + D' },
  { category: 'Line Editing', command: 'Duplicate Line Down', keys: 'Shift + Alt + Down' },
  { category: 'Line Editing', command: 'Duplicate Line Up', keys: 'Shift + Alt + Up' },
  { category: 'Line Editing', command: 'Move Line Down', keys: 'Alt + Down' },
  { category: 'Line Editing', command: 'Move Line Up', keys: 'Alt + Up' },
  { category: 'Line Editing', command: 'Delete Entire Line', keys: 'Ctrl + Shift + K' },
  { category: 'Line Editing', command: 'Insert Line Below', keys: 'Ctrl + Enter' },
  { category: 'Line Editing', command: 'Insert Line Above', keys: 'Ctrl + Shift + Enter' },
  { category: 'Line Editing', command: 'Join Lines', keys: 'Ctrl + J' },
  { category: 'Line Editing', command: 'Transpose Characters', keys: 'Ctrl + T' },
  { category: 'Line Editing', command: 'Delete Word Backward', keys: 'Ctrl + Backspace' },
  { category: 'Line Editing', command: 'Delete Word Forward', keys: 'Ctrl + Delete' },
  { category: 'Line Editing', command: 'Indent Line / Selection', keys: 'Ctrl + ]' },
  { category: 'Line Editing', command: 'Unindent Line / Selection', keys: 'Ctrl + [' },
  { category: 'Line Editing', command: 'Toggle Line Comment', keys: 'Ctrl + /' },
  { category: 'Line Editing', command: 'Toggle Block Comment', keys: 'Ctrl + Shift + /' },

  // Sublime Chords (Ctrl+K ...)
  { category: 'Sublime Chords (Ctrl+K)', command: 'Transform to UPPERCASE', keys: 'Ctrl + K Ctrl + U' },
  { category: 'Sublime Chords (Ctrl+K)', command: 'Transform to lowercase', keys: 'Ctrl + K Ctrl + L' },
  { category: 'Sublime Chords (Ctrl+K)', command: 'Delete to End of Line', keys: 'Ctrl + K Ctrl + K' },
  { category: 'Sublime Chords (Ctrl+K)', command: 'Delete to Start of Line', keys: 'Ctrl + K Backspace' },
  { category: 'Sublime Chords (Ctrl+K)', command: 'Center Scroll on Cursor', keys: 'Ctrl + K Ctrl + C' },
  { category: 'Sublime Chords (Ctrl+K)', command: 'Unfold All Code Blocks', keys: 'Ctrl + K Ctrl + 0 / Ctrl + K Ctrl + J' },
  { category: 'Sublime Chords (Ctrl+K)', command: 'Close All Open Tabs', keys: 'Ctrl + K Ctrl + W' },
  { category: 'Sublime Chords (Ctrl+K)', command: 'Toggle Sidebar', keys: 'Ctrl + K Ctrl + B' },
  { category: 'Sublime Chords (Ctrl+K)', command: 'Open Folder...', keys: 'Ctrl + K Ctrl + O' },
  { category: 'Sublime Chords (Ctrl+K)', command: 'Keyboard Shortcuts Cheat Sheet', keys: 'Ctrl + K Ctrl + S' },

  // Bookmarks (Sublime Text)
  { category: 'Bookmarks', command: 'Toggle Bookmark on Line', keys: 'Ctrl + F2' },
  { category: 'Bookmarks', command: 'Jump to Next Bookmark', keys: 'F2' },
  { category: 'Bookmarks', command: 'Jump to Previous Bookmark', keys: 'Shift + F2' },
  { category: 'Bookmarks', command: 'Clear All Bookmarks', keys: 'Ctrl + Shift + F2' },

  // Go to Anything & Navigation
  { category: 'Go to Anything', command: 'Go to Anything (Quick Open)', keys: 'Ctrl + P' },
  { category: 'Go to Anything', command: 'Go to Line', keys: 'Ctrl + G / :line' },
  { category: 'Go to Anything', command: 'Go to Symbol in File', keys: 'Ctrl + R / @symbol' },
  { category: 'Go to Anything', command: 'Command Palette', keys: 'Ctrl + Shift + P' },
  { category: 'Go to Anything', command: 'Jump to Document Start', keys: 'Ctrl + Home' },
  { category: 'Go to Anything', command: 'Jump to Document End', keys: 'Ctrl + End' },
  { category: 'Go to Anything', command: 'Move by Subword', keys: 'Alt + Left / Alt + Right' },
  { category: 'Go to Anything', command: 'Select by Subword', keys: 'Shift + Alt + Left / Right' },

  // Tabs & Window Layout
  { category: 'Tabs & Window', command: 'Reopen Closed Tab', keys: 'Ctrl + Shift + T' },
  { category: 'Tabs & Window', command: 'Next Tab', keys: 'Ctrl + Tab / Ctrl + PageDown' },
  { category: 'Tabs & Window', command: 'Previous Tab', keys: 'Ctrl + Shift + Tab / Ctrl + PageUp' },
  { category: 'Tabs & Window', command: 'Switch to Tab 1 - 9', keys: 'Alt + 1 .. Alt + 9' },
  { category: 'Tabs & Window', command: 'Close Active Tab', keys: 'Ctrl + W' },
  { category: 'Tabs & Window', command: 'Distraction Free Mode', keys: 'Shift + F11' },
  { category: 'Tabs & Window', command: 'Toggle Full Screen', keys: 'F11' },
  { category: 'Tabs & Window', command: 'Toggle Sidebar', keys: 'Ctrl + B' },
  { category: 'Tabs & Window', command: 'Toggle Integrated Terminal', keys: 'Ctrl + `' },
  { category: 'Tabs & Window', command: 'Toggle Two Columns Split', keys: 'Ctrl + \\' },
  { category: 'Tabs & Window', command: 'Layout: Single Pane', keys: 'Alt + Shift + 1' },
  { category: 'Tabs & Window', command: 'Layout: Two Columns', keys: 'Alt + Shift + 2' },
  { category: 'Tabs & Window', command: 'Layout: Two Rows', keys: 'Alt + Shift + 3' },

  // Code Folding
  { category: 'Code Folding', command: 'Fold Code Block', keys: 'Ctrl + Shift + [' },
  { category: 'Code Folding', command: 'Unfold Code Block', keys: 'Ctrl + Shift + ]' },
  { category: 'Code Folding', command: 'Fold All Blocks', keys: 'Ctrl + Alt + [' },
  { category: 'Code Folding', command: 'Unfold All Blocks', keys: 'Ctrl + Alt + ]' },

  // Search & Replace
  { category: 'Search & Replace', command: 'Find in Document', keys: 'Ctrl + F' },
  { category: 'Search & Replace', command: 'Replace in Document', keys: 'Ctrl + H' },
  { category: 'Search & Replace', command: 'Find Next Match', keys: 'F3 / Enter' },
  { category: 'Search & Replace', command: 'Find Previous Match', keys: 'Shift + F3 / Shift + Enter' },
  { category: 'Search & Replace', command: 'Focus Search in Files', keys: 'Ctrl + Shift + F' },
  { category: 'Search & Replace', command: 'Focus File Explorer', keys: 'Ctrl + Shift + E' },
  { category: 'Search & Replace', command: 'Focus Source Control (Git)', keys: 'Ctrl + Shift + G' },

  // Text Zooming
  { category: 'Zoom & View', command: 'Zoom In (Enlarge Text)', keys: 'Ctrl + = / Ctrl + +' },
  { category: 'Zoom & View', command: 'Zoom Out (Shrink Text)', keys: 'Ctrl + -' },
  { category: 'Zoom & View', command: 'Reset Zoom (Default 14px)', keys: 'Ctrl + 0' },
  { category: 'Zoom & View', command: 'Zoom with Mouse Wheel', keys: 'Ctrl + Mouse Wheel' },

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
