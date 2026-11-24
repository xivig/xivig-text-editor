import React from 'react';

export interface AnsiSpan {
  text: string;
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
}

const ANSI_COLOR_MAP: Record<number, string> = {
  // Standard 8 colors (One Dark Pro theme inspired)
  30: '#5c6370', // Black / Dark gray
  31: '#e06c75', // Red
  32: '#98c379', // Green
  33: '#e5c07b', // Yellow
  34: '#61afef', // Blue
  35: '#c678dd', // Magenta
  36: '#56b6c2', // Cyan
  37: '#abb2bf', // White / Light gray

  // Bright 8 colors
  90: '#5c6370', // Bright black (gray)
  91: '#e06c75', // Bright red
  92: '#98c379', // Bright green
  93: '#e5c07b', // Bright yellow
  94: '#61afef', // Bright blue
  95: '#c678dd', // Bright magenta
  96: '#56b6c2', // Bright cyan
  97: '#ffffff', // Bright white
};

const ANSI_BG_MAP: Record<number, string> = {
  // Standard 8 background colors
  40: 'rgba(0, 0, 0, 0.4)',
  41: 'rgba(224, 108, 117, 0.25)',
  42: 'rgba(152, 195, 121, 0.25)',
  43: 'rgba(229, 192, 123, 0.25)',
  44: 'rgba(97, 175, 239, 0.25)',
  45: 'rgba(198, 120, 221, 0.25)',
  46: 'rgba(86, 182, 194, 0.25)',
  47: 'rgba(171, 178, 191, 0.25)',

  // Bright 8 background colors
  100: 'rgba(92, 99, 112, 0.35)',
  101: 'rgba(224, 108, 117, 0.35)',
  102: 'rgba(152, 195, 121, 0.35)',
  103: 'rgba(229, 192, 123, 0.35)',
  104: 'rgba(97, 175, 239, 0.35)',
  105: 'rgba(198, 120, 221, 0.35)',
  106: 'rgba(86, 182, 194, 0.35)',
  107: 'rgba(255, 255, 255, 0.35)',
};

/**
 * Strips all ANSI escape sequences (colors, cursor control, etc.) from a string.
 */
export function stripAnsi(text: string): string {
  if (!text || (!text.includes('\u001b') && !text.includes('\x1b'))) {
    return text;
  }
  return text
    .replace(/\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)/g, '')
    .replace(/\u001b\[[?0-9;]*[a-zA-Z]/g, '')
    .replace(/\u001b[()][AB012]/g, '')
    .replace(/\u001b./g, '');
}

/**
 * 256-color palette lookup.
 */
function get256Color(n: number): string {
  if (n < 0 || n > 255) return '#abb2bf';
  const ansi16 = [
    '#000000', '#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#abb2bf',
    '#5c6370', '#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#ffffff',
  ];
  if (n < 16) return ansi16[n];
  if (n >= 232) {
    const gray = Math.round(8 + (n - 232) * 10);
    return `rgb(${gray}, ${gray}, ${gray})`;
  }
  const code = n - 16;
  const r = Math.floor(code / 36);
  const g = Math.floor((code % 36) / 6);
  const b = code % 6;
  const v = (x: number) => (x === 0 ? 0 : 55 + x * 40);
  return `rgb(${v(r)}, ${v(g)}, ${v(b)})`;
}

/**
 * Parses a string containing ANSI escape sequences into styled spans.
 */
export function parseAnsi(text: string): AnsiSpan[] {
  if (!text) return [];

  // Strip non-SGR ANSI sequences first so they don't break rendering
  const cleaned = text
    .replace(/\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)/g, '')
    .replace(/\u001b\[[?0-9;]*[a-ln-z]/gi, '')
    .replace(/\u001b[()][AB012]/g, '');

  if (!cleaned.includes('\u001b') && !cleaned.includes('\x1b')) {
    return [{ text: cleaned }];
  }

  const spans: AnsiSpan[] = [];
  const regex = /\u001b\[([0-9;]*)m/g;
  let lastIndex = 0;

  let currentColor: string | undefined;
  let currentBg: string | undefined;
  let isBold = false;
  let isDim = false;
  let isItalic = false;
  let isUnderline = false;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(cleaned)) !== null) {
    const textSegment = cleaned.slice(lastIndex, match.index);
    if (textSegment.length > 0) {
      spans.push({
        text: textSegment,
        color: currentColor,
        backgroundColor: currentBg,
        bold: isBold || undefined,
        dim: isDim || undefined,
        italic: isItalic || undefined,
        underline: isUnderline || undefined,
      });
    }

    lastIndex = regex.lastIndex;

    const rawParams = match[1];
    const params = rawParams === '' ? [0] : rawParams.split(';').map((p) => parseInt(p, 10));

    let i = 0;
    while (i < params.length) {
      const code = isNaN(params[i]) ? 0 : params[i];

      if (code === 0) {
        // Reset all
        currentColor = undefined;
        currentBg = undefined;
        isBold = false;
        isDim = false;
        isItalic = false;
        isUnderline = false;
      } else if (code === 1) {
        isBold = true;
      } else if (code === 2) {
        isDim = true;
      } else if (code === 3) {
        isItalic = true;
      } else if (code === 4) {
        isUnderline = true;
      } else if (code === 22) {
        isBold = false;
        isDim = false;
      } else if (code === 23) {
        isItalic = false;
      } else if (code === 24) {
        isUnderline = false;
      } else if (ANSI_COLOR_MAP[code]) {
        currentColor = ANSI_COLOR_MAP[code];
      } else if (ANSI_BG_MAP[code]) {
        currentBg = ANSI_BG_MAP[code];
      } else if (code === 39) {
        currentColor = undefined;
      } else if (code === 49) {
        currentBg = undefined;
      } else if (code === 38) {
        // Extended foreground color: 38;5;n or 38;2;r;g;b
        if (params[i + 1] === 5 && params[i + 2] !== undefined) {
          currentColor = get256Color(params[i + 2]);
          i += 2;
        } else if (params[i + 1] === 2 && params[i + 4] !== undefined) {
          currentColor = `rgb(${params[i + 2]}, ${params[i + 3]}, ${params[i + 4]})`;
          i += 4;
        }
      } else if (code === 48) {
        // Extended background color: 48;5;n or 48;2;r;g;b
        if (params[i + 1] === 5 && params[i + 2] !== undefined) {
          currentBg = get256Color(params[i + 2]);
          i += 2;
        } else if (params[i + 1] === 2 && params[i + 4] !== undefined) {
          currentBg = `rgb(${params[i + 2]}, ${params[i + 3]}, ${params[i + 4]})`;
          i += 4;
        }
      }
      i++;
    }
  }

  const trailingText = cleaned.slice(lastIndex);
  if (trailingText.length > 0) {
    spans.push({
      text: trailingText,
      color: currentColor,
      backgroundColor: currentBg,
      bold: isBold || undefined,
      dim: isDim || undefined,
      italic: isItalic || undefined,
      underline: isUnderline || undefined,
    });
  }

  return spans;
}

/**
 * Formats a uniform 11-character timestamp: "hh:mm:ss AM/PM".
 * Ensures perfect vertical alignment and guarantees zero layout jumping.
 */
export function formatOutputTimestamp(input?: Date | string): string {
  if (!input) {
    input = new Date();
  }
  if (input instanceof Date) {
    let hours = input.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const h = String(hours).padStart(2, '0');
    const m = String(input.getMinutes()).padStart(2, '0');
    const s = String(input.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s} ${ampm}`;
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})(?:\s*([a-zA-Z]{2}))?$/);
    if (match) {
      let hNum = parseInt(match[1], 10);
      let ampm = match[4] ? match[4].toUpperCase() : '';
      if (!ampm) {
        // If 24-hour time like 18:40:15 without AM/PM
        if (hNum >= 12) {
          ampm = 'PM';
          if (hNum > 12) hNum -= 12;
        } else {
          ampm = 'AM';
          if (hNum === 0) hNum = 12;
        }
      }
      const h = String(hNum).padStart(2, '0');
      const m = match[2].padStart(2, '0');
      const s = match[3].padStart(2, '0');
      return `${h}:${m}:${s} ${ampm}`;
    }
    return trimmed;
  }
  return '';
}

/**
 * Renders an ANSI string as React styled components.
 */
export function renderAnsi(text: string, defaultColor?: string): React.ReactNode {
  if (!text) return null;

  if (!text.includes('\u001b') && !text.includes('\x1b')) {
    return text;
  }

  const spans = parseAnsi(text);
  if (spans.length === 0) return null;
  if (spans.length === 1 && !spans[0].color && !spans[0].bold && !spans[0].dim && !spans[0].italic && !spans[0].underline && !spans[0].backgroundColor) {
    return spans[0].text;
  }

  return spans.map((span, index) => {
    const style: React.CSSProperties = {};
    if (span.color) style.color = span.color;
    else if (defaultColor) style.color = defaultColor;

    if (span.backgroundColor) style.backgroundColor = span.backgroundColor;
    if (span.bold) style.fontWeight = 600;
    if (span.dim) style.opacity = 0.65;
    if (span.italic) style.fontStyle = 'italic';
    if (span.underline) style.textDecoration = 'underline';

    return (
      <span key={index} style={style}>
        {span.text}
      </span>
    );
  });
}
