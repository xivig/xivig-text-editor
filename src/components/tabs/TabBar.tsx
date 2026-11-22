import React from 'react';
import { X, Plus, Circle } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';

export const TabBar: React.FC = () => {
  const documents = useEditorStore((state) => state.documents);
  const activeDocumentId = useEditorStore((state) => state.activeDocumentId);
  const setActiveDocument = useEditorStore((state) => state.setActiveDocument);
  const closeDocument = useEditorStore((state) => state.closeDocument);
  const createNewDocument = useEditorStore((state) => state.createNewDocument);

  if (documents.length === 0) {
    return (
      <div style={emptyTabBarStyle}>
        <button
          onClick={() => createNewDocument()}
          style={addTabBtnStyle}
          title="New File (Ctrl+N)"
        >
          <Plus size={14} />
        </button>
      </div>
    );
  }

  return (
    <div style={tabBarContainerStyle}>
      <div style={tabsScrollContainerStyle}>
        {documents.map((doc) => {
          const isActive = doc.id === activeDocumentId;

          return (
            <div
              key={doc.id}
              onClick={() => setActiveDocument(doc.id)}
              onAuxClick={(e) => {
                // Middle click closes tab
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
              <span style={tabNameStyle}>{doc.name}</span>

              {/* Dirty indicator or close button */}
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
      </div>

      <button
        onClick={() => createNewDocument()}
        style={addTabBtnStyle}
        title="New File (Ctrl+N)"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};

const tabBarContainerStyle: React.CSSProperties = {
  height: 'var(--xivig-tabbar-height)',
  backgroundColor: 'var(--xivig-activity-bar)',
  display: 'flex',
  alignItems: 'center',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  userSelect: 'none',
  overflow: 'hidden',
};

const tabsScrollContainerStyle: React.CSSProperties = {
  display: 'flex',
  height: '100%',
  overflowX: 'auto',
  scrollbarWidth: 'none',
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
  transition: 'opacity 0.15s, background-color 0.15s',
};

const dirtyIndicatorBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2px',
};

const emptyTabBarStyle: React.CSSProperties = {
  height: 'var(--xivig-tabbar-height)',
  backgroundColor: 'var(--xivig-activity-bar)',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '8px',
};

const addTabBtnStyle: React.CSSProperties = {
  padding: '6px 10px',
  color: 'var(--xivig-text-dim)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
