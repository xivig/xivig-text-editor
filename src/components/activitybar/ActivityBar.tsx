import React from 'react';
import { Files, Search, GitBranch, Package, Settings } from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { ActiveSidebarView } from '../../types/editor';

export const ActivityBar: React.FC = () => {
  const activeView = useFileStore((state) => state.activeSidebarView);
  const isSidebarOpen = useFileStore((state) => state.isSidebarOpen);
  const setActiveSidebarView = useFileStore((state) => state.setActiveSidebarView);

  const topItems: Array<{ id: ActiveSidebarView; icon: React.ReactNode; label: string }> = [
    { id: 'explorer', icon: <Files size={20} />, label: 'Explorer (Ctrl+Shift+E)' },
    { id: 'search', icon: <Search size={20} />, label: 'Search (Ctrl+Shift+F)' },
    { id: 'git', icon: <GitBranch size={20} />, label: 'Source Control (Ctrl+Shift+G)' },
    { id: 'extensions', icon: <Package size={20} />, label: 'Extensions (Ctrl+Shift+X)' },
  ];

  return (
    <aside style={activityBarStyle}>
      <div style={itemsGroupStyle}>
        {topItems.map((item) => {
          const isActive = isSidebarOpen && activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSidebarView(item.id)}
              title={item.label}
              style={{
                ...iconBtnStyle,
                color: isActive ? 'var(--xivig-accent)' : 'var(--xivig-text-dim)',
                borderLeft: isActive ? '2px solid var(--xivig-accent)' : '2px solid transparent',
              }}
            >
              {item.icon}
            </button>
          );
        })}
      </div>

      <div style={itemsGroupStyle}>
        <button
          onClick={() => {
            useEditorStore.getState().openSettings();
          }}
          title="Settings (Ctrl+,)"
          style={iconBtnStyle}
        >
          <Settings size={20} />
        </button>
      </div>
    </aside>
  );
};

const activityBarStyle: React.CSSProperties = {
  width: 'var(--xivig-activitybar-width)',
  backgroundColor: 'var(--xivig-activity-bar)',
  borderRight: '1px solid var(--xivig-border-subtle)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '6px 0',
  userSelect: 'none',
};

const itemsGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
};

const iconBtnStyle: React.CSSProperties = {
  width: '100%',
  height: '42px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.15s ease',
};
