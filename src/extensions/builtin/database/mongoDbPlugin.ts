import { MongoCollectionOperation, MongoDbSettings } from './types';

export const DEFAULT_MONGODB_SETTINGS: MongoDbSettings = {
  enabled: true,
  defaultLimit: 50,
  allowDiskUse: false,
};

/**
 * Parses MongoDB connection URIs (both standard mongodb:// and SRV mongodb+srv://).
 */
export function parseMongoUri(uri: string): {
  protocol: string;
  host: string;
  port?: number;
  database?: string;
  username?: string;
  hasPassword?: boolean;
  isSrv: boolean;
} {
  const isSrv = uri.startsWith('mongodb+srv://');
  const clean = uri.replace(/^mongodb(?:\+srv)?:\/\//, '');

  let authPart = '';
  let hostPart = clean;

  if (clean.includes('@')) {
    const parts = clean.split('@');
    authPart = parts[0];
    hostPart = parts[1];
  }

  let username: string | undefined;
  let hasPassword = false;

  if (authPart) {
    const [u, p] = authPart.split(':');
    username = decodeURIComponent(u);
    hasPassword = !!p;
  }

  let database: string | undefined;
  if (hostPart.includes('/')) {
    const parts = hostPart.split('/');
    hostPart = parts[0];
    database = parts[1].split('?')[0] || undefined;
  }

  let port: number | undefined;
  if (hostPart.includes(':')) {
    const [h, p] = hostPart.split(':');
    hostPart = h;
    port = parseInt(p, 10);
  } else if (!isSrv) {
    port = 27017;
  }

  return {
    protocol: isSrv ? 'mongodb+srv' : 'mongodb',
    host: hostPart,
    port,
    database,
    username,
    hasPassword,
    isSrv,
  };
}

/**
 * Builds a runnable MongoDB shell / mongosh statement.
 */
export function buildMongoShellCommand(op: MongoCollectionOperation): string {
  const col = op.collection;

  switch (op.operation) {
    case 'find': {
      const filterStr = op.filter ? JSON.stringify(op.filter) : '{}';
      const projStr = op.projection ? `, ${JSON.stringify(op.projection)}` : '';
      const limitStr = op.limit ? `.limit(${op.limit})` : '';
      return `db.${col}.find(${filterStr}${projStr})${limitStr};`;
    }
    case 'insertOne': {
      const docStr = op.update ? JSON.stringify(op.update) : '{}';
      return `db.${col}.insertOne(${docStr});`;
    }
    case 'updateOne': {
      const filterStr = JSON.stringify(op.filter || {});
      const updateStr = JSON.stringify(op.update || {});
      return `db.${col}.updateOne(${filterStr}, ${updateStr});`;
    }
    case 'deleteOne': {
      const filterStr = JSON.stringify(op.filter || {});
      return `db.${col}.deleteOne(${filterStr});`;
    }
    case 'aggregate': {
      const pipeStr = JSON.stringify(op.pipeline || [], null, 2);
      return `db.${col}.aggregate(${pipeStr});`;
    }
    case 'countDocuments': {
      const filterStr = op.filter ? JSON.stringify(op.filter) : '{}';
      return `db.${col}.countDocuments(${filterStr});`;
    }
  }
}

/**
 * Validates BSON / JSON filter query syntax.
 */
export function validateBsonFilter(jsonStr: string): { valid: boolean; parsed?: any; error?: string } {
  if (!jsonStr || !jsonStr.trim()) {
    return { valid: true, parsed: {} };
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { valid: false, error: 'Query filter must be a JSON object' };
    }
    return { valid: true, parsed };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Malformed JSON syntax' };
  }
}
