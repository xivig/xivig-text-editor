import React, { useEffect, useState } from 'react';
import { X, KeyRound, AlertTriangle, Check } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const RemoveLicenseModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isRemoveLicenseOpen);
  const close = useUIStore((state) => state.closeRemoveLicenseModal);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  useEffect(() => {
    if (isOpen) {
      setRemoved(false);
    }
  }, [isOpen]);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={15} color="#eab308" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
              Remove License
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
          {removed ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(52, 211, 153, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                }}
              >
                <Check size={24} color="#34d399" />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
                License Key Removed
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
                Xivig Text Editor is now operating under the Community Open Source License.
              </div>
              <button
                onClick={close}
                style={{
                  marginTop: '18px',
                  backgroundColor: '#35363a',
                  border: '1px solid #4a4d55',
                  color: '#ffffff',
                  padding: '6px 20px',
                  borderRadius: '3px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  backgroundColor: '#1e1f23',
                  padding: '14px 16px',
                  borderRadius: '4px',
                  border: '1px solid #33353c',
                  marginBottom: '16px',
                }}
              >
                <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                    Active Registration
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', lineHeight: 1.5 }}>
                    Registered To: <strong style={{ color: '#ffffff' }}>Bandhu</strong>
                    <br />
                    Tier: <span style={{ color: '#4aa2f2' }}>Xivig Open License</span>
                    <br />
                    Key: <code style={{ color: '#a3e635' }}>XIVIG-2026-ACTIVE-PERPETUAL</code>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5, marginBottom: '20px' }}>
                Are you sure you want to remove this license? You can restore or enter a new license key anytime.
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={close}
                  style={{
                    backgroundColor: '#35363a',
                    border: '1px solid #4a4d55',
                    color: '#ffffff',
                    padding: '6px 16px',
                    borderRadius: '3px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#44464c')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#35363a')}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setRemoved(true)}
                  style={{
                    backgroundColor: '#e11d48',
                    border: '1px solid #f43f5e',
                    color: '#ffffff',
                    padding: '6px 16px',
                    borderRadius: '3px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#be123c')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e11d48')}
                >
                  Remove License
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
