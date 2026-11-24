import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Settings,
  Shield,
  Check,
  X,
  Code,
  FileQuestion,
  Wand2,
  Bug,
  TestTube,
} from 'lucide-react';
import { useAiStore } from '../../stores/aiStore';
import { getActiveEditorView } from '../editor/editorViewRegistry';

export const AiAssistantPanel: React.FC = () => {
  const [promptInput, setPromptInput] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [previewingCode, setPreviewingCode] = useState<string | null>(null);

  const messages = useAiStore((state) => state.messages);
  const isLoading = useAiStore((state) => state.isLoading);
  const provider = useAiStore((state) => state.provider);
  const apiKey = useAiStore((state) => state.apiKey);
  const endpoint = useAiStore((state) => state.endpoint);
  const model = useAiStore((state) => state.model);
  const isPrivacyMode = useAiStore((state) => state.isPrivacyMode);
  const totalTokensUsed = useAiStore((state) => state.totalTokensUsed);

  const setProvider = useAiStore((state) => state.setProvider);
  const setApiKey = useAiStore((state) => state.setApiKey);
  const setEndpoint = useAiStore((state) => state.setEndpoint);
  const setModel = useAiStore((state) => state.setModel);
  const setPrivacyMode = useAiStore((state) => state.setPrivacyMode);
  const sendPrompt = useAiStore((state) => state.sendPrompt);
  const clearMessages = useAiStore((state) => state.clearMessages);

  // Helper to extract currently selected text in editor
  const getSelectedEditorCode = (): string | undefined => {
    const view = getActiveEditorView();
    if (!view) return undefined;
    const { from, to } = view.state.selection.main;
    if (from === to) return undefined;
    return view.state.sliceDoc(from, to);
  };

  const handleSend = async (customPrompt?: string) => {
    const text = (customPrompt || promptInput).trim();
    if (!text || isLoading) return;
    setPromptInput('');
    const codeContext = getSelectedEditorCode();
    await sendPrompt(text, codeContext);
  };

  const handleApplyProposedCode = (code: string) => {
    const view = getActiveEditorView();
    if (view) {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: code },
      });
      setPreviewingCode(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--xivig-bg)', color: 'var(--xivig-text)' }}>
      {/* Top Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--xivig-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--xivig-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} style={{ color: 'var(--xivig-accent, #6c8cff)' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
            AI Assistant ({provider})
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setShowConfig(!showConfig)}
            title="Configure AI Providers & Privacy"
            style={iconBtnStyle}
          >
            <Settings size={13} style={{ color: showConfig ? 'var(--xivig-accent)' : undefined }} />
          </button>
          <button
            onClick={clearMessages}
            title="Clear Chat History"
            style={iconBtnStyle}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Provider & Privacy Config Drawer */}
      {showConfig && (
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: '#0e1117',
            borderBottom: '1px solid var(--xivig-border)',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Provider</span>
            <select
              value={provider}
              onChange={(e: any) => setProvider(e.target.value)}
              style={selectStyle}
            >
              <option value="ollama">Ollama / Local (Default)</option>
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="custom">Custom Endpoint</option>
            </select>
          </div>

          {provider === 'openai' && (
            <div>
              <label style={{ display: 'block', color: 'var(--xivig-text-dim)', marginBottom: '2px' }}>API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', color: 'var(--xivig-text-dim)', marginBottom: '2px' }}>Endpoint</label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--xivig-text-dim)', marginBottom: '2px' }}>Model Name</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
            <span style={{ color: 'var(--xivig-text-dim)' }}>Privacy (Local only)</span>
            <input
              type="checkbox"
              checked={isPrivacyMode}
              onChange={(e) => setPrivacyMode(e.target.checked)}
            />
          </div>

          <div style={{ fontSize: '10px', color: '#888' }}>
            Tokens consumed: <span style={{ color: 'var(--xivig-accent)', fontWeight: 600 }}>{totalTokensUsed}</span>
          </div>
        </div>
      )}

      {/* Quick Action Pills */}
      <div
        style={{
          padding: '6px 10px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          borderBottom: '1px solid var(--xivig-border)',
          backgroundColor: 'var(--xivig-surface)',
        }}
      >
        <button
          onClick={() => handleSend('Explain this selected code in detail with complexity analysis.')}
          style={quickPillStyle}
        >
          <FileQuestion size={11} /> Explain
        </button>
        <button
          onClick={() => handleSend('Refactor this selected code for optimal readability and performance.')}
          style={quickPillStyle}
        >
          <Wand2 size={11} /> Refactor
        </button>
        <button
          onClick={() => handleSend('Generate comprehensive unit tests for this code.')}
          style={quickPillStyle}
        >
          <TestTube size={11} /> Tests
        </button>
        <button
          onClick={() => handleSend('Find potential security vulnerabilities or runtime bugs in this code.')}
          style={quickPillStyle}
        >
          <Bug size={11} /> Bugs
        </button>
      </div>

      {/* Message Chat List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              backgroundColor: m.role === 'user' ? 'rgba(108, 140, 255, 0.15)' : 'var(--xivig-surface)',
              border: m.role === 'user' ? '1px solid rgba(108, 140, 255, 0.3)' : '1px solid var(--xivig-border)',
              fontSize: '11px',
              lineHeight: '1.5',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', color: m.role === 'user' ? 'var(--xivig-accent)' : '#4ec9b0' }}>
                {m.role === 'user' ? 'You' : 'Xivig Assistant'}
              </span>
              <span style={{ fontSize: '9px', color: 'var(--xivig-text-dim)' }}>{m.timestamp}</span>
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>

            {/* Proposed Code Block */}
            {m.proposedCode && (
              <div style={{ marginTop: '8px', padding: '6px', backgroundColor: '#090a0f', borderRadius: '4px', border: '1px solid var(--xivig-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#888', fontWeight: 700 }}>PROPOSED CODE CHANGE</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => setPreviewingCode(previewingCode === m.proposedCode ? null : m.proposedCode!)}
                      style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: '#2d3748', border: 'none', borderRadius: '3px', color: '#fff', cursor: 'pointer' }}
                    >
                      {previewingCode === m.proposedCode ? 'Hide' : 'Preview'}
                    </button>
                    <button
                      onClick={() => handleApplyProposedCode(m.proposedCode!)}
                      style={{ padding: '2px 8px', fontSize: '10px', backgroundColor: '#35b779', border: 'none', borderRadius: '3px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
                {previewingCode === m.proposedCode && (
                  <pre style={{ margin: 0, fontSize: '10px', fontFamily: 'monospace', color: '#93c5fd', whiteSpace: 'pre-wrap', maxHeight: '140px', overflowY: 'auto' }}>
                    {m.proposedCode}
                  </pre>
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{ fontStyle: 'italic', fontSize: '11px', color: 'var(--xivig-accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={12} /> Generating intelligent response...
          </div>
        )}
      </div>

      {/* Input Box */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--xivig-border)', backgroundColor: 'var(--xivig-surface)' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{ display: 'flex', gap: '6px' }}
        >
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Ask AI or type an instruction..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '6px 8px',
              backgroundColor: 'var(--xivig-bg)',
              border: '1px solid var(--xivig-border)',
              borderRadius: '4px',
              color: 'var(--xivig-text)',
              fontSize: '11px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !promptInput.trim()}
            style={{
              padding: '6px 10px',
              backgroundColor: promptInput.trim() ? 'var(--xivig-accent)' : '#2a2a2a',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: promptInput.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Send size={12} />
          </button>
        </form>
      </div>
    </div>
  );
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--xivig-text-dim)',
  cursor: 'pointer',
  padding: '3px',
};

const quickPillStyle: React.CSSProperties = {
  padding: '3px 6px',
  backgroundColor: 'var(--xivig-bg)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '3px',
  fontSize: '10px',
  color: 'var(--xivig-text)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
};

const selectStyle: React.CSSProperties = {
  backgroundColor: '#161922',
  border: '1px solid var(--xivig-border)',
  borderRadius: '3px',
  color: '#e5e7eb',
  fontSize: '10px',
  padding: '2px 4px',
  outline: 'none',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 6px',
  backgroundColor: '#161922',
  border: '1px solid var(--xivig-border)',
  borderRadius: '3px',
  color: '#e5e7eb',
  fontSize: '10px',
  outline: 'none',
  boxSizing: 'border-box',
};
