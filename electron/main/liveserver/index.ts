import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import crypto from 'node:crypto';
import { BrowserWindow, shell } from 'electron';
import { assertPathAuthorized } from '../security';

export interface LiveServerStatus {
  isRunning: boolean;
  port: number;
  url: string;
  rootPath: string;
}

interface LiveServerInstance {
  server: http.Server;
  port: number;
  url: string;
  rootPath: string;
  sessionToken: string;
  sseClients: Set<http.ServerResponse>;
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

// Sensitive file patterns forbidden from being served
const SENSITIVE_FILE_PATTERNS = [
  /(^|[/\\])\.env(\.|$)/i,
  /(^|[/\\])\.git([/\\]|$)/i,
  /(^|[/\\])\.gitignore$/i,
  /(^|[/\\])id_rsa/i,
  /(^|[/\\])id_ed25519/i,
  /\.(pem|key|p12|pfx|kdbx|sql)$/i,
  /(^|[/\\])node_modules([/\\]|$)/i,
];

function isSensitivePath(filePath: string): boolean {
  return SENSITIVE_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function getReloadScript(sessionToken: string): string {
  return `
<!-- Injected by Xivig Live Server -->
<script>
(function() {
  try {
    const src = new EventSource('/__xivig_live_reload?token=${encodeURIComponent(sessionToken)}');
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
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}

const serversByWindow = new Map<number, LiveServerInstance>();

export function getLiveServerStatus(winId?: number): LiveServerStatus {
  if (winId !== undefined) {
    const instance = serversByWindow.get(winId);
    if (instance) {
      return {
        isRunning: true,
        port: instance.port,
        url: instance.url,
        rootPath: instance.rootPath,
      };
    }
  }
  // Fallback to first active server
  const first = serversByWindow.values().next().value;
  if (first) {
    return {
      isRunning: true,
      port: first.port,
      url: first.url,
      rootPath: first.rootPath,
    };
  }
  return {
    isRunning: false,
    port: 0,
    url: '',
    rootPath: '',
  };
}

export function triggerLiveReload(winId?: number): void {
  const instances = winId !== undefined && serversByWindow.has(winId)
    ? [serversByWindow.get(winId)!]
    : Array.from(serversByWindow.values());

  for (const instance of instances) {
    if (instance.sseClients.size === 0) continue;
    for (const client of instance.sseClients) {
      try {
        client.write('data: reload\n\n');
      } catch {
        instance.sseClients.delete(client);
      }
    }
  }
}

export async function startLiveServer(
  rootDirectory: string,
  preferredPort = 5500,
  win: BrowserWindow | null = null
): Promise<{ success: boolean; port: number; url: string; error?: string }> {
  if (!win || win.isDestroyed()) {
    return { success: false, port: 0, url: '', error: 'Active window required' };
  }

  const winId = win.id;
  await stopLiveServer(win);

  if (!rootDirectory || !fs.existsSync(rootDirectory)) {
    return { success: false, port: 0, url: '', error: 'Invalid root directory path' };
  }

  let canonicalRoot: string;
  try {
    const resolvedPath = path.resolve(rootDirectory);
    assertPathAuthorized(winId, resolvedPath, 'liveserver:start');
    const stat = fs.statSync(resolvedPath);
    const targetDir = stat.isDirectory() ? resolvedPath : path.dirname(resolvedPath);
    canonicalRoot = fs.realpathSync(targetDir);
  } catch (err: any) {
    return { success: false, port: 0, url: '', error: `Cannot resolve root directory: ${err.message}` };
  }

  const sessionToken = crypto.randomBytes(24).toString('hex');
  const sseClients = new Set<http.ServerResponse>();

  let attemptPort = preferredPort;
  const maxPort = preferredPort + 30;

  const tryStartServer = (portToTry: number): Promise<{ success: boolean; port: number; url: string; error?: string }> => {
    return new Promise((resolve) => {
      const server = http.createServer((req, res) => {
        // Enforce maximum header & URL limits
        const parsedUrl = url.parse(req.url || '/', true);

        // Safe URL decoding to protect against malformed URL encoding attacks
        let pathname = '/';
        try {
          pathname = decodeURIComponent(parsedUrl.pathname || '/');
        } catch {
          res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('400 Bad Request: Malformed URI encoding.');
          return;
        }

        const securityHeaders = {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'Access-Control-Allow-Origin': `http://127.0.0.1:${portToTry}`,
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (req.method === 'OPTIONS') {
          res.writeHead(204, securityHeaders);
          res.end();
          return;
        }

        // 1. SSE Live reload endpoint with mandatory session token validation
        if (pathname === '/__xivig_live_reload') {
          const clientToken = parsedUrl.query.token;
          if (!clientToken || clientToken !== sessionToken) {
            res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders });
            res.end('401 Unauthorized: Invalid or missing live reload session token.');
            return;
          }

          if (sseClients.size >= 30) {
            res.writeHead(429, { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders });
            res.end('429 Too Many Requests: Live server client limit reached.');
            return;
          }

          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            ...securityHeaders,
          });
          res.write('data: connected\n\n');
          sseClients.add(res);

          req.on('close', () => {
            sseClients.delete(res);
          });
          return;
        }

        // 2. Sensitive file access restriction
        if (isSensitivePath(pathname)) {
          res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders });
          res.end('403 Forbidden: Access to sensitive project files is restricted.');
          return;
        }

        // 3. Strict directory boundary and symlink escape validation
        const cleanPath = path.normalize(pathname).replace(/^([a-zA-Z]:|[/\\])+/, '');
        const targetCandidate = path.resolve(canonicalRoot, cleanPath);

        const relativeSyntax = path.relative(canonicalRoot, targetCandidate);
        if (relativeSyntax.startsWith('..') || path.isAbsolute(relativeSyntax)) {
          res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders });
          res.end('403 Forbidden: Directory traversal attempt blocked.');
          return;
        }

        let safePath = targetCandidate;
        if (fs.existsSync(targetCandidate)) {
          try {
            const canonicalTarget = fs.realpathSync(targetCandidate);
            const relativeCanonical = path.relative(canonicalRoot, canonicalTarget);
            if (relativeCanonical.startsWith('..') || path.isAbsolute(relativeCanonical)) {
              res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders });
              res.end('403 Forbidden: Symlink destination outside workspace.');
              return;
            }
            if (isSensitivePath(relativeCanonical)) {
              res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders });
              res.end('403 Forbidden: Access to sensitive file is restricted.');
              return;
            }
            safePath = canonicalTarget;
          } catch {
            res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders });
            res.end('403 Forbidden: Unable to verify realpath.');
            return;
          }
        }

        // If directory, search for index.html inside it
        if (fs.existsSync(safePath) && fs.statSync(safePath).isDirectory()) {
          const indexCandidate = path.join(safePath, 'index.html');
          if (fs.existsSync(indexCandidate)) {
            try {
              const canonicalIndex = fs.realpathSync(indexCandidate);
              const relativeIndex = path.relative(canonicalRoot, canonicalIndex);
              if (!relativeIndex.startsWith('..') && !path.isAbsolute(relativeIndex)) {
                safePath = canonicalIndex;
              }
            } catch {
              // Ignore resolution error
            }
          }
        }

        if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', ...securityHeaders });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><title>404 Not Found - Xivig Live Server</title></head>
              <body style="font-family: system-ui, sans-serif; background: #17191f; color: #e5e7eb; padding: 40px;">
                <h2 style="color: #ef6464;">404 Not Found</h2>
                <p>Cannot find: <code>${escapeHtml(pathname)}</code></p>
                <p style="color: #9299a8;">Serving from: <code>${escapeHtml(canonicalRoot)}</code></p>
              </body>
            </html>
          `);
          return;
        }

        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        // For HTML files, inject the live reload snippet with authenticating session token
        if (ext === '.html' || ext === '.htm') {
          try {
            let html = fs.readFileSync(safePath, 'utf-8');
            const reloadSnippet = getReloadScript(sessionToken);
            if (html.includes('</body>')) {
              html = html.replace('</body>', `${reloadSnippet}</body>`);
            } else if (html.includes('</html>')) {
              html = html.replace('</html>', `${reloadSnippet}</html>`);
            } else {
              html += reloadSnippet;
            }

            res.writeHead(200, {
              'Content-Type': contentType,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              ...securityHeaders,
            });
            res.end(html);
          } catch {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders });
            res.end('500 Internal Server Error');
          }
          return;
        }

        // Non-HTML static files
        try {
          const stat = fs.statSync(safePath);
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stat.size,
            ...securityHeaders,
          });
          const stream = fs.createReadStream(safePath);
          stream.pipe(res);
        } catch {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders });
          res.end('500 Error');
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
        const liveUrl = `http://127.0.0.1:${portToTry}`;
        serversByWindow.set(winId, {
          server,
          port: portToTry,
          url: liveUrl,
          rootPath: canonicalRoot,
          sessionToken,
          sseClients,
        });

        if (win && !win.isDestroyed()) {
          win.webContents.send('liveserver:changed', getLiveServerStatus(winId));
        }

        resolve({ success: true, port: portToTry, url: liveUrl });
      });
    });
  };

  return tryStartServer(attemptPort);
}

export async function stopLiveServer(win: BrowserWindow | null = null): Promise<boolean> {
  if (!win) {
    let stoppedAny = false;
    for (const [id, instance] of serversByWindow) {
      for (const client of instance.sseClients) {
        try { client.end(); } catch {}
      }
      instance.sseClients.clear();
      await new Promise<void>((resolve) => instance.server.close(() => resolve()));
      stoppedAny = true;
    }
    serversByWindow.clear();
    return stoppedAny;
  }

  const instance = serversByWindow.get(win.id);
  if (instance) {
    for (const client of instance.sseClients) {
      try { client.end(); } catch {}
    }
    instance.sseClients.clear();

    await new Promise<void>((resolve) => {
      instance.server.close(() => resolve());
    });

    serversByWindow.delete(win.id);

    if (!win.isDestroyed()) {
      win.webContents.send('liveserver:changed', getLiveServerStatus(win.id));
    }
    return true;
  }

  return false;
}

export function openLiveServerInBrowser(winId?: number, subPath = ''): void {
  const status = getLiveServerStatus(winId);
  if (status.isRunning && status.url) {
    const cleanSub = subPath ? subPath.replace(/^\/+/, '') : '';
    const targetUrl = cleanSub ? `${status.url}/${cleanSub}` : status.url;
    shell.openExternal(targetUrl);
  }
}
