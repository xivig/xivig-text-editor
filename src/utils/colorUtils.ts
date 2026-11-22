export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HSVA {
  h: number; // 0 - 360
  s: number; // 0 - 100
  v: number; // 0 - 100
  a: number; // 0 - 1
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// Convert RGB to HEX (#rrggbb or #rrggbbaa)
export function rgbToHex(r: number, g: number, b: number, a = 1): string {
  const toHex = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
  if (a < 1) {
    const alphaHex = Math.round(clamp(a * 255, 0, 255)).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert RGBA to RGB string
export function rgbaToString(r: number, g: number, b: number, a = 1): string {
  if (a < 1) {
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${parseFloat(a.toFixed(2))})`;
  }
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

// Convert RGBA to HSLA string
export function rgbaToHslString(r: number, g: number, b: number, a = 1): string {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  if (a < 1) {
    return `hsla(${hDeg}, ${sPct}%, ${lPct}%, ${parseFloat(a.toFixed(2))})`;
  }
  return `hsl(${hDeg}, ${sPct}%, ${lPct}%)`;
}

// RGB to HSV
export function rgbToHsv(r: number, g: number, b: number, a = 1): HSVA {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;

  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const diff = max - min;

  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (diff !== 0) {
    switch (max) {
      case rN:
        h = (gN - bN) / diff + (gN < bN ? 6 : 0);
        break;
      case gN:
        h = (bN - rN) / diff + 2;
        break;
      case bN:
        h = (rN - gN) / diff + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
    a,
  };
}

// HSV to RGB
export function hsvToRgb(h: number, s: number, v: number, a = 1): RGBA {
  const hN = (h % 360) / 60;
  const sN = s / 100;
  const vN = v / 100;

  const c = vN * sN;
  const x = c * (1 - Math.abs((hN % 2) - 1));
  const m = vN - c;

  let r1 = 0, g1 = 0, b1 = 0;
  if (hN >= 0 && hN < 1) { r1 = c; g1 = x; b1 = 0; }
  else if (hN >= 1 && hN < 2) { r1 = x; g1 = c; b1 = 0; }
  else if (hN >= 2 && hN < 3) { r1 = 0; g1 = c; b1 = x; }
  else if (hN >= 3 && hN < 4) { r1 = 0; g1 = x; b1 = c; }
  else if (hN >= 4 && hN < 5) { r1 = x; g1 = 0; b1 = c; }
  else if (hN >= 5 && hN <= 6) { r1 = c; g1 = 0; b1 = x; }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
    a,
  };
}

// Parse arbitrary CSS color string into RGBA
export function parseCssColor(colorStr: string): RGBA {
  const str = colorStr.trim().toLowerCase();

  // 1. HEX (#rgb, #rgba, #rrggbb, #rrggbbaa)
  if (str.startsWith('#')) {
    const hex = str.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }
    if (hex.length === 4) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: parseInt(hex[3] + hex[3], 16) / 255,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      };
    }
  }

  // 2. rgb / rgba
  const rgbMatch = str.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
      a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1,
    };
  }

  // 3. Named colors fallback canvas
  try {
    const dummy = document.createElement('canvas').getContext('2d');
    if (dummy) {
      dummy.fillStyle = str;
      const computed = dummy.fillStyle;
      if (computed && computed !== str) {
        return parseCssColor(computed);
      }
    }
  } catch {}

  // Default fallback to cyan accent
  return { r: 108, g: 140, b: 255, a: 1 };
}
