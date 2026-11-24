import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCw,
  Square,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
  Bug,
  CheckCircle2,
  AlertCircle,
  Eye,
  List,
} from 'lucide-react';
import { useDebugStore, DapStackFrame } from '../../stores/debugStore';

export const DebugPanel: React.FC = () => {
  const sessionState = useDebugStore((state) => state.sessionState);
  const configurations = useDebugStore((state) => state.configurations);
  const selectedConfigIndex = useDebugStore((state) => state.selectedConfigIndex);
  const startDebugging = useDebugStore((state) => state.startDebugging);
  const stopDebugging = useDebugStore((state) => state.stopDebugging);
  const continueExecution = useDebugStore((state) => state.continueExecution);
  const pauseExecution = useDebugStore((state) => state.pauseExecution);
  const stepOver = useDebugStore((state) => state.stepOver);
  const stepInto = useDebugStore((state) => state.stepInto);
  const stepOut = useDebugStore((state) => state.stepOut);
  const restartDebugging = useDebugStore((state) => state.restartDebugging);
  const stackFrames = useDebugStore((state) => state.stackFrames);
  const activeFrame = useDebugStore((state) => state.activeFrame);
  const selectFrame = useDebugStore((state) => state.selectFrame);
  const variablesByScope = useDebugStore((state) => state.variablesByScope);
  const watchExpressions = useDebugStore((state) => state.watchExpressions);
  const addWatchExpression = useDebugStore((state) => state.addWatchExpression);
  const removeWatchExpression = useDebugStore((state) => state.removeWatchExpression);
  const breakpoints = useDebugStore((state) => state.breakpoints);
  const toggleBreakpoint = useDebugStore((state) => state.toggleBreakpoint);
  const clearAllBreakpoints = useDebugStore((state) => state.clearAllBreakpoints);

  const [newWatchText, setNewWatchText] = useState('');
  const [isAddingWatch, setIsAddingWatch] = useState(false);

  const handleAddWatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWatchText.trim()) {
      addWatchExpression(newWatchText);
      setNewWatchText('');
      setIsAddingWatch(false);
    }
  };

  const isDebugging = sessionState !== 'stopped';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Header & Launch Bar */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--xivig-border, #2c313d)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Run & Debug
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: sessionState === 'running' ? 'rgba(34, 197, 94, 0.2)' : sessionState === 'paused' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: sessionState === 'running' ? '#22c55e' : sessionState === 'paused' ? '#f59e0b' : 'var(--xivig-text-dim, #646b7a)',
              fontWeight: 600,
            }}
          >
            {sessionState.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            style={{
              flex: 1,
              backgroundColor: 'var(--xivig-surface, #1d2028)',
              color: 'var(--xivig-text, #e5e7eb)',
              border: '1px solid var(--xivig-border, #2c313d)',
              borderRadius: '4px',
              fontSize: '11px',
              padding: '4px 6px',
            }}
          >
            {configurations.map((cfg, idx) => (
              <option key={idx} value={idx}>
                {cfg.name}
              </option>
            ))}
          </select>

          {!isDebugging ? (
            <button
              onClick={() => startDebugging()}
              title="Start Debugging (F5)"
              style={{
                backgroundColor: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Play size={13} fill="#fff" />
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {sessionState === 'paused' ? (
                <button
                  onClick={() => continueExecution()}
                  title="Continue (F5)"
                  style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', padding: '2px' }}
                >
                  <Play size={15} fill="#22c55e" />
                </button>
              ) : (
                <button
                  onClick={() => pauseExecution()}
                  title="Pause (F6)"
                  style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', padding: '2px' }}
                >
                  <Pause size={15} />
                </button>
              )}
              <button
                onClick={() => stepOver()}
                title="Step Over (F10)"
                style={{ background: 'none', border: 'none', color: '#6c8cff', cursor: 'pointer', padding: '2px' }}
              >
                <ArrowRight size={15} />
              </button>
              <button
                onClick={() => stepInto()}
                title="Step Into (F11)"
                style={{ background: 'none', border: 'none', color: '#6c8cff', cursor: 'pointer', padding: '2px' }}
              >
                <ArrowDown size={15} />
              </button>
              <button
                onClick={() => stepOut()}
                title="Step Out (Shift+F11)"
                style={{ background: 'none', border: 'none', color: '#6c8cff', cursor: 'pointer', padding: '2px' }}
              >
                <ArrowUp size={15} />
              </button>
              <button
                onClick={() => restartDebugging()}
                title="Restart Debugging (Ctrl+Shift+F5)"
                style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '2px' }}
              >
                <RotateCw size={14} />
              </button>
              <button
                onClick={() => stopDebugging()}
                title="Stop Debugging (Shift+F5)"
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
              >
                <Square size={14} fill="#ef4444" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Accordion Panels */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Variables Section */}
        <div style={{ borderBottom: '1px solid var(--xivig-border, #2c313d)' }}>
          <div style={{ padding: '6px 12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', fontWeight: 600, fontSize: '11px' }}>
            VARIABLES
          </div>
          <div style={{ padding: '8px 12px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {Object.keys(variablesByScope).length === 0 ? (
              <span style={{ color: 'var(--xivig-text-dim, #646b7a)', fontStyle: 'italic' }}>
                {isDebugging ? 'No variables in current scope' : 'Not debugging'}
              </span>
            ) : (
              Object.entries(variablesByScope).map(([scope, vars]) => (
                <div key={scope} style={{ marginBottom: '6px' }}>
                  <div style={{ color: 'var(--xivig-accent, #6c8cff)', fontWeight: 600, fontSize: '10px' }}>{scope.toUpperCase()}</div>
                  {vars.map((v, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span style={{ color: '#93c5fd' }}>{v.name}</span>
                      <span style={{ color: '#86efac', fontFamily: 'monospace' }}>{v.value}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Watch Expressions */}
        <div style={{ borderBottom: '1px solid var(--xivig-border, #2c313d)' }}>
          <div style={{ padding: '6px 12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', fontWeight: 600, fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>WATCH</span>
            <button
              onClick={() => setIsAddingWatch(true)}
              style={{ background: 'none', border: 'none', color: 'var(--xivig-text-dim, #646b7a)', cursor: 'pointer', padding: 0 }}
            >
              <Plus size={14} />
            </button>
          </div>
          <div style={{ padding: '8px 12px', fontSize: '11px' }}>
            {isAddingWatch && (
              <form onSubmit={handleAddWatch} style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  autoFocus
                  placeholder="Expression to watch..."
                  value={newWatchText}
                  onChange={(e) => setNewWatchText(e.target.value)}
                  onBlur={() => !newWatchText && setIsAddingWatch(false)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--xivig-surface, #1d2028)',
                    border: '1px solid var(--xivig-accent, #6c8cff)',
                    color: '#fff',
                    borderRadius: '3px',
                    padding: '3px 6px',
                    fontSize: '11px',
                  }}
                />
              </form>
            )}
            {watchExpressions.length === 0 && !isAddingWatch ? (
              <span style={{ color: 'var(--xivig-text-dim, #646b7a)', fontStyle: 'italic' }}>No watch expressions</span>
            ) : (
              watchExpressions.map((w) => (
                <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ color: '#cbd5e1' }}>{w.expression}:</span>
                    <span style={{ color: '#86efac', fontFamily: 'monospace' }}>{w.value || '<not evaluated>'}</span>
                  </div>
                  <button
                    onClick={() => removeWatchExpression(w.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--xivig-text-dim, #646b7a)', cursor: 'pointer', padding: 0 }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Call Stack */}
        <div style={{ borderBottom: '1px solid var(--xivig-border, #2c313d)' }}>
          <div style={{ padding: '6px 12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', fontWeight: 600, fontSize: '11px' }}>
            CALL STACK
          </div>
          <div style={{ padding: '8px 12px', fontSize: '11px' }}>
            {stackFrames.length === 0 ? (
              <span style={{ color: 'var(--xivig-text-dim, #646b7a)', fontStyle: 'italic' }}>
                {isDebugging ? 'Running...' : 'Not debugging'}
              </span>
            ) : (
              stackFrames.map((f) => (
                <div
                  key={f.id}
                  onClick={() => selectFrame(f)}
                  style={{
                    padding: '3px 6px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    backgroundColor: activeFrame?.id === f.id ? 'rgba(108, 140, 255, 0.15)' : 'transparent',
                    color: activeFrame?.id === f.id ? 'var(--xivig-accent, #6c8cff)' : 'var(--xivig-text, #e5e7eb)',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{f.name}</span>
                  <span style={{ color: 'var(--xivig-text-dim, #646b7a)', marginLeft: '6px' }}>
                    {f.source?.name || 'anonymous'}:{f.line}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Breakpoints */}
        <div>
          <div style={{ padding: '6px 12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', fontWeight: 600, fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>BREAKPOINTS</span>
            <button
              onClick={() => clearAllBreakpoints()}
              title="Remove All Breakpoints"
              style={{ background: 'none', border: 'none', color: 'var(--xivig-text-dim, #646b7a)', cursor: 'pointer', padding: 0 }}
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div style={{ padding: '8px 12px', fontSize: '11px' }}>
            {Object.keys(breakpoints).length === 0 ? (
              <span style={{ color: 'var(--xivig-text-dim, #646b7a)', fontStyle: 'italic' }}>No breakpoints</span>
            ) : (
              Object.entries(breakpoints).map(([file, list]) =>
                list.map((bp) => {
                  const fileName = file.split('/').pop() || file;
                  return (
                    <div
                      key={`${file}-${bp.line}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: bp.condition ? '#f59e0b' : '#ef4444',
                          }}
                        />
                        <span>{fileName}</span>
                        <span style={{ color: 'var(--xivig-text-dim, #646b7a)' }}>:{bp.line}</span>
                        {bp.condition && (
                          <span style={{ fontSize: '9px', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '1px 4px', borderRadius: '2px' }}>
                            {bp.condition}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleBreakpoint(file, bp.line)}
                        style={{ background: 'none', border: 'none', color: 'var(--xivig-text-dim, #646b7a)', cursor: 'pointer', padding: 0 }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
