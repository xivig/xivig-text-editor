import { OpenApiOperation, OpenApiLintResult, OpenApiEditorSettings, HttpMethod } from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export const DEFAULT_OPENAPI_EDITOR_SETTINGS: OpenApiEditorSettings = {
  enabled: true,
  enableLiveLinting: true,
  validateReferences: true,
};

const OPENAPI_KEYWORDS = [
  'openapi: 3.0.3',
  'openapi: 3.1.0',
  'swagger: "2.0"',
  'info:',
  'title:',
  'version:',
  'description:',
  'servers:',
  'paths:',
  'parameters:',
  'responses:',
  'components:',
  'schemas:',
  'securitySchemes:',
  'requestBody:',
  'content:',
  'application/json:',
  'application/x-www-form-urlencoded:',
  'schema:',
  'type: object',
  'type: string',
  'type: integer',
  'type: array',
  'type: boolean',
  'items:',
  'properties:',
  'required:',
  'tags:',
  'operationId:',
  'summary:',
  'bearerAuth:',
];

/**
 * Validates top-level structure of OpenAPI 3.x or Swagger 2.0 specs.
 */
export function validateOpenApiDocument(doc: any): {
  valid: boolean;
  errors: string[];
  version: string;
} {
  const errors: string[] = [];
  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: ['Specification must be a JSON/YAML object'], version: '' };
  }

  let version = '';
  if (typeof doc.openapi === 'string') {
    version = doc.openapi;
  } else if (typeof doc.swagger === 'string') {
    version = doc.swagger;
  } else {
    errors.push('Missing "openapi" or "swagger" version declaration');
  }

  if (!doc.info || typeof doc.info !== 'object') {
    errors.push('Missing required "info" object');
  } else {
    if (!doc.info.title) errors.push('Missing "info.title"');
    if (!doc.info.version) errors.push('Missing "info.version"');
  }

  if (!doc.paths || typeof doc.paths !== 'object') {
    errors.push('Missing required "paths" object');
  }

  return {
    valid: errors.length === 0,
    errors,
    version,
  };
}

/**
 * Extracts a flattened list of all HTTP operations across all paths.
 */
export function extractOperations(doc: any): OpenApiOperation[] {
  if (!doc?.paths || typeof doc.paths !== 'object') return [];

  const operations: OpenApiOperation[] = [];
  const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

  for (const [pathKey, pathItem] of Object.entries(doc.paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const [methodKey, op] of Object.entries(pathItem)) {
      if (!httpMethods.includes(methodKey.toLowerCase()) || !op || typeof op !== 'object') {
        continue;
      }

      const opObj = op as any;
      const method = methodKey.toUpperCase() as HttpMethod;

      operations.push({
        method,
        path: pathKey,
        operationId: opObj.operationId,
        summary: opObj.summary,
        description: opObj.description,
        tags: Array.isArray(opObj.tags) ? opObj.tags : undefined,
        parameters: Array.isArray(opObj.parameters) ? opObj.parameters : undefined,
        responses: typeof opObj.responses === 'object' ? opObj.responses : {},
      });
    }
  }

  return operations;
}

/**
 * Lints an OpenAPI document for best practices and missing schemas.
 */
export function lintOpenApiDocument(doc: any): OpenApiLintResult[] {
  const results: OpenApiLintResult[] = [];
  const validation = validateOpenApiDocument(doc);

  for (const err of validation.errors) {
    results.push({
      path: 'root',
      severity: 'error',
      message: err,
    });
  }

  if (!validation.valid) return results;

  const ops = extractOperations(doc);

  for (const op of ops) {
    const loc = `${op.method} ${op.path}`;

    if (!op.operationId) {
      results.push({
        path: loc,
        severity: 'warning',
        message: `Missing 'operationId' for ${loc}`,
      });
    }

    if (!op.summary) {
      results.push({
        path: loc,
        severity: 'info',
        message: `Operation ${loc} has no summary`,
      });
    }

    // Check responses
    const responseCodes = Object.keys(op.responses || {});
    const hasSuccess = responseCodes.some((code) => code.startsWith('2') || code === 'default');
    if (!hasSuccess) {
      results.push({
        path: loc,
        severity: 'warning',
        message: `Operation ${loc} has no 2xx or default response defined`,
      });
    }

    // Check path parameters matching
    const pathParamMatches = op.path.match(/\{([a-zA-Z0-9_]+)\}/g);
    if (pathParamMatches) {
      const declaredPathParams = (op.parameters || [])
        .filter((p) => p.in === 'path')
        .map((p) => p.name);

      for (const rawMatch of pathParamMatches) {
        const paramName = rawMatch.slice(1, -1);
        if (!declaredPathParams.includes(paramName)) {
          results.push({
            path: loc,
            severity: 'error',
            message: `Path parameter '{${paramName}}' is not defined in parameters list`,
          });
        }
      }
    }
  }

  return results;
}

/**
 * CodeMirror autocompletion source for OpenAPI / Swagger specs.
 */
export function createOpenApiCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z0-9_:-]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const norm = word.text.toLowerCase();
    const matches = OPENAPI_KEYWORDS.filter((k) => k.toLowerCase().startsWith(norm));
    if (matches.length === 0) return null;

    return {
      from: word.from,
      options: matches.map((k) => ({
        label: k,
        type: 'keyword',
        detail: 'OpenAPI Spec',
        boost: 3,
      })),
    };
  };
}
