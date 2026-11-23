import React, { useState, useEffect } from 'react';
import { ArrowUpCircle, ExternalLink, X, CheckCircle, RefreshCw, Download, RotateCw } from 'lucide-react';
import { UpdateCheckResult, UpdateProgress, DownloadedUpdateInfo } from '../../types/electron';

interface UpdateBannerProps {
  manualCheckTrigger?: number;
}

export const UpdateNotificationBanner: React.FC<UpdateBannerProps> = ({ manualCheckTrigger }) => {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null);
  const [downloadedInfo, setDownloadedInfo] = useState<DownloadedUpdateInfo | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [upToDateMessage, setUpToDateMessage] = useState<string | null>(null);

  // Check if an update was already downloaded and listen for update events
  useEffect(() => {
    // Check initial downloaded status
    if (window.xivig?.getDownloadedUpdateInfo) {
      window.xivig.getDownloadedUpdateInfo().then((info) => {
        if (info) {
          setDownloadedInfo(info);
          setIsDismissed(false);
        }
      }).catch(() => {});
    }

    if (!window.xivig) return;

    const unsubAvailable = window.xivig.onUpdateAvailable?.((info) => {
      if (info.updateAvailable) {
        setUpdateInfo(info);
        setIsDismissed(false);
      }
    });

    const unsubProgress = window.xivig.onUpdateDownloadProgress?.((progress) => {
      setIsDownloading(true);
      setDownloadProgress(progress);
    });

    const unsubDownloaded = window.xivig.onUpdateDownloaded?.((info) => {
      setIsDownloading(false);
      setDownloadProgress(null);
      setDownloadedInfo(info);
      setIsDismissed(false);
    });

    return () => {
      unsubAvailable?.();
      unsubProgress?.();
      unsubDownloaded?.();
    };
  }, []);

  // Handle manual update checks
  useEffect(() => {
    if (!manualCheckTrigger || manualCheckTrigger <= 0) return;

    let mounted = true;
    setIsChecking(true);
    setUpToDateMessage(null);
    setIsDismissed(false);

    if (window.xivig?.checkForUpdates) {
      window.xivig
        .checkForUpdates()
        .then((info) => {
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
        })
        .catch((err) => {
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

  const handleStartDownload = async () => {
    if (!window.xivig?.startUpdateDownload) return;
    setIsDownloading(true);
    try {
      const res = await window.xivig.startUpdateDownload();
      if (!res.success && res.error) {
        setIsDownloading(false);
      }
    } catch {
      setIsDownloading(false);
    }
  };

  const handleApplyAndRestart = async () => {
    if (!window.xivig?.applyUpdateAndRestart) return;
    setIsApplying(true);
    try {
      await window.xivig.applyUpdateAndRestart();
    } catch {
      setIsApplying(false);
    }
  };

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
          <button onClick={() => setUpToDateMessage(null)} style={iconButtonStyle} aria-label="Dismiss">
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  // 1. If update is downloaded and ready to restart
  if (downloadedInfo && !isDismissed) {
    return (
      <div style={{ ...bannerContainerStyle, borderColor: '#35b779', backgroundColor: 'rgba(53, 183, 121, 0.12)' }} role="alert">
        <div style={bannerContentStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <CheckCircle size={15} style={{ color: '#35b779', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--xivig-text)' }}>
              <strong>Update Ready:</strong> Xivig <strong>v{downloadedInfo.version}</strong> has been downloaded. Reload to update seamlessly without manual installation.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleApplyAndRestart}
              disabled={isApplying}
              style={{ ...actionButtonStyle, backgroundColor: '#35b779' }}
              title="Restart Xivig and apply update in-place without installer prompts"
            >
              <RotateCw size={12} style={{ marginRight: '5px' }} className={isApplying ? 'animate-spin' : ''} />
              <span>{isApplying ? 'Restarting...' : 'Reload & Apply Update'}</span>
            </button>
            <button onClick={() => setIsDismissed(true)} style={iconButtonStyle} title="Dismiss notice" aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. If update is available
  if (updateInfo?.updateAvailable && !isDismissed) {
    return (
      <div style={bannerContainerStyle} role="alert" aria-live="polite">
        <div style={bannerContentStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <ArrowUpCircle size={15} style={{ color: 'var(--xivig-accent)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--xivig-text)' }}>
              <strong>Update Available:</strong> Xivig <strong>v{updateInfo.latestVersion}</strong> is ready (Current: v{updateInfo.currentVersion}).
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
                Downloading update...
              </span>
            ) : updateInfo.downloadUrl ? (
              <button
                onClick={handleStartDownload}
                style={actionButtonStyle}
                title="Download update package in background"
              >
                <Download size={12} style={{ marginRight: '4px' }} />
                <span>Download Update</span>
              </button>
            ) : null}

            <button
              onClick={() => window.xivig?.openReleasePage?.(updateInfo.htmlUrl)}
              style={{ ...actionButtonStyle, backgroundColor: 'transparent', border: '1px solid var(--xivig-border)', color: 'var(--xivig-text)' }}
              title="View release notes on GitHub"
            >
              <span>Notes</span>
              <ExternalLink size={11} style={{ marginLeft: '4px' }} />
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
  transition: 'opacity 0.15s ease',
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

const progressTrackStyle: React.CSSProperties = {
  width: '80px',
  height: '6px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '3px',
  overflow: 'hidden',
};

const progressBarStyle: React.CSSProperties = {
  height: '100%',
  backgroundColor: 'var(--xivig-accent)',
  borderRadius: '3px',
  transition: 'width 0.15s ease',
};
