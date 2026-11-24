import React from 'react';
import { X, Plus, Circle, Columns, Rows, Square, Eye, BookOpen, Play, Pin } from 'lucide-react';
import { useEditorStore, SplitLayout } from '../../stores/editorStore';
import { useBuildStore } from '../../stores/buildStore';
import { FileIcon } from '../common/FileIcon';
import { FileContextMenu, ContextMenuTarget } from '../common/FileContextMenu';
import { DirtyCloseModal } from '../modals/DirtyCloseModal';
import { useUIStore } from '../../stores/uiStore';

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
  const reorderTabs = useEditorStore((state) => state.reorderTabs);
  const togglePinTab = useEditorStore((state) => state.togglePinTab);
  const markDocumentSaved = useEditorStore((state) => state.markDocumentSaved);
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
  const dirtyCloseDocId = useUIStore((state) => state.dirtyCloseDocId);
  const openDirtyCloseModal = useUIStore((state) => state.openDirtyCloseModal);
  const closeDirtyCloseModal = useUIStore((state) => state.closeDirtyCloseModal);
  const [draggedTabId, setDraggedTabId] = React.useState<string | null>(null);
  const [dropTargetTabId, setDropTargetTabId] = React.useState<string | null>(null);

  const handleRequestClose = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc && doc.isDirty) {
      openDirtyCloseModal(docId);
    } else {
      closeDocument(docId);
    }
  };

  const handleSaveAndClose = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      if (doc.path && window.xivig?.saveFile) {
        const res = await window.xivig.saveFile(doc.path, doc.content);
        if (res.success) {
          markDocumentSaved(doc.id, doc.path);
        }
      } else if (window.xivig?.saveFileDialog) {
        const res = await window.xivig.saveFileDialog({
          defaultName: doc.name,
          content: doc.content,
        });
        if (!res.canceled && res.filePath) {
          markDocumentSaved(doc.id, res.filePath);
        }
      }
    }
    closeDocument(docId);
    closeDirtyCloseModal();
  };

  const handleDiscardAndClose = (docId: string) => {
    closeDocument(docId);
    closeDirtyCloseModal();
  };

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
      <div
        style={tabsScrollContainerStyle}
        onContextMenu={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            const active = activeDoc;
            setContextMenu({
              x: e.clientX,
              y: e.clientY,
              target: {
                name: active ? active.name : '',
                path: active ? (active.path || active.name) : '',
                docId: active ? active.id : undefined,
              },
            });
          }
        }}
      >
        {documents.map((doc) => {
          const isActive = doc.id === activeDocumentId;

          return (
            <div
              key={doc.id}
              draggable
              onDragStart={(e) => {
                setDraggedTabId(doc.id);
                e.dataTransfer.setData('text/plain', doc.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => {
                setDraggedTabId(null);
                setDropTargetTabId(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dropTargetTabId !== doc.id) {
                  setDropTargetTabId(doc.id);
                }
              }}
              onDragLeave={() => {
                if (dropTargetTabId === doc.id) {
                  setDropTargetTabId(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const sourceId = e.dataTransfer.getData('text/plain') || draggedTabId;
                if (sourceId && sourceId !== doc.id) {
                  reorderTabs(sourceId, doc.id);
                }
                setDraggedTabId(null);
                setDropTargetTabId(null);
              }}
              onClick={() => setActiveDocument(doc.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  target: { name: doc.name, path: doc.path || doc.name, docId: doc.id },
                });
              }}
              onAuxClick={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  handleRequestClose(doc.id);
                }
              }}
              style={{
                ...tabItemStyle,
                backgroundColor: isActive ? 'var(--xivig-tab-active)' : 'var(--xivig-tab-inactive)',
                borderTop: isActive ? '2px solid var(--xivig-accent)' : '2px solid transparent',
                borderLeft: dropTargetTabId === doc.id ? '2px solid var(--xivig-accent)' : undefined,
                color: isActive ? 'var(--xivig-text)' : 'var(--xivig-text-muted)',
                opacity: draggedTabId === doc.id ? 0.6 : 1,
                cursor: 'pointer',
              }}
            >
              {doc.isPinned && (
                <Pin
                  size={11}
                  style={{
                    marginRight: '4px',
                    color: 'var(--xivig-accent)',
                    transform: 'rotate(45deg)',
                    flexShrink: 0,
                  }}
                  title="Pinned tab (Click unpin in context menu)"
                />
              )}
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
                      handleRequestClose(doc.id);
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
                      handleRequestClose(doc.id);
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
          source="tab"
          onClose={() => setContextMenu(null)}
        />
      )}

      {dirtyCloseDocId && (
        <DirtyCloseModal
          docId={dirtyCloseDocId}
          onClose={() => closeDirtyCloseModal()}
          onSaveAndClose={handleSaveAndClose}
          onDiscardAndClose={handleDiscardAndClose}
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
