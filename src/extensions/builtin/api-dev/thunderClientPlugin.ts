import { ApiRequest, ThunderClientSettings } from './types';

export const DEFAULT_THUNDER_CLIENT_SETTINGS: ThunderClientSettings = {
  enabled: true,
  defaultTimeoutMs: 30000,
  followRedirects: true,
  saveResponseHistory: true,
};

/**
 * Replaces {{variable}} placeholders with values from an environment dictionary.
 */
export function interpolateVariables(template: string, vars: Record<string, string> = {}): string {
  if (!template) return '';
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

/**
 * Constructs a browser/Node-compatible fetch request specification from an ApiRequest.
 */
export function buildFetchRequest(
  req: ApiRequest,
  env: Record<string, string> = {}
): { url: string; options: RequestInit } {
  let targetUrl = interpolateVariables(req.url, env);

  // Append query params if specified
  if (req.params && Object.keys(req.params).length > 0) {
    const urlObj = new URL(targetUrl.startsWith('http') ? targetUrl : `http://${targetUrl}`);
    for (const [key, value] of Object.entries(req.params)) {
      const interpolatedKey = interpolateVariables(key, env);
      const interpolatedVal = interpolateVariables(value, env);
      urlObj.searchParams.set(interpolatedKey, interpolatedVal);
    }
    targetUrl = urlObj.toString();
  }

  const headers: Record<string, string> = {};
  if (req.headers) {
    for (const [k, v] of Object.entries(req.headers)) {
      headers[interpolateVariables(k, env)] = interpolateVariables(v, env);
    }
  }

  const options: RequestInit = {
    method: req.method,
    headers,
  };

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.body) {
    const interpolatedBody = interpolateVariables(req.body, env);
    options.body = interpolatedBody;

    if (!Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) {
      if (req.bodyType === 'json' || (interpolatedBody.startsWith('{') && interpolatedBody.endsWith('}'))) {
        headers['Content-Type'] = 'application/json';
      } else if (req.bodyType === 'x-www-form-urlencoded') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }
  }

  return {
    url: targetUrl,
    options,
  };
}

/**
 * Formats a response payload for pretty viewing in the response panel.
 */
export function formatResponseBody(body: string, contentType = ''): string {
  if (!body) return '';

  const isJson =
    contentType.toLowerCase().includes('json') ||
    (body.trim().startsWith('{') && body.trim().endsWith('}')) ||
    (body.trim().startsWith('[') && body.trim().endsWith(']'));

  if (isJson) {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  }

  return body;
}

/**
 * Formats byte counts into human-readable data size strings.
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

/**
 * Formats duration in milliseconds into a user-friendly string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}
