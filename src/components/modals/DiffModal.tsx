import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, GitCompare, FileText, Clipboard, HardDrive, Columns, AlignJustify } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useEditorStore } from '../../stores/editorStore';
import { computeLineDiff, SideBySideLine, DiffLine } from '../../utils/diffUtils';

export const DiffModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isDiffModalOpen);
  const onClose = useUIStore((state) => state.closeDiffModal);

  const documents = useEditorStore((state) => state.documents);
  const activeDoc = useEditorStore((state) => state.getActiveDocument());

  // Comparison sources
  const [baseSource, setBaseSource] = useState<string>('disk');
  const [diskContent, setDiskContent] = useState<string | null>(null);
  const [clipboardContent, setClipboardContent] = useState<string | null>(null);
  const [diffViewMode, setDiffViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');

  // Load disk version when doc changes or modal opens
  useEffect(() => {
    if (!isOpen || !activeDoc) return;

    if (activeDoc.path && window.xivig?.readFile) {
      window.xivig.readFile(activeDoc.path).then((res) => {
        if (res.content !== undefined) {
          setDiskContent(res.content);
        } else {
          setDiskContent(null);
        }
      }).catch(() => setDiskContent(null));
    } else {
      setDiskContent(null);
    }

    // Default to disk if file has path and is dirty, else compare with clipboard or another tab
    if (activeDoc.path) {
      setBaseSource('disk');
    } else if (documents.length > 1) {
      const other = documents.find((d) => d.id !== activeDoc.id);
      setBaseSource(other ? other.id : 'clipboard');
    } else {
      setBaseSource('clipboard');
    }
  }, [isOpen, activeDoc?.id, activeDoc?.path]);

  // Load clipboard text if selected
  useEffect(() => {
    if (isOpen && baseSource === 'clipboard' && navigator?.clipboard?.readText) {
      navigator.clipboard.readText().then((text) => setClipboardContent(text)).catch(() => {});
    }
  }, [isOpen, baseSource]);

  // Resolve base text
  const baseText = useMemo(() => {
    if (baseSource === 'disk') {
      return diskContent ?? '(File does not exist on disk or cannot be read)';
    }
    if (baseSource === 'clipboard') {
      return clipboardContent ?? '';
    }
    const doc = documents.find((d) => d.id === baseSource);
    return doc ? doc.content : '';
  }, [baseSource, diskContent, clipboardContent, documents]);

  const modifiedText = activeDoc ? activeDoc.content : '';

  // Compute diff
  const diff = useMemo(() => {
    return computeLineDiff(baseText, modifiedText);
  }, [baseText, modifiedText]);

  // Synchronized scroll refs for side-by-side
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  const handleLeftScroll = () => {
    if (isSyncingScroll.current) return;
    if (leftPaneRef.current && rightPaneRef.current) {
      isSyncingScroll.current = true;
      rightPaneRef.current.scrollTop = leftPaneRef.current.scrollTop;
      rightPaneRef.current.scrollLeft = leftPaneRef.current.scrollLeft;
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    }
  };

  const handleRightScroll = () => {
    if (isSyncingScroll.current) return;
    if (leftPaneRef.current && rightPaneRef.current) {
      isSyncingScroll.current = true;
      leftPaneRef.current.scrollTop = rightPaneRef.current.scrollTop;
      leftPaneRef.current.scrollLeft = rightPaneRef.current.scrollLeft;
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    }
  };

  // Keyboard close
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

  if (!isOpen || !activeDoc) return null;

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={headerTitleStyle}>
            <GitCompare size={18} color="var(--xivig-accent, #6c8cff)" />
            <span style={{ fontWeight: 600, fontSize: '15px' }}>
              File Comparison (Diff) — {activeDoc.name}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* View mode toggle */}
            <div style={modeToggleContainerStyle}>
              <button
                onClick={() => setDiffViewMode('side-by-side')}
                style={modeToggleBtnStyle(diffViewMode === 'side-by-side')}
                title="Side-by-Side View"
              >
                <Columns size={13} style={{ marginRight: '4px' }} />
                Side-by-Side
              </button>
              <button
                onClick={() => setDiffViewMode('unified')}
                style={modeToggleBtnStyle(diffViewMode === 'unified')}
                title="Unified View"
              >
                <AlignJustify size={13} style={{ marginRight: '4px' }} />
                Unified
              </button>
            </div>

            {/* Close button */}
            <button onClick={onClose} style={closeBtnStyle} title="Close (Esc)">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Control toolbar */}
        <div style={toolbarStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--xivig-text-muted)' }}>Compare with:</span>
            <select
              value={baseSource}
              onChange={(e) => setBaseSource(e.target.value)}
              style={selectStyle}
            >
              {activeDoc.path && (
                <option value="disk">Saved File on Disk ({activeDoc.name})</option>
              )}
              <option value="clipboard">Clipboard Content</option>
              {documents
                .filter((d) => d.id !== activeDoc.id)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    Tab: {d.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
            <span style={{ color: '#50fa7b', fontWeight: 600 }}>+{diff.additions} additions</span>
            <span style={{ color: '#ff5555', fontWeight: 600 }}>-{diff.deletions} deletions</span>
          </div>
        </div>

        {/* Diff content view */}
        <div style={diffContainerStyle}>
          {diffViewMode === 'side-by-side' ? (
            <div style={sideBySideWrapperStyle}>
              {/* Left Pane (Base) */}
              <div
                ref={leftPaneRef}
                onScroll={handleLeftScroll}
                style={diffPaneStyle}
              >
                <div style={paneHeaderStyle}>
                  Base: {baseSource === 'disk' ? 'Disk Version' : baseSource === 'clipboard' ? 'Clipboard' : 'Original Tab'}
                </div>
                {diff.sideBySideLines.map((line, idx) => {
                  const isDel = line.type === 'delete' || line.type === 'modify';
                  return (
                    <div
                      key={idx}
                      style={{
                        ...lineRowStyle,
                        backgroundColor: isDel ? 'rgba(255, 85, 85, 0.15)' : 'transparent',
                      }}
                    >
                      <div style={lineNumStyle}>{line.oldLineNumber ?? ''}</div>
                      <div style={lineCodeStyle}>{line.oldText ?? ''}</div>
                    </div>
                  );
                })}
              </div>

              {/* Right Pane (Modified / Current) */}
              <div
                ref={rightPaneRef}
                onScroll={handleRightScroll}
                style={diffPaneStyle}
              >
                <div style={paneHeaderStyle}>Current: {activeDoc.name} (Working Buffer)</div>
                {diff.sideBySideLines.map((line, idx) => {
                  const isAdd = line.type === 'add' || line.type === 'modify';
                  return (
                    <div
                      key={idx}
                      style={{
                        ...lineRowStyle,
                        backgroundColor: isAdd ? 'rgba(80, 250, 123, 0.15)' : 'transparent',
                      }}
                    >
                      <div style={lineNumStyle}>{line.newLineNumber ?? ''}</div>
                      <div style={lineCodeStyle}>{line.newText ?? ''}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Unified Diff View */
            <div style={unifiedWrapperStyle}>
              {diff.unifiedLines.map((line, idx) => {
                const bg =
                  line.type === 'add'
                    ? 'rgba(80, 250, 123, 0.15)'
                    : line.type === 'delete'
                    ? 'rgba(255, 85, 85, 0.15)'
                    : 'transparent';

                const sign = line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' ';
                const signColor = line.type === 'add' ? '#50fa7b' : line.type === 'delete' ? '#ff5555' : 'transparent';

                return (
                  <div key={idx} style={{ ...lineRowStyle, backgroundColor: bg }}>
                    <div style={{ ...lineNumStyle, width: '40px' }}>{line.oldLineNumber ?? ''}</div>
                    <div style={{ ...lineNumStyle, width: '40px' }}>{line.newLineNumber ?? ''}</div>
                    <div style={{ width: '18px', textAlign: 'center', color: signColor, fontWeight: 700 }}>
                      {sign}
                    </div>
                    <div style={lineCodeStyle}>{line.text}</div>
                  </div>
                );
              })}
            </div>
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
  backgroundColor: 'rgba(0, 0, 0, 0.65)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(3px)',
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-bg-panel, #21222c)',
  border: '1px solid var(--xivig-border-subtle, #343746)',
  borderRadius: '8px',
  width: '92vw',
  maxWidth: '1280px',
  height: '84vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '12px 18px',
  borderBottom: '1px solid var(--xivig-border-subtle, #343746)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: 'var(--xivig-bg-activity, #1e1f29)',
};

const headerTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  color: 'var(--xivig-text, #f8f8f2)',
};

const toolbarStyle: React.CSSProperties = {
  padding: '8px 18px',
  borderBottom: '1px solid var(--xivig-border-subtle, #343746)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: 'rgba(0, 0, 0, 0.15)',
};

const selectStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-bg-input, #282a36)',
  color: 'var(--xivig-text, #f8f8f2)',
  border: '1px solid var(--xivig-border-subtle, #44475a)',
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '12px',
  outline: 'none',
  cursor: 'pointer',
};

const modeToggleContainerStyle: React.CSSProperties = {
  display: 'flex',
  backgroundColor: 'var(--xivig-bg-input, #282a36)',
  borderRadius: '5px',
  padding: '2px',
  border: '1px solid var(--xivig-border-subtle, #44475a)',
};

const modeToggleBtnStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  padding: '3px 8px',
  fontSize: '11px',
  borderRadius: '3px',
  border: 'none',
  cursor: 'pointer',
  backgroundColor: active ? 'var(--xivig-accent, #6c8cff)' : 'transparent',
  color: active ? '#ffffff' : 'var(--xivig-text-muted, #999)',
  fontWeight: active ? 600 : 400,
});

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--xivig-text-muted, #999)',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
};

const diffContainerStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
};

const sideBySideWrapperStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  height: '100%',
};

const diffPaneStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  fontFamily: 'var(--xivig-font-mono, monospace)',
  fontSize: '12px',
  lineHeight: '20px',
  backgroundColor: '#191a21',
  borderRight: '1px solid var(--xivig-border-subtle, #343746)',
};

const paneHeaderStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--xivig-text-muted, #999)',
  backgroundColor: '#21222c',
  borderBottom: '1px solid #343746',
  position: 'sticky',
  top: 0,
  zIndex: 1,
};

const unifiedWrapperStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  fontFamily: 'var(--xivig-font-mono, monospace)',
  fontSize: '12px',
  lineHeight: '20px',
  backgroundColor: '#191a21',
};

const lineRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  minHeight: '20px',
  whiteSpace: 'pre',
};

const lineNumStyle: React.CSSProperties = {
  width: '45px',
  paddingRight: '8px',
  textAlign: 'right',
  color: '#6272a4',
  userSelect: 'none',
  fontSize: '11px',
  flexShrink: 0,
};

const lineCodeStyle: React.CSSProperties = {
  flex: 1,
  color: '#f8f8f2',
  paddingLeft: '4px',
};
