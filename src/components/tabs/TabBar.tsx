import React from 'react';
import { X, Plus, Circle, Columns, Rows, Square, Eye, BookOpen, Play } from 'lucide-react';
import { useEditorStore, SplitLayout } from '../../stores/editorStore';
import { useBuildStore } from '../../stores/buildStore';
import { FileIcon } from '../common/FileIcon';
import { FileContextMenu, ContextMenuTarget } from '../common/FileContextMenu';

interface TabBarProps {
  pane?: 'primary' | 'secondary';
}

export const TabBar: React.FC<TabBarProps> = ({ pane = 'primary' }) => {
  const documents = useEditorStore((state) => state.documents);
  const activeDocumentId = useEditorStore((state) =>
    pane === 'secondary' ? state.secondaryDocumentId : state.activeDocumentId
  );
  const setActiveDocument = useEditorStore((state) =>
    pane === 'secondary' ? state.setSecondaryDocument : state.setActiveDocument
  );
  const closeDocument = useEditorStore((state) => state.closeDocument);
  const createNewDocument = useEditorStore((state) => state.createNewDocument);
  const splitLayout = useEditorStore((state) => state.splitLayout);
  const setSplitLayout = useEditorStore((state) => state.setSplitLayout);
  const setActivePane = useEditorStore((state) => state.setActivePane);
  const isPreviewOpen = useEditorStore((state) => state.isPreviewOpen);
  const previewMode = useEditorStore((state) => state.previewMode);
  const togglePreview = useEditorStore((state) => state.togglePreview);

  const activeDoc = useEditorStore((state) =>
    state.documents.find((d) => d.id === (pane === 'secondary' ? state.secondaryDocumentId : state.activeDocumentId))
  );
  const isMarkdown = activeDoc?.language === 'markdown' || activeDoc?.name.endsWith('.md');

  const isRunning = useBuildStore((state) => state.isRunning);
  const executeBuild = useBuildStore((state) => state.executeBuild);
  const stopBuild = useBuildStore((state) => state.stopBuild);
  const activeTarget = useBuildStore((state) => state.activeTarget);
  const detectDefaultTarget = useBuildStore((state) => state.detectDefaultTarget);

  const currentTarget = activeTarget && activeDoc && activeTarget.name.includes(activeDoc.name)
    ? activeTarget
    : detectDefaultTarget();

  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; target: ContextMenuTarget } | null>(null);

  const handleToggleSplit = (layout: SplitLayout) => {
    if (splitLayout === layout) {
      setSplitLayout('single');
    } else {
      setSplitLayout(layout);
    }
  };

  return (
    <div
      onClick={() => setActivePane(pane)}
      style={tabBarContainerStyle}
    >
      <div style={tabsScrollContainerStyle}>
        {documents.map((doc) => {
          const isActive = doc.id === activeDocumentId;

          return (
            <div
              key={doc.id}
              onClick={() => setActiveDocument(doc.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (doc.path) {
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    target: { name: doc.name, path: doc.path },
                  });
                }
              }}
              onAuxClick={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  closeDocument(doc.id);
                }
              }}
              style={{
                ...tabItemStyle,
                backgroundColor: isActive ? 'var(--xivig-tab-active)' : 'var(--xivig-tab-inactive)',
                borderTop: isActive ? '2px solid var(--xivig-accent)' : '2px solid transparent',
                color: isActive ? 'var(--xivig-text)' : 'var(--xivig-text-muted)',
              }}
            >
              <FileIcon
                filename={doc.name}
                isSettings={doc.id === 'settings'}
                size={14}
                style={{ marginRight: '6px', flexShrink: 0 }}
              />
              <span style={tabNameStyle}>{doc.name}</span>

              <div style={tabIndicatorContainerStyle}>
                {doc.isDirty ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeDocument(doc.id);
                    }}
                    style={dirtyIndicatorBtnStyle}
                    title="Unsaved changes. Click to close."
                  >
                    <Circle size={8} fill="var(--xivig-accent)" color="var(--xivig-accent)" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeDocument(doc.id);
                    }}
                    style={closeTabBtnStyle}
                    title="Close (Ctrl+W)"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <button
          onClick={() => createNewDocument()}
          style={addTabBtnStyle}
          title="New File (Ctrl+N)"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Pane Split, Preview & Run Controls (Rendered on primary tab bar) */}
      {pane === 'primary' && (
        <div style={layoutControlsStyle}>
          {/* Direct File Runner Button */}
          {isRunning ? (
            <button
              onClick={() => stopBuild()}
              style={{
                ...splitBtnStyle,
                color: '#ef6464',
                backgroundColor: 'rgba(239, 100, 100, 0.15)',
              }}
              title="Stop Running Task"
            >
              <Square size={12} fill="#ef6464" />
            </button>
          ) : (
            <button
              onClick={() => executeBuild()}
              style={{
                ...splitBtnStyle,
                color: '#35b779',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(53, 183, 121, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={`Run ${activeDoc?.name || 'File'} (${currentTarget.name}) (Ctrl+B)`}
            >
              <Play size={13} fill="#35b779" />
            </button>
          )}

          {isMarkdown ? (
            <button
              onClick={() => togglePreview('markdown')}
              style={{
                ...splitBtnStyle,
                color: isPreviewOpen && previewMode === 'markdown' ? 'var(--xivig-accent)' : 'var(--xivig-text-dim)',
                backgroundColor: isPreviewOpen && previewMode === 'markdown' ? 'var(--xivig-accent-subtle)' : 'transparent',
              }}
              title="Toggle Markdown Live Preview (Ctrl+Shift+V)"
            >
              <BookOpen size={13} />
            </button>
          ) : (
            <button
              onClick={() => togglePreview('live-web')}
              style={{
                ...splitBtnStyle,
                color: isPreviewOpen && previewMode === 'live-web' ? 'var(--xivig-accent)' : 'var(--xivig-text-dim)',
                backgroundColor: isPreviewOpen && previewMode === 'live-web' ? 'var(--xivig-accent-subtle)' : 'transparent',
              }}
              title="Toggle Live Web Preview (Ctrl+K V)"
            >
              <Eye size={13} />
            </button>
          )}

          <button
            onClick={() => handleToggleSplit('two-columns')}
            style={{
              ...splitBtnStyle,
              color: splitLayout === 'two-columns' ? 'var(--xivig-accent)' : 'var(--xivig-text-dim)',
              backgroundColor: splitLayout === 'two-columns' ? 'var(--xivig-accent-subtle)' : 'transparent',
            }}
            title="Split Editor Into Columns (Alt+Shift+2)"
          >
            <Columns size={13} />
          </button>
          <button
            onClick={() => handleToggleSplit('two-rows')}
            style={{
              ...splitBtnStyle,
              color: splitLayout === 'two-rows' ? 'var(--xivig-accent)' : 'var(--xivig-text-dim)',
              backgroundColor: splitLayout === 'two-rows' ? 'var(--xivig-accent-subtle)' : 'transparent',
            }}
            title="Split Editor Into Rows (Alt+Shift+3)"
          >
            <Rows size={13} />
          </button>
          {splitLayout !== 'single' && (
            <button
              onClick={() => setSplitLayout('single')}
              style={splitBtnStyle}
              title="Close Split View (Alt+Shift+1)"
            >
              <Square size={12} />
            </button>
          )}
        </div>
      )}

      {contextMenu && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          target={contextMenu.target}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

const tabBarContainerStyle: React.CSSProperties = {
  height: 'var(--xivig-tabbar-height)',
  backgroundColor: 'var(--xivig-activity-bar)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  userSelect: 'none',
  overflow: 'hidden',
  paddingRight: '6px',
};

const tabsScrollContainerStyle: React.CSSProperties = {
  display: 'flex',
  height: '100%',
  overflowX: 'auto',
  scrollbarWidth: 'none',
  flex: 1,
};

const tabItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '0 12px',
  height: '100%',
  borderRight: '1px solid var(--xivig-border-subtle)',
  fontSize: '12.5px',
  cursor: 'pointer',
  minWidth: '110px',
  maxWidth: '220px',
  transition: 'background-color 0.1s ease',
};

const tabNameStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
};

const tabIndicatorContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '18px',
  height: '18px',
};

const closeTabBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '3px',
  padding: '2px',
  color: 'inherit',
  opacity: 0.6,
};

const dirtyIndicatorBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2px',
};

const addTabBtnStyle: React.CSSProperties = {
  padding: '6px 10px',
  color: 'var(--xivig-text-dim)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const layoutControlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
};

const splitBtnStyle: React.CSSProperties = {
  padding: '4px 6px',
  borderRadius: '3px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.1s, background-color 0.1s',
};
