import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import logoUrl from '../../assets/logo.png';

export const Titlebar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const activeDoc = useEditorStore((state) => state.getActiveDocument());
  const currentFolderName = useFileStore((state) => state.currentFolderName);

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
    currentFolderName ? `[${currentFolderName}]` : null,
    'Xivig Editor',
  ]
    .filter(Boolean)
    .join(' — ');

  return (
    <header style={titlebarStyle}>
      {/* Brand & Logo */}
      <div style={leftSectionStyle}>
        <img
          src={logoUrl}
          alt="Xivig Logo"
          style={{ width: '18px', height: '18px', objectFit: 'contain', display: 'block' }}
        />
        <span style={brandTextStyle}>Xivig</span>
      </div>

      {/* Centered Document / App Title */}
      <div style={centerSectionStyle}>
        <span style={titleTextStyle}>{titleText}</span>
      </div>

      {/* Window Controls */}
      <div style={windowControlsStyle}>
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
          style={{ ...windowBtnStyle, ...closeBtnHoverStyle }}
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
};

const logoBadgeStyle: React.CSSProperties = {
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const brandTextStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.5px',
  color: 'var(--xivig-accent)',
};

const centerSectionStyle: React.CSSProperties = {
  flex: 1,
  textAlign: 'center',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  padding: '0 20px',
};

const titleTextStyle: React.CSSProperties = {
  fontSize: '11.5px',
  color: 'var(--xivig-text-muted)',
};

const windowControlsStyle: CustomCSSProperties = {
  display: 'flex',
  height: '100%',
  WebkitAppRegion: 'no-drag',
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

const closeBtnHoverStyle: React.CSSProperties = {};
