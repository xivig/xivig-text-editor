import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  Terminal as TerminalIcon,
  AlertTriangle,
  FileText,
  Trash2,
  RotateCcw,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';

export const BottomPanel: React.FC = () => {
  const isOpen = useUIStore((state) => state.isBottomPanelOpen);
  const activeTab = useUIStore((state) => state.activeBottomTab);
  const setBottomTab = useUIStore((state) => state.setBottomTab);
  const toggleBottomPanel = useUIStore((state) => state.toggleBottomPanel);
  const currentFolderPath = useFileStore((state) => state.currentFolderPath);

  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize xterm.js instance
  useEffect(() => {
    if (!isOpen || activeTab !== 'terminal' || !terminalContainerRef.current) return;

    if (!xtermRef.current) {
      const term = new XTerm({
        cursorBlink: true,
        cursorStyle: 'bar',
        fontSize: 13,
        fontFamily: 'var(--xivig-font-mono)',
        lineHeight: 1.3,
        theme: {
          background: '#13151a',
          foreground: '#e5e7eb',
          cursor: '#6c8cff',
          selectionBackground: 'rgba(108, 140, 255, 0.3)',
          black: '#191b22',
          red: '#ef6464',
          green: '#35b779',
          yellow: '#e6ad45',
          blue: '#61afef',
          magenta: '#c678dd',
          cyan: '#56b6c2',
          white: '#e5e7eb',
        },
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      term.open(terminalContainerRef.current);
      fitAddon.fit();

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      // Handle user keystrokes -> write to shell
      term.onData((data) => {
        window.xivig?.terminalWrite?.(data);
      });

      // Initialize shell backend
      window.xivig?.terminalInit?.(currentFolderPath || undefined);
    }

    // Subscribe to shell stdout/stderr
    const unsubscribe = window.xivig?.onTerminalData?.((data) => {
      xtermRef.current?.write(data);
    });

    const handleResize = () => {
      fitAddonRef.current?.fit();
    };

    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);

    return () => {
      unsubscribe?.();
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, activeTab, currentFolderPath]);

  // Clean up terminal on unmount
  useEffect(() => {
    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
        fitAddonRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const panelHeight = isExpanded ? '440px' : '230px';

  const handleClear = () => {
    xtermRef.current?.clear();
  };

  const handleRestart = () => {
    xtermRef.current?.clear();
    window.xivig?.terminalInit?.(currentFolderPath || undefined);
  };

  return (
    <div style={{ ...panelContainerStyle, height: panelHeight }}>
      {/* Header bar */}
      <div style={panelHeaderStyle}>
        {/* Tabs */}
        <div style={tabsGroupStyle}>
          <button
            onClick={() => setBottomTab('terminal')}
            style={{
              ...tabBtnStyle,
              borderBottom: activeTab === 'terminal' ? '2px solid var(--xivig-accent)' : '2px solid transparent',
              color: activeTab === 'terminal' ? 'var(--xivig-text)' : 'var(--xivig-text-dim)',
            }}
          >
            <TerminalIcon size={13} style={{ marginRight: '6px' }} />
            <span>Terminal</span>
          </button>
          <button
            onClick={() => setBottomTab('problems')}
            style={{
              ...tabBtnStyle,
              borderBottom: activeTab === 'problems' ? '2px solid var(--xivig-accent)' : '2px solid transparent',
              color: activeTab === 'problems' ? 'var(--xivig-text)' : 'var(--xivig-text-dim)',
            }}
          >
            <AlertTriangle size={13} style={{ marginRight: '6px' }} />
            <span>Problems (0)</span>
          </button>
          <button
            onClick={() => setBottomTab('output')}
            style={{
              ...tabBtnStyle,
              borderBottom: activeTab === 'output' ? '2px solid var(--xivig-accent)' : '2px solid transparent',
              color: activeTab === 'output' ? 'var(--xivig-text)' : 'var(--xivig-text-dim)',
            }}
          >
            <FileText size={13} style={{ marginRight: '6px' }} />
            <span>Output</span>
          </button>
        </div>

        {/* Action Controls */}
        <div style={actionsGroupStyle}>
          {activeTab === 'terminal' && (
            <>
              <button onClick={handleClear} style={iconBtnStyle} title="Clear Terminal">
                <Trash2 size={13} />
              </button>
              <button onClick={handleRestart} style={iconBtnStyle} title="Restart Terminal">
                <RotateCcw size={13} />
              </button>
            </>
          )}
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              setTimeout(() => fitAddonRef.current?.fit(), 50);
            }}
            style={iconBtnStyle}
            title={isExpanded ? 'Restore Height' : 'Maximize Panel'}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button onClick={() => toggleBottomPanel()} style={iconBtnStyle} title="Close Panel (Ctrl+`)">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div style={panelBodyStyle}>
        {activeTab === 'terminal' && (
          <div
            ref={terminalContainerRef}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#13151a',
              padding: '6px 12px',
              overflow: 'hidden',
            }}
          />
        )}

        {activeTab === 'problems' && (
          <div style={emptyPanelContentStyle}>
            <p style={{ color: 'var(--xivig-text-dim)', fontSize: '12px' }}>
              No problems detected in workspace.
            </p>
          </div>
        )}

        {activeTab === 'output' && (
          <div style={outputContentStyle}>
            <pre style={{ margin: 0, color: 'var(--xivig-text-muted)', fontSize: '12px', fontFamily: 'var(--xivig-font-mono)' }}>
              [Xivig Editor System Log]{'\n'}
              Workspace: {currentFolderPath || 'None'}{'\n'}
              Ready.
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const panelContainerStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-statusbar)',
  borderTop: '1px solid var(--xivig-border-subtle)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  transition: 'height 0.15s ease',
  flexShrink: 0,
};

const panelHeaderStyle: React.CSSProperties = {
  height: '30px',
  backgroundColor: 'var(--xivig-activity-bar)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 8px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  userSelect: 'none',
};

const tabsGroupStyle: React.CSSProperties = {
  display: 'flex',
  height: '100%',
};

const tabBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  fontSize: '11.5px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  height: '100%',
  transition: 'color 0.1s ease',
};

const actionsGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const iconBtnStyle: React.CSSProperties = {
  color: 'var(--xivig-text-dim)',
  padding: '3px',
  borderRadius: '3px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const panelBodyStyle: React.CSSProperties = {
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
};

const emptyPanelContentStyle: React.CSSProperties = {
  padding: '24px',
  textAlign: 'center',
};

const outputContentStyle: React.CSSProperties = {
  padding: '12px 16px',
  height: '100%',
  overflowY: 'auto',
};
