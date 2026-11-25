/**
 * Category 9: API Development Extensions
 * Type definitions & schemas for Thunder Client, Postman, REST Client, and OpenAPI
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface ApiRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  bodyType?: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw';
  body?: string;
  description?: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timeMs: number;
  sizeBytes: number;
}

export interface ThunderClientSettings {
  enabled: boolean;
  defaultTimeoutMs: number;
  followRedirects: boolean;
  saveResponseHistory: boolean;
}

export interface RestClientRequest extends ApiRequest {
  lineNumber: number;
  rawText: string;
}

export interface RestClientSettings {
  enabled: boolean;
  timeoutMs: number;
  followRedirects: boolean;
  defaultHeaders: Record<string, string>;
}

export interface OpenApiOperation {
  method: HttpMethod;
  path: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Array<{
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    required?: boolean;
    description?: string;
  }>;
  responses: Record<string, { description?: string }>;
}

export interface OpenApiLintResult {
  path: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface OpenApiEditorSettings {
  enabled: boolean;
  enableLiveLinting: boolean;
  validateReferences: boolean;
}
