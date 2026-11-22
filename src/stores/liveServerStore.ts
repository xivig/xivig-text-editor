import { create } from 'zustand';
import { useFileStore } from './fileStore';
import { useEditorStore } from './editorStore';

interface LiveServerState {
  isRunning: boolean;
  port: number;
  url: string;
  rootPath: string;

  startServer: (targetPath?: string, port?: number) => Promise<boolean>;
  stopServer: () => Promise<void>;
  toggleServer: () => Promise<void>;
  openInBrowser: (subPath?: string) => Promise<void>;
  checkStatus: () => Promise<void>;
  notifyReload: () => void;
}

let reloadDebounce: NodeJS.Timeout | null = null;

export const useLiveServerStore = create<LiveServerState>((set, get) => {
  // Listen for Live Server status changes from main process
  if (typeof window !== 'undefined' && window.xivig?.onLiveServerChanged) {
    window.xivig.onLiveServerChanged((status) => {
      set({
        isRunning: status.isRunning,
        port: status.port,
        url: status.url,
        rootPath: status.rootPath,
      });
    });
  }

  return {
    isRunning: false,
    port: 5500,
    url: '',
    rootPath: '',

    startServer: async (targetPath, port = 5500) => {
      const workspaceFolder = useFileStore.getState().currentFolderPath;
      const activeDoc = useEditorStore.getState().getActiveDocument();

      const resolvedRoot =
        targetPath ||
        workspaceFolder ||
        (activeDoc?.path ? activeDoc.path.replace(/[/\\][^/\\]+$/, '') : null);

      if (!resolvedRoot || !window.xivig?.liveServerStart) {
        console.warn('[LiveServer] No workspace folder or file directory to serve');
        return false;
      }

      const res = await window.xivig.liveServerStart(resolvedRoot, port);
      if (res.success) {
        set({
          isRunning: true,
          port: res.port,
          url: res.url,
          rootPath: resolvedRoot,
        });
        return true;
      }
      return false;
    },

    stopServer: async () => {
      if (window.xivig?.liveServerStop) {
        await window.xivig.liveServerStop();
      }
      set({
        isRunning: false,
        url: '',
      });
    },

    toggleServer: async () => {
      if (get().isRunning) {
        await get().stopServer();
      } else {
        await get().startServer();
      }
    },

    openInBrowser: async (subPath) => {
      if (!get().isRunning) {
        const ok = await get().startServer();
        if (!ok) return;
      }

      const activeDoc = useEditorStore.getState().getActiveDocument();
      let docSubPath = subPath;

      if (!docSubPath && activeDoc?.path && get().rootPath) {
        // Compute relative subpath
        const normRoot = get().rootPath.replace(/\\/g, '/');
        const normDoc = activeDoc.path.replace(/\\/g, '/');
        if (normDoc.startsWith(normRoot)) {
          docSubPath = normDoc.replace(normRoot, '').replace(/^\//, '');
        }
      }

      if (window.xivig?.liveServerOpenBrowser) {
        await window.xivig.liveServerOpenBrowser(docSubPath || undefined);
      }
    },

    checkStatus: async () => {
      if (window.xivig?.liveServerStatus) {
        const status = await window.xivig.liveServerStatus();
        set({
          isRunning: status.isRunning,
          port: status.port,
          url: status.url,
          rootPath: status.rootPath,
        });
      }
    },

    notifyReload: () => {
      if (!get().isRunning) return;
      if (reloadDebounce) clearTimeout(reloadDebounce);
      reloadDebounce = setTimeout(() => {
        window.xivig?.liveServerTriggerReload?.();
      }, 300);
    },
  };
});
