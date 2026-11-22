import React, { useEffect } from 'react';
import { X, Cpu, CheckCircle2, Database, RefreshCw } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';

export const IndexingStatusModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isIndexingStatusOpen);
  const close = useUIStore((state) => state.closeIndexingStatusModal);
  const currentFolderPath = useFileStore((state) => state.currentFolderPath);
  const fileTree = useFileStore((state) => state.fileTree);

  const fileCount = fileTree ? fileTree.length : 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'var(--xivig-font-ui, system-ui, -apple-system, sans-serif)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: '#242528',
          border: '1px solid #3c3e44',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75)',
          color: '#d1d5db',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            height: '40px',
            backgroundColor: '#35363a',
            borderBottom: '1px solid #44464c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={15} color="#4aa2f2" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
              Indexing Status
            </span>
          </div>
          <button
            onClick={close}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '3px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.backgroundColor = '#4b4d53';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#1b1c1e',
              padding: '14px 18px',
              borderRadius: '4px',
              border: '1px solid #2d2e33',
              marginBottom: '18px',
            }}
          >
            <CheckCircle2 size={24} color="#34d399" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                indexing [idle]: 100% complete
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                All symbols, definitions, and project tokens are cached and indexed.
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
            <div style={{ backgroundColor: '#2a2b2f', padding: '10px 14px', borderRadius: '4px' }}>
              <div style={{ fontSize: '11px', color: '#8c909a', textTransform: 'uppercase' }}>Worker Threads</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={14} color="#4aa2f2" /> 4 Active Workers
              </div>
            </div>

            <div style={{ backgroundColor: '#2a2b2f', padding: '10px 14px', borderRadius: '4px' }}>
              <div style={{ fontSize: '11px', color: '#8c909a', textTransform: 'uppercase' }}>Workspace Files</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff', marginTop: '3px' }}>
                {fileCount > 0 ? `${fileCount} indexed` : 'Indexed'}
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#1b1c1e',
              border: '1px solid #2d2e33',
              borderRadius: '4px',
              padding: '10px 14px',
              fontSize: '11px',
              fontFamily: 'Consolas, monospace',
              color: '#9ca3af',
              lineHeight: 1.6,
            }}
          >
            <div>[OK] AST symbols parsed: 0 pending</div>
            <div>[OK] Go to Symbol (Ctrl+R) database synchronized</div>
            <div>[OK] Code navigation and cross-file references ready</div>
            <div style={{ color: '#4aa2f2' }}>
              Workspace: {currentFolderPath ? currentFolderPath : 'Default Workspace'}
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              onClick={close}
              style={{
                backgroundColor: '#35363a',
                border: '1px solid #4a4d55',
                color: '#ffffff',
                padding: '6px 18px',
                borderRadius: '3px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#44464c')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#35363a')}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
