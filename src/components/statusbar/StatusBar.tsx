import React from 'react';
import { GitBranch, AlertCircle, AlertTriangle, Radio } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useDiagnosticsStore } from '../../stores/diagnosticsStore';
import { useLiveServerStore } from '../../stores/liveServerStore';
import { detectLanguageName } from '../editor/languageSupport';

export const StatusBar: React.FC = () => {
  const activeDoc = useEditorStore((state) => state.getActiveDocument());
  const openLanguageSelector = useUIStore((state) => state.openLanguageSelector);
  const toggleBottomPanel = useUIStore((state) => state.toggleBottomPanel);
  const gitBranch = useFileStore((state) => state.gitBranch);
  const isGitRepo = useFileStore((state) => state.isGitRepo);

  const totalErrors = useDiagnosticsStore((state) => state.getTotalErrors());
  const totalWarnings = useDiagnosticsStore((state) => state.getTotalWarnings());

  const languageName = activeDoc ? detectLanguageName(activeDoc.name || activeDoc.language) : 'Plain Text';
  const line = activeDoc?.cursor.line || 1;
  const col = activeDoc?.cursor.col || 1;
  const fontSize = useSettingsStore((state) => state.settings.fontSize);
  const resetZoom = useSettingsStore((state) => state.resetZoom);

  const { isRunning: isLiveRunning, port: livePort, toggleServer: toggleLiveServer, openInBrowser: openLiveBrowser } = useLiveServerStore();

  return (
    <footer style={statusBarStyle}>
      {/* Left items */}
      <div style={sectionStyle}>
        <div style={itemStyle} title={isGitRepo ? `Git branch: ${gitBranch}` : 'Not a Git repository'}>
          <GitBranch size={12} style={{ marginRight: '4px' }} />
          <span>{isGitRepo ? gitBranch : 'no git'}</span>
        </div>
        <div
          onClick={() => toggleBottomPanel('problems')}
          style={{
            ...itemStyle,
            color: totalErrors > 0 ? '#ef6464' : totalWarnings > 0 ? '#e6ad45' : 'inherit',
          }}
          title={`Problems: ${totalErrors} errors, ${totalWarnings} warnings (Click to view)`}
        >
          <AlertCircle size={12} style={{ marginRight: '4px' }} />
          <span style={{ fontWeight: totalErrors > 0 || totalWarnings > 0 ? 600 : 'normal' }}>
            {totalErrors}
          </span>
          {totalWarnings > 0 && (
            <span style={{ marginLeft: '6px', display: 'flex', alignItems: 'center' }}>
              <AlertTriangle size={11} style={{ marginRight: '3px' }} />
              {totalWarnings}
            </span>
          )}
        </div>
      </div>

      {/* Right items */}
      <div style={sectionStyle}>
        <div
          onClick={(e) => {
            if (e.altKey && isLiveRunning) {
              openLiveBrowser();
            } else {
              toggleLiveServer();
            }
          }}
          style={{
            ...itemStyle,
            color: isLiveRunning ? '#4ec9b0' : 'inherit',
            fontWeight: isLiveRunning ? 600 : 'normal',
          }}
          title={
            isLiveRunning
              ? `Live Server: Running on port ${livePort} (Click to Stop, Alt+Click to Open Browser)`
              : 'Live Server: Click to Go Live'
          }
        >
          <Radio size={12} style={{ marginRight: '4px' }} className={isLiveRunning ? 'animate-pulse' : ''} />
          <span>{isLiveRunning ? `Port: ${livePort}` : 'Go Live'}</span>
        </div>
        <div style={itemStyle}>
          <span>Ln {line}, Col {col}</span>
        </div>
        <div style={itemStyle}>
          <span>Spaces: 2</span>
        </div>
        <div
          onClick={() => resetZoom()}
          style={itemStyle}
          title={`Editor font size: ${fontSize}px. Click to reset zoom (Ctrl+0)`}
        >
          <span>{fontSize}px</span>
        </div>
        <div style={itemStyle}>
          <span>UTF-8</span>
        </div>
        <div style={itemStyle}>
          <span>LF</span>
        </div>
        <div
          onClick={openLanguageSelector}
          style={{ ...itemStyle, color: 'var(--xivig-accent)', fontWeight: 500 }}
          title="Select Language Mode (Click to change)"
        >
          <span>{languageName}</span>
        </div>
      </div>
    </footer>
  );
};

const statusBarStyle: React.CSSProperties = {
  height: 'var(--xivig-statusbar-height)',
  backgroundColor: 'var(--xivig-statusbar)',
  borderTop: '1px solid var(--xivig-border-subtle)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 10px',
  fontSize: 'var(--xivig-font-size-sm)',
  color: 'var(--xivig-text-muted)',
  userSelect: 'none',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
};
