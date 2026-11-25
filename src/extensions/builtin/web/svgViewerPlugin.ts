import DOMPurify from 'dompurify';
import { SvgMetadata, SvgViewerSettings } from './types';

export const DEFAULT_SVG_VIEWER_SETTINGS: SvgViewerSettings = {
  enabled: true,
  sanitizeOnRender: true,
  showCheckerboardGrid: true,
  allowScripts: false,
  maxFileSizeKb: 5120, // 5MB
};

/**
 * Sanitizes SVG markup to protect against XSS and malicious script execution.
 * Removes <script>, <iframe>, <object>, <embed>, <applet>, inline on* handlers, and javascript: links.
 */
export function sanitizeSvg(svgContent: string): {
  cleanSvg: string;
  removedElements: string[];
  isClean: boolean;
} {
  if (!svgContent || !svgContent.trim()) {
    return { cleanSvg: '', removedElements: [], isClean: true };
  }

  const removedElements: string[] = [];

  // Track if scripts or dangerous elements were present
  const dangerousTagRegex = /<\s*(script|iframe|object|embed|applet|meta|link)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>|<\s*(script|iframe|object|embed|applet|meta|link)\b[^>]*\/?>/gi;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = dangerousTagRegex.exec(svgContent)) !== null) {
    removedElements.push(tagMatch[1] || tagMatch[2]);
  }

  // Track dangerous event attributes: onclick, onload, onerror, onmouseover, etc.
  const dangerousAttrRegex = /\s(on[a-z]+)\s*=\s*["'][^"']*["']/gi;
  let attrMatch: RegExpExecArray | null;
  while ((attrMatch = dangerousAttrRegex.exec(svgContent)) !== null) {
    removedElements.push(attrMatch[1]);
  }

  // Track javascript: pseudo-protocols
  const jsUriRegex = /(?:href|src|xlink:href)\s*=\s*["']\s*javascript:[^"']*["']/gi;
  if (jsUriRegex.test(svgContent)) {
    removedElements.push('javascript: URI');
  }

  let clean = svgContent;

  // Use DOMPurify if in DOM environment (window / document available)
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    try {
      clean = DOMPurify.sanitize(svgContent, {
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_TAGS: ['use'],
      });
    } catch {
      // Fall through to regex sanitizer if DOMPurify encounters an issue
    }
  }

  // Regex-based hardening (ensures safety in pure node/headless and renderer environments alike)
  clean = clean
    .replace(/<\s*(?:script|iframe|object|embed|applet|meta|link)\b[^>]*>[\s\S]*?<\s*\/\s*(?:script|iframe|object|embed|applet|meta|link)\s*>/gi, '')
    .replace(/<\s*(?:script|iframe|object|embed|applet|meta|link)\b[^>]*\/?>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(?:href|src|xlink:href)\s*=\s*["']\s*javascript:[^"']*["']/gi, '');

  return {
    cleanSvg: clean.trim(),
    removedElements: Array.from(new Set(removedElements)),
    isClean: removedElements.length === 0,
  };
}

/**
 * Extracts dimensions, viewBox, path count, and color palette from SVG markup.
 */
export function extractSvgMetadata(svgContent: string): SvgMetadata {
  if (!svgContent) {
    return {
      elementCount: 0,
      pathCount: 0,
      colors: [],
      hasScripts: false,
      isSanitized: true,
    };
  }

  const { isClean } = sanitizeSvg(svgContent);

  // Extract viewBox
  const viewBoxMatch = svgContent.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1].trim() : undefined;

  // Extract width & height
  const widthMatch = svgContent.match(/<svg\b[^>]*\bwidth\s*=\s*["']([^"']+)["']/i);
  const heightMatch = svgContent.match(/<svg\b[^>]*\bheight\s*=\s*["']([^"']+)["']/i);

  // Extract element tags
  const tags = svgContent.match(/<([a-zA-Z][a-zA-Z0-9:-]*)\b/g) || [];
  const elementCount = tags.length;

  // Count paths
  const paths = svgContent.match(/<path\b/gi) || [];
  const pathCount = paths.length;

  // Extract colors from fill="..." and stroke="..." and style="..."
  const colorSet = new Set<string>();
  const fillMatches = svgContent.matchAll(/(?:fill|stroke)\s*=\s*["']([^"']+)["']/gi);
  for (const m of fillMatches) {
    const val = m[1].trim();
    if (val && val !== 'none' && val !== 'transparent' && val !== 'currentColor' && !val.startsWith('url(')) {
      colorSet.add(val.toLowerCase());
    }
  }

  return {
    width: widthMatch ? widthMatch[1] : undefined,
    height: heightMatch ? heightMatch[1] : undefined,
    viewBox,
    elementCount,
    pathCount,
    colors: Array.from(colorSet),
    hasScripts: !isClean,
    isSanitized: isClean,
  };
}

/**
 * Minifies and optimizes SVG markup for production distribution.
 */
export function optimizeSvg(svgContent: string): string {
  if (!svgContent) return '';

  return svgContent
    // Remove XML declaration and DOCTYPE
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Collapse multi-spaces and empty lines
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

/**
 * Converts sanitized SVG markup into a browser-safe Data URI.
 */
export function svgToDataUri(svgContent: string): string {
  const { cleanSvg } = sanitizeSvg(svgContent);
  const encoded = encodeURIComponent(cleanSvg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');

  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}
