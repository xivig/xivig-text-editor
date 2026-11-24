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
    { id: 'explorer', icon: <Files size={19} />, label: 'Explorer (Ctrl+Shift+E)' },
    { id: 'search', icon: <Search size={19} />, label: 'Search (Ctrl+Shift+F)' },
    { id: 'git', icon: <GitBranch size={19} />, label: 'Source Control (Ctrl+Shift+G)' },
    { id: 'debug', icon: <Bug size={19} />, label: 'Run & Debug (Ctrl+Shift+D)' },
    { id: 'extensions', icon: <Package size={19} />, label: 'Extensions (Ctrl+Shift+X)' },
    { id: 'web', icon: <Globe size={19} />, label: 'Web Development Toolkit' },
    { id: 'ai', icon: <Sparkles size={19} />, label: 'AI Assistant' },
  ];

  return (
    <aside style={activityBarStyle}>
      <div style={itemsGroupStyle}>
        {topItems.map((item) => {
          const isActive = isSidebarOpen && activeView === item.id;
          return (
            <div key={item.id} style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
              {isActive && <div style={activeIndicatorPillStyle} />}
              <button
                onClick={() => setActiveSidebarView(item.id)}
                title={item.label}
                style={{
                  ...iconBtnStyle,
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--xivig-text-dim)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#e2e8f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--xivig-text-dim)';
                  }
                }}
              >
                {item.icon}
              </button>
            </div>
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
              backgroundColor: 'rgba(53, 183, 121, 0.12)',
            }}
          >
            <RotateCw size={17} className="animate-spin-slow" />
          </button>
        )}
        <button
          onClick={() => {
            useEditorStore.getState().openSettings();
          }}
          title={downloadedInfo ? `Settings (Ctrl+,) • Update v${downloadedInfo.version} ready to install` : 'Settings (Ctrl+,)'}
          style={iconBtnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--xivig-text-dim)';
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={19} />
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
                  boxShadow: downloadedInfo ? '0 0 8px rgba(53, 183, 121, 0.7)' : '0 0 6px rgba(108, 140, 255, 0.6)',
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
  padding: '8px 0',
  userSelect: 'none',
};

const itemsGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
};

const activeIndicatorPillStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  top: '8px',
  bottom: '8px',
  width: '3px',
  borderRadius: '0 3px 3px 0',
  backgroundColor: 'var(--xivig-accent)',
  boxShadow: '0 0 10px rgba(108, 140, 255, 0.8)',
};

const iconBtnStyle: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--xivig-text-dim)',
  transition: 'all 0.15s ease',
  cursor: 'pointer',
  position: 'relative',
};
