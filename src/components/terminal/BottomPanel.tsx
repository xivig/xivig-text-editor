import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  Terminal as TerminalIcon,
  AlertTriangle,
  AlertCircle,
  Info,
  FileText,
  Trash2,
  RotateCcw,
  Maximize2,
  Minimize2,
  X,
  Play,
  Square,
  Cpu,
  ChevronDown,
  ChevronRight,
  Bug,
  Plus,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useDiagnosticsStore, DiagnosticItem } from '../../stores/diagnosticsStore';
import { useBuildStore } from '../../stores/buildStore';
import { useTerminalStore } from '../../stores/terminalStore';
import { FileIcon } from '../common/FileIcon';
import { renderAnsi, formatOutputTimestamp } from '../../utils/ansi';
import { DebugConsolePane } from './DebugConsolePane';

export const BottomPanel: React.FC = () => {
  const isOpen = useUIStore((state) => state.isBottomPanelOpen);
  const activeTab = useUIStore((state) => state.activeBottomTab);
  const setBottomTab = useUIStore((state) => state.setBottomTab);
  const toggleBottomPanel = useUIStore((state) => state.toggleBottomPanel);
  const openBuildSystemModal = useUIStore((state) => state.openBuildSystemModal);
  const currentFolderPath = useFileStore((state) => state.currentFolderPath);

  // Diagnostics store
  const allDiagnostics = useDiagnosticsStore((state) => state.allDiagnostics);
  const totalErrors = useDiagnosticsStore((state) => state.totalErrors);
  const totalWarnings = useDiagnosticsStore((state) => state.totalWarnings);

  // Build store
  const isRunning = useBuildStore((state) => state.isRunning);
  const activeTarget = useBuildStore((state) => state.activeTarget);
  const outputLines = useBuildStore((state) => state.outputLines);
  const exitCode = useBuildStore((state) => state.exitCode);
  const executeBuild = useBuildStore((state) => state.executeBuild);
  const stopBuild = useBuildStore((state) => state.stopBuild);
  const clearOutput = useBuildStore((state) => state.clearOutput);
  const detectDefaultTarget = useBuildStore((state) => state.detectDefaultTarget);

  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const outputTerminalRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [collapsedFiles, setCollapsedFiles] = useState<Record<string, boolean>>({});
  const [problemFilter, setProblemFilter] = useState<'all' | 'errors' | 'warnings'>('all');

  // Group diagnostics by file (Keep hooks at the very top of component)
  const filteredDiagnostics = React.useMemo(() => {
    return allDiagnostics.filter((d) => {
      if (problemFilter === 'errors') return d.severity === 'error';
      if (problemFilter === 'warnings') return d.severity === 'warning';
      return true;
    });
  }, [allDiagnostics, problemFilter]);

  const groupedProblems = React.useMemo(() => {
    return filteredDiagnostics.reduce<Record<string, DiagnosticItem[]>>((acc, d) => {
      const key = d.fileName || 'Untitled';
      if (!acc[key]) acc[key] = [];
      acc[key].push(d);
      return acc;
    }, {});
  }, [filteredDiagnostics]);

  const activeDoc = useEditorStore((state) => state.getActiveDocument());
  const currentBuildTarget = React.useMemo(() => {
    if (activeTarget && activeDoc && activeTarget.name.includes(activeDoc.name)) {
      return activeTarget;
    }
    return detectDefaultTarget();
  }, [activeTarget, activeDoc, detectDefaultTarget]);

  // Auto-scroll output to bottom without horizontal displacement or parent shifting
  useEffect(() => {
    if (activeTab === 'output' && outputTerminalRef.current) {
      outputTerminalRef.current.scrollTop = outputTerminalRef.current.scrollHeight;
    }
  }, [outputLines, activeTab]);

  // Initialize xterm.js instance
  useEffect(() => {
    if (!isOpen || activeTab !== 'terminal' || !terminalContainerRef.current) return;

    if (!xtermRef.current) {
      const term = new XTerm({
        cursorBlink: true,
        cursorStyle: 'bar',
        fontSize: 13,
        fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, "Courier New", monospace',
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

      // Initialize shell backend with PTY dimensions
      const initialCols = term.cols || 80;
      const initialRows = term.rows || 24;
      window.xivig?.terminalInit?.({
        cwd: currentFolderPath || undefined,
        cols: initialCols,
        rows: initialRows,
      });
    }

    // Subscribe to shell stdout/stderr
    const unsubscribe = window.xivig?.onTerminalData?.((data) => {
      xtermRef.current?.write(data);
    });

    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        try {
          fitAddonRef.current.fit();
          const { cols, rows } = xtermRef.current;
          if (cols && rows) {
            window.xivig?.terminalResize?.({ cols, rows });
          }
        } catch {}
      }
    };

    // Use ResizeObserver on container to handle panel toggle, expansion, and window resizes
    let resizeObserver: ResizeObserver | null = null;
    if (terminalContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(handleResize);
      });
      resizeObserver.observe(terminalContainerRef.current);
    }

    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 50);
    setTimeout(handleResize, 200);

    return () => {
      unsubscribe?.();
      resizeObserver?.disconnect();
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

  const panelHeight = isExpanded ? '460px' : '230px';

  const handleClear = () => {
    xtermRef.current?.clear();
  };

  const handleRestart = () => {
    xtermRef.current?.clear();
    window.xivig?.terminalInit?.(currentFolderPath || undefined);
  };

  const handleJumpToProblem = (p: DiagnosticItem) => {
    const editorStore = useEditorStore.getState();
    const doc = editorStore.documents.find((d) => d.id === p.docId || d.path === p.filePath);

    if (doc) {
      editorStore.setActiveDocument(doc.id);
    }
  };

  const toggleFileCollapse = (fileName: string) => {
    setCollapsedFiles((prev) => ({
      ...prev,
      [fileName]: !prev[fileName],
    }));
  };

  return (
    <div style={{ ...panelContainerStyle, height: panelHeight }}>
      {/* Header bar */}
      <div style={panelHeaderStyle}>
        {/* Tabs */}
        <div style={tabsGroupStyle}>
          {/* Terminal Tab */}
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

          {/* Problems Tab */}
          <button
            onClick={() => setBottomTab('problems')}
            style={{
              ...tabBtnStyle,
              borderBottom: activeTab === 'problems' ? '2px solid var(--xivig-accent)' : '2px solid transparent',
              color: activeTab === 'problems' ? 'var(--xivig-text)' : 'var(--xivig-text-dim)',
            }}
          >
            <AlertTriangle
              size={13}
              style={{
                marginRight: '6px',
                color: totalErrors > 0 ? '#ef6464' : totalWarnings > 0 ? '#e6ad45' : 'inherit',
              }}
            />
            <span>Problems</span>
            {(totalErrors > 0 || totalWarnings > 0) && (
              <span
                style={{
                  marginLeft: '6px',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 700,
                  backgroundColor: totalErrors > 0 ? '#ef6464' : '#e6ad45',
                  color: '#ffffff',
                }}
              >
                {totalErrors + totalWarnings}
              </span>
            )}
          </button>

          {/* Output Tab */}
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
            {isRunning && (
              <span
                style={{
                  marginLeft: '6px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#35b779',
                  display: 'inline-block',
                }}
              />
            )}
          </button>

          {/* Debug Console Tab */}
          <button
            onClick={() => setBottomTab('debugConsole')}
            style={{
              ...tabBtnStyle,
              borderBottom: activeTab === 'debugConsole' ? '2px solid var(--xivig-accent)' : '2px solid transparent',
              color: activeTab === 'debugConsole' ? 'var(--xivig-text)' : 'var(--xivig-text-dim)',
            }}
          >
            <Bug size={13} style={{ marginRight: '6px' }} />
            <span>Debug Console</span>
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

          {activeTab === 'output' && (
            <>
              {isRunning ? (
                <button
                  onClick={() => stopBuild()}
                  style={{ ...iconBtnStyle, color: '#ef6464' }}
                  title="Stop Running Task"
                >
                  <Square size={12} fill="#ef6464" />
                </button>
              ) : (
                <button
                  onClick={() => executeBuild()}
                  style={{ ...iconBtnStyle, color: '#35b779' }}
                  title={`Run Task: ${currentBuildTarget.name} (Ctrl+Shift+B / F7)`}
                >
                  <Play size={12} fill="#35b779" />
                </button>
              )}
              <button
                onClick={() => openBuildSystemModal()}
                style={iconBtnStyle}
                title="Select Build Target (Ctrl+Shift+B)"
              >
                <Cpu size={13} />
              </button>
              <button onClick={() => clearOutput()} style={iconBtnStyle} title="Clear Output">
                <Trash2 size={13} />
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
        {/* Terminal Surface */}
        {activeTab === 'terminal' && (
          <div
            style={{
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              backgroundColor: '#13151a',
              padding: '2px 8px 8px 8px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              ref={terminalContainerRef}
              style={{
                width: '100%',
                flex: 1,
                minHeight: 0,
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
            />
          </div>
        )}

        {/* Problems Surface */}
        {activeTab === 'problems' && (
          <div style={problemsContainerStyle}>
            {/* Filter Sub-header */}
            <div style={problemsSubHeaderStyle}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setProblemFilter('all')}
                  style={{
                    ...filterBtnStyle,
                    backgroundColor: problemFilter === 'all' ? 'var(--xivig-surface-hover)' : 'transparent',
                    color: problemFilter === 'all' ? 'var(--xivig-text)' : 'var(--xivig-text-dim)',
                  }}
                >
                  All ({allDiagnostics.length})
                </button>
                <button
                  onClick={() => setProblemFilter('errors')}
                  style={{
                    ...filterBtnStyle,
                    backgroundColor: problemFilter === 'errors' ? 'rgba(239, 100, 100, 0.15)' : 'transparent',
                    color: problemFilter === 'errors' ? '#ef6464' : 'var(--xivig-text-dim)',
                  }}
                >
                  <AlertCircle size={11} style={{ marginRight: '4px' }} />
                  Errors ({totalErrors})
                </button>
                <button
                  onClick={() => setProblemFilter('warnings')}
                  style={{
                    ...filterBtnStyle,
                    backgroundColor: problemFilter === 'warnings' ? 'rgba(230, 173, 69, 0.15)' : 'transparent',
                    color: problemFilter === 'warnings' ? '#e6ad45' : 'var(--xivig-text-dim)',
                  }}
                >
                  <AlertTriangle size={11} style={{ marginRight: '4px' }} />
                  Warnings ({totalWarnings})
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
              {Object.keys(groupedProblems).length > 0 ? (
                Object.entries(groupedProblems).map(([fileName, items]) => {
                  const isCollapsed = collapsedFiles[fileName];

                  return (
                    <div key={fileName} style={{ marginBottom: '6px' }}>
                      {/* File Group Header */}
                      <div
                        onClick={() => toggleFileCollapse(fileName)}
                        style={fileGroupHeaderStyle}
                      >
                        {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                        <FileIcon filename={fileName} size={14} style={{ margin: '0 6px' }} />
                        <span style={{ fontWeight: 600, color: 'var(--xivig-text)', fontSize: '12px' }}>
                          {fileName}
                        </span>
                        <span
                          style={{
                            marginLeft: '8px',
                            fontSize: '10.5px',
                            color: 'var(--xivig-text-dim)',
                            backgroundColor: 'var(--xivig-activity-bar)',
                            padding: '1px 6px',
                            borderRadius: '10px',
                          }}
                        >
                          {items.length}
                        </span>
                      </div>

                      {/* Items */}
                      {!isCollapsed && (
                        <div style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {items.map((prob) => {
                            const isError = prob.severity === 'error';
                            const isWarning = prob.severity === 'warning';
                            const IconComponent = isError ? AlertCircle : isWarning ? AlertTriangle : Info;
                            const iconColor = isError ? '#ef6464' : isWarning ? '#e6ad45' : '#56b6c2';

                            return (
                              <div
                                key={prob.id}
                                onClick={() => handleJumpToProblem(prob)}
                                style={problemRowStyle}
                              >
                                <IconComponent size={12} color={iconColor} style={{ marginRight: '8px', flexShrink: 0 }} />
                                <span style={{ flex: 1, color: 'var(--xivig-text)', fontSize: '12px', marginRight: '8px' }}>
                                  {prob.message}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--xivig-text-dim)', flexShrink: 0 }}>
                                  [{prob.line}, {prob.col}]
                                </span>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    color: 'var(--xivig-text-muted)',
                                    backgroundColor: 'var(--xivig-activity-bar)',
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    marginLeft: '8px',
                                    flexShrink: 0,
                                  }}
                                >
                                  {prob.source}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={emptyPanelContentStyle}>
                  <p style={{ color: 'var(--xivig-text-dim)', fontSize: '12px' }}>
                    No problems detected in open documents. Clean workspace!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Output Surface (Build System & Task Runner) */}
        {activeTab === 'output' && (
          <div style={outputContainerStyle}>
            {/* Output Sub-header Bar */}
            <div style={outputSubHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', overflow: 'hidden' }}>
                <span style={{ color: 'var(--xivig-text-dim)', flexShrink: 0 }}>Runner:</span>
                <span style={{ fontWeight: 600, color: 'var(--xivig-accent)', flexShrink: 0 }}>
                  {currentBuildTarget.name}
                </span>
                <code
                  style={{
                    backgroundColor: 'var(--xivig-surface)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: 'var(--xivig-text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={`${currentBuildTarget.command} ${currentBuildTarget.args.join(' ')}${currentBuildTarget.secondaryCommand ? ` && ${currentBuildTarget.secondaryCommand.command}` : ''}`}
                >
                  {currentBuildTarget.command} {currentBuildTarget.args.slice(0, 3).join(' ')}
                  {currentBuildTarget.secondaryCommand ? ` → ${currentBuildTarget.secondaryCommand.command}` : ''}
                </code>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => clearOutput()}
                  style={btnActionStyle}
                  title="Clear Output Log"
                >
                  <Trash2 size={12} style={{ marginRight: '4px' }} />
                  Clear
                </button>
                <button
                  onClick={() => openBuildSystemModal()}
                  style={btnActionStyle}
                  title="Select / Configure Target (Ctrl+Shift+B)"
                >
                  <Cpu size={12} style={{ marginRight: '4px' }} />
                  Change Target
                </button>
                {isRunning ? (
                  <button
                    onClick={() => stopBuild()}
                    style={{ ...btnActionStyle, backgroundColor: '#ef6464', color: '#ffffff' }}
                  >
                    <Square size={11} style={{ marginRight: '4px' }} fill="#ffffff" />
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={() => executeBuild()}
                    style={{ ...btnActionStyle, backgroundColor: 'var(--xivig-accent)', color: '#ffffff' }}
                  >
                    <Play size={11} style={{ marginRight: '4px' }} fill="#ffffff" />
                    Run (Ctrl+Shift+B / F7)
                  </button>
                )}
              </div>
            </div>

            {/* Console Log Lines */}
            <div ref={outputTerminalRef} style={outputTerminalAreaStyle}>
              {outputLines.length === 0 ? (
                <div style={emptyPanelContentStyle}>
                  <p style={{ color: 'var(--xivig-text-dim)', fontSize: '12px' }}>
                    Output log is empty. Press Run (Ctrl+Shift+B / F7) to execute a task.
                  </p>
                </div>
              ) : (
                outputLines.map((line) => {
                  let color = 'var(--xivig-text)';
                  if (line.type === 'system') color = '#56b6c2';
                  else if (line.type === 'stderr' || line.type === 'error') color = '#ef6464';
                  else if (line.type === 'success') color = '#35b779';

                  return (
                    <div
                      key={line.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        lineHeight: 1.5,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--xivig-text-dim)',
                          fontSize: '11px',
                          fontFamily: 'var(--xivig-font-mono)',
                          userSelect: 'none',
                          flexShrink: 0,
                          width: '82px',
                          minWidth: '82px',
                          letterSpacing: '0.2px',
                        }}
                      >
                        {formatOutputTimestamp(line.timestamp)}
                      </span>
                      <pre
                        style={{
                          margin: 0,
                          flex: 1,
                          color,
                          fontFamily: 'var(--xivig-font-mono)',
                          fontSize: '12px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          minWidth: 0,
                        }}
                      >
                        {renderAnsi(line.text, color)}
                      </pre>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Debug Console Surface */}
        {activeTab === 'debugConsole' && <DebugConsolePane />}
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
  height: '32px',
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
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'all 0.1s ease',
};

const actionsGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

const iconBtnStyle: React.CSSProperties = {
  padding: '4px',
  borderRadius: '3px',
  color: 'var(--xivig-text-dim)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const panelBodyStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const emptyPanelContentStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: '16px',
};

const problemsContainerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: '#13151a',
};

const problemsSubHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  backgroundColor: 'var(--xivig-statusbar)',
};

const filterBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '11px',
  padding: '2px 8px',
  borderRadius: '4px',
  cursor: 'pointer',
  border: 'none',
};

const fileGroupHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '4px 6px',
  cursor: 'pointer',
  borderRadius: '3px',
};

const problemRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '3px 8px',
  borderRadius: '3px',
  cursor: 'pointer',
  transition: 'background-color 0.1s',
};

const outputContainerStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: '#13151a',
};

const outputSubHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '5px 12px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  backgroundColor: 'var(--xivig-statusbar)',
  flexShrink: 0,
};

const btnActionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '3px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid var(--xivig-border-subtle)',
  backgroundColor: 'var(--xivig-surface)',
  color: 'var(--xivig-text)',
};

const outputTerminalAreaStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '8px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
};
