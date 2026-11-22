import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import logoUrl from '../../assets/logo.png';

export const AboutModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isAboutModalOpen);
  const close = useUIStore((state) => state.closeAboutModal);
  const [buildTimestamp] = useState(() => new Date().toISOString());

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
          maxWidth: '600px',
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
            height: '42px',
            backgroundColor: '#35363a',
            borderBottom: '1px solid #44464c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px 0 20px',
            userSelect: 'none',
          }}
        >
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
            About
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
              transition: 'all 0.15s ease',
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
        <div
          style={{
            padding: '30px 28px 32px 24px',
            display: 'flex',
            gap: '24px',
            alignItems: 'flex-start',
          }}
        >
          {/* Logo Icon on Left */}
          <div style={{ flexShrink: 0, marginTop: '2px' }}>
            <img
              src={logoUrl}
              alt="Xivig Text Editor Logo"
              width="76"
              height="76"
              style={{
                borderRadius: '12px',
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.35)',
                display: 'block',
              }}
            />
          </div>

          {/* Right Info Column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Release Information */}
            <div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 500,
                  color: '#ffffff',
                  letterSpacing: '0.2px',
                  marginBottom: '6px',
                }}
              >
                Xivig Text Editor
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
                Release 1.0
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
                build timestamp: {buildTimestamp}
              </div>
            </div>

            {/* Release Credits */}
            <div style={{ fontSize: '12px', color: '#d1d5db', lineHeight: 1.5 }}>
              Release Credits:{' '}
              <span
                style={{
                  color: '#4aa2f2',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Bandhu
              </span>
            </div>

            {/* Copyright */}
            <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
              Copyright 2026 - Xivig. All rights reserved.
            </div>

            {/* Third Party Libraries */}
            <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
              Third Party Libraries that we use -{' '}
              <span
                style={{
                  color: '#4aa2f2',
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                onClick={() => {
                  alert(
                    'Third Party Attributions:\n• CodeMirror 6 (MIT)\n• xterm.js (MIT)\n• js-beautify (MIT)\n• Lucide Icons (ISC)\n• React & Vite (MIT)'
                  );
                }}
              >
                Licences and Attributions
              </span>{' '}
              .
            </div>

            {/* Documentation and Source */}
            <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
              Documentation and source at{' '}
              <a
                href="https://github.com/xivig/xivig-text-editor"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#4aa2f2',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  wordBreak: 'break-all',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                https://github.com/xivig/xivig-text-editor
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
