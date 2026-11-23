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
    if (!activeDoc?.path || !currentFolderPath) return url;

    const normRoot = currentFolderPath.replace(/\\/g, '/');
    const normPath = activeDoc.path.replace(/\\/g, '/');
    if (normPath.startsWith(normRoot)) {
      const rel = normPath.replace(normRoot, '').replace(/^\//, '');
      return `${url}/${rel}`;
    }
    return url;
  }, [isRunning, url, activeDoc?.path, currentFolderPath]);

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
    <div className="flex flex-col h-full bg-[#181818] border-l border-[#2e2e2e] select-none text-gray-300">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#202020] border-b border-[#2e2e2e] text-xs">
        {/* Left: Device Presets */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setDeviceMode('responsive')}
            title="Responsive (100%)"
            className={`p-1 rounded transition-colors ${
              deviceMode === 'responsive' ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={() => setDeviceMode('desktop')}
            title="Desktop (1200px)"
            className={`p-1 rounded transition-colors ${
              deviceMode === 'desktop' ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Monitor size={13} />
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            title="Tablet (768px)"
            className={`p-1 rounded transition-colors ${
              deviceMode === 'tablet' ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Tablet size={13} />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            title="Mobile (375px)"
            className={`p-1 rounded transition-colors ${
              deviceMode === 'mobile' ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Smartphone size={13} />
          </button>
        </div>

        {/* Center: Live Server / URL Status */}
        <div className="flex items-center space-x-2">
          {isRunning ? (
            <div className="flex items-center space-x-1 bg-[#1a2d1d] border border-[#2d5a32] px-2 py-0.5 rounded text-[11px] text-[#4ec9b0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ec9b0] animate-pulse" />
              <span>Port {port}</span>
              <button
                onClick={() => setUseServerUrl(!useServerUrl)}
                className={`ml-1 px-1.5 py-0.2 rounded text-[10px] ${
                  useServerUrl ? 'bg-[#2d5a32] text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
                title="Toggle between Server HTTP vs Keystroke Preview"
              >
                {useServerUrl ? 'Live HTTP' : 'Direct'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => startServer()}
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#2a2a2a] hover:bg-[#333] text-gray-300 hover:text-white text-[11px] border border-[#3c3c3c] transition-colors"
              title="Start embedded Live Server (HTTP with auto-reload)"
            >
              <Radio size={11} className="text-gray-400" />
              <span>Start Live Server</span>
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleReload}
            title="Refresh Preview"
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#333] transition-colors"
          >
            <RotateCw size={13} />
          </button>

          <button
            onClick={() => openInBrowser()}
            title="Open in System Browser"
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#333] transition-colors"
          >
            <ExternalLink size={13} />
          </button>

          <button
            onClick={() => setShowConsole(!showConsole)}
            title="Toggle Preview Console"
            className={`p-1 rounded flex items-center space-x-1 transition-colors ${
              showConsole ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#333]'
            }`}
          >
            <Terminal size={13} />
            {errorCount > 0 && (
              <span className="bg-red-500 text-white rounded-full px-1 text-[9px] font-bold">
                {errorCount}
              </span>
            )}
          </button>

          <button
            onClick={closePreview}
            title="Close Preview"
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#333] transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 overflow-auto bg-[#141414] flex justify-center p-2 relative">
        <div
          className="h-full bg-white transition-all duration-200 shadow-2xl overflow-hidden flex flex-col rounded-sm"
          style={{
            width: getViewportWidth(),
            maxWidth: '100%',
          }}
        >
          {useServerUrl && isRunning && serverPreviewUrl ? (
            <iframe
              key={`srv-${iframeKey}`}
              ref={iframeRef}
              src={serverPreviewUrl}
              className="w-full h-full border-none flex-1"
              title="Xivig Live Server Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            />
          ) : (
            <iframe
              key={`direct-${iframeKey}`}
              ref={iframeRef}
              srcDoc={previewHtml}
              className="w-full h-full border-none flex-1"
              title="Xivig Direct Preview"
              sandbox="allow-scripts allow-forms allow-modals"
            />
          )}
        </div>
      </div>

      {/* Embedded Console Drawer */}
      {showConsole && (
        <div className="h-44 bg-[#1e1e1e] border-t border-[#2e2e2e] flex flex-col text-xs">
          <div className="flex items-center justify-between px-3 py-1 bg-[#252526] border-b border-[#2e2e2e] text-gray-400 font-mono">
            <span>Preview Console ({logs.length} logs)</span>
            <button
              onClick={() => setLogs([])}
              title="Clear Console"
              className="hover:text-white flex items-center space-x-1"
            >
              <Trash2 size={11} />
              <span>Clear</span>
            </button>
          </div>
          <div className="flex-1 overflow-auto p-2 font-mono text-[11px] space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500 italic">No console output yet.</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start space-x-2 py-0.5 border-b border-[#2a2a2a] ${
                    log.type === 'error'
                      ? 'text-red-400 bg-red-950/20'
                      : log.type === 'warn'
                      ? 'text-yellow-400 bg-yellow-950/20'
                      : log.type === 'info'
                      ? 'text-blue-400'
                      : 'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500 text-[10px] select-none">
                    [{log.timestamp}]
                  </span>
                  <span className="uppercase text-[9px] px-1 py-0.2 rounded font-bold bg-[#333] text-gray-200">
                    {log.type}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-all">{log.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
