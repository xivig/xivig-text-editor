import { sanitizeSvg, extractSvgMetadata } from '../extensions/builtin/web/svgViewerPlugin';

export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.svg'] as const;
export const RASTER_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico'] as const;

export type ImageExtension = typeof IMAGE_EXTENSIONS[number];

/**
 * Checks whether the given filename or path is an image file (raster or vector SVG).
 */
export function isImageFile(filenameOrPath?: string | null): boolean {
  if (!filenameOrPath) return false;
  const clean = filenameOrPath.split('?')[0].split('#')[0];
  const lastDot = clean.lastIndexOf('.');
  if (lastDot === -1) return false;
  const ext = clean.slice(lastDot).toLowerCase();
  return (IMAGE_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * Checks whether the given filename or path is an SVG vector image.
 */
export function isSvgFile(filenameOrPath?: string | null): boolean {
  if (!filenameOrPath) return false;
  const clean = filenameOrPath.split('?')[0].split('#')[0];
  return clean.toLowerCase().endsWith('.svg');
}

/**
 * Checks whether the given filename or path is a raster image (PNG, JPG, GIF, WebP, BMP, ICO).
 */
export function isRasterImageFile(filenameOrPath?: string | null): boolean {
  if (!filenameOrPath) return false;
  const clean = filenameOrPath.split('?')[0].split('#')[0];
  const lastDot = clean.lastIndexOf('.');
  if (lastDot === -1) return false;
  const ext = clean.slice(lastDot).toLowerCase();
  return (RASTER_IMAGE_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * Returns the standard MIME type for an image extension.
 */
export function getImageMimeType(filenameOrPath?: string | null): string {
  if (!filenameOrPath) return 'application/octet-stream';
  const clean = filenameOrPath.split('?')[0].split('#')[0].toLowerCase();
  if (clean.endsWith('.png')) return 'image/png';
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
  if (clean.endsWith('.gif')) return 'image/gif';
  if (clean.endsWith('.webp')) return 'image/webp';
  if (clean.endsWith('.svg')) return 'image/svg+xml';
  if (clean.endsWith('.bmp')) return 'image/bmp';
  if (clean.endsWith('.ico')) return 'image/x-icon';
  return 'application/octet-stream';
}

/**
 * Formats a byte size into a human-readable string (B, KB, MB).
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Estimates byte size from a base64 string or Data URL.
 */
export function estimateBase64SizeBytes(dataUrlOrBase64: string): number {
  if (!dataUrlOrBase64) return 0;
  const base64Str = dataUrlOrBase64.includes(';base64,')
    ? dataUrlOrBase64.split(';base64,')[1]
    : dataUrlOrBase64;
  const padding = (base64Str.endsWith('==') ? 2 : base64Str.endsWith('=') ? 1 : 0);
  return Math.max(0, Math.floor((base64Str.length * 3) / 4) - padding);
}

export { sanitizeSvg, extractSvgMetadata };
