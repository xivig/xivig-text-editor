import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const AboutModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isAboutModalOpen);
  const close = useUIStore((state) => state.closeAboutModal);

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
          maxWidth: '620px',
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
            <svg
              width="78"
              height="78"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(234, 88, 12, 0.35))' }}
            >
              {/* Origami Falcon / Star emblem */}
              <polygon points="50,12 36,46 50,40" fill="#fb923c" />
              <polygon points="50,12 50,40 64,46" fill="#f97316" />
              <polygon points="10,48 44,36 48,48" fill="#f59e0b" />
              <polygon points="10,48 48,48 38,62" fill="#ea580c" />
              <polygon points="50,40 38,62 50,88" fill="#e11d48" />
              <polygon points="50,40 50,88 62,62" fill="#dc2626" />
              <polygon points="90,48 52,36 50,48" fill="#f97316" />
              <polygon points="90,48 50,48 62,62" fill="#b91c1c" />
              <polygon points="36,46 50,40 48,48" fill="#fef08a" />
              <polygon points="64,46 50,40 52,48" fill="#fdba74" />
            </svg>
          </div>

          {/* Right Info Column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* App Name & Version Details */}
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
                Phoenix Code
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
                Release 5.5 build 5.5.11-23832
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
                Phoenix Pro Build: d786c9f
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
                build timestamp: 2026-10-27T11:04:30.905Z
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
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Bandhu
              </span>
            </div>

            {/* Copyright */}
            <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
              Copyright 2021 - present{' '}
              <span
                style={{
                  color: '#4aa2f2',
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Core.ai
              </span>{' '}
              and its licensors. All rights reserved.
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

            {/* MDN License */}
            <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
              MDN Docs and the MDN graphical logo are licensed under a Creative Commons Attribution license,{' '}
              <a
                href="https://creativecommons.org/licenses/by-sa/2.5/"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#4aa2f2',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                CC-BY-SA 2.5 Unported
              </a>
              .
            </div>

            {/* Documentation Link */}
            <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
              Documentation and source at{' '}
              <a
                href="https://github.com/phcode-dev/phoenix"
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
                https://github.com/phcode-dev/phoenix/
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
