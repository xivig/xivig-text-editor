import { BuiltinExtensionModule } from '../../api/types';
import { DEFAULT_SQL_TOOLS_SETTINGS } from './sqlToolsPlugin';
import { createMySqlCompletionSource, MYSQL_KEYWORDS } from './sqlToolsMysqlPlugin';
import { DEFAULT_DATABASE_CLIENT_SETTINGS } from './databaseClientPlugin';
import { DEFAULT_MONGODB_SETTINGS } from './mongoDbPlugin';
import { DEFAULT_SQLITE_VIEWER_SETTINGS } from './sqliteViewerPlugin';
import { DEFAULT_REDIS_SETTINGS } from './redisPlugin';

export * from './types';
export * from './sqlToolsPlugin';
export * from './sqlToolsMysqlPlugin';
export * from './databaseClientPlugin';
export * from './mongoDbPlugin';
export * from './sqliteViewerPlugin';
export * from './redisPlugin';

// 1. SQLTools
export const sqlToolsExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.sqltools',
    name: 'SQLTools - Database tools',
    publisher: 'Matheus Teixeira',
    version: '0.28.4',
    description: 'Database management tool supporting connection configs, queries, table schemas, and bookmarks.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#222222',
    iconSymbol: '🗄️',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. SQLTools MySQL Driver
export const sqlToolsMysqlExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.sqltools-mysql',
    name: 'SQLTools MySQL/MariaDB Driver',
    publisher: 'Matheus Teixeira',
    version: '0.7.0',
    description: 'MySQL and MariaDB dialect driver with auto-increment, engine configurations, and type completions.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#00758f',
    iconSymbol: '🐬',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. Database Client
export const databaseClientExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.database-client',
    name: 'Database Client',
    publisher: 'cweijan',
    version: '7.5.0',
    description: 'Multi-DBMS database client for MySQL, PostgreSQL, SQLite, MariaDB, and SQL Server with table visualizer.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#0984e3',
    iconSymbol: '📊',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. MongoDB for VS Code
export const mongoDbExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.mongodb',
    name: 'MongoDB for VS Code',
    publisher: 'MongoDB',
    version: '1.8.0',
    description: 'Connect to MongoDB clusters, navigate databases and collections, and run BSON queries/aggregations.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#13aa52',
    iconSymbol: '🍃',
  },
  activate: () => {},
  deactivate: () => {},
};

// 5. SQLite Viewer
export const sqliteViewerExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.sqlite-viewer',
    name: 'SQLite Viewer',
    publisher: 'Florian Klampfer',
    version: '0.5.11',
    description: 'Explore SQLite databases and view tables, schema DDL, and records directly in the editor.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#003b57',
    iconSymbol: '🪶',
  },
  activate: () => {},
  deactivate: () => {},
};

// 6. Redis Extension
export const redisExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.redis',
    name: 'Redis',
    publisher: 'cweijan',
    version: '2.0.0',
    description: 'Explore Redis keys, view values (strings, hashes, lists, sets, zsets), and execute Redis commands.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#d82c20',
    iconSymbol: '🔴',
  },
  activate: () => {},
  deactivate: () => {},
};
