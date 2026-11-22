import chokidar, { FSWatcher } from 'chokidar';
import { BrowserWindow } from 'electron';

let currentWatcher: FSWatcher | null = null;
let debounceTimeout: NodeJS.Timeout | null = null;

export function watchWorkspace(folderPath: string, win: BrowserWindow | null): void {
  stopWatching();

  if (!folderPath || !win) return;

  try {
    currentWatcher = chokidar.watch(folderPath, {
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

    const triggerRefresh = (event: string, filePath: string) => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        if (!win || win.isDestroyed()) return;
        win.webContents.send('workspace:files-changed', {
          event,
          path: filePath,
          folderPath,
        });
      }, 300);
    };

    currentWatcher
      .on('add', (p) => triggerRefresh('add', p))
      .on('change', (p) => triggerRefresh('change', p))
      .on('unlink', (p) => triggerRefresh('unlink', p))
      .on('addDir', (p) => triggerRefresh('addDir', p))
      .on('unlinkDir', (p) => triggerRefresh('unlinkDir', p))
      .on('error', (err) => console.error('[Xivig Watcher] Error:', err));

    console.log('[Xivig Watcher] Watching workspace:', folderPath);
  } catch (err) {
    console.error('[Xivig Watcher] Failed to watch:', err);
  }
}

export function stopWatching(): void {
  if (currentWatcher) {
    currentWatcher.close();
    currentWatcher = null;
    console.log('[Xivig Watcher] Stopped watching.');
  }
}
