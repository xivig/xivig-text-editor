/**
 * Category 8: Database Tools Extensions
 * Type definitions & configuration interfaces
 */

export type DatabaseDialect =
  | 'mysql'
  | 'postgresql'
  | 'sqlite'
  | 'mariadb'
  | 'sqlserver'
  | 'mongodb'
  | 'redis';

export interface DatabaseConnectionConfig {
  id: string;
  name: string;
  dialect: DatabaseDialect;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  filename?: string; // For SQLite
  ssl?: boolean;
}

export interface TableColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string;
  comment?: string;
}

export interface TableSchema {
  name: string;
  columns: TableColumnSchema[];
  primaryKeys: string[];
  rowCountEstimate?: number;
}

export interface SqlToolsSettings {
  enabled: boolean;
  defaultDialect: DatabaseDialect;
  autoFormatOnRun: boolean;
  maxQueryResults: number;
}

export interface DatabaseClientSettings {
  enabled: boolean;
  pageSize: number;
  showNullAsBadge: boolean;
  autoConnectOnStartup: boolean;
}

export interface MongoCollectionOperation {
  collection: string;
  operation: 'find' | 'insertOne' | 'updateOne' | 'deleteOne' | 'aggregate' | 'countDocuments';
  filter?: Record<string, any>;
  update?: Record<string, any>;
  pipeline?: Record<string, any>[];
  projection?: Record<string, any>;
  limit?: number;
}

export interface MongoDbSettings {
  enabled: boolean;
  defaultLimit: number;
  allowDiskUse: boolean;
}

export interface SQLiteTableInfo {
  name: string;
  type: 'table' | 'view' | 'index';
  sql: string;
  columns: TableColumnSchema[];
}

export interface SQLiteViewerSettings {
  enabled: boolean;
  pageSize: number;
  enableBlobHexView: boolean;
}

export type RedisDataType = 'string' | 'hash' | 'list' | 'set' | 'zset' | 'none';

export interface RedisKeyItem {
  key: string;
  type: RedisDataType;
  ttlSeconds: number; // -1 for persistent, -2 for non-existent
  size?: number;
}

export interface RedisSettings {
  enabled: boolean;
  defaultDb: number;
  maxKeyScan: number;
}
