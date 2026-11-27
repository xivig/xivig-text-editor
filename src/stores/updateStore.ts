import { create } from 'zustand';
import { UpdateCheckResult, UpdateProgress, DownloadedUpdateInfo } from '../types/electron';

export interface UpdateStoreState {
  isChecking: boolean;
  isDownloading: boolean;
  isApplying: boolean;
  updateInfo: UpdateCheckResult | null;
  downloadProgress: UpdateProgress | null;
  downloadedInfo: DownloadedUpdateInfo | null;
  statusMessage: string | null;
  isBannerDismissed: boolean;

  setBannerDismissed: (dismissed: boolean) => void;
  setStatusMessage: (msg: string | null) => void;
  checkForUpdates: (manual?: boolean) => Promise<UpdateCheckResult | null>;
  startDownload: () => Promise<boolean>;
  applyAndRestart: () => Promise<boolean>;
  initializeListeners: () => () => void;
}

export const useUpdateStore = create<UpdateStoreState>((set, get) => ({
  isChecking: false,
  isDownloading: false,
  isApplying: false,
  updateInfo: null,
  downloadProgress: null,
  downloadedInfo: null,
  statusMessage: null,
  isBannerDismissed: false,

  setBannerDismissed: (dismissed: boolean) => set({ isBannerDismissed: dismissed }),
  setStatusMessage: (msg: string | null) => set({ statusMessage: msg }),

  checkForUpdates: async (manual = false) => {
    set({ isChecking: true, statusMessage: null });
    if (manual) {
      set({ isBannerDismissed: false });
    }

    try {
      if (window.xivig?.checkForUpdates) {
        const result = await window.xivig.checkForUpdates();
        set({ isChecking: false });

        if (result.updateAvailable) {
          set({ updateInfo: result });
          // In VS Code-style automatic flow, immediately initiate background download if binary available
          if (!get().isDownloading && !get().downloadedInfo && result.downloadUrl) {
            get().startDownload().catch(() => {});
          }
        } else {
          set({
            updateInfo: result,
            statusMessage: manual ? `You're up to date! Xivig v${result.currentVersion} is the latest version.` : null,
          });
        }
        return result;
      } else {
        // Fallback for mock/browser testing
        const fallbackResult: UpdateCheckResult = {
          updateAvailable: false,
          currentVersion: '2.0.2',
          latestVersion: '2.0.2',
        };
        set({
          isChecking: false,
          updateInfo: fallbackResult,
          statusMessage: manual ? `You're up to date! Xivig v2.0.2 is the latest version.` : null,
        });
        return fallbackResult;
      }
    } catch (err: any) {
      set({
        isChecking: false,
        statusMessage: manual ? `Could not check for updates: ${err.message || 'Offline'}` : null,
      });
      return null;
    }
  },

  startDownload: async () => {
    if (get().isDownloading) return false;
    set({ isDownloading: true });

    try {
      if (window.xivig?.startUpdateDownload) {
        const res = await window.xivig.startUpdateDownload();
        if (!res.success) {
          set({ isDownloading: false, statusMessage: res.error || 'Download failed' });
          return false;
        }
        return true;
      } else {
        // Mock download progress for development testing
        set({ isDownloading: true, downloadProgress: { percent: 10, transferred: 1000, total: 10000 } });
        setTimeout(() => {
          set({ downloadProgress: { percent: 50, transferred: 5000, total: 10000 } });
        }, 150);
        setTimeout(() => {
          set({
            isDownloading: false,
            downloadProgress: null,
            downloadedInfo: {
              version: '2.0.2',
              filePath: 'mock-update.exe',
              assetName: 'Xivig.Text.Editor.Setup.2.0.2.exe',
              releaseName: 'Xivig v2.0.2',
            },
            isBannerDismissed: false,
          });
        }, 300);
        return true;
      }
    } catch (err: any) {
      set({ isDownloading: false, statusMessage: err.message || 'Download error' });
      return false;
    }
  },

  applyAndRestart: async () => {
    set({ isApplying: true });
    try {
      if (window.xivig?.applyUpdateAndRestart) {
        const res = await window.xivig.applyUpdateAndRestart();
        return res.success;
      } else {
        // Development / browser fallback: simulate clean IDE reload
        setTimeout(() => {
          window.location.reload();
        }, 500);
        return true;
      }
    } catch {
      set({ isApplying: false });
      return false;
    }
  },

  initializeListeners: () => {
    // Check initial downloaded update status from Electron
    if (window.xivig?.getDownloadedUpdateInfo) {
      window.xivig.getDownloadedUpdateInfo().then((info) => {
        if (info) {
          set({ downloadedInfo: info, isBannerDismissed: false });
        }
      }).catch(() => {});
    }

    if (!window.xivig) return () => {};

    const unsubAvailable = window.xivig.onUpdateAvailable?.((info) => {
      if (info.updateAvailable) {
        set({ updateInfo: info, isBannerDismissed: false });
      }
    });

    const unsubProgress = window.xivig.onUpdateDownloadProgress?.((progress) => {
      set({ isDownloading: true, downloadProgress: progress });
    });

    const unsubDownloaded = window.xivig.onUpdateDownloaded?.((info) => {
      set({
        isDownloading: false,
        downloadProgress: null,
        downloadedInfo: info,
        isBannerDismissed: false,
      });
    });

    return () => {
      unsubAvailable?.();
      unsubProgress?.();
      unsubDownloaded?.();
    };
  },
}));
