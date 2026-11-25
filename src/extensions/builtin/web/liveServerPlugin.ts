import { LiveServerSettings } from './types';

export const DEFAULT_LIVE_SERVER_SETTINGS: LiveServerSettings = {
  enabled: true,
  port: 5500,
  autoOpenBrowser: false,
  ignorePatterns: ['node_modules/**', '.git/**', 'dist/**', 'build/**', '.cache/**'],
  liveReloadDebounceMs: 250,
  notifyOnReload: true,
};

/**
 * Validates and sanitizes a TCP port number.
 */
export function validatePort(port: number): { valid: boolean; port: number; error?: string } {
  if (!Number.isInteger(port)) {
    return { valid: false, port: 5500, error: 'Port must be an integer' };
  }
  if (port < 1024 || port > 65535) {
    return { valid: false, port: 5500, error: 'Port must be between 1024 and 65535' };
  }
  return { valid: true, port };
}

/**
 * Checks whether changes to a file path should trigger a live reload.
 */
export function isPathReloadEligible(
  filePath: string,
  ignorePatterns: string[] = DEFAULT_LIVE_SERVER_SETTINGS.ignorePatterns
): boolean {
  if (!filePath) return false;
  const normalized = filePath.replace(/\\/g, '/');

  for (const pattern of ignorePatterns) {
    const cleanPattern = pattern.replace('/**', '').replace('/*', '');
    if (normalized.includes(`/${cleanPattern}/`) || normalized.startsWith(`${cleanPattern}/`) || normalized.includes(cleanPattern)) {
      return false;
    }
  }

  // Reload eligible for web files
  return /\.(html|htm|css|js|jsx|ts|tsx|json|svg|png|jpe?g|webp|gif|php|blade\.php)$/i.test(normalized);
}

/**
 * Computes the HTTP preview URL for a given document within a workspace root.
 */
export function computeLiveServerUrl(rootPath: string, docPath?: string, port = 5500): string {
  const baseUrl = `http://127.0.0.1:${port}`;
  if (!docPath || !rootPath) {
    return baseUrl;
  }

  const normRoot = rootPath.replace(/\\/g, '/').replace(/\/$/, '');
  const normDoc = docPath.replace(/\\/g, '/');

  if (normDoc.startsWith(normRoot)) {
    const relative = normDoc.slice(normRoot.length).replace(/^\//, '');
    return `${baseUrl}/${encodeURI(relative)}`;
  }

  const filename = normDoc.split('/').pop() || '';
  return `${baseUrl}/${encodeURI(filename)}`;
}
