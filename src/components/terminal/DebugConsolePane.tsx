import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Terminal, ArrowRight } from 'lucide-react';
import { useDebugStore } from '../../stores/debugStore';

export const DebugConsolePane: React.FC = () => {
  const consoleMessages = useDebugStore((state) => state.consoleMessages);
  const evaluateExpression = useDebugStore((state) => state.evaluateExpression);
  const appendConsoleMessage = useDebugStore((state) => state.appendConsoleMessage);
  const clearConsole = useDebugStore((state) => state.clearConsole);
  const sessionState = useDebugStore((state) => state.sessionState);

  const [inputVal, setInputVal] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expr = inputVal.trim();
    if (!expr) return;

    appendConsoleMessage('console', `> ${expr}`);
    setInputVal('');

    const res = await evaluateExpression(expr);
    appendConsoleMessage('stdout', res);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#13151a',
        color: '#e5e7eb',
        fontFamily: 'var(--xivig-font-mono, monospace)',
        fontSize: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Sub-header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          fontSize: '11px',
        }}
      >
        <span style={{ color: 'var(--xivig-text-dim, #646b7a)' }}>
          Debug Console ({sessionState.toUpperCase()})
        </span>
        <button
          onClick={clearConsole}
          title="Clear Console"
          style={{ background: 'none', border: 'none', color: 'var(--xivig-text-dim, #646b7a)', cursor: 'pointer', padding: '2px' }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {consoleMessages.length === 0 ? (
          <div style={{ color: 'var(--xivig-text-dim, #646b7a)', fontStyle: 'italic', padding: '12px 0' }}>
            Debug console is ready. Type an expression below to evaluate.
          </div>
        ) : (
          consoleMessages.map((msg) => {
            let color = '#e5e7eb';
            if (msg.category === 'stderr' || msg.category === 'error') color = '#ef4444';
            else if (msg.category === 'console') color = '#6c8cff';

            return (
              <div key={msg.id} style={{ color, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.4 }}>
                {msg.text}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input REPL Prompt */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          borderTop: '1px solid var(--xivig-border, #2c313d)',
          backgroundColor: '#0f1115',
        }}
      >
        <span style={{ color: 'var(--xivig-accent, #6c8cff)', fontWeight: 700, marginRight: '6px' }}>&gt;</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={sessionState === 'paused' ? 'Evaluate in current stack frame...' : 'Evaluate expression...'}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: '12px',
          }}
        />
      </form>
    </div>
  );
};
