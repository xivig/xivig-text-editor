import chokidar, { FSWatcher } from 'chokidar';
import { BrowserWindow } from 'electron';
import { assertPathAuthorized } from '../security';

interface WindowWatcherEntry {
  watcher: FSWatcher;
  debounceTimeout: NodeJS.Timeout | null;
  folderPath: string;
}

const watchersByWindow = new Map<number, WindowWatcherEntry>();

export function watchWorkspace(folderPath: string, win: BrowserWindow | null): void {
  if (!folderPath || !win || win.isDestroyed()) return;

  const winId = win.id;

  // Stop any existing watcher for this window first
  stopWatching(winId);

  try {
    assertPathAuthorized(folderPath, 'workspace:watch');

    const watcher = chokidar.watch(folderPath, {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/dist-electron/**',
        '**/.DS_Store',
      ],
      ignoreInitial: true,
      persistent: true,
      depth: 6,
    });

    const entry: WindowWatcherEntry = {
      watcher,
      debounceTimeout: null,
      folderPath,
    };

    const triggerRefresh = (event: string, filePath: string) => {
      if (entry.debounceTimeout) clearTimeout(entry.debounceTimeout);
      entry.debounceTimeout = setTimeout(() => {
        if (!win || win.isDestroyed()) return;
        win.webContents.send('workspace:files-changed', {
          event,
          path: filePath,
          folderPath,
        });
      }, 300);
    };

    watcher
      .on('add', (p) => triggerRefresh('add', p))
      .on('change', (p) => triggerRefresh('change', p))
      .on('unlink', (p) => triggerRefresh('unlink', p))
      .on('addDir', (p) => triggerRefresh('addDir', p))
      .on('unlinkDir', (p) => triggerRefresh('unlinkDir', p))
      .on('error', (err) => console.error(`[Xivig Watcher Win-${winId}] Error:`, err));

    watchersByWindow.set(winId, entry);
    console.log(`[Xivig Watcher Win-${winId}] Watching workspace:`, folderPath);
  } catch (err: any) {
    console.error(`[Xivig Watcher Win-${winId}] Failed to watch:`, err.message);
  }
}

export function stopWatching(winId?: number): void {
  if (winId !== undefined) {
    const entry = watchersByWindow.get(winId);
    if (entry) {
      if (entry.debounceTimeout) clearTimeout(entry.debounceTimeout);
      entry.watcher.close();
      watchersByWindow.delete(winId);
      console.log(`[Xivig Watcher Win-${winId}] Stopped watching.`);
    }
  } else {
    for (const [id, entry] of watchersByWindow) {
      if (entry.debounceTimeout) clearTimeout(entry.debounceTimeout);
      entry.watcher.close();
      console.log(`[Xivig Watcher Win-${id}] Stopped watching.`);
    }
    watchersByWindow.clear();
  }
}
