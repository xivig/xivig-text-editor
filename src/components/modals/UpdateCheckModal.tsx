import React, { useEffect } from 'react';
import { X, CheckCircle, ExternalLink } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const UpdateCheckModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isUpdateCheckOpen);
  const close = useUIStore((state) => state.closeUpdateCheckModal);

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
          maxWidth: '480px',
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
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
            Check for Updates
          </span>
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
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(52, 211, 153, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <CheckCircle size={28} color="#34d399" />
          </div>

          <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
            Xivig Text Editor is up to date
          </div>

          <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '6px', lineHeight: 1.5 }}>
            You are running the newest version available: <strong>Release 1.0 (v1.0.0)</strong>.
          </div>

          <div
            style={{
              backgroundColor: '#1b1c1e',
              border: '1px solid #2d2e33',
              borderRadius: '4px',
              padding: '10px 14px',
              margin: '18px 0',
              fontSize: '12px',
              color: '#9ca3af',
              textAlign: 'left',
              lineHeight: 1.6,
            }}
          >
            <div>• Channel: <strong>Stable</strong></div>
            <div>• Architecture: <strong>x64 / arm64</strong></div>
            <div>• Security: <strong>Up to date</strong></div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={() => window.open('https://github.com/xivig/xivig-text-editor/releases', '_blank')}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #4a4d55',
                color: '#4aa2f2',
                padding: '6px 16px',
                borderRadius: '3px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2d2e33')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ExternalLink size={13} />
              Releases
            </button>
            <button
              onClick={close}
              style={{
                backgroundColor: '#0e639c',
                border: '1px solid #1177bb',
                color: '#ffffff',
                padding: '6px 24px',
                borderRadius: '3px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1177bb')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0e639c')}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
