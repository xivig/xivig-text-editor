import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  X,
  Radio,
  Terminal,
  Trash2,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useLiveServerStore } from '../../stores/liveServerStore';
import { useFileStore } from '../../stores/fileStore';

type DeviceMode = 'responsive' | 'mobile' | 'tablet' | 'desktop';

interface ConsoleLog {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  text: string;
  timestamp: string;
}

export const LivePreviewPane: React.FC = () => {
  const activeDoc = useEditorStore((state) =>
    state.documents.find((d) => d.id === state.activeDocumentId)
  );
  const closePreview = useEditorStore((state) => state.closePreview);

  const isRunning = useLiveServerStore((state) => state.isRunning);
  const port = useLiveServerStore((state) => state.port);
  const url = useLiveServerStore((state) => state.url);
  const startServer = useLiveServerStore((state) => state.startServer);
  const openInBrowser = useLiveServerStore((state) => state.openInBrowser);
  const currentFolderPath = useFileStore((state) => state.currentFolderPath);

  const [deviceMode, setDeviceMode] = useState<DeviceMode>('responsive');
  const [useServerUrl, setUseServerUrl] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // If live server turns on and user was viewing an HTML file, encourage server mode option
  useEffect(() => {
    if (isRunning && !useServerUrl) {
      setUseServerUrl(true);
    }
  }, [isRunning]);

  // Compute live server preview URL
  const serverPreviewUrl = React.useMemo(() => {
    if (!isRunning || !url) return '';
    if (!activeDoc?.path || !currentFolderPath) {
      return activeDoc?.name ? `${url}/${activeDoc.name}` : url;
    }

    const normRoot = currentFolderPath.replace(/\\/g, '/').toLowerCase();
    const normPath = activeDoc.path.replace(/\\/g, '/').toLowerCase();
    if (normPath.startsWith(normRoot)) {
      const rel = activeDoc.path.replace(/\\/g, '/').slice(normRoot.length).replace(/^\//, '');
      return `${url}/${rel}`;
    }
    if (activeDoc?.name) {
      return `${url}/${activeDoc.name}`;
    }
    return url;
  }, [isRunning, url, activeDoc?.path, activeDoc?.name, currentFolderPath]);

  // Capture console messages from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'XIVIG_CONSOLE') {
        const newLog: ConsoleLog = {
          id: `${Date.now()}-${Math.random()}`,
          type: e.data.level || 'log',
          text: e.data.args ? e.data.args.join(' ') : String(e.data.message || ''),
          timestamp: new Date().toLocaleTimeString(),
        };
        setLogs((prev) => [...prev.slice(-100), newLog]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Build srcDoc for instant keystroke preview
  const previewHtml = React.useMemo(() => {
    if (!activeDoc) return '<body style="background:#1e1e1e;color:#888;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">No active document</body>';

    const content = activeDoc.content || '';
    const consoleInterceptor = `
      <script>
        (function() {
          const send = (level, args) => {
            try {
              window.parent.postMessage({
                type: 'XIVIG_CONSOLE',
                level: level,
                args: Array.from(args).map(a => {
                  if (typeof a === 'object') {
                    try { return JSON.stringify(a); } catch(_) { return String(a); }
                  }
                  return String(a);
                })
              }, '*');
            } catch (_) {}
          };
          const _log = console.log, _warn = console.warn, _error = console.error, _info = console.info;
          console.log = function() { send('log', arguments); _log.apply(console, arguments); };
          console.warn = function() { send('warn', arguments); _warn.apply(console, arguments); };
          console.error = function() { send('error', arguments); _error.apply(console, arguments); };
          console.info = function() { send('info', arguments); _info.apply(console, arguments); };
          window.alert = function(msg) { send('info', ['[alert] ' + msg]); };
          window.onerror = function(msg, src, line, col) {
            send('error', [msg + ' (' + line + ':' + col + ')']);
          };
        })();
      </script>
    `;

    if (activeDoc.language === 'html' || activeDoc.name.endsWith('.html') || activeDoc.name.endsWith('.htm')) {
      if (content.includes('<head>')) {
        return content.replace('<head>', `<head>${consoleInterceptor}`);
      }
      return `${consoleInterceptor}${content}`;
    }

    if (activeDoc.language === 'css' || activeDoc.name.endsWith('.css')) {
      return `<!DOCTYPE html><html><head>${consoleInterceptor}<style>${content}</style></head><body style="padding:20px;font-family:system-ui,-apple-system,sans-serif;background:#fff;color:#111;"><h1>CSS Preview</h1><p>This is a paragraph styled by your active stylesheet.</p><div class="box" style="padding:16px;border:1px solid #ccc;margin-top:12px;">Styled Box Container <button style="margin-left:12px;">Sample Button</button></div></body></html>`;
    }

    if (activeDoc.language === 'javascript' || activeDoc.name.endsWith('.js')) {
      return `<!DOCTYPE html><html><head>${consoleInterceptor}</head><body style="padding:20px;font-family:monospace;background:#181818;color:#00ff66;"><h3>JavaScript Execution Environment</h3><p style="color:#aaa;">Output sent to Preview Console below.</p><script>try { ${content} } catch(e) { console.error(e.message); }</script></body></html>`;
    }

    // Default generic text
    return `<!DOCTYPE html><html><head>${consoleInterceptor}</head><body style="padding:20px;font-family:monospace;white-space:pre-wrap;background:#181818;color:#ccc;">${content.replace(/</g, '&lt;')}</body></html>`;
  }, [activeDoc?.content, activeDoc?.language, activeDoc?.name]);

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  const getViewportWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      case 'desktop':
        return '1200px';
      case 'responsive':
      default:
        return '100%';
    }
  };

  const errorCount = logs.filter((l) => l.type === 'error').length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
        backgroundColor: '#181818',
        borderLeft: '1px solid #2e2e2e',
        userSelect: 'none',
        color: '#d4d4d4',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 10px',
          backgroundColor: '#202020',
          borderBottom: '1px solid #2e2e2e',
          fontSize: '12px',
          gap: '8px',
          userSelect: 'none',
          flexShrink: 0,
          height: '35px',
          boxSizing: 'border-box',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Left: Device Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
          <button
            onClick={() => setDeviceMode('responsive')}
            title="Responsive (100%)"
            style={{
              padding: '4px 6px',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: deviceMode === 'responsive' ? '#37373d' : 'transparent',
              color: deviceMode === 'responsive' ? '#ffffff' : '#999999',
            }}
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={() => setDeviceMode('desktop')}
            title="Desktop (1200px)"
            style={{
              padding: '4px 6px',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: deviceMode === 'desktop' ? '#37373d' : 'transparent',
              color: deviceMode === 'desktop' ? '#ffffff' : '#999999',
            }}
          >
            <Monitor size={13} />
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            title="Tablet (768px)"
            style={{
              padding: '4px 6px',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: deviceMode === 'tablet' ? '#37373d' : 'transparent',
              color: deviceMode === 'tablet' ? '#ffffff' : '#999999',
            }}
          >
            <Tablet size={13} />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            title="Mobile (375px)"
            style={{
              padding: '4px 6px',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: deviceMode === 'mobile' ? '#37373d' : 'transparent',
              color: deviceMode === 'mobile' ? '#ffffff' : '#999999',
            }}
          >
            <Smartphone size={13} />
          </button>
        </div>

        {/* Center: Live Server / URL Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {isRunning ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#1a2d1d',
                border: '1px solid #2d5a32',
                padding: '2px 8px',
                borderRadius: '3px',
                fontSize: '11px',
                color: '#4ec9b0',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#4ec9b0',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>Port {port}</span>
              <span style={{ color: '#2d5a32' }}>|</span>
              <button
                onClick={() => setUseServerUrl(!useServerUrl)}
                style={{
                  padding: '1px 6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: useServerUrl ? '#2d5a32' : 'transparent',
                  color: useServerUrl ? '#ffffff' : '#aaaaaa',
                }}
                title="Toggle between Server HTTP vs Keystroke Direct Preview"
              >
                {useServerUrl ? 'Live HTTP' : 'Direct'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => startServer()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '3px',
                backgroundColor: '#2a2a2a',
                color: '#cccccc',
                fontSize: '11px',
                border: '1px solid #3c3c3c',
                cursor: 'pointer',
              }}
              title="Start embedded Live Server (HTTP with auto-reload)"
            >
              <Radio size={11} style={{ color: '#888888' }} />
              <span>Start Live Server</span>
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={handleReload}
            title="Refresh Preview"
            style={{
              padding: '4px 6px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#888888',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RotateCw size={13} />
          </button>

          <button
            onClick={() => openInBrowser()}
            title="Open in System Browser"
            style={{
              padding: '4px 6px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#888888',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ExternalLink size={13} />
          </button>

          <button
            onClick={() => setShowConsole(!showConsole)}
            title="Toggle Preview Console"
            style={{
              padding: '4px 6px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: showConsole ? '#37373d' : 'transparent',
              color: showConsole ? '#ffffff' : '#888888',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Terminal size={13} />
            {errorCount > 0 && (
              <span
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  padding: '0 4px',
                  fontSize: '9px',
                  fontWeight: 700,
                }}
              >
                {errorCount}
              </span>
            )}
          </button>

          <button
            onClick={closePreview}
            title="Close Preview"
            style={{
              padding: '4px 6px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#888888',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div
        style={{
          flex: '1 1 0%',
          height: 'calc(100% - 35px)',
          minHeight: 0,
          width: '100%',
          backgroundColor: '#141414',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: deviceMode === 'responsive' ? '0' : '12px',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: getViewportWidth(),
            width: '100%',
            height: '100%',
            minHeight: 0,
            flex: '1 1 0%',
            backgroundColor: '#ffffff',
            boxShadow: deviceMode === 'responsive' ? 'none' : '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: deviceMode === 'responsive' ? '0' : '4px',
            boxSizing: 'border-box',
          }}
        >
          {useServerUrl && isRunning && serverPreviewUrl ? (
            <iframe
              key={`srv-${iframeKey}`}
              ref={iframeRef}
              src={serverPreviewUrl}
              style={{
                width: '100%',
                height: '100%',
                flex: '1 1 0%',
                minHeight: '100%',
                border: 'none',
                display: 'block',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
              }}
              title="Xivig Live Server Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            />
          ) : (
            <iframe
              key={`direct-${iframeKey}`}
              ref={iframeRef}
              srcDoc={previewHtml}
              style={{
                width: '100%',
                height: '100%',
                flex: '1 1 0%',
                minHeight: '100%',
                border: 'none',
                display: 'block',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
              }}
              title="Xivig Direct Preview"
              sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
            />
          )}
        </div>
      </div>

      {/* Embedded Console Drawer */}
      {showConsole && (
        <div
          style={{
            height: '160px',
            backgroundColor: '#1e1e1e',
            borderTop: '1px solid #2e2e2e',
            display: 'flex',
            flexDirection: 'column',
            fontSize: '12px',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 10px',
              backgroundColor: '#252526',
              borderBottom: '1px solid #2e2e2e',
              color: '#888888',
              fontFamily: 'monospace',
              fontSize: '11px',
            }}
          >
            <span>Preview Console ({logs.length} logs)</span>
            <button
              onClick={() => setLogs([])}
              title="Clear Console"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#888888',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={11} />
              <span>Clear</span>
            </button>
          </div>
          <div
            style={{
              flex: '1 1 0%',
              overflowY: 'auto',
              padding: '6px',
              fontFamily: 'monospace',
              fontSize: '11px',
            }}
          >
            {logs.length === 0 ? (
              <div style={{ color: '#666666', fontStyle: 'italic' }}>No console output yet.</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '2px 0',
                    borderBottom: '1px solid #2a2a2a',
                    color:
                      log.type === 'error'
                        ? '#f87171'
                        : log.type === 'warn'
                        ? '#facc15'
                        : log.type === 'info'
                        ? '#60a5fa'
                        : '#cccccc',
                    backgroundColor:
                      log.type === 'error'
                        ? 'rgba(127, 29, 29, 0.2)'
                        : log.type === 'warn'
                        ? 'rgba(113, 63, 18, 0.2)'
                        : 'transparent',
                  }}
                >
                  <span style={{ color: '#666666', fontSize: '10px', userSelect: 'none' }}>
                    [{log.timestamp}]
                  </span>
                  <span
                    style={{
                      textTransform: 'uppercase',
                      fontSize: '9px',
                      padding: '1px 4px',
                      borderRadius: '2px',
                      fontWeight: 700,
                      backgroundColor: '#333333',
                      color: '#e5e7eb',
                    }}
                  >
                    {log.type}
                  </span>
                  <span style={{ flex: '1 1 0%', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {log.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
