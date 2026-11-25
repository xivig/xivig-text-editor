import { RestClientRequest, HttpMethod, RestClientSettings } from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export const DEFAULT_REST_CLIENT_SETTINGS: RestClientSettings = {
  enabled: true,
  timeoutMs: 15000,
  followRedirects: true,
  defaultHeaders: {
    'User-Agent': 'Xivig-REST-Client/1.0',
  },
};

const COMMON_HTTP_HEADERS = [
  'Accept', 'Accept-Encoding', 'Accept-Language', 'Authorization',
  'Cache-Control', 'Content-Type', 'Cookie', 'Origin', 'User-Agent',
  'X-Requested-With', 'X-Api-Key', 'X-Forwarded-For',
];

const COMMON_CONTENT_TYPES = [
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
  'text/html',
  'application/xml',
];

/**
 * Resolves system variables like {{$guid}}, {{$timestamp}}, and {{$randomInt min max}}.
 */
export function resolveSystemVariables(text: string): string {
  if (!text) return '';

  return text
    .replace(/\{\{\s*\$guid\s*\}\}/gi, () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    })
    .replace(/\{\{\s*\$timestamp(?:\s+([-+]?\d+[smhd]?))?\s*\}\}/gi, () => {
      return Math.floor(Date.now() / 1000).toString();
    })
    .replace(/\{\{\s*\$randomInt\s+(\d+)\s+(\d+)\s*\}\}/gi, (_, minStr, maxStr) => {
      const min = parseInt(minStr, 10);
      const max = parseInt(maxStr, 10);
      return Math.floor(Math.random() * (max - min + 1) + min).toString();
    })
    .replace(/\{\{\s*\$datetime\s*([a-zA-Z0-9_-]+)?\s*\}\}/gi, () => {
      return new Date().toISOString();
    });
}

/**
 * Parses an entire .http or .rest file content into executable RestClientRequest objects.
 */
export function parseHttpFile(
  content: string,
  externalVars: Record<string, string> = {}
): RestClientRequest[] {
  if (!content || !content.trim()) return [];

  const lines = content.split(/\r?\n/);
  const fileVars: Record<string, string> = { ...externalVars };
  const requests: RestClientRequest[] = [];

  // 1. First pass: extract file-level variables (@name = value)
  for (const line of lines) {
    const varMatch = line.match(/^@([a-zA-Z0-9_.-]+)\s*=\s*(.+)$/);
    if (varMatch) {
      fileVars[varMatch[1].trim()] = varMatch[2].trim();
    }
  }

  function applyVars(str: string): string {
    const withFileVars = str.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, key) => {
      return fileVars[key] !== undefined ? fileVars[key] : match;
    });
    return resolveSystemVariables(withFileVars);
  }

  // 2. Second pass: split blocks delimited by ###
  let currentBlockLines: { line: string; index: number }[] = [];
  let currentBlockName = '';

  function flushBlock() {
    if (currentBlockLines.length === 0) return;

    // Filter out comment lines and variable declarations
    const effectiveLines = currentBlockLines.filter(
      (item) => !item.line.trim().startsWith('#') && !item.line.trim().startsWith('@')
    );

    if (effectiveLines.length === 0) {
      currentBlockLines = [];
      return;
    }

    // First effective line must be request line: METHOD URL [HTTP/version]
    const requestLineItem = effectiveLines[0];
    const reqLineTokens = requestLineItem.line.trim().split(/\s+/);
    if (reqLineTokens.length < 2) {
      currentBlockLines = [];
      return;
    }

    const rawMethod = reqLineTokens[0].toUpperCase();
    const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    if (!validMethods.includes(rawMethod as HttpMethod)) {
      currentBlockLines = [];
      return;
    }

    const method = rawMethod as HttpMethod;
    const url = applyVars(reqLineTokens[1]);

    const headers: Record<string, string> = {};
    const bodyLines: string[] = [];
    let inBody = false;

    for (let i = 1; i < effectiveLines.length; i++) {
      const lineItem = effectiveLines[i];
      const rawLine = lineItem.line;

      if (!inBody) {
        if (!rawLine.trim()) {
          inBody = true;
          continue;
        }

        const colonIdx = rawLine.indexOf(':');
        if (colonIdx !== -1) {
          const headerName = applyVars(rawLine.slice(0, colonIdx).trim());
          const headerVal = applyVars(rawLine.slice(colonIdx + 1).trim());
          headers[headerName] = headerVal;
        }
      } else {
        bodyLines.push(applyVars(rawLine));
      }
    }

    const body = bodyLines.length > 0 ? bodyLines.join('\n').trim() : undefined;
    let bodyType: RestClientRequest['bodyType'] = 'none';
    if (body) {
      const ct = Object.entries(headers).find(([k]) => k.toLowerCase() === 'content-type')?.[1];
      if (ct?.includes('json') || (body.startsWith('{') && body.endsWith('}'))) {
        bodyType = 'json';
      } else if (ct?.includes('urlencoded')) {
        bodyType = 'x-www-form-urlencoded';
      } else {
        bodyType = 'raw';
      }
    }

    requests.push({
      id: `req_${requestLineItem.index}`,
      name: currentBlockName || `${method} ${url}`,
      method,
      url,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body,
      bodyType,
      lineNumber: requestLineItem.index + 1,
      rawText: currentBlockLines.map((l) => l.line).join('\n'),
    });

    currentBlockLines = [];
    currentBlockName = '';
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (line.trim().startsWith('###')) {
      flushBlock();
      currentBlockName = line.trim().replace(/^###\s*/, '');
    } else {
      currentBlockLines.push({ line, index: idx });
    }
  }
  flushBlock();

  return requests;
}

/**
 * Converts a RestClientRequest into a standard curl CLI command string.
 */
export function toCurlCommand(req: RestClientRequest): string {
  const parts: string[] = ['curl', '-X', req.method, `"${req.url}"`];

  if (req.headers) {
    for (const [key, value] of Object.entries(req.headers)) {
      parts.push('-H', `"${key}: ${value.replace(/"/g, '\\"')}"`);
    }
  }

  if (req.body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    parts.push('-d', `'${req.body.replace(/'/g, "'\\''")}'`);
  }

  return parts.join(' ');
}

/**
 * Autocompletion for .http files (methods, headers, content types, system variables).
 */
export function createRestClientCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[\$a-zA-Z0-9_-]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const line = context.state.doc.lineAt(context.pos).text;
    const isBeginningOfLine = context.pos - word.text.length <= line.search(/\S/);

    const options: any[] = [];

    if (isBeginningOfLine) {
      const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
      for (const m of methods) {
        if (m.startsWith(word.text.toUpperCase())) {
          options.push({
            label: m,
            type: 'keyword',
            detail: 'HTTP Method',
            boost: 5,
          });
        }
      }
    }

    // Header completions
    for (const h of COMMON_HTTP_HEADERS) {
      if (h.toLowerCase().startsWith(word.text.toLowerCase())) {
        options.push({
          label: `${h}: `,
          type: 'property',
          detail: 'HTTP Header',
          boost: 3,
        });
      }
    }

    // System variables
    const sysVars = ['$guid', '$timestamp', '$randomInt 1 100', '$datetime iso8601'];
    for (const sv of sysVars) {
      if (sv.toLowerCase().startsWith(word.text.toLowerCase())) {
        options.push({
          label: `{{${sv}}}`,
          type: 'variable',
          detail: 'REST Client Variable',
          boost: 4,
        });
      }
    }

    if (options.length === 0) return null;

    return {
      from: word.from,
      options,
    };
  };
}
