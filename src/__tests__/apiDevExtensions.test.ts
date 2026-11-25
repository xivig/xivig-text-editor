import { describe, it, expect } from 'vitest';
import {
  interpolateVariables,
  buildFetchRequest,
  formatResponseBody,
  formatBytes,
  formatDuration,
  isPostmanCollection,
  parsePostmanCollection,
  exportToPostmanCollection,
  parsePostmanEnvironment,
  resolveSystemVariables,
  parseHttpFile,
  toCurlCommand,
  createRestClientCompletionSource,
  validateOpenApiDocument,
  extractOperations,
  lintOpenApiDocument,
  createOpenApiCompletionSource,
} from '../extensions/builtin/api-dev';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';

describe('Category 9: API Development Extensions', () => {
  describe('Thunder Client', () => {
    it('interpolates variables within URLs, headers, and bodies', () => {
      const template = '{{baseUrl}}/api/v1/users?token={{authToken}}';
      const env = { baseUrl: 'https://api.xivig.dev', authToken: 'xyz123' };
      const result = interpolateVariables(template, env);
      expect(result).toBe('https://api.xivig.dev/api/v1/users?token=xyz123');
    });

    it('builds fetch options with query parameters and auto-added JSON content-type header', () => {
      const req = {
        id: 'req_1',
        name: 'Create Post',
        method: 'POST' as const,
        url: 'https://jsonplaceholder.typicode.com/posts',
        params: { draft: 'true' },
        bodyType: 'json' as const,
        body: '{"title":"Test Post"}',
      };
      const fetchReq = buildFetchRequest(req);
      expect(fetchReq.url).toBe('https://jsonplaceholder.typicode.com/posts?draft=true');
      expect(fetchReq.options.method).toBe('POST');
      expect((fetchReq.options.headers as any)['Content-Type']).toBe('application/json');
      expect(fetchReq.options.body).toBe('{"title":"Test Post"}');
    });

    it('pretty prints JSON response bodies and leaves non-JSON untouched', () => {
      const rawJson = '{"status":"ok","count":42}';
      const formatted = formatResponseBody(rawJson, 'application/json');
      expect(formatted).toBe(JSON.stringify(JSON.parse(rawJson), null, 2));

      const rawHtml = '<html><body>Hello</body></html>';
      expect(formatResponseBody(rawHtml, 'text/html')).toBe(rawHtml);
    });

    it('formats data sizes and durations correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(1048576)).toBe('1.00 MB');

      expect(formatDuration(250)).toBe('250 ms');
      expect(formatDuration(2450)).toBe('2.45 s');
    });
  });

  describe('Postman Collections & Environments', () => {
    it('detects valid Postman Collection schemas', () => {
      const valid = {
        info: {
          name: 'Xivig API Suite',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [],
      };
      expect(isPostmanCollection(valid)).toBe(true);
      expect(isPostmanCollection({ foo: 'bar' })).toBe(false);
    });

    it('parses nested folders and requests into flat executable ApiRequest items', () => {
      const collection = {
        info: { name: 'E-commerce API' },
        item: [
          {
            name: 'Users',
            item: [
              {
                id: 'get-users',
                name: 'List Users',
                request: {
                  method: 'GET',
                  url: {
                    raw: 'https://api.store.com/users?page=1',
                    query: [{ key: 'page', value: '1' }],
                  },
                  header: [{ key: 'Accept', value: 'application/json' }],
                },
              },
            ],
          },
        ],
      };

      const parsed = parsePostmanCollection(collection);
      expect(parsed.name).toBe('E-commerce API');
      expect(parsed.requests).toHaveLength(1);
      expect(parsed.requests[0].name).toBe('[Users] List Users');
      expect(parsed.requests[0].method).toBe('GET');
      expect(parsed.requests[0].headers?.['Accept']).toBe('application/json');
    });

    it('exports requests to valid Postman Collection v2.1 format', () => {
      const exported: any = exportToPostmanCollection('My Exported Suite', [
        {
          id: '1',
          name: 'Health Check',
          method: 'GET',
          url: 'https://api.internal/health',
          headers: { 'X-Source': 'Xivig' },
        },
      ]);

      expect(exported.info.name).toBe('My Exported Suite');
      expect(exported.info.schema).toContain('schema.getpostman.com');
      expect(exported.item).toHaveLength(1);
      expect(exported.item[0].request.method).toBe('GET');
      expect(exported.item[0].request.header[0].key).toBe('X-Source');
    });

    it('parses Postman Environment JSON ignoring disabled variables', () => {
      const envJson = {
        name: 'Staging',
        values: [
          { key: 'baseUrl', value: 'https://stage.api.com', enabled: true },
          { key: 'apiKey', value: 'secret99', enabled: true },
          { key: 'debug', value: 'true', enabled: false },
        ],
      };
      const env = parsePostmanEnvironment(envJson);
      expect(env.baseUrl).toBe('https://stage.api.com');
      expect(env.apiKey).toBe('secret99');
      expect(env.debug).toBeUndefined();
    });
  });

  describe('REST Client (.http / .rest)', () => {
    it('resolves system variables such as $guid, $timestamp, and $randomInt', () => {
      const resolved = resolveSystemVariables('UUID: {{$guid}}, TS: {{$timestamp}}, Rand: {{$randomInt 10 20}}');
      expect(resolved).toMatch(/UUID: [0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
      expect(resolved).toMatch(/TS: \d{10}/);
      const randMatch = resolved.match(/Rand: (\d+)/);
      expect(randMatch).not.toBeNull();
      const num = parseInt(randMatch![1], 10);
      expect(num).toBeGreaterThanOrEqual(10);
      expect(num).toBeLessThanOrEqual(20);
    });

    it('parses multi-request .http files with file variables and block comments', () => {
      const httpDoc = `
@baseUrl = https://jsonplaceholder.typicode.com
@apiKey = token-xyz

### Get First Post
GET {{baseUrl}}/posts/1 HTTP/1.1
Authorization: Bearer {{apiKey}}
Accept: application/json

### Create New Post
POST {{baseUrl}}/posts
Content-Type: application/json

{
  "title": "REST Client Post",
  "body": "Written from Xivig",
  "userId": 1
}
      `;

      const requests = parseHttpFile(httpDoc);
      expect(requests).toHaveLength(2);

      expect(requests[0].name).toBe('Get First Post');
      expect(requests[0].method).toBe('GET');
      expect(requests[0].url).toBe('https://jsonplaceholder.typicode.com/posts/1');
      expect(requests[0].headers?.['Authorization']).toBe('Bearer token-xyz');

      expect(requests[1].name).toBe('Create New Post');
      expect(requests[1].method).toBe('POST');
      expect(requests[1].bodyType).toBe('json');
      expect(requests[1].body).toContain('"title": "REST Client Post"');
    });

    it('generates reproducible curl command from request', () => {
      const curl = toCurlCommand({
        id: 'req_1',
        name: 'Login',
        method: 'POST',
        lineNumber: 1,
        rawText: '',
        url: 'https://auth.api.com/v1/tokens',
        headers: { 'Content-Type': 'application/json' },
        body: '{"user":"test"}',
      });
      expect(curl).toBe('curl -X POST "https://auth.api.com/v1/tokens" -H "Content-Type: application/json" -d \'{"user":"test"}\'');
    });

    it('provides CodeMirror completions for HTTP methods and headers', () => {
      const state = EditorState.create({ doc: 'G' });
      const context = new CompletionContext(state, 1, true);
      const source = createRestClientCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels).toContain('GET');
    });
  });

  describe('OpenAPI (Swagger) Editor', () => {
    const validSpec = {
      openapi: '3.0.3',
      info: {
        title: 'Petstore API',
        version: '1.0.0',
      },
      paths: {
        '/pets': {
          get: {
            operationId: 'listPets',
            summary: 'List all pets',
            tags: ['pets'],
            responses: {
              '200': { description: 'Success' },
            },
          },
        },
        '/pets/{petId}': {
          get: {
            operationId: 'getPetById',
            summary: 'Get pet details',
            parameters: [
              { name: 'petId', in: 'path', required: true },
            ],
            responses: {
              '200': { description: 'Found pet' },
            },
          },
        },
      },
    };

    it('validates OpenAPI 3.0 document successfully', () => {
      const val = validateOpenApiDocument(validSpec);
      expect(val.valid).toBe(true);
      expect(val.version).toBe('3.0.3');
      expect(val.errors).toHaveLength(0);
    });

    it('flags missing version, info, or paths', () => {
      const invalid = { info: { title: 'No version' } };
      const val = validateOpenApiDocument(invalid);
      expect(val.valid).toBe(false);
      expect(val.errors).toContain('Missing "openapi" or "swagger" version declaration');
      expect(val.errors).toContain('Missing "info.version"');
      expect(val.errors).toContain('Missing required "paths" object');
    });

    it('extracts flattened operations across all paths and methods', () => {
      const ops = extractOperations(validSpec);
      expect(ops).toHaveLength(2);
      expect(ops[0].method).toBe('GET');
      expect(ops[0].path).toBe('/pets');
      expect(ops[0].operationId).toBe('listPets');
      expect(ops[1].path).toBe('/pets/{petId}');
    });

    it('lints OpenAPI specs for missing 2xx responses and unreferenced path parameters', () => {
      const buggySpec = {
        openapi: '3.0.3',
        info: { title: 'Buggy API', version: '1.0.0' },
        paths: {
          '/items/{itemId}': {
            get: {
              // Missing operationId, missing 2xx, missing parameter definition for {itemId}
              responses: {
                '500': { description: 'Server Error' },
              },
            },
          },
        },
      };

      const lintIssues = lintOpenApiDocument(buggySpec);
      const messages = lintIssues.map((i) => i.message);

      expect(messages.some((m) => m.includes("Missing 'operationId'"))).toBe(true);
      expect(messages.some((m) => m.includes('no 2xx or default response'))).toBe(true);
      expect(messages.some((m) => m.includes("Path parameter '{itemId}' is not defined"))).toBe(true);
    });

    it('provides CodeMirror autocompletion for OpenAPI schema keywords', () => {
      const state = EditorState.create({ doc: 'open' });
      const context = new CompletionContext(state, 4, true);
      const source = createOpenApiCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels).toContain('openapi: 3.0.3');
    });
  });
});
