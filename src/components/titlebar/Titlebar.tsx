import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Search, Terminal, Maximize, Minimize } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';
import logoUrl from '../../assets/logo.png';

export const Titlebar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const activeDoc = useEditorStore((state) =>
    state.documents.find((d) => d.id === state.activeDocumentId)
  );
  const currentFolderName = useFileStore((state) => state.currentFolderName);
  const openCommandPalette = useUIStore((state) => state.openCommandPalette);
  const toggleBottomPanel = useUIStore((state) => state.toggleBottomPanel);
  const isDistractionFree = useUIStore((state) => state.isDistractionFree);
  const toggleDistractionFree = useUIStore((state) => state.toggleDistractionFree);

  useEffect(() => {
    if (window.xivig?.isMaximized) {
      window.xivig.isMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => window.xivig?.minimizeWindow?.();
  const handleMaximize = () => {
    window.xivig?.maximizeWindow?.();
    setIsMaximized(!isMaximized);
  };
  const handleClose = () => window.xivig?.closeWindow?.();

  const titleText = [
    activeDoc ? `${activeDoc.name}${activeDoc.isDirty ? ' •' : ''}` : null,
    currentFolderName ? `${currentFolderName}` : null,
  ]
    .filter(Boolean)
    .join('  —  ') || 'Xivig Editor';

  return (
    <header style={titlebarStyle}>
      {/* Brand & Logo */}
      <div style={leftSectionStyle}>
        <div style={logoWrapperStyle}>
          <img
            src={logoUrl}
            alt="Xivig Logo"
            style={{ width: '18px', height: '18px', objectFit: 'contain', display: 'block' }}
          />
        </div>
        <span style={brandTextStyle}>Xivig</span>
        <span style={versionPillStyle}>v2.0.4</span>
      </div>

      {/* Modern Centered Command Center Pill */}
      <div style={centerSectionStyle}>
        <div
          onClick={() => openCommandPalette()}
          style={commandCenterPillStyle}
          title="Search commands, files, and symbols (Ctrl+P / Ctrl+Shift+P)"
        >
          <Search size={12} color="#818cf8" style={{ marginRight: '7px', flexShrink: 0 }} />
          <span style={commandCenterTextStyle}>{titleText}</span>
          <kbd style={commandCenterKbdStyle}>Ctrl+P</kbd>
        </div>
      </div>

      {/* Quick Actions & Window Controls */}
      <div style={windowControlsStyle}>
        <button
          onClick={() => toggleBottomPanel()}
          style={quickActionBtnStyle}
          title="Toggle Terminal Panel (Ctrl+`)"
          aria-label="Toggle Terminal"
        >
          <Terminal size={13} />
        </button>
        <button
          onClick={() => toggleDistractionFree()}
          style={{
            ...quickActionBtnStyle,
            color: isDistractionFree ? 'var(--xivig-accent)' : 'var(--xivig-text-muted)',
          }}
          title={isDistractionFree ? 'Exit Distraction-Free Mode' : 'Enter Distraction-Free Mode'}
          aria-label="Toggle Fullscreen Editor"
        >
          {isDistractionFree ? <Minimize size={13} /> : <Maximize size={13} />}
        </button>

        <div style={separatorStyle} />

        <button
          onClick={handleMinimize}
          style={windowBtnStyle}
          title="Minimize"
          aria-label="Minimize"
        >
          <Minus size={13} />
        </button>
        <button
          onClick={handleMaximize}
          style={windowBtnStyle}
          title={isMaximized ? 'Restore' : 'Maximize'}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <Copy size={11} /> : <Square size={11} />}
        </button>
        <button
          onClick={handleClose}
          style={windowBtnStyle}
          title="Close"
          aria-label="Close"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e81123';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--xivig-text-muted)';
          }}
        >
          <X size={14} />
        </button>
      </div>
    </header>
  );
};

type CustomCSSProperties = React.CSSProperties & {
  WebkitAppRegion?: 'drag' | 'no-drag';
};

const titlebarStyle: CustomCSSProperties = {
  height: 'var(--xivig-titlebar-height)',
  backgroundColor: 'var(--xivig-activity-bar)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  WebkitAppRegion: 'drag',
  userSelect: 'none',
  paddingLeft: '12px',
};

const leftSectionStyle: CustomCSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  WebkitAppRegion: 'no-drag',
  minWidth: '150px',
};

const logoWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  filter: 'drop-shadow(0 2px 6px rgba(108, 140, 255, 0.35))',
};

const brandTextStyle: React.CSSProperties = {
  fontSize: '12.5px',
  fontWeight: 700,
  letterSpacing: '0.4px',
  color: '#ffffff',
};

const versionPillStyle: React.CSSProperties = {
  fontSize: '9.5px',
  fontWeight: 600,
  padding: '1px 5px',
  borderRadius: '4px',
  backgroundColor: 'rgba(108, 140, 255, 0.12)',
  border: '1px solid rgba(108, 140, 255, 0.25)',
  color: '#a5b4fc',
};

const centerSectionStyle: CustomCSSProperties = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  WebkitAppRegion: 'no-drag',
  maxWidth: '540px',
  margin: '0 auto',
};

const commandCenterPillStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  maxWidth: '420px',
  height: '24px',
  padding: '0 12px',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.07)',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
};

const commandCenterTextStyle: React.CSSProperties = {
  fontSize: '11.5px',
  color: 'var(--xivig-text-muted)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 500,
};

const commandCenterKbdStyle: React.CSSProperties = {
  marginLeft: 'auto',
  paddingLeft: '10px',
  fontSize: '9.5px',
  fontWeight: 600,
  color: 'var(--xivig-text-dim)',
  fontFamily: 'inherit',
};

const windowControlsStyle: CustomCSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '100%',
  WebkitAppRegion: 'no-drag',
};

const quickActionBtnStyle: React.CSSProperties = {
  width: '32px',
  height: '24px',
  margin: '0 2px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '4px',
  color: 'var(--xivig-text-muted)',
  transition: 'all 0.15s ease',
  cursor: 'pointer',
};

const separatorStyle: React.CSSProperties = {
  width: '1px',
  height: '14px',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  margin: '0 6px',
};

const windowBtnStyle: React.CSSProperties = {
  width: '46px',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--xivig-text-muted)',
  transition: 'background-color 0.15s ease',
};
