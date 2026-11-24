import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  X,
  Replace as ReplaceIcon,
} from 'lucide-react';
import {
  SearchQuery,
  setSearchQuery,
  findNext,
  findPrevious,
  replaceNext,
  replaceAll,
  selectSelectionMatches,
  SearchCursor,
  RegExpCursor,
} from '@codemirror/search';
import { useUIStore } from '../../stores/uiStore';
import { getActiveEditorView } from '../editor/editorViewRegistry';

export const SearchPanel: React.FC = () => {
  const isOpen = useUIStore((state) => state.isSearchPanelOpen);
  const mode = useUIStore((state) => state.searchMode);
  const close = useUIStore((state) => state.closeSearchPanel);
  const openSearchPanel = useUIStore((state) => state.openSearchPanel);

  const [searchQueryText, setSearchQueryText] = useState('');
  const [replaceQueryText, setReplaceQueryText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [regexp, setRegexp] = useState(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [draftSearch, setDraftSearch] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const saveToHistory = (term: string) => {
    if (!term.trim()) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item !== term);
      return [term, ...filtered].slice(0, 50);
    });
    setHistoryIndex(-1);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (mode === 'replace' && replaceInputRef.current) {
          searchInputRef.current?.focus();
        } else {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }
      }, 50);
    }
  }, [isOpen, mode]);

  // Update CodeMirror search state on change
  useEffect(() => {
    const view = getActiveEditorView();
    if (!view) return;

    if (!searchQueryText) {
      setMatchCount(null);
      view.dispatch({
        effects: setSearchQuery.of(
          new SearchQuery({
            search: '',
          })
        ),
      });
      return;
    }

    try {
      const query = new SearchQuery({
        search: searchQueryText,
        replace: replaceQueryText,
        caseSensitive,
        wholeWord,
        regexp,
      });

      view.dispatch({
        effects: setSearchQuery.of(query),
      });

      // Count matches
      let count = 0;
      const doc = view.state.doc;
      if (regexp) {
        try {
          const flags = caseSensitive ? 'gm' : 'gim';
          const rx = new RegExp(searchQueryText, flags);
          const cursor = new RegExpCursor(doc, rx.source, { ignoreCase: !caseSensitive });
          while (!cursor.next().done) {
            count++;
            if (count > 999) break;
          }
        } catch {
          count = 0;
        }
      } else {
        const cursor = new SearchCursor(
          doc,
          searchQueryText,
          0,
          doc.length,
          caseSensitive ? (x) => x : (x) => x.toLowerCase()
        );
        while (!cursor.next().done) {
          count++;
          if (count > 999) break;
        }
      }
      setMatchCount(count);
    } catch {
      setMatchCount(0);
    }
  }, [searchQueryText, replaceQueryText, caseSensitive, wholeWord, regexp]);

  const handleFindNext = () => {
    saveToHistory(searchQueryText);
    const view = getActiveEditorView();
    if (view) findNext(view);
  };

  const handleFindPrevious = () => {
    saveToHistory(searchQueryText);
    const view = getActiveEditorView();
    if (view) findPrevious(view);
  };

  const handleReplaceNext = () => {
    saveToHistory(searchQueryText);
    const view = getActiveEditorView();
    if (view) replaceNext(view);
  };

  const handleReplaceAll = () => {
    saveToHistory(searchQueryText);
    const view = getActiveEditorView();
    if (!view) return;
    if (matchCount && matchCount > 10) {
      if (!confirm(`Replace all ${matchCount} matches in current file?`)) {
        return;
      }
    }
    replaceAll(view);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowUp' && searchHistory.length > 0) {
      e.preventDefault();
      if (historyIndex === -1) {
        setDraftSearch(searchQueryText);
        const nextIdx = 0;
        setHistoryIndex(nextIdx);
        setSearchQueryText(searchHistory[nextIdx]);
      } else if (historyIndex < searchHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setSearchQueryText(searchHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown' && historyIndex >= 0) {
      e.preventDefault();
      if (historyIndex === 0) {
        setHistoryIndex(-1);
        setSearchQueryText(draftSearch);
      } else {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setSearchQueryText(searchHistory[nextIdx]);
      }
    } else if (e.altKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      setCaseSensitive((prev) => !prev);
    } else if (e.altKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      setRegexp((prev) => !prev);
    } else if (e.altKey && e.key.toLowerCase() === 'w') {
      e.preventDefault();
      setWholeWord((prev) => !prev);
    } else if (e.ctrlKey && e.altKey && e.key === 'Enter') {
      e.preventDefault();
      handleReplaceAll();
    } else if (e.altKey && e.key === 'Enter') {
      e.preventDefault();
      const view = getActiveEditorView();
      if (view) {
        selectSelectionMatches(view);
        close();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handleFindPrevious();
      } else {
        handleFindNext();
      }
    }
  };

  if (!isOpen) return null;

  const isReplaceMode = mode === 'replace';

  return (
    <div style={panelContainerStyle}>
      <div style={panelBodyStyle}>
        {/* Toggle Mode Arrow */}
        <button
          onClick={() => openSearchPanel(isReplaceMode ? 'find' : 'replace')}
          style={toggleModeBtnStyle}
          title={isReplaceMode ? 'Switch to Find' : 'Switch to Replace'}
        >
          {isReplaceMode ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Search & Replace Inputs Column */}
        <div style={inputsColStyle}>
          {/* Find Row */}
          <div style={inputRowStyle}>
            <div style={inputWrapperStyle}>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQueryText}
                onChange={(e) => setSearchQueryText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Find"
                style={textInputStyle}
              />

              {/* Toggles */}
              <div style={togglesStyle}>
                <button
                  onClick={() => setCaseSensitive(!caseSensitive)}
                  style={{
                    ...toggleBtnStyle,
                    backgroundColor: caseSensitive ? 'var(--xivig-accent-active)' : 'transparent',
                    color: caseSensitive ? 'var(--xivig-accent)' : 'var(--xivig-text-dim)',
                  }}
                  title="Match Case (Alt+C)"
                >
                  Aa
                </button>
                <button
                  onClick={() => setWholeWord(!wholeWord)}
                  style={{
                    ...toggleBtnStyle,
                    backgroundColor: wholeWord ? 'var(--xivig-accent-active)' : 'transparent',
                    color: wholeWord ? 'var(--xivig-accent)' : 'var(--xivig-text-dim)',
                  }}
                  title="Match Whole Word (Alt+W)"
                >
                  \b
                </button>
                <button
                  onClick={() => setRegexp(!regexp)}
                  style={{
                    ...toggleBtnStyle,
                    backgroundColor: regexp ? 'var(--xivig-accent-active)' : 'transparent',
                    color: regexp ? 'var(--xivig-accent)' : 'var(--xivig-text-dim)',
                  }}
                  title="Use Regular Expression (Alt+R)"
                >
                  .*
                </button>
              </div>
            </div>

            {/* Match status */}
            <span style={matchCountStyle}>
              {matchCount !== null ? (matchCount === 0 ? 'No results' : `${matchCount} matches`) : ''}
            </span>

            {/* Nav buttons */}
            <button
              onClick={handleFindPrevious}
              style={iconBtnStyle}
              title="Previous Match (Shift+Enter)"
            >
              <ArrowUp size={13} />
            </button>
            <button
              onClick={handleFindNext}
              style={iconBtnStyle}
              title="Next Match (Enter)"
            >
              <ArrowDown size={13} />
            </button>
            <button onClick={close} style={iconBtnStyle} title="Close (Escape)">
              <X size={13} />
            </button>
          </div>

          {/* Replace Row */}
          {isReplaceMode && (
            <div style={{ ...inputRowStyle, marginTop: '6px' }}>
              <div style={inputWrapperStyle}>
                <input
                  ref={replaceInputRef}
                  type="text"
                  value={replaceQueryText}
                  onChange={(e) => setReplaceQueryText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleReplaceNext();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      close();
                    }
                  }}
                  placeholder="Replace"
                  style={textInputStyle}
                />
              </div>

              {/* Action buttons */}
              <button
                onClick={handleReplaceNext}
                style={actionTextBtnStyle}
                title="Replace Next (Enter)"
              >
                Replace
              </button>
              <button
                onClick={handleReplaceAll}
                style={actionTextBtnStyle}
                title="Replace All (Alt+Enter)"
              >
                All
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const panelContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '24px',
  zIndex: 500,
  userSelect: 'none',
};

const panelBodyStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '6px',
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.45)',
  padding: '6px 8px',
  gap: '4px',
};

const toggleModeBtnStyle: React.CSSProperties = {
  padding: '4px',
  color: 'var(--xivig-text-dim)',
  borderRadius: '3px',
  display: 'flex',
  alignItems: 'center',
  marginTop: '2px',
};

const inputsColStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const inputRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const inputWrapperStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '240px',
  backgroundColor: 'var(--xivig-bg)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '4px',
  padding: '2px 4px',
};

const textInputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '12px',
  color: 'var(--xivig-text)',
  padding: '2px 4px',
};

const togglesStyle: React.CSSProperties = {
  display: 'flex',
  gap: '2px',
};

const toggleBtnStyle: React.CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 600,
  fontFamily: 'monospace',
  padding: '2px 4px',
  borderRadius: '3px',
  cursor: 'pointer',
};

const matchCountStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--xivig-text-dim)',
  minWidth: '65px',
  textAlign: 'right',
  paddingRight: '4px',
};

const iconBtnStyle: React.CSSProperties = {
  padding: '4px',
  color: 'var(--xivig-text-muted)',
  borderRadius: '3px',
  display: 'flex',
  alignItems: 'center',
};

const actionTextBtnStyle: React.CSSProperties = {
  padding: '3px 8px',
  fontSize: '11px',
  fontWeight: 500,
  backgroundColor: 'var(--xivig-accent-subtle)',
  color: 'var(--xivig-accent)',
  borderRadius: '3px',
  cursor: 'pointer',
};
