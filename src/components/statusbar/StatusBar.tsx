import React, { useState, useRef, useEffect } from 'react';
import { GitBranch, AlertCircle, AlertTriangle, Radio, Check } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useDiagnosticsStore } from '../../stores/diagnosticsStore';
import { useLiveServerStore } from '../../stores/liveServerStore';
import { detectLanguageName } from '../editor/languageSupport';
import { getActiveEditorView } from '../editor/editorViewRegistry';

export const StatusBar: React.FC = () => {
  const activeDoc = useEditorStore((state) =>
    state.documents.find((d) => d.id === state.activeDocumentId)
  );
  const updateDocumentContent = useEditorStore((state) => state.updateDocumentContent);
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
  backgroundColor: 'var(--xivig-statusbar)',
  borderTop: '1px solid var(--xivig-border-subtle)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 10px',
  fontSize: 'var(--xivig-font-size-sm)',
  color: 'var(--xivig-text-muted)',
  userSelect: 'none',
  position: 'relative',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const interactiveItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '2px 4px',
  borderRadius: '3px',
  transition: 'background-color 0.15s ease',
};

const popoverStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 'calc(100% + 6px)',
  left: 0,
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '6px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
  padding: '4px',
  zIndex: 1000,
  minWidth: '140px',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const popoverHeaderStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--xivig-text-dim)',
  padding: '4px 8px 2px',
};

const popoverItemStyle = (isSelected: boolean): React.CSSProperties => ({
  padding: '6px 8px',
  fontSize: '11px',
  color: isSelected ? 'var(--xivig-accent)' : 'var(--xivig-text)',
  backgroundColor: isSelected ? 'rgba(78, 201, 176, 0.12)' : 'transparent',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});
