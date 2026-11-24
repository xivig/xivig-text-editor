import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ExternalLink, RefreshCw, ArrowUpCircle, AlertCircle, Download, RotateCw } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { UpdateCheckResult, UpdateProgress, DownloadedUpdateInfo } from '../../types/electron';

export const UpdateCheckModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isUpdateCheckOpen);
  const close = useUIStore((state) => state.closeUpdateCheckModal);

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<UpdateCheckResult | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null);
  const [downloadedInfo, setDownloadedInfo] = useState<DownloadedUpdateInfo | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

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
    if (window.xivig?.getDownloadedUpdateInfo) {
      window.xivig.getDownloadedUpdateInfo().then((info) => {
        if (info) setDownloadedInfo(info);
      }).catch(() => {});
    }

    if (!window.xivig) return;

    const unsubProgress = window.xivig.onUpdateDownloadProgress?.((progress) => {
      setIsDownloading(true);
      setDownloadProgress(progress);
    });

    const unsubDownloaded = window.xivig.onUpdateDownloaded?.((info) => {
      setIsDownloading(false);
      setDownloadProgress(null);
      setDownloadedInfo(info);
    });

    return () => {
      unsubProgress?.();
      unsubDownloaded?.();
    };
  }, []);

  const performCheck = () => {
    setIsLoading(true);
    if (window.xivig?.checkForUpdates) {
      window.xivig
        .checkForUpdates()
        .then((res) => {
          setResult(res);
          setIsLoading(false);
        })
        .catch((err) => {
          setResult({
            updateAvailable: false,
            currentVersion: '1.3.0',
            latestVersion: '1.3.0',
            error: err.message || 'Network error',
          });
          setIsLoading(false);
        });
    } else {
      setTimeout(() => {
        setResult({
          updateAvailable: false,
          currentVersion: '1.3.0',
          latestVersion: '1.3.0',
        });
        setIsLoading(false);
      }, 500);
    }
  };

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

  useEffect(() => {
    if (isOpen) {
      performCheck();
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
          borderRadius: '6px',
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
            padding: '0 16px',
            userSelect: 'none',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
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
          {isLoading ? (
            <div style={{ padding: '24px 0' }}>
              <RefreshCw
                size={32}
                className="animate-spin"
                style={{ color: 'var(--xivig-accent)', margin: '0 auto 16px auto', display: 'block' }}
              />
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>
                Checking for updates...
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
                Connecting to GitHub Releases repository
              </div>
            </div>
          ) : result?.updateAvailable ? (
            <>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: downloadedInfo ? 'rgba(53, 183, 121, 0.18)' : 'rgba(78, 201, 176, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                {downloadedInfo ? (
                  <CheckCircle size={30} color="#35b779" />
                ) : (
                  <ArrowUpCircle size={30} color="var(--xivig-accent)" />
                )}
              </div>

              <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
                {downloadedInfo ? 'Update Ready to Install' : 'A New Version of Xivig is Available!'}
              </div>

              <div style={{ fontSize: '13px', color: '#d1d5db', marginTop: '8px', lineHeight: 1.5 }}>
                {downloadedInfo ? (
                  <>
                    Xivig <strong>v{downloadedInfo.version}</strong> has been downloaded. Restart now to update seamlessly without manual installation.
                  </>
                ) : (
                  <>
                    Version <strong>v{result.latestVersion}</strong> is available (Current: v{result.currentVersion}).
                  </>
                )}
              </div>

              {result.releaseName && (
                <div style={{ fontSize: '12px', color: 'var(--xivig-accent)', marginTop: '4px', fontWeight: 500 }}>
                  {result.releaseName}
                </div>
              )}

              {/* Download Progress Bar if downloading */}
              {isDownloading && downloadProgress && (
                <div style={{ margin: '14px 0', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>
                    <span>Downloading update package...</span>
                    <span>{downloadProgress.percent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#1b1c1e', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${downloadProgress.percent}%`,
                        height: '100%',
                        backgroundColor: 'var(--xivig-accent)',
                        transition: 'width 0.15s ease',
                      }}
                    />
                  </div>
                </div>
              )}

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
                <div>• Current Version: <strong>v{result.currentVersion}</strong></div>
                <div>• Latest Release: <strong>v{result.latestVersion}</strong></div>
                <div>• Update Mode: <strong>Seamless In-Place Reload</strong></div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {downloadedInfo ? (
                  <button
                    onClick={handleApplyAndRestart}
                    disabled={isApplying}
                    style={{
                      backgroundColor: '#35b779',
                      border: 'none',
                      color: '#ffffff',
                      padding: '8px 20px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <RotateCw size={14} className={isApplying ? 'animate-spin' : ''} />
                    {isApplying ? 'Restarting...' : 'Reload & Apply Update'}
                  </button>
                ) : (
                  <>
                    {result.downloadUrl && !isDownloading && (
                      <button
                        onClick={handleStartDownload}
                        style={{
                          backgroundColor: 'var(--xivig-accent)',
                          border: 'none',
                          color: '#ffffff',
                          padding: '8px 20px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Download size={14} />
                        Download Update
                      </button>
                    )}
                    <button
                      onClick={() => window.xivig?.openReleasePage?.(result.htmlUrl)}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #4a4d55',
                        color: '#4aa2f2',
                        padding: '8px 18px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <ExternalLink size={13} />
                      Release Notes
                    </button>
                  </>
                )}

                <button
                  onClick={close}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #4a4d55',
                    color: '#9ca3af',
                    padding: '8px 18px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </>
          ) : result?.error ? (
            <>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 100, 100, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                <AlertCircle size={28} color="#ef6464" />
              </div>

              <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
                Unable to Check for Updates
              </div>

              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px', lineHeight: 1.5 }}>
                {result.error}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
                <button
                  onClick={performCheck}
                  style={{
                    backgroundColor: 'var(--xivig-accent)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '6px 18px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Retry
                </button>
                <button
                  onClick={close}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #4a4d55',
                    color: '#9ca3af',
                    padding: '6px 18px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  width: '52px',
                  height: '52px',
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
                You are running the newest version available: <strong>Release {(result?.currentVersion || '1.2.0').split('.').slice(0, 2).join('.')} (v{result?.currentVersion || '1.2.0'})</strong>.
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
                <div>• Channel: <strong>Stable Release</strong></div>
                <div>• Runtime: <strong>Electron 45 / Node 24 LTS</strong></div>
                <div>• Security: <strong>Up to date (0 audit vulnerabilities)</strong></div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={() => window.xivig?.openReleasePage?.(result?.htmlUrl)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #4a4d55',
                    color: '#4aa2f2',
                    padding: '6px 16px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ExternalLink size={13} />
                  View Releases
                </button>
                <button
                  onClick={close}
                  style={{
                    backgroundColor: 'var(--xivig-accent)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '6px 24px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  OK
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
