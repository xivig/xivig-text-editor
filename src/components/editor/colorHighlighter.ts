import {
  EditorView,
  ViewPlugin,
  ViewUpdate,
  Decoration,
  DecorationSet,
  WidgetType,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

// Regexes for CSS color literals
const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;
const RGB_COLOR_REGEX = /rgba?\(\s*\d{1,3}%?\s*(?:,\s*|\s+)\d{1,3}%?\s*(?:,\s*|\s+)\d{1,3}%?(?:\s*(?:,|\/)\s*(?:[01]?(?:\.\d+)?|\d{1,3}%))?\s*\)/gi;
const HSL_COLOR_REGEX = /hsla?\(\s*\d{1,3}(?:deg)?\s*(?:,\s*|\s+)\d{1,3}%\s*(?:,\s*|\s+)\d{1,3}%(?:\s*(?:,|\/)\s*(?:[01]?(?:\.\d+)?|\d{1,3}%))?\s*\)/gi;

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseCssColor(colorStr: string): RGBA {
  const str = colorStr.trim();

  // 1. Hex
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + 'ff';
    else if (hex.length === 4) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    else if (hex.length === 6) hex = hex + 'ff';
    const num = parseInt(hex, 16);
    if (!isNaN(num)) {
      return {
        r: (num >> 24) & 255,
        g: (num >> 16) & 255,
        b: (num >> 8) & 255,
        a: Number(((num & 255) / 255).toFixed(2)),
      };
    }
  }

  // 2. RGB / RGBA
  const rgbMatch = str.match(
    /rgba?\(\s*(\d{1,3}%?)\s*(?:,\s*|\s+)(\d{1,3}%?)\s*(?:,\s*|\s+)(\d{1,3}%?)(?:\s*(?:,|\/)\s*([01]?(?:\.\d+)?|\d{1,3}%))?\s*\)/i
  );
  if (rgbMatch) {
    const parseVal = (v: string) =>
      v.endsWith('%') ? Math.round(parseFloat(v) * 2.55) : parseInt(v, 10);
    const parseA = (v?: string) =>
      !v ? 1 : v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v);
    return {
      r: Math.min(255, Math.max(0, parseVal(rgbMatch[1]))),
      g: Math.min(255, Math.max(0, parseVal(rgbMatch[2]))),
      b: Math.min(255, Math.max(0, parseVal(rgbMatch[3]))),
      a: Math.min(1, Math.max(0, parseA(rgbMatch[4]))),
    };
  }

  // 3. HSL / HSLA
  const hslMatch = str.match(
    /hsla?\(\s*(\d{1,3}(?:deg)?)\s*(?:,\s*|\s+)(\d{1,3}%)\s*(?:,\s*|\s+)(\d{1,3}%)(?:\s*(?:,|\/)\s*([01]?(?:\.\d+)?|\d{1,3}%))?\s*\)/i
  );
  if (hslMatch) {
    const h = parseInt(hslMatch[1], 10) || 0;
    const s = (parseInt(hslMatch[2], 10) || 0) / 100;
    const l = (parseInt(hslMatch[3], 10) || 0) / 100;
    const parseA = (v?: string) =>
      !v ? 1 : v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v);
    const a = Math.min(1, Math.max(0, parseA(hslMatch[4])));

    const k = (n: number) => (n + h / 30) % 12;
    const fA = s * Math.min(l, 1 - l);
    const f = (n: number) => l - fA * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return {
      r: Math.round(255 * f(0)),
      g: Math.round(255 * f(8)),
      b: Math.round(255 * f(4)),
      a,
    };
  }

  return { r: 0, g: 0, b: 0, a: 1 };
}

export function toHex(rgba: RGBA): string {
  const hex = ((1 << 24) + (rgba.r << 16) + (rgba.g << 8) + rgba.b).toString(16).slice(1);
  if (rgba.a < 1) {
    const alphaHex = Math.round(rgba.a * 255)
      .toString(16)
      .padStart(2, '0');
    return `#${hex}${alphaHex}`;
  }
  return `#${hex}`;
}

export function toRgbString(rgba: RGBA): string {
  if (rgba.a < 1) {
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${Number(rgba.a.toFixed(2))})`;
  }
  return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
}

export function toHslString(rgba: RGBA): string {
  const r = rgba.r / 255;
  const g = rgba.g / 255;
  const b = rgba.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  if (rgba.a < 1) {
    return `hsla(${hDeg}, ${sPct}%, ${lPct}%, ${Number(rgba.a.toFixed(2))})`;
  }
  return `hsl(${hDeg}, ${sPct}%, ${lPct}%)`;
}

// Preset color palette (popular Tailwind CSS colors)
const PRESET_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#f43f5e', '#ffffff', '#94a3b8',
  '#475569', '#1e293b', '#0f172a', '#000000',
];

let activePopover: HTMLElement | null = null;

function removeActivePopover() {
  if (activePopover) {
    activePopover.remove();
    activePopover = null;
  }
}

/**
 * Creates and displays an interactive floating Color Picker popover.
 */
function openColorPicker(
  view: EditorView,
  targetRect: DOMRect,
  initialColorStr: string,
  rangeFrom: number,
  rangeTo: number
) {
  removeActivePopover();

  let currentColor = parseCssColor(initialColorStr);
  let currentFrom = rangeFrom;
  let currentTo = rangeTo;

  type ColorFormat = 'hex' | 'rgb' | 'hsl';
  let format: ColorFormat = initialColorStr.startsWith('hsl')
    ? 'hsl'
    : initialColorStr.startsWith('rgb')
    ? 'rgb'
    : 'hex';

  const popover = document.createElement('div');
  popover.className = 'xivig-color-picker-popover';
  Object.assign(popover.style, {
    position: 'fixed',
    left: `${Math.max(10, Math.min(window.innerWidth - 240, targetRect.left))}px`,
    top: `${Math.min(window.innerHeight - 260, targetRect.bottom + 6)}px`,
    zIndex: '99999',
    backgroundColor: 'var(--xivig-surface, #1e293b)',
    border: '1px solid var(--xivig-border, #334155)',
    borderRadius: '8px',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.55)',
    padding: '12px',
    width: '230px',
    userSelect: 'none',
    fontFamily: 'var(--xivig-font-ui, system-ui, sans-serif)',
    fontSize: '12px',
    color: 'var(--xivig-text, #f8fafc)',
  });

  const updateDocument = (newText: string) => {
    view.dispatch({
      changes: { from: currentFrom, to: currentTo, insert: newText },
      userEvent: 'input.color',
    });
    currentTo = currentFrom + newText.length;
  };

  const getFormattedColor = () => {
    if (format === 'hex') return toHex(currentColor);
    if (format === 'rgb') return toRgbString(currentColor);
    return toHslString(currentColor);
  };

  // Header: Color preview box + format toggle badge
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.marginBottom = '10px';

  const previewWrapper = document.createElement('div');
  previewWrapper.style.display = 'flex';
  previewWrapper.style.alignItems = 'center';
  previewWrapper.style.gap = '8px';

  const previewBox = document.createElement('div');
  Object.assign(previewBox.style, {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.2)',
    background: toRgbString(currentColor),
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  });
  previewBox.title = 'Click to open system color picker / eyedropper';

  // Invisible color input over previewBox to trigger native color picker
  const nativeColorInput = document.createElement('input');
  nativeColorInput.type = 'color';
  nativeColorInput.value = toHex(currentColor).slice(0, 7);
  Object.assign(nativeColorInput.style, {
    position: 'absolute',
    opacity: '0',
    width: '100%',
    height: '100%',
    cursor: 'pointer',
    top: '0',
    left: '0',
  });

  nativeColorInput.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    const parsed = parseCssColor(val);
    currentColor.r = parsed.r;
    currentColor.g = parsed.g;
    currentColor.b = parsed.b;
    refreshUI();
    updateDocument(getFormattedColor());
  });

  previewBox.appendChild(nativeColorInput);

  const formatBadge = document.createElement('button');
  formatBadge.textContent = format.toUpperCase();
  Object.assign(formatBadge.style, {
    padding: '3px 8px',
    backgroundColor: 'var(--xivig-accent, #38bdf8)',
    color: '#0f172a',
    borderRadius: '4px',
    fontWeight: '700',
    fontSize: '10px',
    cursor: 'pointer',
    border: 'none',
  });
  formatBadge.title = 'Click to cycle format (HEX / RGB / HSL)';

  formatBadge.addEventListener('click', () => {
    format = format === 'hex' ? 'rgb' : format === 'rgb' ? 'hsl' : 'hex';
    formatBadge.textContent = format.toUpperCase();
    colorTextInput.value = getFormattedColor();
    updateDocument(getFormattedColor());
  });

  previewWrapper.appendChild(previewBox);

  // Text representation input
  const colorTextInput = document.createElement('input');
  colorTextInput.type = 'text';
  colorTextInput.value = getFormattedColor();
  Object.assign(colorTextInput.style, {
    width: '110px',
    padding: '4px 6px',
    fontSize: '11px',
    backgroundColor: 'var(--xivig-surface-hover, #0f172a)',
    border: '1px solid var(--xivig-border, #334155)',
    color: 'var(--xivig-text, #fff)',
    borderRadius: '4px',
    outline: 'none',
  });

  colorTextInput.addEventListener('change', () => {
    const parsed = parseCssColor(colorTextInput.value);
    currentColor = parsed;
    refreshUI();
    updateDocument(getFormattedColor());
  });

  previewWrapper.appendChild(colorTextInput);
  header.appendChild(previewWrapper);
  header.appendChild(formatBadge);
  popover.appendChild(header);

  // Alpha slider
  const alphaRow = document.createElement('div');
  alphaRow.style.display = 'flex';
  alphaRow.style.alignItems = 'center';
  alphaRow.style.gap = '8px';
  alphaRow.style.marginBottom = '10px';

  const alphaLabel = document.createElement('span');
  alphaLabel.textContent = 'Alpha';
  alphaLabel.style.fontSize = '11px';
  alphaLabel.style.color = 'var(--xivig-text-dim, #94a3b8)';
  alphaLabel.style.width = '36px';

  const alphaSlider = document.createElement('input');
  alphaSlider.type = 'range';
  alphaSlider.min = '0';
  alphaSlider.max = '100';
  alphaSlider.value = `${Math.round(currentColor.a * 100)}`;
  alphaSlider.style.flex = '1';
  alphaSlider.style.cursor = 'pointer';

  alphaSlider.addEventListener('input', () => {
    currentColor.a = Number((parseInt(alphaSlider.value, 10) / 100).toFixed(2));
    refreshUI();
    updateDocument(getFormattedColor());
  });

  alphaRow.appendChild(alphaLabel);
  alphaRow.appendChild(alphaSlider);
  popover.appendChild(alphaRow);

  // Quick Preset Swatches
  const paletteHeader = document.createElement('div');
  paletteHeader.textContent = 'Presets';
  paletteHeader.style.fontSize = '10px';
  paletteHeader.style.color = 'var(--xivig-text-dim, #94a3b8)';
  paletteHeader.style.marginBottom = '6px';
  paletteHeader.style.textTransform = 'uppercase';
  popover.appendChild(paletteHeader);

  const paletteGrid = document.createElement('div');
  paletteGrid.style.display = 'grid';
  paletteGrid.style.gridTemplateColumns = 'repeat(8, 1fr)';
  paletteGrid.style.gap = '4px';

  PRESET_PALETTE.forEach((presetHex) => {
    const swatch = document.createElement('div');
    Object.assign(swatch.style, {
      width: '20px',
      height: '20px',
      borderRadius: '4px',
      backgroundColor: presetHex,
      cursor: 'pointer',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      transition: 'transform 0.1s ease',
    });
    swatch.title = presetHex;

    swatch.addEventListener('mouseenter', () => {
      swatch.style.transform = 'scale(1.15)';
    });
    swatch.addEventListener('mouseleave', () => {
      swatch.style.transform = 'scale(1)';
    });
    swatch.addEventListener('click', () => {
      currentColor = parseCssColor(presetHex);
      refreshUI();
      updateDocument(getFormattedColor());
    });

    paletteGrid.appendChild(swatch);
  });

  popover.appendChild(paletteGrid);

  function refreshUI() {
    previewBox.style.background = toRgbString(currentColor);
    nativeColorInput.value = toHex(currentColor).slice(0, 7);
    colorTextInput.value = getFormattedColor();
    alphaSlider.value = `${Math.round(currentColor.a * 100)}`;
  }

  // Dismiss on outside click
  const handleOutsideClick = (e: MouseEvent) => {
    if (!popover.contains(e.target as Node)) {
      removeActivePopover();
      document.removeEventListener('mousedown', handleOutsideClick);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      removeActivePopover();
      document.removeEventListener('keydown', handleKeyDown);
    }
  };

  setTimeout(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
  }, 10);

  document.body.appendChild(popover);
  activePopover = popover;
}

/**
 * Custom Widget that renders an inline color swatch square directly before a CSS color value.
 */
class ColorSwatchWidget extends WidgetType {
  constructor(
    readonly colorStr: string,
    readonly from: number,
    readonly to: number
  ) {
    super();
  }

  eq(other: ColorSwatchWidget) {
    return other.colorStr === this.colorStr && other.from === this.from && other.to === this.to;
  }

  toDOM(view: EditorView) {
    const swatch = document.createElement('span');
    swatch.className = 'cm-css-color-swatch';
    Object.assign(swatch.style, {
      display: 'inline-block',
      width: '11px',
      height: '11px',
      margin: '0 4px 0 1px',
      verticalAlign: '-1px',
      borderRadius: '3px',
      cursor: 'pointer',
      boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
      backgroundColor: this.colorStr,
      backgroundImage:
        'linear-gradient(45deg, #bbb 25%, transparent 25%), linear-gradient(-45deg, #bbb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #bbb 75%), linear-gradient(-45deg, transparent 75%, #bbb 75%)',
      backgroundSize: '4px 4px',
      backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px',
      position: 'relative',
    });

    const innerColor = document.createElement('span');
    Object.assign(innerColor.style, {
      display: 'block',
      width: '100%',
      height: '100%',
      borderRadius: '2px',
      backgroundColor: this.colorStr,
    });
    swatch.appendChild(innerColor);

    const parsed = parseCssColor(this.colorStr);
    const hex = toHex(parsed);
    const rgb = toRgbString(parsed);
    const hsl = toHslString(parsed);
    swatch.title = `${hex} | ${rgb} | ${hsl}\nClick to open interactive color picker`;

    swatch.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const rect = swatch.getBoundingClientRect();
      openColorPicker(view, rect, this.colorStr, this.from, this.to);
    });

    return swatch;
  }

  ignoreEvent() {
    return false;
  }
}

/**
 * Builds decorations across all visible ranges in the viewport,
 * identifying HEX, RGB, RGBA, HSL, and HSLA color codes.
 */
function buildColorDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.sliceDoc(from, to);
    const matches: { color: string; from: number; to: number }[] = [];

    // 1. Match Hex colors (#fff, #38bdf8, #1e293be6, etc.)
    let m: RegExpExecArray | null;
    HEX_COLOR_REGEX.lastIndex = 0;
    while ((m = HEX_COLOR_REGEX.exec(text)) !== null) {
      matches.push({
        color: m[0],
        from: from + m.index,
        to: from + m.index + m[0].length,
      });
    }

    // 2. Match RGB / RGBA colors
    RGB_COLOR_REGEX.lastIndex = 0;
    while ((m = RGB_COLOR_REGEX.exec(text)) !== null) {
      matches.push({
        color: m[0],
        from: from + m.index,
        to: from + m.index + m[0].length,
      });
    }

    // 3. Match HSL / HSLA colors
    HSL_COLOR_REGEX.lastIndex = 0;
    while ((m = HSL_COLOR_REGEX.exec(text)) !== null) {
      matches.push({
        color: m[0],
        from: from + m.index,
        to: from + m.index + m[0].length,
      });
    }

    // Sort all matches ascending by start position
    matches.sort((a, b) => a.from - b.from);

    // Filter out overlapping ranges
    let lastTo = -1;
    for (const match of matches) {
      if (match.from >= lastTo) {
        builder.add(
          match.from,
          match.from,
          Decoration.widget({
            widget: new ColorSwatchWidget(match.color, match.from, match.to),
            side: -1,
          })
        );
        lastTo = match.to;
      }
    }
  }

  return builder.finish();
}

/**
 * CodeMirror 6 ViewPlugin for CSS color highlighting and interactive color picking.
 */
export const cssColorHighlighterExtension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildColorDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildColorDecorations(update.view);
      }
    }

    destroy() {
      removeActivePopover();
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
