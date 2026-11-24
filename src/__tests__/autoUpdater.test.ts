// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUpdateStore } from '../stores/updateStore';
import { UpdateCheckResult, DownloadedUpdateInfo, UpdateProgress } from '../types/electron';

describe('Auto-Updater Store & Lifecycle (VS Code-style In-Place Updates)', () => {
  let mockXivig: any;

  beforeEach(() => {
    // Reset Zustand store state to defaults
    useUpdateStore.setState({
      isChecking: false,
      isDownloading: false,
      isApplying: false,
      updateInfo: null,
      downloadProgress: null,
      downloadedInfo: null,
      statusMessage: null,
      isBannerDismissed: false,
    });

    // Setup mock window.xivig updater IPC methods
    mockXivig = {
      checkForUpdates: vi.fn(),
      startUpdateDownload: vi.fn(),
      applyUpdateAndRestart: vi.fn(),
      getDownloadedUpdateInfo: vi.fn().mockResolvedValue(null),
      onUpdateAvailable: vi.fn(() => vi.fn()),
      onUpdateDownloadProgress: vi.fn(() => vi.fn()),
      onUpdateDownloaded: vi.fn(() => vi.fn()),
    };

    (window as any).xivig = mockXivig;
  });

  it('initializes with expected default state', () => {
    const state = useUpdateStore.getState();
    expect(state.isChecking).toBe(false);
    expect(state.isDownloading).toBe(false);
    expect(state.isApplying).toBe(false);
    expect(state.downloadProgress).toBeNull();
    expect(state.updateInfo).toBeNull();
    expect(state.downloadedInfo).toBeNull();
    expect(state.statusMessage).toBeNull();
    expect(state.isBannerDismissed).toBe(false);
  });

  it('updates banner dismissed state and status message', () => {
    useUpdateStore.getState().setBannerDismissed(true);
    expect(useUpdateStore.getState().isBannerDismissed).toBe(true);

    useUpdateStore.getState().setStatusMessage('Update available soon');
    expect(useUpdateStore.getState().statusMessage).toBe('Update available soon');

    useUpdateStore.getState().setStatusMessage(null);
    expect(useUpdateStore.getState().statusMessage).toBeNull();
  });

  it('performs manual check when application is up to date', async () => {
    const upToDateResult: UpdateCheckResult = {
      updateAvailable: false,
      currentVersion: '1.4.0',
      latestVersion: '1.4.0',
    };
    mockXivig.checkForUpdates.mockResolvedValueOnce(upToDateResult);

    const result = await useUpdateStore.getState().checkForUpdates(true);

    expect(result).toEqual(upToDateResult);
    expect(useUpdateStore.getState().isChecking).toBe(false);
    expect(useUpdateStore.getState().updateInfo).toEqual(upToDateResult);
    expect(useUpdateStore.getState().statusMessage).toContain("You're up to date! Xivig v1.4.0 is the latest version.");
    expect(useUpdateStore.getState().isBannerDismissed).toBe(false);
  });

  it('automatically initiates background download when update is found', async () => {
    const updateAvailableResult: UpdateCheckResult = {
      updateAvailable: true,
      currentVersion: '1.3.0',
      latestVersion: '1.4.0',
      downloadUrl: 'https://github.com/xivig/xivig-text-editor/releases/download/v1.4.0/Xivig.Text.Editor.Setup.1.4.0.exe',
      releaseNotes: 'Search and navigation, tab reordering, and advanced editing release.',
    };
    mockXivig.checkForUpdates.mockResolvedValueOnce(updateAvailableResult);
    mockXivig.startUpdateDownload.mockResolvedValueOnce({ success: true });

    const result = await useUpdateStore.getState().checkForUpdates(false);

    expect(result).toEqual(updateAvailableResult);
    expect(useUpdateStore.getState().updateInfo).toEqual(updateAvailableResult);
    expect(mockXivig.startUpdateDownload).toHaveBeenCalled();
  });

  it('attaches update listeners and correctly maps incoming events', () => {
    let availableCallback: ((info: any) => void) | undefined;
    let progressCallback: ((progress: any) => void) | undefined;
    let downloadedCallback: ((info: any) => void) | undefined;

    mockXivig.onUpdateAvailable.mockImplementation((cb: any) => {
      availableCallback = cb;
      return vi.fn();
    });
    mockXivig.onUpdateDownloadProgress.mockImplementation((cb: any) => {
      progressCallback = cb;
      return vi.fn();
    });
    mockXivig.onUpdateDownloaded.mockImplementation((cb: any) => {
      downloadedCallback = cb;
      return vi.fn();
    });

    const cleanup = useUpdateStore.getState().initializeListeners();

    expect(mockXivig.onUpdateAvailable).toHaveBeenCalled();
    expect(mockXivig.onUpdateDownloadProgress).toHaveBeenCalled();
    expect(mockXivig.onUpdateDownloaded).toHaveBeenCalled();

    // 1. Simulate update-available event
    availableCallback!({
      updateAvailable: true,
      currentVersion: '1.3.0',
      latestVersion: '1.4.0',
    });
    expect(useUpdateStore.getState().updateInfo?.latestVersion).toBe('1.4.0');

    // 2. Simulate download-progress event
    const progress: UpdateProgress = { percent: 45.5, transferred: 45500000, total: 100000000 };
    progressCallback!(progress);
    expect(useUpdateStore.getState().isDownloading).toBe(true);
    expect(useUpdateStore.getState().downloadProgress).toEqual(progress);

    // 3. Simulate update-downloaded event
    const downloadedInfo: DownloadedUpdateInfo = {
      version: '1.4.0',
      filePath: 'C:\\Users\\Mock\\AppData\\Local\\xivig-updater\\update.exe',
      assetName: 'Xivig.Text.Editor.Setup.1.4.0.exe',
      releaseName: 'Xivig v1.4.0',
    };
    downloadedCallback!(downloadedInfo);
    expect(useUpdateStore.getState().isDownloading).toBe(false);
    expect(useUpdateStore.getState().downloadProgress).toBeNull();
    expect(useUpdateStore.getState().downloadedInfo).toEqual(downloadedInfo);
    expect(useUpdateStore.getState().isBannerDismissed).toBe(false);

    // Cleanup unbinds listeners cleanly
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('triggers silent in-place installation and restart', async () => {
    mockXivig.applyUpdateAndRestart.mockResolvedValueOnce({ success: true });

    const promise = useUpdateStore.getState().applyAndRestart();
    expect(useUpdateStore.getState().isApplying).toBe(true);

    const success = await promise;
    expect(success).toBe(true);
    expect(mockXivig.applyUpdateAndRestart).toHaveBeenCalled();
  });

  it('handles offline or network errors gracefully during update check', async () => {
    mockXivig.checkForUpdates.mockRejectedValueOnce(new Error('Network request failed'));

    const result = await useUpdateStore.getState().checkForUpdates(true);

    expect(result).toBeNull();
    expect(useUpdateStore.getState().isChecking).toBe(false);
    expect(useUpdateStore.getState().statusMessage).toContain('Network request failed');
  });
});
