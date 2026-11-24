import React, { useState, useRef, useEffect } from 'react';
import { GitBranch, AlertCircle, AlertTriangle, Radio, Check, RotateCw, RefreshCw, Lock } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useDiagnosticsStore } from '../../stores/diagnosticsStore';
import { useLiveServerStore } from '../../stores/liveServerStore';
import { useUpdateStore } from '../../stores/updateStore';
import { useLspStore } from '../../lsp/lspStore';
import { Server } from 'lucide-react';
import { detectLanguageName } from '../editor/languageSupport';
import { getActiveEditorView } from '../editor/editorViewRegistry';

export const StatusBar: React.FC = () => {
  const activeDoc = useEditorStore((state) =>
    state.documents.find((d) => d.id === state.activeDocumentId)
  );
  const updateDocumentContent = useEditorStore((state) => state.updateDocumentContent);
  const toggleReadOnly = useEditorStore((state) => state.toggleReadOnly);
  const openLanguageSelector = useUIStore((state) => state.openLanguageSelector);
  const toggleBottomPanel = useUIStore((state) => state.toggleBottomPanel);
  const gitBranch = useFileStore((state) => state.gitBranch);
  const isGitRepo = useFileStore((state) => state.isGitRepo);

  const totalErrors = useDiagnosticsStore((state) => state.totalErrors);
  const totalWarnings = useDiagnosticsStore((state) => state.totalWarnings);

  const languageName = activeDoc ? detectLanguageName(activeDoc.language, activeDoc.name) : 'Plain Text';
  const line = activeDoc?.cursor.line || 1;
  const col = activeDoc?.cursor.col || 1;
  const fontSize = useSettingsStore((state) => state.settings.fontSize);
  const tabSize = useSettingsStore((state) => state.settings.tabSize);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const resetZoom = useSettingsStore((state) => state.resetZoom);

  const { isRunning: isLiveRunning, port: livePort, toggleServer: toggleLiveServer, openInBrowser: openLiveBrowser } = useLiveServerStore();

  const downloadedInfo = useUpdateStore((state) => state.downloadedInfo);
  const isDownloading = useUpdateStore((state) => state.isDownloading);
  const downloadProgress = useUpdateStore((state) => state.downloadProgress);
  const applyAndRestart = useUpdateStore((state) => state.applyAndRestart);
  const activeLspServer = useLspStore((state) => state.activeServer);

  const [indentMenuOpen, setIndentMenuOpen] = useState(false);
  const [encodingMenuOpen, setEncodingMenuOpen] = useState(false);
  const [selectedEncoding, setSelectedEncoding] = useState('UTF-8');

  const indentContainerRef = useRef<HTMLDivElement>(null);
  const encodingContainerRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (indentContainerRef.current && !indentContainerRef.current.contains(e.target as Node)) {
        setIndentMenuOpen(false);
      }
      if (encodingContainerRef.current && !encodingContainerRef.current.contains(e.target as Node)) {
        setEncodingMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Line ending detection & conversion
  const isCRLF = activeDoc?.content?.includes('\r\n') ?? false;
  const lineEnding = isCRLF ? 'CRLF' : 'LF';

  const toggleLineEnding = () => {
    if (!activeDoc) return;
    const newContent = isCRLF
      ? activeDoc.content.replace(/\r\n/g, '\n')
      : activeDoc.content.replace(/\r?\n/g, '\r\n');

    const view = getActiveEditorView();
    if (view) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: newContent },
      });
    } else {
      updateDocumentContent(activeDoc.id, newContent);
    }
  };

  return (
    <footer style={statusBarStyle} role="status" aria-label="Editor Status Bar">
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
        {downloadedInfo && (
          <div
            onClick={() => applyAndRestart()}
            style={{
              ...interactiveItemStyle,
              color: '#35b779',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={`Restart Xivig to apply update v${downloadedInfo.version} (Click to Restart)`}
          >
            <RotateCw size={11} className="animate-spin-slow" />
            <span>Restart to Update</span>
          </div>
        )}
        {isDownloading && (
          <div
            style={{
              ...itemStyle,
              color: 'var(--xivig-accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={`Downloading update: ${downloadProgress?.percent ? Math.round(downloadProgress.percent) : 0}%`}
          >
            <RefreshCw size={11} className="animate-spin" />
            <span>Updating {downloadProgress?.percent ? Math.round(downloadProgress.percent) : 0}%</span>
          </div>
        )}

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

        <div style={itemStyle} title="Current line and column">
          <span>Ln {line}, Col {col}</span>
        </div>

        {activeDoc?.isReadOnly && (
          <div
            onClick={() => toggleReadOnly(activeDoc.id)}
            style={{
              ...interactiveItemStyle,
              color: '#f59e0b',
              fontWeight: 500,
              gap: '4px',
            }}
            title="File is in Read-Only Mode. Click to unlock and allow editing."
          >
            <Lock size={12} />
            <span>Read-Only</span>
          </div>
        )}

        {/* Indentation selector */}
        <div ref={indentContainerRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setIndentMenuOpen((prev) => !prev)}
            style={interactiveItemStyle}
            title={`Indentation: Spaces: ${tabSize}. Click to configure indentation.`}
          >
            <span>Spaces: {tabSize}</span>
          </div>
          {indentMenuOpen && (
            <div style={popoverStyle}>
              <div style={popoverHeaderStyle}>Indentation Size</div>
              {[2, 4, 8].map((size) => (
                <div
                  key={size}
                  onClick={() => {
                    updateSettings({ tabSize: size });
                    setIndentMenuOpen(false);
                  }}
                  style={popoverItemStyle(tabSize === size)}
                >
                  <span>Spaces: {size}</span>
                  {tabSize === size && <Check size={12} />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          onClick={() => resetZoom()}
          style={interactiveItemStyle}
          title={`Editor font size: ${fontSize}px. Click to reset zoom (Ctrl+0)`}
        >
          <span>{fontSize}px</span>
        </div>

        {/* Encoding selector */}
        <div ref={encodingContainerRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setEncodingMenuOpen((prev) => !prev)}
            style={interactiveItemStyle}
            title={`File Encoding: ${selectedEncoding}. Click to change.`}
          >
            <span>{selectedEncoding}</span>
          </div>
          {encodingMenuOpen && (
            <div style={{ ...popoverStyle, right: 0 }}>
              <div style={popoverHeaderStyle}>File Encoding</div>
              {['UTF-8', 'UTF-8 with BOM', 'UTF-16 LE', 'Windows 1252'].map((enc) => (
                <div
                  key={enc}
                  onClick={() => {
                    setSelectedEncoding(enc);
                    setEncodingMenuOpen(false);
                  }}
                  style={popoverItemStyle(selectedEncoding === enc)}
                >
                  <span>{enc}</span>
                  {selectedEncoding === enc && <Check size={12} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Line ending toggle */}
        <div
          onClick={toggleLineEnding}
          style={interactiveItemStyle}
          title={`Line Ending: ${lineEnding}. Click to convert buffer to ${isCRLF ? 'LF' : 'CRLF'}.`}
        >
          <span>{lineEnding}</span>
        </div>

        {/* Language Server Protocol (LSP) Status Indicator */}
        <div
          onClick={() => useLspStore.getState().openModal()}
          style={{
            ...interactiveItemStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: activeLspServer?.status === 'running' ? '#35b779' : 'var(--xivig-text-muted)',
            fontWeight: 500,
          }}
          title={
            activeLspServer
              ? `LSP: ${activeLspServer.name} (${activeLspServer.status}). Click to configure language servers.`
              : 'LSP: No active language server. Click to open Language Servers Manager.'
          }
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor:
                activeLspServer?.status === 'running'
                  ? '#35b779'
                  : activeLspServer?.status === 'starting'
                  ? '#e6ad45'
                  : activeLspServer?.status === 'error'
                  ? '#ef6464'
                  : 'var(--xivig-text-dim)',
            }}
          />
          <span>{activeLspServer ? `LSP: ${activeLspServer.id}` : 'LSP: Ready'}</span>
        </div>

        {/* Language selector */}
        <div
          onClick={openLanguageSelector}
          style={{ ...interactiveItemStyle, color: 'var(--xivig-accent)', fontWeight: 500 }}
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
  backgroundColor: '#111318',
  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 12px',
  fontSize: 'var(--xivig-font-size-sm)',
  color: 'var(--xivig-text-muted)',
  userSelect: 'none',
  position: 'relative',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '2px 5px',
  borderRadius: '4px',
};

const interactiveItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '2px 6px',
  borderRadius: '4px',
  transition: 'all 0.12s ease',
};

const popoverStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 'calc(100% + 6px)',
  left: 0,
  backgroundColor: '#191b24',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(16px)',
  padding: '4px',
  zIndex: 1000,
  minWidth: '150px',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const popoverHeaderStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  color: 'var(--xivig-text-dim)',
  padding: '5px 8px 3px',
};

const popoverItemStyle = (isSelected: boolean): React.CSSProperties => ({
  padding: '6px 8px',
  fontSize: '11px',
  color: isSelected ? 'var(--xivig-accent)' : '#e2e8f0',
  backgroundColor: isSelected ? 'rgba(108, 140, 255, 0.15)' : 'transparent',
  borderRadius: '5px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  transition: 'all 0.1s ease',
});
