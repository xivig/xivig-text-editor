import React, { useState, useEffect } from 'react';
import { ArrowUpCircle, ExternalLink, X, CheckCircle, RefreshCw } from 'lucide-react';
import { UpdateCheckResult } from '../../types/electron';

interface UpdateBannerProps {
  manualCheckTrigger?: number;
}

export const UpdateNotificationBanner: React.FC<UpdateBannerProps> = ({ manualCheckTrigger }) => {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [upToDateMessage, setUpToDateMessage] = useState<string | null>(null);

  // Listen for automatic update notifications from main process
  useEffect(() => {
    if (!window.xivig?.onUpdateAvailable) return;
    const unsubscribe = window.xivig.onUpdateAvailable((info) => {
      if (info.updateAvailable) {
        setUpdateInfo(info);
        setIsDismissed(false);
      }
    });
    return unsubscribe;
  }, []);

  // Handle manual update checks
  useEffect(() => {
    if (!manualCheckTrigger || manualCheckTrigger <= 0) return;

    let mounted = true;
    setIsChecking(true);
    setUpToDateMessage(null);
    setIsDismissed(false);

    if (window.xivig?.checkForUpdates) {
      window.xivig.checkForUpdates().then((info) => {
        if (!mounted) return;
        setIsChecking(false);
        if (info.updateAvailable) {
          setUpdateInfo(info);
        } else {
          setUpToDateMessage(`You are running the latest version of Xivig (v${info.currentVersion})!`);
          setTimeout(() => {
            if (mounted) setUpToDateMessage(null);
          }, 5000);
        }
      }).catch((err) => {
        if (!mounted) return;
        setIsChecking(false);
        setUpToDateMessage(`Could not check for updates: ${err.message || 'Offline'}`);
        setTimeout(() => {
          if (mounted) setUpToDateMessage(null);
        }, 5000);
      });
    }

    return () => {
      mounted = false;
    };
  }, [manualCheckTrigger]);

  if (isChecking) {
    return (
      <div style={bannerContainerStyle}>
        <div style={bannerContentStyle}>
          <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--xivig-accent)', marginRight: '8px' }} />
          <span style={{ fontSize: '12px', color: 'var(--xivig-text)' }}>Checking for Xivig updates...</span>
        </div>
      </div>
    );
  }

  if (upToDateMessage) {
    return (
      <div style={{ ...bannerContainerStyle, backgroundColor: 'rgba(78, 201, 176, 0.15)', borderColor: 'var(--xivig-accent)' }}>
        <div style={bannerContentStyle}>
          <CheckCircle size={14} style={{ color: 'var(--xivig-accent)', marginRight: '8px' }} />
          <span style={{ fontSize: '12px', color: 'var(--xivig-text)' }}>{upToDateMessage}</span>
          <button
            onClick={() => setUpToDateMessage(null)}
            style={iconButtonStyle}
            aria-label="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  if (!updateInfo?.updateAvailable || isDismissed) {
    return null;
  }

  return (
    <div style={bannerContainerStyle} role="alert" aria-live="polite">
      <div style={bannerContentStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <ArrowUpCircle size={15} style={{ color: 'var(--xivig-accent)', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: 'var(--xivig-text)' }}>
            <strong>Update Available:</strong> Xivig <strong>v{updateInfo.latestVersion}</strong> is available for download (Current: v{updateInfo.currentVersion}).
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => window.xivig?.openReleasePage?.(updateInfo.htmlUrl)}
            style={actionButtonStyle}
            title="Download the latest version on GitHub"
          >
            <span>View & Download</span>
            <ExternalLink size={12} style={{ marginLeft: '4px' }} />
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            style={iconButtonStyle}
            title="Dismiss update notice"
            aria-label="Dismiss update notice"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const bannerContainerStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-surface)',
  borderBottom: '1px solid var(--xivig-border)',
  borderTop: '2px solid var(--xivig-accent)',
  padding: '6px 14px',
  display: 'flex',
  justifyContent: 'center',
  zIndex: 999,
  userSelect: 'none',
  animation: 'slideDown 0.2s ease',
};

const bannerContentStyle: React.CSSProperties = {
  maxWidth: '1200px',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const actionButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'var(--xivig-accent)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '4px',
  padding: '4px 10px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
};

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--xivig-text-dim)',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  borderRadius: '4px',
};
