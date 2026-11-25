import { RedisDataType, RedisSettings } from './types';

export const DEFAULT_REDIS_SETTINGS: RedisSettings = {
  enabled: true,
  defaultDb: 0,
  maxKeyScan: 1000,
};

/**
 * Parses Redis connection URIs (e.g. redis://:password@127.0.0.1:6379/0 or rediss://).
 */
export function parseRedisUri(uri: string): {
  host: string;
  port: number;
  password?: string;
  dbIndex: number;
  isTls: boolean;
} {
  const isTls = uri.startsWith('rediss://');
  const clean = uri.replace(/^rediss?:\/\//, '');

  let authPart = '';
  let hostPart = clean;

  if (clean.includes('@')) {
    const parts = clean.split('@');
    authPart = parts[0];
    hostPart = parts[1];
  }

  let password: string | undefined;
  if (authPart) {
    const colonIdx = authPart.indexOf(':');
    password = colonIdx !== -1 ? decodeURIComponent(authPart.slice(colonIdx + 1)) : decodeURIComponent(authPart);
  }

  let dbIndex = 0;
  if (hostPart.includes('/')) {
    const parts = hostPart.split('/');
    hostPart = parts[0];
    const parsedDb = parseInt(parts[1], 10);
    if (!isNaN(parsedDb)) dbIndex = parsedDb;
  }

  let port = 6379;
  if (hostPart.includes(':')) {
    const parts = hostPart.split(':');
    hostPart = parts[0];
    port = parseInt(parts[1], 10) || 6379;
  }

  return {
    host: hostPart || '127.0.0.1',
    port,
    password,
    dbIndex,
    isTls,
  };
}

/**
 * Formats a Redis CLI command string.
 */
export function buildRedisCommand(command: string, args: (string | number)[] = []): string {
  const cleanCmd = command.trim().toUpperCase();
  const formattedArgs = args.map((a) => {
    const str = String(a);
    return str.includes(' ') ? `"${str.replace(/"/g, '\\"')}"` : str;
  });

  return [cleanCmd, ...formattedArgs].join(' ');
}

/**
 * Infers Redis data type from raw in-memory structure or response.
 */
export function inferRedisType(value: any): RedisDataType {
  if (typeof value === 'string' || typeof value === 'number') return 'string';
  if (Array.isArray(value)) return 'list';
  if (value instanceof Set) return 'set';
  if (typeof value === 'object' && value !== null) return 'hash';
  return 'none';
}
