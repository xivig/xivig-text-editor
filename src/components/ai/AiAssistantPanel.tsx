import React, { useState, useEffect, useRef } from 'react';
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
  Copy,
  ArrowDownToLine,
  FileCode,
  Layers,
  Cpu,
  Info,
} from 'lucide-react';
import { useAiStore, AiProvider } from '../../stores/aiStore';
import { useEditorStore } from '../../stores/editorStore';
import { getActiveEditorView } from '../editor/editorViewRegistry';

export const AiAssistantPanel: React.FC = () => {
  const [promptInput, setPromptInput] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const messages = useAiStore((state) => state.messages);
  const isLoading = useAiStore((state) => state.isLoading);
  const provider = useAiStore((state) => state.provider);
  const apiKey = useAiStore((state) => state.apiKey);
  const endpoint = useAiStore((state) => state.endpoint);
  const model = useAiStore((state) => state.model);
  const isPrivacyMode = useAiStore((state) => state.isPrivacyMode);
  const includeContext = useAiStore((state) => state.includeContext);
  const totalTokensUsed = useAiStore((state) => state.totalTokensUsed);

  const setProvider = useAiStore((state) => state.setProvider);
  const setApiKey = useAiStore((state) => state.setApiKey);
  const setEndpoint = useAiStore((state) => state.setEndpoint);
  const setModel = useAiStore((state) => state.setModel);
  const setPrivacyMode = useAiStore((state) => state.setPrivacyMode);
  const setIncludeContext = useAiStore((state) => state.setIncludeContext);
  const sendPrompt = useAiStore((state) => state.sendPrompt);
  const clearMessages = useAiStore((state) => state.clearMessages);
  const loadSavedSettings = useAiStore((state) => state.loadSavedSettings);

  const activeDoc = useEditorStore((state) => state.getActiveDocument());

  useEffect(() => {
    loadSavedSettings();
  }, [loadSavedSettings]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Context detection: selection or active document
  const getEditorContext = () => {
    const view = getActiveEditorView();
    if (!view || !activeDoc) {
      return { code: undefined, fileName: undefined, language: undefined, isSelection: false, lineCount: 0 };
    }
    const { from, to } = view.state.selection.main;
    if (from !== to) {
      const selectedText = view.state.sliceDoc(from, to);
      const lines = selectedText.split('\n').length;
      return {
        code: selectedText,
        fileName: activeDoc.name,
        language: activeDoc.language,
        isSelection: true,
        lineCount: lines,
      };
    }
    const fullText = activeDoc.content;
    const lines = fullText.split('\n').length;
    return {
      code: fullText,
      fileName: activeDoc.name,
      language: activeDoc.language,
      isSelection: false,
      lineCount: lines,
    };
  };

  const currentCtx = getEditorContext();

  const handleSend = async (customPrompt?: string) => {
    const text = (customPrompt || promptInput).trim();
    if (!text || isLoading) return;
    setPromptInput('');
    const ctx = includeContext ? getEditorContext() : { code: undefined, fileName: undefined, language: undefined };
    await sendPrompt(text, ctx.code, ctx.fileName, ctx.language);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleApplyProposedCode = (code: string, id: string) => {
    const view = getActiveEditorView();
    if (view) {
      const { from, to } = view.state.selection.main;
      // If there's an active selection, replace it. Otherwise replace full doc or insert at cursor.
      if (from !== to) {
        view.dispatch({ changes: { from, to, insert: code } });
      } else {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: code },
        });
      }
      setAppliedId(id);
      setTimeout(() => setAppliedId(null), 2500);
    }
  };

  const handleInsertAtCursor = (code: string, id: string) => {
    const view = getActiveEditorView();
    if (view) {
      const from = view.state.selection.main.from;
      view.dispatch({ changes: { from, insert: code } });
      setAppliedId(id);
      setTimeout(() => setAppliedId(null), 2500);
    }
  };

  const getProviderLabel = (p: AiProvider): string => {
    switch (p) {
      case 'builtin':
        return 'Built-in (Offline)';
      case 'openai':
        return 'OpenAI (GPT-4o)';
      case 'gemini':
        return 'Google Gemini';
      case 'anthropic':
        return 'Claude 3.5';
      case 'ollama':
        return 'Ollama (Local)';
      case 'custom':
        return 'Custom API';
      default:
        return p;
    }
  };

  return (
    <div style={containerStyle}>
      {/* Top Header Bar */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Sparkles size={14} color="var(--xivig-accent)" />
          <span style={headerTitleStyle}>
            AI Assistant
          </span>
          <span style={providerBadgeStyle}>
            {provider === 'builtin' ? 'Offline' : provider}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setShowConfig(!showConfig)}
            title="Configure AI Engine & API Keys"
            style={{
              ...iconBtnStyle,
              color: showConfig ? 'var(--xivig-accent)' : 'var(--xivig-text-dim)',
              backgroundColor: showConfig ? 'rgba(108, 140, 255, 0.15)' : 'transparent',
            }}
          >
            <Settings size={13} />
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

      {/* Provider & Key Configuration Drawer */}
      {showConfig && (
        <div style={configDrawerStyle}>
          <div style={configRowStyle}>
            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>AI Provider</span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AiProvider)}
              style={selectStyle}
            >
              <option value="builtin">Built-in Engine (Offline & Fast)</option>
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="gemini">Google Gemini (Flash / Pro)</option>
              <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
              <option value="ollama">Ollama (Localhost:11434)</option>
              <option value="custom">Custom Endpoint (LM Studio / vLLM)</option>
            </select>
          </div>

          {provider === 'builtin' && (
            <div style={infoBoxStyle}>
              <Cpu size={12} color="#35b779" style={{ marginRight: '6px', flexShrink: 0 }} />
              <span>
                Zero setup needed! The built-in engine analyzes code, generates tests, and suggests fixes locally without sending code to external servers.
              </span>
            </div>
          )}

          {provider !== 'builtin' && provider !== 'ollama' && (
            <div>
              <label style={labelStyle}>
                API Key {provider === 'openai' ? '(OpenAI sk-...)' : provider === 'gemini' ? '(Google AI Studio Key)' : '(Anthropic Key)'}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API Key..."
                style={inputStyle}
              />
            </div>
          )}

          {provider !== 'builtin' && (
            <div>
              <label style={labelStyle}>Endpoint URL</label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          {provider !== 'builtin' && (
            <div>
              <label style={labelStyle}>Model Name</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
            <span style={{ color: 'var(--xivig-text-dim)', fontSize: '10.5px' }}>Strict Privacy Mode (Local only)</span>
            <input
              type="checkbox"
              checked={isPrivacyMode}
              onChange={(e) => setPrivacyMode(e.target.checked)}
            />
          </div>

          <div style={{ fontSize: '10px', color: 'var(--xivig-text-dim)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '6px' }}>
            Tokens consumed: <span style={{ color: 'var(--xivig-accent)', fontWeight: 600 }}>{totalTokensUsed}</span>
          </div>
        </div>
      )}

      {/* Active Editor Context Strip */}
      {activeDoc && (
        <div style={contextStripStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <FileCode size={11} color="var(--xivig-accent)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '10px', color: 'var(--xivig-text-muted)' }}>
              {currentCtx.isSelection ? (
                <>Selection ({currentCtx.lineCount} lines) in <strong style={{ color: '#ffffff' }}>{activeDoc.name}</strong></>
              ) : (
                <>Buffer: <strong style={{ color: '#ffffff' }}>{activeDoc.name}</strong> ({currentCtx.lineCount} lines)</>
              )}
            </span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', color: 'var(--xivig-text-dim)', flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={includeContext}
              onChange={(e) => setIncludeContext(e.target.checked)}
              style={{ margin: 0 }}
            />
            <span>Attach</span>
          </label>
        </div>
      )}

      {/* Quick Action Pills */}
      <div style={quickPillsContainerStyle}>
        <button
          onClick={() => handleSend('Explain this code in detail with architecture breakdown and time/space complexity.')}
          style={quickPillStyle}
        >
          <FileQuestion size={11} color="#60a5fa" />
          <span>Explain</span>
        </button>
        <button
          onClick={() => handleSend('Find bugs, security vulnerabilities, or edge case issues in this code and provide the fix.')}
          style={quickPillStyle}
        >
          <Bug size={11} color="#ef6464" />
          <span>Bugs</span>
        </button>
        <button
          onClick={() => handleSend('Generate comprehensive unit tests covering happy paths and edge cases.')}
          style={quickPillStyle}
        >
          <TestTube size={11} color="#35b779" />
          <span>Tests</span>
        </button>
        <button
          onClick={() => handleSend('Refactor this code for readability, performance, and modern idiomatic syntax.')}
          style={quickPillStyle}
        >
          <Wand2 size={11} color="#c084fc" />
          <span>Refactor</span>
        </button>
      </div>

      {/* Chat Messages List */}
      <div style={chatListStyle}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              ...messageCardStyle,
              backgroundColor: m.role === 'user' ? 'rgba(108, 140, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              borderColor: m.role === 'user' ? 'rgba(108, 140, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* Message Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '9.5px',
                    color: m.role === 'user' ? 'var(--xivig-accent)' : '#35b779',
                  }}
                >
                  {m.role === 'user' ? 'You' : 'Xivig Assistant'}
                </span>
                {m.fileName && (
                  <span style={fileContextBadgeStyle}>
                    {m.fileName}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '9.5px', color: 'var(--xivig-text-dim)' }}>
                {m.timestamp}
              </span>
            </div>

            {/* Message Content */}
            <div style={{ whiteSpace: 'pre-wrap', color: '#e2e8f0', fontSize: '11.5px', lineHeight: 1.55 }}>
              {m.content}
            </div>

            {/* Proposed Code Block */}
            {m.proposedCode && (
              <div style={codeBlockContainerStyle}>
                <div style={codeBlockHeaderStyle}>
                  <span style={{ fontSize: '9.5px', color: '#a5b4fc', fontWeight: 700, letterSpacing: '0.5px' }}>
                    PROPOSED CODE CHANGE
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleCopyCode(m.proposedCode!, m.id)}
                      style={codeActionBtnStyle}
                      title="Copy code to clipboard"
                    >
                      {copiedId === m.id ? (
                        <Check size={11} color="#35b779" />
                      ) : (
                        <Copy size={11} />
                      )}
                      <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => handleInsertAtCursor(m.proposedCode!, m.id)}
                      style={codeActionBtnStyle}
                      title="Insert at cursor position"
                    >
                      <ArrowDownToLine size={11} />
                      <span>Insert</span>
                    </button>

                    <button
                      onClick={() => handleApplyProposedCode(m.proposedCode!, m.id)}
                      style={{
                        ...codeActionBtnStyle,
                        backgroundColor: 'var(--xivig-accent)',
                        borderColor: 'transparent',
                        color: '#ffffff',
                        fontWeight: 600,
                      }}
                      title="Apply change to editor"
                    >
                      {appliedId === m.id ? (
                        <>
                          <Check size={11} />
                          <span>Applied!</span>
                        </>
                      ) : (
                        <>
                          <Check size={11} />
                          <span>Apply</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <pre style={codeBlockPreStyle}>
                  {m.proposedCode}
                </pre>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div style={loadingIndicatorStyle}>
            <Sparkles size={13} className="animate-spin-slow" />
            <span>Generating intelligent response...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Form Bar */}
      <div style={inputContainerStyle}>
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
            placeholder="Ask AI or type an instruction (e.g. explain, test, fix)..."
            disabled={isLoading}
            style={promptInputFieldStyle}
          />
          <button
            type="submit"
            disabled={isLoading || !promptInput.trim()}
            style={{
              ...sendBtnStyle,
              backgroundColor: promptInput.trim() ? 'var(--xivig-accent)' : 'rgba(255, 255, 255, 0.05)',
              color: promptInput.trim() ? '#ffffff' : 'var(--xivig-text-dim)',
              cursor: promptInput.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------------
// STYLES
// -------------------------------------------------------------------

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: 'var(--xivig-sidebar)',
  color: 'var(--xivig-text)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: 'var(--xivig-activity-bar)',
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.8px',
  color: '#e2e8f0',
  textTransform: 'uppercase',
};

const providerBadgeStyle: React.CSSProperties = {
  fontSize: '9.5px',
  fontWeight: 600,
  padding: '1px 5px',
  borderRadius: '4px',
  backgroundColor: 'rgba(108, 140, 255, 0.15)',
  border: '1px solid rgba(108, 140, 255, 0.3)',
  color: '#a5b4fc',
};

const iconBtnStyle: React.CSSProperties = {
  padding: '3px 5px',
  borderRadius: '4px',
  color: 'var(--xivig-text-dim)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.12s ease',
};

const configDrawerStyle: React.CSSProperties = {
  padding: '10px 12px',
  backgroundColor: '#14161f',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  fontSize: '11px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const configRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--xivig-text-dim)',
  marginBottom: '3px',
  fontSize: '10px',
  fontWeight: 500,
};

const infoBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  padding: '6px 8px',
  backgroundColor: 'rgba(53, 183, 121, 0.08)',
  border: '1px solid rgba(53, 183, 121, 0.2)',
  borderRadius: '5px',
  color: '#a7f3d0',
  fontSize: '10.5px',
  lineHeight: '1.4',
};

const contextStripStyle: React.CSSProperties = {
  padding: '5px 10px',
  backgroundColor: 'rgba(0, 0, 0, 0.25)',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
};

const quickPillsContainerStyle: React.CSSProperties = {
  padding: '6px 10px',
  display: 'flex',
  gap: '4px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  backgroundColor: 'var(--xivig-activity-bar)',
  overflowX: 'auto',
  scrollbarWidth: 'none',
};

const quickPillStyle: React.CSSProperties = {
  padding: '3px 7px',
  backgroundColor: 'rgba(255, 255, 255, 0.035)',
  border: '1px solid rgba(255, 255, 255, 0.07)',
  borderRadius: '12px',
  fontSize: '10.5px',
  color: '#e2e8f0',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  whiteSpace: 'nowrap',
  transition: 'all 0.12s ease',
};

const chatListStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const messageCardStyle: React.CSSProperties = {
  padding: '9px 11px',
  borderRadius: '8px',
  border: '1px solid',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
};

const fileContextBadgeStyle: React.CSSProperties = {
  fontSize: '9px',
  color: 'var(--xivig-text-dim)',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  padding: '1px 5px',
  borderRadius: '3px',
};

const codeBlockContainerStyle: React.CSSProperties = {
  marginTop: '8px',
  padding: '8px',
  backgroundColor: '#0d0f16',
  borderRadius: '6px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
};

const codeBlockHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px',
};

const codeActionBtnStyle: React.CSSProperties = {
  padding: '2px 7px',
  fontSize: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px',
  color: '#e2e8f0',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
  transition: 'all 0.12s ease',
};

const codeBlockPreStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '11px',
  fontFamily: 'var(--xivig-font-mono)',
  color: '#93c5fd',
  whiteSpace: 'pre-wrap',
  maxHeight: '180px',
  overflowY: 'auto',
  lineHeight: 1.45,
};

const loadingIndicatorStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--xivig-accent)',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontStyle: 'italic',
  padding: '4px 0',
};

const inputContainerStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderTop: '1px solid var(--xivig-border-subtle)',
  backgroundColor: 'var(--xivig-activity-bar)',
};

const promptInputFieldStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 9px',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '11.5px',
  outline: 'none',
};

const sendBtnStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: 'none',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
};

const selectStyle: React.CSSProperties = {
  backgroundColor: '#1a1d28',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px',
  color: '#e5e7eb',
  fontSize: '10.5px',
  padding: '3px 6px',
  outline: 'none',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 7px',
  backgroundColor: '#1a1d28',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px',
  color: '#e5e7eb',
  fontSize: '10.5px',
  outline: 'none',
  boxSizing: 'border-box',
};
