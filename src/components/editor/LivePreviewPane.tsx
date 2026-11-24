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
  Crosshair,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Info,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useLiveServerStore } from '../../stores/liveServerStore';
import { useFileStore } from '../../stores/fileStore';

export type DeviceMode = 'responsive' | 'mobile' | 'iphone14' | 'pixel7' | 'tablet' | 'ipad' | 'desktop';

export interface ConsoleLog {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  text: string;
  timestamp: string;
}

export interface InspectedElementInfo {
  tag: string;
  id?: string;
  className?: string;
  width: number;
  height: number;
  color?: string;
  fontSize?: string;
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
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [useServerUrl, setUseServerUrl] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'error' | 'warn'>('all');
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [inspectMode, setInspectMode] = useState<boolean>(false);
  const [inspectedElement, setInspectedElement] = useState<InspectedElementInfo | null>(null);

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

  // Capture console and inspect element messages from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'XIVIG_CONSOLE') {
        const newLog: ConsoleLog = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: e.data.level || 'log',
          text: e.data.args ? e.data.args.join(' ') : String(e.data.message || ''),
          timestamp: new Date().toLocaleTimeString(),
        };
        setLogs((prev) => [...prev.slice(-100), newLog]);
      } else if (e.data && e.data.type === 'XIVIG_INSPECT') {
        setInspectedElement({
          tag: e.data.tag,
          id: e.data.id || undefined,
          className: e.data.className || undefined,
          width: Math.round(e.data.width || 0),
          height: Math.round(e.data.height || 0),
          color: e.data.color,
          fontSize: e.data.fontSize,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Build srcDoc for instant keystroke preview
  const previewHtml = React.useMemo(() => {
    if (!activeDoc) {
      return '<body style="background:#1e1e1e;color:#888;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">No active document</body>';
    }

    const content = activeDoc.content || '';
    const consoleAndInspectorInterceptor = `
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

          // Inspect Mode listener
          let highlightBox = null;
          let isInspecting = ${inspectMode};

          function createHighlightBox() {
            if (highlightBox) return highlightBox;
            highlightBox = document.createElement('div');
            highlightBox.style.position = 'fixed';
            highlightBox.style.pointerEvents = 'none';
            highlightBox.style.border = '2px dashed #6c8cff';
            highlightBox.style.backgroundColor = 'rgba(108, 140, 255, 0.15)';
            highlightBox.style.zIndex = '999999';
            highlightBox.style.transition = 'all 0.05s ease';
            document.body.appendChild(highlightBox);
            return highlightBox;
          }

          if (isInspecting) {
            document.addEventListener('mouseover', function(e) {
              const el = e.target;
              if (!el || el === highlightBox) return;
              const rect = el.getBoundingClientRect();
              const box = createHighlightBox();
              box.style.top = rect.top + 'px';
              box.style.left = rect.left + 'px';
              box.style.width = rect.width + 'px';
              box.style.height = rect.height + 'px';

              const computed = window.getComputedStyle(el);
              window.parent.postMessage({
                type: 'XIVIG_INSPECT',
                tag: el.tagName.toLowerCase(),
                id: el.id,
                className: el.className,
                width: rect.width,
                height: rect.height,
                color: computed.color,
                fontSize: computed.fontSize,
              }, '*');
            }, true);
          }
        })();
      </script>
    `;

    if (activeDoc.language === 'html' || activeDoc.name.endsWith('.html') || activeDoc.name.endsWith('.htm')) {
      if (content.includes('<head>')) {
        return content.replace('<head>', `<head>${consoleAndInspectorInterceptor}`);
      }
      return `${consoleAndInspectorInterceptor}${content}`;
    }

    if (activeDoc.language === 'css' || activeDoc.name.endsWith('.css')) {
      return `<!DOCTYPE html><html><head>${consoleAndInspectorInterceptor}<style>${content}</style></head><body style="padding:20px;font-family:system-ui,-apple-system,sans-serif;background:#fff;color:#111;"><h1>CSS Preview</h1><p>This is a paragraph styled by your active stylesheet.</p><div class="box" style="padding:16px;border:1px solid #ccc;margin-top:12px;">Styled Box Container <button style="margin-left:12px;">Sample Button</button></div></body></html>`;
    }

    if (activeDoc.language === 'javascript' || activeDoc.name.endsWith('.js')) {
      return `<!DOCTYPE html><html><head>${consoleAndInspectorInterceptor}</head><body style="padding:20px;font-family:monospace;background:#181818;color:#00ff66;"><h3>JavaScript Execution Environment</h3><p style="color:#aaa;">Output sent to Preview Console below.</p><script>try { ${content} } catch(e) { console.error(e.message); }</script></body></html>`;
    }

    // Default generic text
    return `<!DOCTYPE html><html><head>${consoleAndInspectorInterceptor}</head><body style="padding:20px;font-family:monospace;white-space:pre-wrap;background:#181818;color:#ccc;">${content.replace(/</g, '&lt;')}</body></html>`;
  }, [activeDoc?.content, activeDoc?.language, activeDoc?.name, inspectMode]);

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  const getViewportDimensions = (): { width: string; height: string } => {
    let w = '100%';
    let h = '100%';

    switch (deviceMode) {
      case 'mobile':
      case 'iphone14':
        w = '390px';
        h = '844px';
        break;
      case 'pixel7':
        w = '412px';
        h = '915px';
        break;
      case 'tablet':
      case 'ipad':
        w = '820px';
        h = '1180px';
        break;
      case 'desktop':
        w = '1280px';
        h = '800px';
        break;
      case 'responsive':
      default:
        return { width: '100%', height: '100%' };
    }

    if (orientation === 'landscape') {
      return { width: h, height: w };
    }
    return { width: w, height: h };
  };

  const { width: viewportWidth, height: viewportHeight } = getViewportDimensions();
  const errorCount = logs.filter((l) => l.type === 'error').length;
  const filteredLogs = logs.filter((l) => consoleFilter === 'all' || l.type === consoleFilter);

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
          height: '38px',
          boxSizing: 'border-box',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Left: Device Presets & Orientation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
          <select
            value={deviceMode}
            onChange={(e: any) => setDeviceMode(e.target.value)}
            style={{
              padding: '2px 6px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #3c3c3c',
              borderRadius: '3px',
              color: '#fff',
              fontSize: '11px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="responsive">Responsive (100%)</option>
            <option value="iphone14">iPhone 14 (390×844)</option>
            <option value="pixel7">Pixel 7 (412×915)</option>
            <option value="ipad">iPad Air (820×1180)</option>
            <option value="desktop">Desktop HD (1280×800)</option>
          </select>

          {deviceMode !== 'responsive' && (
            <button
              onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}
              title={`Orientation: ${orientation} (click to rotate)`}
              style={{
                padding: '4px 6px',
                borderRadius: '3px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: '#cccccc',
              }}
            >
              <RotateCcw size={13} />
            </button>
          )}

          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
              title="Zoom Out"
              style={{ padding: '3px', border: 'none', background: 'none', color: '#999', cursor: 'pointer' }}
            >
              <ZoomOut size={12} />
            </button>
            <span style={{ fontSize: '10px', color: '#888', minWidth: '32px', textAlign: 'center' }}>
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
              title="Zoom In"
              style={{ padding: '3px', border: 'none', background: 'none', color: '#999', cursor: 'pointer' }}
            >
              <ZoomIn size={12} />
            </button>
          </div>
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
          {/* Inspect Element Toggle */}
          <button
            onClick={() => setInspectMode(!inspectMode)}
            title="Inspect Element (hover/click elements in preview)"
            style={{
              padding: '4px 6px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: inspectMode ? 'var(--xivig-accent, #6c8cff)' : 'transparent',
              color: inspectMode ? '#fff' : '#888888',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Crosshair size={13} />
          </button>

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
            onClick={() => setShowConsole(!showConsole)}
            title="Toggle Preview Console"
            style={{
              padding: '4px 8px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: showConsole ? '#37373d' : 'transparent',
              color: errorCount > 0 ? '#f87171' : showConsole ? '#ffffff' : '#888888',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: errorCount > 0 ? 600 : 400,
            }}
          >
            <Terminal size={13} />
            {errorCount > 0 && (
              <span
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '1px 5px',
                  fontSize: '9px',
                  fontWeight: 700,
                }}
              >
                {errorCount}
              </span>
            )}
          </button>

          {isRunning && (
            <button
              onClick={() => openInBrowser()}
              title="Open in External Browser"
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
          )}

          <button
            onClick={closePreview}
            title="Close Preview Pane"
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

      {/* Inspected Element Banner */}
      {inspectedElement && (
        <div
          style={{
            padding: '4px 10px',
            backgroundColor: 'rgba(108, 140, 255, 0.15)',
            borderBottom: '1px solid rgba(108, 140, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--xivig-accent, #6c8cff)', fontWeight: 700 }}>&lt;{inspectedElement.tag}&gt;</span>
            {inspectedElement.id && <span style={{ color: '#e6ad45' }}>#{inspectedElement.id}</span>}
            {inspectedElement.className && <span style={{ color: '#35b779' }}>.{inspectedElement.className}</span>}
            <span style={{ color: '#888' }}>
              {inspectedElement.width} × {inspectedElement.height}px
            </span>
            {inspectedElement.fontSize && <span style={{ color: '#aaa' }}>{inspectedElement.fontSize}</span>}
          </div>
          <button
            onClick={() => setInspectedElement(null)}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '2px' }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Main Viewport Container */}
      <div
        style={{
          flex: '1 1 0%',
          width: '100%',
          overflow: 'auto',
          display: 'flex',
          alignItems: deviceMode === 'responsive' ? 'stretch' : 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#141414',
          padding: deviceMode === 'responsive' ? '0' : '16px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: viewportWidth,
            height: deviceMode === 'responsive' ? '100%' : viewportHeight,
            maxWidth: '100%',
            transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
            transformOrigin: 'top center',
            transition: 'width 0.2s ease, height 0.2s ease, transform 0.15s ease',
            boxShadow: deviceMode === 'responsive' ? 'none' : '0 10px 30px rgba(0,0,0,0.5)',
            borderRadius: deviceMode === 'responsive' ? '0' : '6px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={useServerUrl && serverPreviewUrl ? serverPreviewUrl : undefined}
            srcDoc={!useServerUrl || !serverPreviewUrl ? previewHtml : undefined}
            title="Live Web Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#ffffff',
              display: 'block',
            }}
          />
        </div>
      </div>

      {/* Console Drawer */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Console ({logs.length})</span>
              <button
                onClick={() => setConsoleFilter('all')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: consoleFilter === 'all' ? '#fff' : '#888',
                  cursor: 'pointer',
                  fontWeight: consoleFilter === 'all' ? 700 : 400,
                }}
              >
                All
              </button>
              <button
                onClick={() => setConsoleFilter('error')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: consoleFilter === 'error' ? '#ef4444' : '#888',
                  cursor: 'pointer',
                  fontWeight: consoleFilter === 'error' ? 700 : 400,
                }}
              >
                Errors ({errorCount})
              </button>
            </div>
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
            {filteredLogs.length === 0 ? (
              <div style={{ color: '#666666', fontStyle: 'italic' }}>No console output yet.</div>
            ) : (
              filteredLogs.map((log) => (
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
