import React, { useState } from 'react';
import { useLspStore } from '../../lsp/lspStore';
import { LanguageServerProfile } from '../../lsp/types';
import {
  Server,
  Play,
  Square,
  RotateCw,
  Settings,
  Copy,
  Check,
  X,
  Search,
  ExternalLink,
  Terminal,
  Activity,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const LanguageServersModal: React.FC = () => {
  const isModalOpen = useLspStore((state) => state.isModalOpen);
  const closeModal = useLspStore((state) => state.closeModal);
  const servers = useLspStore((state) => state.servers);
  const startServer = useLspStore((state) => state.startServer);
  const stopServer = useLspStore((state) => state.stopServer);
  const restartServer = useLspStore((state) => state.restartServer);
  const updateConfig = useLspStore((state) => state.updateConfig);

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit config form state
  const [commandInput, setCommandInput] = useState('');
  const [argsInput, setArgsInput] = useState('');
  const [autoStartInput, setAutoStartInput] = useState(true);
  const [enabledInput, setEnabledInput] = useState(true);

  if (!isModalOpen) return null;

  const filteredServers = servers.filter((s) => {
    if (filter === 'running' && s.status !== 'running') return false;
    if (filter === 'stopped' && s.status === 'running') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.languages.some((l: string) => l.toLowerCase().includes(q)) ||
      s.fileExtensions.some((ext: string) => ext.toLowerCase().includes(q))
    );
  });

  const handleStartEdit = (server: LanguageServerProfile) => {
    setEditingServerId(server.id);
    setCommandInput(server.command);
    setArgsInput(server.args.join(' '));
    setAutoStartInput(server.autoStart);
    setEnabledInput(server.enabled);
  };

  const handleSaveEdit = async (serverId: string) => {
    const args = argsInput.trim() ? argsInput.trim().split(/\s+/) : [];
    await updateConfig(serverId, {
      command: commandInput.trim(),
      args,
      autoStart: autoStartInput,
      enabled: enabledInput,
    });
    setEditingServerId(null);
  };

  const handleCopyGuide = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        style={{
          width: '900px',
          maxWidth: '94vw',
          maxHeight: '88vh',
          backgroundColor: 'var(--xivig-bg, #17191f)',
          border: '1px solid var(--xivig-border, #2c313d)',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          fontFamily: 'var(--xivig-font-sans, system-ui, sans-serif)',
          color: 'var(--xivig-text, #e5e7eb)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--xivig-border, #2c313d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--xivig-surface, #1d2028)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server size={20} color="var(--xivig-accent, #6c8cff)" />
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                Language Server Protocol (LSP) Manager
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--xivig-text-muted, #9299a8)' }}>
                Intelligent code completion, real-time diagnostics, definitions, and symbol indexing.
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--xivig-text-muted, #9299a8)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--xivig-border-subtle, #21252f)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--xivig-surface, #1d2028)',
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--xivig-bg, #17191f)',
              border: '1px solid var(--xivig-border, #2c313d)',
              borderRadius: '6px',
              padding: '6px 12px',
            }}
          >
            <Search size={14} color="var(--xivig-text-dim, #646b7a)" />
            <input
              type="text"
              placeholder="Filter by language, extension, or server name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--xivig-text, #e5e7eb)',
                outline: 'none',
                fontSize: '12px',
                width: '100%',
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['all', 'running', 'stopped'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: filter === mode ? 'var(--xivig-accent, #6c8cff)' : 'rgba(255, 255, 255, 0.05)',
                  color: filter === mode ? '#fff' : 'var(--xivig-text-muted, #9299a8)',
                  textTransform: 'capitalize',
                }}
              >
                {mode} ({servers.filter((s) => (mode === 'all' ? true : mode === 'running' ? s.status === 'running' : s.status !== 'running')).length})
              </button>
            ))}
          </div>
        </div>

        {/* Server List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredServers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--xivig-text-muted, #9299a8)' }}>
              No language servers match your filter.
            </div>
          ) : (
            filteredServers.map((server) => {
              const isEditing = editingServerId === server.id;
              const isRunning = server.status === 'running';

              return (
                <div
                  key={server.id}
                  style={{
                    backgroundColor: 'var(--xivig-surface, #1d2028)',
                    border: isRunning
                      ? '1px solid rgba(108, 140, 255, 0.4)'
                      : '1px solid var(--xivig-border, #2c313d)',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {/* Top Row: Title, Status Badge, Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor:
                            server.status === 'running'
                              ? '#35b779'
                              : server.status === 'starting'
                              ? '#e6ad45'
                              : server.status === 'error'
                              ? '#ef6464'
                              : '#646b7a',
                          boxShadow: isRunning ? '0 0 8px #35b779' : 'none',
                        }}
                      />
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>{server.name}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: isRunning ? 'rgba(53, 183, 121, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: isRunning ? '#35b779' : 'var(--xivig-text-muted, #9299a8)',
                          textTransform: 'uppercase',
                          fontWeight: '600',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {server.status} {server.pid ? `(PID: ${server.pid})` : ''}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isRunning ? (
                        <>
                          <button
                            onClick={() => restartServer(server.id)}
                            title="Restart Server"
                            style={{
                              background: 'none',
                              border: '1px solid var(--xivig-border, #2c313d)',
                              color: 'var(--xivig-text, #e5e7eb)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                            }}
                          >
                            <RotateCw size={13} />
                            Restart
                          </button>
                          <button
                            onClick={() => stopServer(server.id)}
                            title="Stop Server"
                            style={{
                              background: 'rgba(239, 100, 100, 0.15)',
                              border: '1px solid rgba(239, 100, 100, 0.3)',
                              color: '#ef6464',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                            }}
                          >
                            <Square size={13} />
                            Stop
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startServer(server.id)}
                          title="Start Server"
                          style={{
                            background: 'var(--xivig-accent, #6c8cff)',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                          }}
                        >
                          <Play size={13} fill="#fff" />
                          Start
                        </button>
                      )}

                      <button
                        onClick={() => (isEditing ? setEditingServerId(null) : handleStartEdit(server))}
                        title="Configure Server Command & Arguments"
                        style={{
                          background: isEditing ? 'rgba(108, 140, 255, 0.2)' : 'none',
                          border: '1px solid var(--xivig-border, #2c313d)',
                          color: isEditing ? 'var(--xivig-accent, #6c8cff)' : 'var(--xivig-text-muted, #9299a8)',
                          borderRadius: '6px',
                          padding: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                        }}
                      >
                        <Settings size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Languages & File Extensions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: 'var(--xivig-text-dim, #646b7a)' }}>Languages:</span>
                    {server.languages.map((lang: string) => (
                      <span
                        key={lang}
                        style={{
                          fontSize: '11px',
                          backgroundColor: 'rgba(108, 140, 255, 0.12)',
                          color: 'var(--xivig-accent, #6c8cff)',
                          padding: '1px 6px',
                          borderRadius: '3px',
                        }}
                      >
                        {lang}
                      </span>
                    ))}
                    <span style={{ fontSize: '11px', color: 'var(--xivig-text-dim, #646b7a)', marginLeft: '8px' }}>
                      Extensions:
                    </span>
                    {server.fileExtensions.map((ext: string) => (
                      <span
                        key={ext}
                        style={{
                          fontSize: '11px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--xivig-text-muted, #9299a8)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          fontFamily: 'var(--xivig-font-mono, monospace)',
                        }}
                      >
                        {ext}
                      </span>
                    ))}
                  </div>

                  {/* Installation Command / Hint */}
                  {server.installGuide && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--xivig-bg, #17191f)',
                        padding: '6px 10px',
                        borderRadius: '5px',
                        fontSize: '11px',
                        border: '1px solid var(--xivig-border-subtle, #21252f)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <Terminal size={12} color="var(--xivig-text-dim, #646b7a)" />
                        <span style={{ fontFamily: 'var(--xivig-font-mono, monospace)', color: 'var(--xivig-text-muted, #9299a8)' }}>
                          {server.installGuide}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyGuide(server.id, server.installGuide!)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedId === server.id ? '#35b779' : 'var(--xivig-text-muted, #9299a8)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                        }}
                      >
                        {copiedId === server.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedId === server.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}

                  {/* Inline Configuration Drawer */}
                  {isEditing && (
                    <div
                      style={{
                        marginTop: '6px',
                        padding: '12px',
                        backgroundColor: 'var(--xivig-bg, #17191f)',
                        borderRadius: '6px',
                        border: '1px solid var(--xivig-border, #2c313d)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: 'var(--xivig-text-muted, #9299a8)' }}>
                            Executable Command / Binary Path:
                          </label>
                          <input
                            type="text"
                            value={commandInput}
                            onChange={(e) => setCommandInput(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              backgroundColor: 'var(--xivig-surface, #1d2028)',
                              border: '1px solid var(--xivig-border, #2c313d)',
                              borderRadius: '4px',
                              color: 'var(--xivig-text, #e5e7eb)',
                              fontSize: '12px',
                              fontFamily: 'var(--xivig-font-mono, monospace)',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: 'var(--xivig-text-muted, #9299a8)' }}>
                            Command Arguments (space-separated):
                          </label>
                          <input
                            type="text"
                            value={argsInput}
                            onChange={(e) => setArgsInput(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              backgroundColor: 'var(--xivig-surface, #1d2028)',
                              border: '1px solid var(--xivig-border, #2c313d)',
                              borderRadius: '4px',
                              color: 'var(--xivig-text, #e5e7eb)',
                              fontSize: '12px',
                              fontFamily: 'var(--xivig-font-mono, monospace)',
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={autoStartInput}
                              onChange={(e) => setAutoStartInput(e.target.checked)}
                            />
                            Auto-start on file open
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={enabledInput}
                              onChange={(e) => setEnabledInput(e.target.checked)}
                            />
                            Enabled
                          </label>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setEditingServerId(null)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '4px',
                              border: '1px solid var(--xivig-border, #2c313d)',
                              backgroundColor: 'transparent',
                              color: 'var(--xivig-text-muted, #9299a8)',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(server.id)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: 'var(--xivig-accent, #6c8cff)',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                            }}
                          >
                            Save Settings
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--xivig-border, #2c313d)',
            backgroundColor: 'var(--xivig-surface, #1d2028)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--xivig-text-muted, #9299a8)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} color="#35b779" />
            <span>Multiple language servers can run concurrently without restarting Xivig.</span>
          </div>
          <button
            onClick={closeModal}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              backgroundColor: 'var(--xivig-accent, #6c8cff)',
              color: '#fff',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
