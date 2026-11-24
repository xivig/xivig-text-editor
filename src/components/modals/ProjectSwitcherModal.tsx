import React, { useState } from 'react';
import { Folder, FolderPlus, ShieldCheck, ShieldAlert, X, Check, Trash2 } from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectSwitcherModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const currentFolderPath = useFileStore((state) => state.currentFolderPath);
  const recentWorkspaces = useFileStore((state) => state.recentWorkspaces);
  const workspaceFolders = useFileStore((state) => state.workspaceFolders);
  const addWorkspaceFolder = useFileStore((state) => state.addWorkspaceFolder);
  const removeWorkspaceFolder = useFileStore((state) => state.removeWorkspaceFolder);
  const trustedWorkspaces = useFileStore((state) => state.trustedWorkspaces);
  const setWorkspaceTrust = useFileStore((state) => state.setWorkspaceTrust);
  const [filter, setFilter] = useState('');

  if (!isOpen) return null;

  const handleOpenFolder = async () => {
    if (window.xivig?.openFolderDialog) {
      const res = await window.xivig.openFolderDialog();
      if (!res.canceled && res.folderPath) {
        addWorkspaceFolder(res.folderPath);
        onClose();
      }
    }
  };

  const filteredRecents = recentWorkspaces.filter(
    (w) => !filter || w.name.toLowerCase().includes(filter.toLowerCase()) || w.path.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '600px',
          maxHeight: '80vh',
          backgroundColor: 'var(--xivig-bg, #12141a)',
          border: '1px solid var(--xivig-border, #2c313d)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          color: 'var(--xivig-text, #e5e7eb)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--xivig-border, #2c313d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Folder size={18} style={{ color: 'var(--xivig-accent, #6c8cff)' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Project & Workspace Manager</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--xivig-text-dim, #646b7a)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Actions */}
        <div style={{ padding: '12px 20px', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            autoFocus
            placeholder="Search recent projects and folders..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'var(--xivig-surface, #1d2028)',
              border: '1px solid var(--xivig-border, #2c313d)',
              borderRadius: '4px',
              padding: '8px 12px',
              fontSize: '12px',
              color: '#fff',
            }}
          />
          <button
            onClick={handleOpenFolder}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--xivig-accent, #6c8cff)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 14px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <FolderPlus size={15} />
            Add Folder
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' }}>
          {/* Active Workspace Roots */}
          {workspaceFolders.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--xivig-accent, #6c8cff)', marginBottom: '8px' }}>
                WORKSPACE FOLDERS (MULTI-ROOT)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {workspaceFolders.map((wf) => (
                  <div
                    key={wf.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--xivig-surface, #1d2028)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{wf.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--xivig-text-dim, #646b7a)' }}>{wf.path}</div>
                    </div>
                    <button
                      onClick={() => removeWorkspaceFolder(wf.path)}
                      title="Remove folder from workspace"
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Workspaces */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--xivig-text-dim, #646b7a)', marginBottom: '8px' }}>
              RECENT WORKSPACES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredRecents.map((item) => {
                const isTrusted = trustedWorkspaces[item.path] ?? true;
                const isCurrent = currentFolderPath === item.path;

                return (
                  <div
                    key={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      backgroundColor: isCurrent ? 'rgba(108, 140, 255, 0.1)' : 'var(--xivig-surface, #1d2028)',
                      border: isCurrent ? '1px solid rgba(108, 140, 255, 0.3)' : '1px solid transparent',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.name}</span>
                        {isCurrent && (
                          <span style={{ fontSize: '10px', backgroundColor: '#6c8cff', color: '#fff', padding: '1px 5px', borderRadius: '3px' }}>
                            Current
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--xivig-text-dim, #646b7a)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {item.path}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => setWorkspaceTrust(item.path, !isTrusted)}
                        title={isTrusted ? 'Workspace is Trusted (Click to set Restricted)' : 'Workspace is Restricted (Click to Trust)'}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: isTrusted ? '#22c55e' : '#f59e0b',
                        }}
                      >
                        {isTrusted ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                        {isTrusted ? 'Trusted' : 'Restricted'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
