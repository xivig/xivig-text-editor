import React, { useEffect } from 'react';
import { ArrowUpCircle, ExternalLink, X, CheckCircle, RefreshCw, Download, RotateCw } from 'lucide-react';
import { useUpdateStore } from '../../stores/updateStore';

interface UpdateBannerProps {
  manualCheckTrigger?: number;
}

export const UpdateNotificationBanner: React.FC<UpdateBannerProps> = ({ manualCheckTrigger }) => {
  const isChecking = useUpdateStore((state) => state.isChecking);
  const isDownloading = useUpdateStore((state) => state.isDownloading);
  const isApplying = useUpdateStore((state) => state.isApplying);
  const updateInfo = useUpdateStore((state) => state.updateInfo);
  const downloadProgress = useUpdateStore((state) => state.downloadProgress);
  const downloadedInfo = useUpdateStore((state) => state.downloadedInfo);
  const statusMessage = useUpdateStore((state) => state.statusMessage);
  const isDismissed = useUpdateStore((state) => state.isBannerDismissed);

  const setBannerDismissed = useUpdateStore((state) => state.setBannerDismissed);
  const setStatusMessage = useUpdateStore((state) => state.setStatusMessage);
  const checkForUpdates = useUpdateStore((state) => state.checkForUpdates);
  const startDownload = useUpdateStore((state) => state.startDownload);
  const applyAndRestart = useUpdateStore((state) => state.applyAndRestart);
  const initializeListeners = useUpdateStore((state) => state.initializeListeners);

  // Initialize Electron update events listener once on mount
  useEffect(() => {
    const cleanup = initializeListeners();
    return cleanup;
  }, [initializeListeners]);

  // Handle manual update check trigger if prop changes
  useEffect(() => {
    if (manualCheckTrigger && manualCheckTrigger > 0) {
      checkForUpdates(true);
    }
  }, [manualCheckTrigger, checkForUpdates]);

  if (isChecking) {
    return (
      <div style={bannerContainerStyle} role="status">
        <div style={bannerContentStyle}>
          <RefreshCw size={13} className="animate-spin" style={{ color: 'var(--xivig-accent)', marginRight: '8px' }} />
          <span style={{ fontSize: '12px', color: 'var(--xivig-text)' }}>Checking for Xivig updates...</span>
        </div>
      </div>
    );
  }

  if (statusMessage) {
    return (
      <div
        style={{
          ...bannerContainerStyle,
          backgroundColor: statusMessage.includes('Could not')
            ? 'rgba(239, 68, 68, 0.15)'
            : 'rgba(78, 201, 176, 0.15)',
          borderColor: statusMessage.includes('Could not')
            ? 'var(--xivig-error)'
            : 'var(--xivig-accent)',
        }}
        role="status"
      >
        <div style={bannerContentStyle}>
          <CheckCircle size={14} style={{ color: 'var(--xivig-accent)', marginRight: '8px' }} />
          <span style={{ fontSize: '12px', color: 'var(--xivig-text)' }}>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} style={iconButtonStyle} aria-label="Dismiss">
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  // 1. If update is downloaded and ready to restart (VS Code style seamless reload)
  if (downloadedInfo && !isDismissed) {
    return (
      <div
        style={{
          ...bannerContainerStyle,
          borderColor: '#35b779',
          backgroundColor: 'rgba(53, 183, 121, 0.15)',
        }}
        role="alert"
        aria-live="assertive"
      >
        <div style={bannerContentStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <CheckCircle size={15} style={{ color: '#35b779', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--xivig-text)' }}>
              <strong>Update Ready:</strong> Xivig <strong>v{downloadedInfo.version}</strong> has been downloaded. Restart the IDE to update seamlessly without manual installation.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => applyAndRestart()}
              disabled={isApplying}
              style={{ ...actionButtonStyle, backgroundColor: '#35b779' }}
              title="Restart Xivig and apply update in-place without manual installer prompts"
            >
              <RotateCw size={12} style={{ marginRight: '5px' }} className={isApplying ? 'animate-spin' : ''} />
              <span>{isApplying ? 'Restarting IDE...' : 'Restart Xivig to Update'}</span>
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              style={iconButtonStyle}
              title="Dismiss notice (update will apply on next restart)"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. If update is available (downloading or ready to download)
  if (updateInfo?.updateAvailable && !isDismissed) {
    return (
      <div style={bannerContainerStyle} role="alert" aria-live="polite">
        <div style={bannerContentStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <ArrowUpCircle size={15} style={{ color: 'var(--xivig-accent)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--xivig-text)' }}>
              <strong>Update Available:</strong> Xivig <strong>v{updateInfo.latestVersion}</strong> is available (Current: v{updateInfo.currentVersion}).
            </span>
            {isDownloading && downloadProgress && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
                <div style={progressTrackStyle}>
                  <div style={{ ...progressBarStyle, width: `${downloadProgress.percent}%` }} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--xivig-text-dim)' }}>
                  {downloadProgress.percent}%
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isDownloading ? (
              <span style={{ fontSize: '11px', color: 'var(--xivig-accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={11} className="animate-spin" />
                Downloading update in background...
              </span>
            ) : updateInfo.downloadUrl ? (
              <button
                onClick={() => startDownload()}
                style={actionButtonStyle}
                title="Download update in background"
              >
                <Download size={12} style={{ marginRight: '4px' }} />
                <span>Download Update</span>
              </button>
            ) : null}

            <button
              onClick={() => window.xivig?.openReleasePage?.(updateInfo.htmlUrl)}
              style={{
                ...actionButtonStyle,
                backgroundColor: 'transparent',
                border: '1px solid var(--xivig-border)',
                color: 'var(--xivig-text)',
              }}
              title="View release notes on GitHub"
            >
              <span>Release Notes</span>
              <ExternalLink size={11} style={{ marginLeft: '4px' }} />
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
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
  }

  return null;
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
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  maxWidth: '1200px',
  gap: '12px',
};

const actionButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: 'var(--xivig-accent)',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 0.15s ease',
};

const iconButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--xivig-text-dim)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px',
  borderRadius: '4px',
  transition: 'color 0.15s ease',
};

const progressTrackStyle: React.CSSProperties = {
  width: '70px',
  height: '6px',
  backgroundColor: 'var(--xivig-border)',
  borderRadius: '3px',
  overflow: 'hidden',
};

const progressBarStyle: React.CSSProperties = {
  height: '100%',
  backgroundColor: 'var(--xivig-accent)',
  borderRadius: '3px',
  transition: 'width 0.2s ease',
};
