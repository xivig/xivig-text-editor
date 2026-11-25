import {
  DevicePresetId,
  DevicePreset,
  EmulatedViewport,
  LivePreviewSettings,
} from './types';

export const DEVICE_PRESETS: Record<DevicePresetId, DevicePreset> = {
  responsive: {
    id: 'responsive',
    name: 'Responsive (Fill)',
    width: 0,
    height: 0,
    dpr: 1,
    type: 'responsive',
  },
  iphone14: {
    id: 'iphone14',
    name: 'iPhone 14 / 15 Pro',
    width: 390,
    height: 844,
    dpr: 3,
    type: 'mobile',
  },
  pixel7: {
    id: 'pixel7',
    name: 'Google Pixel 7',
    width: 412,
    height: 915,
    dpr: 2.6,
    type: 'mobile',
  },
  ipad: {
    id: 'ipad',
    name: 'Apple iPad Air',
    width: 820,
    height: 1180,
    dpr: 2,
    type: 'tablet',
  },
  desktop: {
    id: 'desktop',
    name: 'Desktop Full HD (1080p)',
    width: 1920,
    height: 1080,
    dpr: 1,
    type: 'desktop',
  },
  macbook: {
    id: 'macbook',
    name: 'MacBook Pro 14"',
    width: 1512,
    height: 982,
    dpr: 2,
    type: 'desktop',
  },
};

export const DEFAULT_LIVE_PREVIEW_SETTINGS: LivePreviewSettings = {
  enabled: true,
  defaultDevice: 'responsive',
  defaultOrientation: 'portrait',
  zoom: 100,
  autoReloadOnSave: true,
  highlightElementOnInspect: true,
  captureConsoleLogs: true,
};

/**
 * Calculates pixel dimensions and scaling based on device preset and orientation.
 */
export function calculateEmulatedViewport(
  presetId: DevicePresetId,
  orientation?: 'portrait' | 'landscape',
  zoom = 100
): EmulatedViewport {
  const preset = DEVICE_PRESETS[presetId] || DEVICE_PRESETS.responsive;
  const resolvedOrientation = orientation ?? (preset.type === 'desktop' ? 'landscape' : 'portrait');

  if (preset.type === 'responsive') {
    return {
      width: '100%',
      height: '100%',
      zoom: Math.max(25, Math.min(200, zoom)),
      dpr: 1,
      orientation: resolvedOrientation,
      presetId,
    };
  }

  let w = preset.width;
  let h = preset.height;

  // For desktop screens, default is landscape (width > height) unless portrait requested.
  // For mobile/tablets, default is portrait (height > width) unless landscape requested.
  if (preset.type === 'desktop') {
    if (resolvedOrientation === 'portrait') {
      w = Math.min(preset.width, preset.height);
      h = Math.max(preset.width, preset.height);
    } else {
      w = Math.max(preset.width, preset.height);
      h = Math.min(preset.width, preset.height);
    }
  } else {
    if (resolvedOrientation === 'landscape') {
      w = Math.max(preset.width, preset.height);
      h = Math.min(preset.width, preset.height);
    } else {
      w = Math.min(preset.width, preset.height);
      h = Math.max(preset.width, preset.height);
    }
  }

  return {
    width: w,
    height: h,
    zoom: Math.max(25, Math.min(200, zoom)),
    dpr: preset.dpr,
    orientation: resolvedOrientation,
    presetId,
  };
}

/**
 * Generates client-side injection script for Live Preview iframe.
 * Captures console.log/warn/error and transmits to parent window,
 * and sets up live inspection element borders.
 */
export function generatePreviewInjectionScript(options?: {
  inspectMode?: boolean;
  captureConsole?: boolean;
}): string {
  const captureConsole = options?.captureConsole !== false;
  const inspectMode = !!options?.inspectMode;

  return `
(function() {
  if (window.__xivig_preview_initialized) return;
  window.__xivig_preview_initialized = true;

  ${captureConsole ? `
  // Console logging interceptor
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;

  function sendConsole(type, args) {
    try {
      const text = Array.from(args).map(a => {
        if (typeof a === 'object') {
          try { return JSON.stringify(a); } catch(e) { return String(a); }
        }
        return String(a);
      }).join(' ');

      window.parent.postMessage({
        source: 'xivig-preview-console',
        type: type,
        text: text,
        timestamp: new Date().toISOString()
      }, '*');
    } catch(err) {}
  }

  console.log = function() { sendConsole('log', arguments); originalLog.apply(console, arguments); };
  console.warn = function() { sendConsole('warn', arguments); originalWarn.apply(console, arguments); };
  console.error = function() { sendConsole('error', arguments); originalError.apply(console, arguments); };
  console.info = function() { sendConsole('info', arguments); originalInfo.apply(console, arguments); };

  window.addEventListener('error', function(e) {
    sendConsole('error', [e.message + ' at ' + (e.filename || '') + ':' + (e.lineno || 0)]);
  });
  ` : ''}

  ${inspectMode ? `
  // Element inspection overlay
  let hoverOverlay = null;

  function ensureOverlay() {
    if (!hoverOverlay) {
      hoverOverlay = document.createElement('div');
      hoverOverlay.id = '__xivig_inspect_overlay';
      hoverOverlay.style.position = 'fixed';
      hoverOverlay.style.pointerEvents = 'none';
      hoverOverlay.style.border = '2px solid #007acc';
      hoverOverlay.style.backgroundColor = 'rgba(0, 122, 204, 0.15)';
      hoverOverlay.style.zIndex = '999999';
      hoverOverlay.style.display = 'none';
      hoverOverlay.style.transition = 'all 0.05s ease';
      document.body.appendChild(hoverOverlay);
    }
  }

  document.addEventListener('mousemove', function(e) {
    ensureOverlay();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === hoverOverlay || el.tagName === 'HTML' || el.tagName === 'BODY') {
      hoverOverlay.style.display = 'none';
      return;
    }
    const rect = el.getBoundingClientRect();
    hoverOverlay.style.display = 'block';
    hoverOverlay.style.top = rect.top + 'px';
    hoverOverlay.style.left = rect.left + 'px';
    hoverOverlay.style.width = rect.width + 'px';
    hoverOverlay.style.height = rect.height + 'px';

    const computed = window.getComputedStyle(el);
    window.parent.postMessage({
      source: 'xivig-preview-inspect',
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      className: typeof el.className === 'string' ? el.className : '',
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      color: computed.color,
      fontSize: computed.fontSize
    }, '*');
  });
  ` : ''}
})();
  `.trim();
}
