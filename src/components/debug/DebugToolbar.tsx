import React from 'react';
import { Play, Pause, ArrowRight, ArrowDown, ArrowUp, RotateCw, Square } from 'lucide-react';
import { useDebugStore } from '../../stores/debugStore';

export const DebugToolbar: React.FC = () => {
  const sessionState = useDebugStore((state) => state.sessionState);
  const continueExecution = useDebugStore((state) => state.continueExecution);
  const pauseExecution = useDebugStore((state) => state.pauseExecution);
  const stepOver = useDebugStore((state) => state.stepOver);
  const stepInto = useDebugStore((state) => state.stepInto);
  const stepOut = useDebugStore((state) => state.stepOut);
  const restartDebugging = useDebugStore((state) => state.restartDebugging);
  const stopDebugging = useDebugStore((state) => state.stopDebugging);

  if (sessionState === 'stopped') return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '42px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9990,
        backgroundColor: 'var(--xivig-surface, #1d2028)',
        border: '1px solid var(--xivig-border, #2c313d)',
        borderRadius: '6px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
      }}
    >
      {sessionState === 'paused' ? (
        <button
          onClick={() => continueExecution()}
          title="Continue (F5)"
          style={btnStyle}
        >
          <Play size={14} fill="#22c55e" color="#22c55e" />
        </button>
      ) : (
        <button
          onClick={() => pauseExecution()}
          title="Pause (F6)"
          style={btnStyle}
        >
          <Pause size={14} color="#f59e0b" />
        </button>
      )}

      <button
        onClick={() => stepOver()}
        title="Step Over (F10)"
        style={btnStyle}
      >
        <ArrowRight size={14} color="#6c8cff" />
      </button>

      <button
        onClick={() => stepInto()}
        title="Step Into (F11)"
        style={btnStyle}
      >
        <ArrowDown size={14} color="#6c8cff" />
      </button>

      <button
        onClick={() => stepOut()}
        title="Step Out (Shift+F11)"
        style={btnStyle}
      >
        <ArrowUp size={14} color="#6c8cff" />
      </button>

      <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--xivig-border, #2c313d)', margin: '0 4px' }} />

      <button
        onClick={() => restartDebugging()}
        title="Restart Debugging (Ctrl+Shift+F5)"
        style={btnStyle}
      >
        <RotateCw size={13} color="#38bdf8" />
      </button>

      <button
        onClick={() => stopDebugging()}
        title="Stop Debugging (Shift+F5)"
        style={btnStyle}
      >
        <Square size={13} fill="#ef4444" color="#ef4444" />
      </button>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  borderRadius: '4px',
  padding: '4px 6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
