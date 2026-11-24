import React from 'react';
import { Files, Search, GitBranch, Package, Settings, RotateCw, Bug, Globe, Sparkles } from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useUpdateStore } from '../../stores/updateStore';
import { ActiveSidebarView } from '../../types/editor';

export const ActivityBar: React.FC = () => {
  const activeView = useFileStore((state) => state.activeSidebarView);
  const isSidebarOpen = useFileStore((state) => state.isSidebarOpen);
  const setActiveSidebarView = useFileStore((state) => state.setActiveSidebarView);
  const downloadedInfo = useUpdateStore((state) => state.downloadedInfo);
  const isDownloading = useUpdateStore((state) => state.isDownloading);
  const applyAndRestart = useUpdateStore((state) => state.applyAndRestart);

  const topItems: Array<{ id: ActiveSidebarView; icon: React.ReactNode; label: string }> = [
    { id: 'explorer', icon: <Files size={20} />, label: 'Explorer (Ctrl+Shift+E)' },
    { id: 'search', icon: <Search size={20} />, label: 'Search (Ctrl+Shift+F)' },
    { id: 'git', icon: <GitBranch size={20} />, label: 'Source Control (Ctrl+Shift+G)' },
    { id: 'debug', icon: <Bug size={20} />, label: 'Run & Debug (Ctrl+Shift+D)' },
    { id: 'extensions', icon: <Package size={20} />, label: 'Extensions (Ctrl+Shift+X)' },
    { id: 'web', icon: <Globe size={20} />, label: 'Web Development Toolkit' },
    { id: 'ai', icon: <Sparkles size={20} />, label: 'AI Assistant' },
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
        {downloadedInfo && (
          <button
            onClick={() => applyAndRestart()}
            title={`Update Ready: Click to Restart Xivig and apply v${downloadedInfo.version}`}
            style={{
              ...iconBtnStyle,
              color: '#35b779',
            }}
          >
            <RotateCw size={18} className="animate-spin-slow" />
          </button>
        )}
        <button
          onClick={() => {
            useEditorStore.getState().openSettings();
          }}
          title={downloadedInfo ? `Settings (Ctrl+,) • Update v${downloadedInfo.version} ready to install` : 'Settings (Ctrl+,)'}
          style={{
            ...iconBtnStyle,
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={20} />
            {(downloadedInfo || isDownloading) && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: downloadedInfo ? '#35b779' : 'var(--xivig-accent)',
                  border: '1.5px solid var(--xivig-activity-bar)',
                  boxShadow: downloadedInfo ? '0 0 6px rgba(53, 183, 121, 0.6)' : 'none',
                }}
              />
            )}
          </div>
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
