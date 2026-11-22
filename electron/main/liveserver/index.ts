import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { BrowserWindow, shell } from 'electron';

export interface LiveServerStatus {
  isRunning: boolean;
  port: number;
  url: string;
  rootPath: string;
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

const LIVE_RELOAD_INJECTION = `
<!-- Injected by Xivig Live Server -->
<script>
(function() {
  try {
    const src = new EventSource('/__xivig_live_reload');
    src.onmessage = function(e) {
      if (e.data === 'reload') {
        console.log('[Xivig Live Server] Change detected, reloading...');
        window.location.reload();
      }
    };
    src.onerror = function() {
      // EventSource auto-reconnects
    };
  } catch (e) {}
})();
</script>
`;

let currentServer: http.Server | null = null;
let currentPort = 5500;
let currentRoot = '';
const sseClients = new Set<http.ServerResponse>();

export function getLiveServerStatus(): LiveServerStatus {
  return {
    isRunning: currentServer !== null,
    port: currentPort,
    url: currentServer ? `http://127.0.0.1:${currentPort}` : '',
    rootPath: currentRoot,
  };
}

export function triggerLiveReload(): void {
  if (sseClients.size === 0) return;
  for (const client of sseClients) {
    try {
      client.write('data: reload\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}

export async function startLiveServer(
  rootDirectory: string,
  preferredPort = 5500,
  win: BrowserWindow | null = null
): Promise<{ success: boolean; port: number; url: string; error?: string }> {
  // Stop existing server if running
  await stopLiveServer(win);

  if (!rootDirectory || !fs.existsSync(rootDirectory)) {
    return { success: false, port: 0, url: '', error: 'Invalid root directory path' };
  }

  currentRoot = fs.statSync(rootDirectory).isDirectory()
    ? rootDirectory
    : path.dirname(rootDirectory);

  let attemptPort = preferredPort;
  const maxPort = preferredPort + 20;

  const tryStartServer = (portToTry: number): Promise<{ success: boolean; port: number; url: string; error?: string }> => {
    return new Promise((resolve) => {
      const server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url || '/', true);
        const pathname = decodeURIComponent(parsedUrl.pathname || '/');

        // 1. SSE Live reload endpoint
        if (pathname === '/__xivig_live_reload') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          res.write('data: connected\n\n');
          sseClients.add(res);

          req.on('close', () => {
            sseClients.delete(res);
          });
          return;
        }

        // 2. Resolve requested file path against currentRoot
        let safePath = path.normalize(path.join(currentRoot, pathname));
        if (!safePath.startsWith(path.normalize(currentRoot))) {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('403 Forbidden');
          return;
        }

        // If directory, try index.html
        if (fs.existsSync(safePath) && fs.statSync(safePath).isDirectory()) {
          const indexFile = path.join(safePath, 'index.html');
          if (fs.existsSync(indexFile)) {
            safePath = indexFile;
          }
        }

        if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><title>404 Not Found - Xivig Live Server</title></head>
              <body style="font-family: system-ui, sans-serif; background: #17191f; color: #e5e7eb; padding: 40px;">
                <h2 style="color: #ef6464;">404 Not Found</h2>
                <p>Cannot find: <code>${pathname}</code></p>
                <p style="color: #9299a8;">Serving from: <code>${currentRoot}</code></p>
              </body>
            </html>
          `);
          return;
        }

        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        // For HTML files, inject the live reload snippet
        if (ext === '.html' || ext === '.htm') {
          try {
            let html = fs.readFileSync(safePath, 'utf-8');
            if (html.includes('</body>')) {
              html = html.replace('</body>', `${LIVE_RELOAD_INJECTION}</body>`);
            } else if (html.includes('</html>')) {
              html = html.replace('</html>', `${LIVE_RELOAD_INJECTION}</html>`);
            } else {
              html += LIVE_RELOAD_INJECTION;
            }

            res.writeHead(200, {
              'Content-Type': contentType,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            });
            res.end(html);
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(`500 Internal Server Error: ${err.message}`);
          }
          return;
        }

        // Non-HTML static files
        try {
          const stat = fs.statSync(safePath);
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stat.size,
            'Access-Control-Allow-Origin': '*',
          });
          const stream = fs.createReadStream(safePath);
          stream.pipe(res);
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(`500 Error: ${err.message}`);
        }
      });

      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE' && portToTry < maxPort) {
          resolve(tryStartServer(portToTry + 1));
        } else {
          resolve({ success: false, port: 0, url: '', error: err.message });
        }
      });

      server.listen(portToTry, '127.0.0.1', () => {
        currentServer = server;
        currentPort = portToTry;
        const liveUrl = `http://127.0.0.1:${currentPort}`;

        if (win && !win.isDestroyed()) {
          win.webContents.send('liveserver:changed', getLiveServerStatus());
        }

        resolve({ success: true, port: currentPort, url: liveUrl });
      });
    });
  };

  return tryStartServer(attemptPort);
}

export async function stopLiveServer(win: BrowserWindow | null = null): Promise<boolean> {
  if (currentServer) {
    for (const client of sseClients) {
      try {
        client.end();
      } catch {}
    }
    sseClients.clear();

    await new Promise<void>((resolve) => {
      currentServer?.close(() => resolve());
      currentServer = null;
    });

    if (win && !win.isDestroyed()) {
      win.webContents.send('liveserver:changed', getLiveServerStatus());
    }
    return true;
  }
  return false;
}

export function openLiveServerInBrowser(subPath = ''): void {
  if (currentServer) {
    const targetUrl = subPath
      ? `http://127.0.0.1:${currentPort}/${subPath.replace(/^\//, '')}`
      : `http://127.0.0.1:${currentPort}`;
    shell.openExternal(targetUrl);
  }
}
