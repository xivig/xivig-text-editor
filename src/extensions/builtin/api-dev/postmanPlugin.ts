import { ApiRequest, HttpMethod } from './types';

/**
 * Checks if a parsed JSON object matches Postman Collection format.
 */
export function isPostmanCollection(json: any): boolean {
  if (!json || typeof json !== 'object') return false;
  return (
    (typeof json.info === 'object' && Array.isArray(json.item)) ||
    (typeof json.info?.schema === 'string' && json.info.schema.includes('getpostman.com'))
  );
}

/**
 * Recursively extracts requests from a Postman Collection v2 or v2.1 document.
 */
export function parsePostmanCollection(json: any): { name: string; requests: ApiRequest[] } {
  const collectionName = json?.info?.name || 'Imported Postman Collection';
  const requests: ApiRequest[] = [];

  function processItems(items: any[], folderPrefix = '') {
    if (!Array.isArray(items)) return;

    for (const item of items) {
      if (!item) continue;

      if (Array.isArray(item.item)) {
        // Folder
        const newPrefix = folderPrefix ? `${folderPrefix} / ${item.name}` : item.name;
        processItems(item.item, newPrefix);
      } else if (item.request) {
        // Request
        const req = item.request;
        const method: HttpMethod = (typeof req.method === 'string' ? req.method.toUpperCase() : 'GET') as HttpMethod;

        let url = '';
        const params: Record<string, string> = {};

        if (typeof req.url === 'string') {
          url = req.url;
        } else if (req.url && typeof req.url === 'object') {
          url = req.url.raw || '';
          if (Array.isArray(req.url.query)) {
            for (const q of req.url.query) {
              if (q && q.key && !q.disabled) {
                params[q.key] = q.value || '';
              }
            }
          }
        }

        const headers: Record<string, string> = {};
        if (Array.isArray(req.header)) {
          for (const h of req.header) {
            if (h && h.key && !h.disabled) {
              headers[h.key] = h.value || '';
            }
          }
        }

        let body: string | undefined;
        let bodyType: ApiRequest['bodyType'] = 'none';

        if (req.body) {
          const mode = req.body.mode;
          if (mode === 'raw') {
            body = req.body.raw || '';
            bodyType = 'json';
          } else if (mode === 'urlencoded' && Array.isArray(req.body.urlencoded)) {
            const pairs = req.body.urlencoded
              .filter((f: any) => f && f.key && !f.disabled)
              .map((f: any) => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value || '')}`);
            body = pairs.join('&');
            bodyType = 'x-www-form-urlencoded';
          }
        }

        const displayName = folderPrefix ? `[${folderPrefix}] ${item.name}` : item.name;

        requests.push({
          id: item.id || `pm_${Math.random().toString(36).substring(2, 9)}`,
          name: displayName || 'Untitled Request',
          method,
          url,
          headers: Object.keys(headers).length > 0 ? headers : undefined,
          params: Object.keys(params).length > 0 ? params : undefined,
          bodyType,
          body,
          description: typeof req.description === 'string' ? req.description : req.description?.content,
        });
      }
    }
  }

  processItems(json.item || []);

  return {
    name: collectionName,
    requests,
  };
}

/**
 * Exports an array of ApiRequest objects to a Postman Collection v2.1 JSON schema.
 */
export function exportToPostmanCollection(name: string, requests: ApiRequest[]): object {
  return {
    info: {
      name,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      _exporter_id: 'xivig-api-client',
    },
    item: requests.map((r) => {
      const headerList = r.headers
        ? Object.entries(r.headers).map(([key, value]) => ({ key, value, type: 'text' }))
        : [];

      return {
        name: r.name,
        request: {
          method: r.method,
          header: headerList,
          url: {
            raw: r.url,
            query: r.params
              ? Object.entries(r.params).map(([key, value]) => ({ key, value }))
              : [],
          },
          body: r.body
            ? {
                mode: r.bodyType === 'x-www-form-urlencoded' ? 'urlencoded' : 'raw',
                raw: r.body,
              }
            : undefined,
          description: r.description,
        },
      };
    }),
  };
}

/**
 * Parses Postman Environment JSON file into a key-value record.
 */
export function parsePostmanEnvironment(json: any): Record<string, string> {
  const env: Record<string, string> = {};
  if (!json || typeof json !== 'object') return env;

  const values = Array.isArray(json.values) ? json.values : [];
  for (const item of values) {
    if (item && item.key && item.enabled !== false) {
      env[item.key] = item.value !== undefined ? String(item.value) : '';
    }
  }

  return env;
}
