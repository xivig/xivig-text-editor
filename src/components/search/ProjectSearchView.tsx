import React, { useState, useRef, useTransition } from 'react';
import {
  Search,
  Replace as ReplaceIcon,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  X,
  FileCode,
  ArrowRight,
} from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { FileItem } from '../../types/editor';
import { FileIcon } from '../common/FileIcon';
import { getActiveEditorView } from '../editor/editorViewRegistry';
import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export interface SearchMatch {
  line: number;
  col: number;
  lineText: string;
  matchText: string;
}

export interface FileSearchResult {
  filePath: string;
  relativePath: string;
  fileName: string;
  matches: SearchMatch[];
}

export const ProjectSearchView: React.FC = () => {
  const currentFolderPath = useFileStore((state) => state.currentFolderPath);
  const fileTree = useFileStore((state) => state.fileTree);
  const searchFolderFilter = useFileStore((state) => state.searchFolderFilter);
  const setSearchFolderFilter = useFileStore((state) => state.setSearchFolderFilter);
  const workspaceSearchQuery = useFileStore((state) => state.workspaceSearchQuery);
  const openDocument = useEditorStore((state) => state.openDocument);

  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [includeFilter, setIncludeFilter] = useState('');
  const [excludeFilter, setExcludeFilter] = useState('node_modules, dist, .git, *.lock');
  const [searchHiddenFiles, setSearchHiddenFiles] = useState(false);
  const [searchIgnoredFiles, setSearchIgnoredFiles] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [draftSearch, setDraftSearch] = useState<string>('');

  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<FileSearchResult[]>([]);
  const [collapsedFiles, setCollapsedFiles] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  const searchInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (workspaceSearchQuery) {
      setQuery(workspaceSearchQuery);
      handleSearch(workspaceSearchQuery);
    }
  }, [workspaceSearchQuery]);

  const saveToHistory = (term: string) => {
    if (!term.trim()) return;
    setSearchHistory((prev) => [term, ...prev.filter((t) => t !== term)].slice(0, 50));
    setHistoryIndex(-1);
  };

  // Flatten all files from fileTree
  const getFlatFileList = (items: FileItem[]): Array<{ path: string; name: string }> => {
    const list: Array<{ path: string; name: string }> = [];
    const walk = (nodes: FileItem[]) => {
      for (const node of nodes) {
        if (node.isDirectory && node.children) {
          walk(node.children);
        } else if (!node.isDirectory) {
          list.push({ path: node.path, name: node.name });
        }
      }
    };
    walk(items);
    return list;
  };

  const handleSearch = async (searchTerm?: string) => {
    const effectiveQuery = searchTerm !== undefined ? searchTerm : query;
    if (!effectiveQuery.trim() || !window.xivig?.readFile) {
      setResults([]);
      return;
    }

    saveToHistory(effectiveQuery);
    setIsSearching(true);
    const files = getFlatFileList(fileTree);
    const searchResults: FileSearchResult[] = [];

    // Filter files based on include, exclude, folder, and hidden settings
    const filteredFiles = files.filter((f) => {
      // If folder filter is active, only search within that folder
      if (searchFolderFilter && !f.path.startsWith(searchFolderFilter)) {
        return false;
      }

      // Exclude hidden files if disabled
      if (!searchHiddenFiles && /(?:^|[/\\])\.[^/\\]+/.test(f.path)) {
        return false;
      }

      // Exclude binary and media files from text search
      if (/\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|mp4|mp3|zip|tar|gz|exe|dll|dylib|so|bin)$/i.test(f.name)) {
        return false;
      }

      // Exclude filter
      if (excludeFilter.trim()) {
        const excludePatterns = excludeFilter.split(',').map((p) => p.trim().replace(/\*/g, '.*'));
        const excludeRx = new RegExp(`(${excludePatterns.join('|')})`, 'i');
        if (excludeRx.test(f.path) || excludeRx.test(f.name)) {
          return false;
        }
      }

      // Include filter
      if (includeFilter.trim()) {
        const includePatterns = includeFilter.split(',').map((p) => p.trim().replace(/\*/g, '.*'));
        const includeRx = new RegExp(`(${includePatterns.join('|')})$`, 'i');
        return includeRx.test(f.name) || includeRx.test(f.path);
      }
      return true;
    });

    let regexPattern: RegExp;
    const isMultilineQuery = effectiveQuery.includes('\n');
    try {
      let pattern = effectiveQuery;
      if (!useRegex) {
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      if (wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      regexPattern = new RegExp(pattern, caseSensitive ? (isMultilineQuery ? 'gm' : 'g') : (isMultilineQuery ? 'gim' : 'gi'));
    } catch {
      setIsSearching(false);
      return;
    }

    for (const file of filteredFiles) {
      try {
        const res = await window.xivig.readFile(file.path);
        if (!res.success || typeof res.content !== 'string') continue;

        const matches: SearchMatch[] = [];

        if (isMultilineQuery) {
          regexPattern.lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = regexPattern.exec(res.content)) !== null) {
            const beforeMatch = res.content.slice(0, match.index);
            const lineNum = (beforeMatch.match(/\n/g) || []).length + 1;
            const lastNewline = beforeMatch.lastIndexOf('\n');
            const colNum = match.index - (lastNewline === -1 ? 0 : lastNewline + 1) + 1;
            const nextNewline = res.content.indexOf('\n', match.index + match[0].length);
            const lineEnd = nextNewline === -1 ? res.content.length : nextNewline;
            const snippet = res.content.slice(lastNewline === -1 ? 0 : lastNewline + 1, lineEnd).trim();

            matches.push({
              line: lineNum,
              col: colNum,
              lineText: snippet,
              matchText: match[0],
            });
            if (!regexPattern.global) break;
          }
        } else {
          const lines = res.content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const lineText = lines[i];
            regexPattern.lastIndex = 0;
            let match: RegExpExecArray | null;

            while ((match = regexPattern.exec(lineText)) !== null) {
              matches.push({
                line: i + 1,
                col: match.index + 1,
                lineText: lineText.trim(),
                matchText: match[0],
              });
              if (!regexPattern.global) break;
            }
          }
        }

        if (matches.length > 0) {
          const relPath = currentFolderPath
            ? file.path.replace(currentFolderPath, '').replace(/^[/\\]/, '')
            : file.name;

          searchResults.push({
            filePath: file.path,
            relativePath: relPath,
            fileName: file.name,
            matches,
          });
        }
      } catch {
        // Skip unreadable files
      }
    }

    startTransition(() => {
      setResults(searchResults);
      setIsSearching(false);
    });
  };

  const handleMatchClick = async (filePath: string, line: number, col: number) => {
    if (!window.xivig?.readFile) return;

    const res = await window.xivig.readFile(filePath);
    if (!res.success || res.content === undefined) return;

    const fileName = filePath.split(/[/\\]/).pop() || filePath;
    openDocument({
      path: filePath,
      name: fileName,
      content: res.content,
      language: fileName,
    });

    // Jump to line and column in editor
    setTimeout(() => {
      const view = getActiveEditorView();
      if (view) {
        try {
          const targetLine = view.state.doc.line(line);
          const targetPos = Math.min(targetLine.from + col - 1, targetLine.to);
          view.dispatch({
            selection: EditorSelection.cursor(targetPos),
            effects: EditorView.scrollIntoView(targetPos, { y: 'center' }),
          });
          view.focus();
        } catch {
          // Ignore jump error
        }
      }
    }, 100);
  };

  const handleReplaceAll = async () => {
    if (!results.length || !window.xivig?.saveFile || !window.xivig?.readFile) return;

    const confirmed = confirm(
      `Are you sure you want to replace all occurrences across ${results.length} files?`
    );
    if (!confirmed) return;

    let regexPattern: RegExp;
    try {
      let pattern = query;
      if (!useRegex) {
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      if (wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      regexPattern = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
    } catch {
      return;
    }

    for (const res of results) {
      const fileData = await window.xivig.readFile(res.filePath);
      if (fileData.success && fileData.content !== undefined) {
        const newContent = fileData.content.replace(regexPattern, replaceText);
        await window.xivig.saveFile(res.filePath, newContent);
      }
    }

    // Re-run search to update results
    handleSearch();
  };

  const renderMatchSnippet = (lineText: string, matchText: string) => {
    if (!matchText) return <span>{lineText}</span>;
    const lowerLine = lineText.toLowerCase();
    const lowerMatch = matchText.toLowerCase();
    const idx = lowerLine.indexOf(lowerMatch);
    if (idx === -1) return <span>{lineText}</span>;

    const before = lineText.slice(0, idx);
    const matched = lineText.slice(idx, idx + matchText.length);
    const after = lineText.slice(idx + matchText.length);

    return (
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <span>{before}</span>
        <mark
          style={{
            backgroundColor: 'rgba(255, 215, 0, 0.35)',
            color: '#ffd700',
            borderRadius: '2px',
            padding: '0 2px',
            fontWeight: 700,
          }}
        >
          {matched}
        </mark>
        <span>{after}</span>
      </span>
    );
  };

  const totalMatches = results.reduce((acc, r) => acc + r.matches.length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', userSelect: 'none' }}>
      {/* Search Header Inputs */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--xivig-border-subtle)' }}>
        {/* Selected Folder Filter Pill */}
        {searchFolderFilter && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '3px 8px',
              marginBottom: '6px',
              backgroundColor: 'rgba(108, 140, 255, 0.15)',
              borderRadius: '4px',
              fontSize: '11px',
              color: 'var(--xivig-accent)',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              📁 in: {searchFolderFilter.split(/[/\\]/).pop()}
            </span>
            <button
              onClick={() => setSearchFolderFilter(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 2px' }}
              title="Clear folder filter"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Search Row */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', marginBottom: '6px' }}>
          <button
            onClick={() => setShowReplace(!showReplace)}
            style={{
              background: 'none',
              border: 'none',
              color: showReplace ? 'var(--xivig-accent)' : 'var(--xivig-text-dim)',
              cursor: 'pointer',
              padding: '2px 4px 2px 0',
            }}
            title="Toggle Replace"
          >
            {showReplace ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              } else if (e.key === 'ArrowUp' && searchHistory.length > 0) {
                e.preventDefault();
                if (historyIndex === -1) {
                  setDraftSearch(query);
                  const nextIdx = 0;
                  setHistoryIndex(nextIdx);
                  setQuery(searchHistory[nextIdx]);
                } else if (historyIndex < searchHistory.length - 1) {
                  const nextIdx = historyIndex + 1;
                  setHistoryIndex(nextIdx);
                  setQuery(searchHistory[nextIdx]);
                }
              } else if (e.key === 'ArrowDown' && historyIndex >= 0) {
                e.preventDefault();
                if (historyIndex === 0) {
                  setHistoryIndex(-1);
                  setQuery(draftSearch);
                } else {
                  const nextIdx = historyIndex - 1;
                  setHistoryIndex(nextIdx);
                  setQuery(searchHistory[nextIdx]);
                }
              }
            }}
            placeholder="Search in workspace..."
            style={{
              flex: 1,
              backgroundColor: 'var(--xivig-surface)',
              border: '1px solid var(--xivig-border)',
              borderRadius: '4px',
              color: 'var(--xivig-text)',
              fontSize: '12px',
              padding: '5px 80px 5px 8px',
              outline: 'none',
            }}
          />
          {/* Quick Option Badges (Aa, \b, .*) */}
          <div style={{ position: 'absolute', right: '4px', display: 'flex', gap: '2px' }}>
            <button
              onClick={() => setCaseSensitive(!caseSensitive)}
              style={{
                ...pillBtnStyle,
                backgroundColor: caseSensitive ? 'var(--xivig-accent)' : 'transparent',
                color: caseSensitive ? '#fff' : 'var(--xivig-text-dim)',
              }}
              title="Match Case (Alt+C)"
              aria-label="Match Case"
            >
              Aa
            </button>
            <button
              onClick={() => setWholeWord(!wholeWord)}
              style={{
                ...pillBtnStyle,
                backgroundColor: wholeWord ? 'var(--xivig-accent)' : 'transparent',
                color: wholeWord ? '#fff' : 'var(--xivig-text-dim)',
              }}
              title="Match Whole Word (Alt+W)"
              aria-label="Match Whole Word"
            >
              \b
            </button>
            <button
              onClick={() => setUseRegex(!useRegex)}
              style={{
                ...pillBtnStyle,
                backgroundColor: useRegex ? 'var(--xivig-accent)' : 'transparent',
                color: useRegex ? '#fff' : 'var(--xivig-text-dim)',
              }}
              title="Use Regular Expression (Alt+R)"
              aria-label="Use Regular Expression"
            >
              .*
            </button>
          </div>
        </div>

        {/* Replace Row */}
        {showReplace && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', marginLeft: '18px' }}>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace with..."
              style={{
                flex: 1,
                backgroundColor: 'var(--xivig-surface)',
                border: '1px solid var(--xivig-border)',
                borderRadius: '4px',
                color: 'var(--xivig-text)',
                fontSize: '12px',
                padding: '5px 8px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleReplaceAll}
              disabled={results.length === 0}
              style={{
                marginLeft: '6px',
                padding: '5px 8px',
                backgroundColor: results.length > 0 ? 'var(--xivig-accent)' : '#333',
                color: results.length > 0 ? '#fff' : '#777',
                border: 'none',
                borderRadius: '3px',
                cursor: results.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
              title="Replace All Occurrences Across Files"
              aria-label="Replace All Occurrences Across Files"
            >
              Replace All
            </button>
          </div>
        )}

        {/* Search Action / Filter Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{ background: 'none', border: 'none', color: 'var(--xivig-text-dim)', fontSize: '11px', cursor: 'pointer' }}
          >
            {showDetails ? 'Hide Filters' : 'Include / Exclude Filters...'}
          </button>
          <button
            onClick={() => handleSearch()}
            disabled={isSearching || !query.trim()}
            style={{
              padding: '4px 10px',
              backgroundColor: query.trim() ? 'var(--xivig-accent)' : 'rgba(108, 140, 255, 0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: query.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Detailed Filters */}
        {showDetails && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--xivig-text-dim)', marginBottom: '2px' }}>files to include</div>
              <input
                type="text"
                value={includeFilter}
                onChange={(e) => setIncludeFilter(e.target.value)}
                placeholder="e.g. *.ts, *.tsx, src/*"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--xivig-surface)',
                  border: '1px solid var(--xivig-border)',
                  borderRadius: '3px',
                  color: 'var(--xivig-text)',
                  fontSize: '11px',
                  padding: '4px 6px',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--xivig-text-dim)', marginBottom: '2px' }}>files to exclude</div>
              <input
                type="text"
                value={excludeFilter}
                onChange={(e) => setExcludeFilter(e.target.value)}
                placeholder="e.g. node_modules, dist, *.lock"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--xivig-surface)',
                  border: '1px solid var(--xivig-border)',
                  borderRadius: '3px',
                  color: 'var(--xivig-text)',
                  fontSize: '11px',
                  padding: '4px 6px',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '2px', fontSize: '11px', color: 'var(--xivig-text-muted)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={searchHiddenFiles}
                  onChange={(e) => setSearchHiddenFiles(e.target.checked)}
                />
                <span>Hidden files</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={searchIgnoredFiles}
                  onChange={(e) => setSearchIgnoredFiles(e.target.checked)}
                />
                <span>Ignored files</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div style={{ padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--xivig-activity-bar)', borderBottom: '1px solid var(--xivig-border-subtle)' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--xivig-text-muted)' }}>
          {isSearching
            ? 'Searching workspace...'
            : results.length > 0
            ? `${totalMatches} matches in ${results.length} files`
            : query.trim()
            ? 'No matches found'
            : 'Enter query to search'}
        </span>
        {results.length > 0 && (
          <button
            onClick={() => setResults([])}
            style={{ background: 'none', border: 'none', color: 'var(--xivig-text-dim)', cursor: 'pointer', padding: '2px' }}
            title="Clear Results"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Results List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {results.map((fileRes) => {
          const isCollapsed = collapsedFiles[fileRes.filePath];
          return (
            <div key={fileRes.filePath} style={{ marginBottom: '4px' }}>
              {/* File Title Bar */}
              <div
                onClick={() =>
                  setCollapsedFiles((prev) => ({
                    ...prev,
                    [fileRes.filePath]: !prev[fileRes.filePath],
                  }))
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                }}
                className="hover:bg-[#252528]"
              >
                {isCollapsed ? <ChevronRight size={12} style={{ marginRight: '4px' }} /> : <ChevronDown size={12} style={{ marginRight: '4px' }} />}
                <FileIcon filename={fileRes.fileName} size={14} style={{ marginRight: '6px' }} />
                <span style={{ color: 'var(--xivig-text)', fontWeight: 600, marginRight: '6px' }}>{fileRes.fileName}</span>
                <span style={{ fontSize: '10px', color: 'var(--xivig-text-dim)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fileRes.relativePath}
                </span>
                <span style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '8px', color: 'var(--xivig-accent)', fontWeight: 700 }}>
                  {fileRes.matches.length}
                </span>
              </div>

              {/* Matches in this file */}
              {!isCollapsed && (
                <div style={{ marginLeft: '16px' }}>
                  {fileRes.matches.map((m, idx) => (
                    <div
                      key={`${fileRes.filePath}-${m.line}-${idx}`}
                      onClick={() => handleMatchClick(fileRes.filePath, m.line, m.col)}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        padding: '3px 8px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontFamily: 'var(--xivig-font-mono, monospace)',
                        lineHeight: 1.4,
                      }}
                      className="hover:bg-[#2a2a2e]"
                      title={`Line ${m.line}, Column ${m.col}`}
                    >
                      <span style={{ color: 'var(--xivig-text-dim)', width: '32px', textAlign: 'right', marginRight: '8px', flexShrink: 0, userSelect: 'none' }}>
                        {m.line}
                      </span>
                      <span style={{ color: 'var(--xivig-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {renderMatchSnippet(m.lineText, m.matchText)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const pillBtnStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: '3px',
  fontSize: '11px',
  fontFamily: 'monospace',
  fontWeight: 700,
  padding: '2px 5px',
  cursor: 'pointer',
  userSelect: 'none',
};
