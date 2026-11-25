import { describe, it, expect } from 'vitest';
import {
  validateConnectionConfig,
  splitSqlStatements,
  formatSqlQuery,
  DEFAULT_SQL_TOOLS_SETTINGS,
  DEFAULT_PORTS,
  buildMySqlTableInspectorQuery,
  buildMySqlSelectQuery,
  createMySqlCompletionSource,
  MYSQL_KEYWORDS,
  createSelectPageQuery,
  formatTableSchemaMarkdown,
  TableSchema,
  parseMongoUri,
  buildMongoShellCommand,
  parseSqliteCreateStatement,
  buildSqliteTableListQuery,
  buildSqlitePageQuery,
  parseRedisUri,
  buildRedisCommand,
  inferRedisType,
} from '../extensions/builtin/database';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';

describe('Category 8: Database Tools Extensions', () => {
  describe('SQLTools & Connection Validation', () => {
    it('validates a complete MySQL connection config successfully', () => {
      const config = {
        name: 'Production DB',
        dialect: 'mysql' as const,
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
      };
      const result = validateConnectionConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects connection missing name or dialect', () => {
      const result = validateConnectionConfig({ host: 'localhost' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Connection name is required');
      expect(result.errors).toContain('Database dialect is required');
    });

    it('validates SQLite requires filename or database path', () => {
      const result = validateConnectionConfig({
        name: 'Local SQLite',
        dialect: 'sqlite',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('SQLite database file path is required');

      const validSqlite = validateConnectionConfig({
        name: 'Local SQLite',
        dialect: 'sqlite',
        filename: '/data/app.db',
      });
      expect(validSqlite.valid).toBe(true);
    });

    it('checks for invalid port boundaries', () => {
      const result = validateConnectionConfig({
        name: 'Invalid Port',
        dialect: 'postgresql',
        host: 'localhost',
        port: 70000,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid port number');
    });

    it('splits SQL scripts by semicolon while respecting string literals and backticks', () => {
      const script = `
        SELECT * FROM users WHERE note = 'hello;world';
        INSERT INTO audit_log (\`event;type\`, message) VALUES ("login;success", "done");
        DELETE FROM sessions WHERE expired = 1
      `;
      const statements = splitSqlStatements(script);
      expect(statements).toHaveLength(3);
      expect(statements[0]).toContain("WHERE note = 'hello;world'");
      expect(statements[1]).toContain('VALUES ("login;success", "done")');
      expect(statements[2]).toBe('DELETE FROM sessions WHERE expired = 1');
    });

    it('formats SQL queries with standard uppercase keywords and clause indentation', () => {
      const raw = 'select id, name from users where active = 1 and age > 18 order by name asc limit 10';
      const formatted = formatSqlQuery(raw);
      expect(formatted).toContain('SELECT');
      expect(formatted).toContain('\nFROM users');
      expect(formatted).toContain('\nWHERE active = 1');
      expect(formatted).toContain('\n  AND age > 18');
      expect(formatted).toContain('\nORDER BY name asc');
      expect(formatted).toContain('\nLIMIT 10');
    });
  });

  describe('SQLTools MySQL Driver', () => {
    it('builds table inspector query stripping dangerous backticks', () => {
      const query = buildMySqlTableInspectorQuery('users` DROP TABLE audit;--');
      expect(query).toBe('DESCRIBE `users DROP TABLE audit;--`;');
    });

    it('builds paged select query with limit and offset', () => {
      const query = buildMySqlSelectQuery('products', 50, 100);
      expect(query).toBe('SELECT * FROM `products` LIMIT 50 OFFSET 100;');
    });

    it('provides CodeMirror completion for MySQL keywords and types', () => {
      const state = EditorState.create({ doc: 'SE' });
      const context = new CompletionContext(state, 2, true);
      const source = createMySqlCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels).toContain('SELECT');
      expect(labels).toContain('SET');
    });
  });

  describe('Database Client Multi-DBMS Queries', () => {
    it('generates correct pagination queries across MySQL, Postgres, SQLite, and SQL Server', () => {
      const mysql = createSelectPageQuery('users', 'mysql', 25, 2);
      expect(mysql).toBe('SELECT * FROM `users` LIMIT 25 OFFSET 25;');

      const pg = createSelectPageQuery('users', 'postgresql', 25, 2);
      expect(pg).toBe('SELECT * FROM "users" LIMIT 25 OFFSET 25;');

      const sqlite = createSelectPageQuery('users', 'sqlite', 25, 1);
      expect(sqlite).toBe('SELECT * FROM "users" LIMIT 25 OFFSET 0;');

      const mssql = createSelectPageQuery('users', 'sqlserver', 25, 3);
      expect(mssql).toBe('SELECT * FROM [users] ORDER BY (SELECT NULL) OFFSET 50 ROWS FETCH NEXT 25 ROWS ONLY;');
    });

    it('formats table schema into Markdown documentation table', () => {
      const schema: TableSchema = {
        name: 'customers',
        primaryKeys: ['id'],
        rowCountEstimate: 12500,
        columns: [
          { name: 'id', type: 'INT', nullable: false, isPrimaryKey: true },
          { name: 'email', type: 'VARCHAR(255)', nullable: false, isPrimaryKey: false },
          { name: 'status', type: 'VARCHAR(50)', nullable: true, isPrimaryKey: false, defaultValue: 'pending' },
        ],
      };

      const md = formatTableSchemaMarkdown(schema);
      expect(md).toContain('### Table: `customers`');
      expect(md).toContain('Estimated rows: 12,500');
      expect(md).toContain('🔑 PK');
      expect(md).toContain('`pending`');
    });
  });

  describe('MongoDB for VS Code', () => {
    it('parses standard MongoDB connection URI', () => {
      const parsed = parseMongoUri('mongodb://admin:secret123@cluster0.db.com:27017/analytics_db?authSource=admin');
      expect(parsed.isSrv).toBe(false);
      expect(parsed.username).toBe('admin');
      expect(parsed.hasPassword).toBe(true);
      expect(parsed.host).toBe('cluster0.db.com');
      expect(parsed.port).toBe(27017);
      expect(parsed.database).toBe('analytics_db');
    });

    it('parses MongoDB SRV connection URI', () => {
      const parsed = parseMongoUri('mongodb+srv://developer:pw@app.prod.mongodb.net/production');
      expect(parsed.isSrv).toBe(true);
      expect(parsed.username).toBe('developer');
      expect(parsed.hasPassword).toBe(true);
      expect(parsed.host).toBe('app.prod.mongodb.net');
      expect(parsed.database).toBe('production');
    });

    it('builds runnable MongoDB shell commands for find, insert, update, and delete', () => {
      const findCmd = buildMongoShellCommand({
        collection: 'users',
        operation: 'find',
        filter: { role: 'admin' },
        limit: 10,
      });
      expect(findCmd).toBe('db.users.find({"role":"admin"}).limit(10);');

      const insertCmd = buildMongoShellCommand({
        collection: 'logs',
        operation: 'insertOne',
        update: { msg: 'system boot' },
      });
      expect(insertCmd).toBe('db.logs.insertOne({"msg":"system boot"});');

      const countCmd = buildMongoShellCommand({
        collection: 'orders',
        operation: 'countDocuments',
        filter: { status: 'shipped' },
      });
      expect(countCmd).toBe('db.orders.countDocuments({"status":"shipped"});');
    });
  });

  describe('SQLite Viewer', () => {
    it('parses SQLite CREATE TABLE statement into column schemas', () => {
      const ddl = `
        CREATE TABLE "orders" (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT,
          "customer_id" INTEGER NOT NULL,
          "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          "notes" TEXT DEFAULT 'N/A',
          CONSTRAINT fk_customer FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
        );
      `;
      const columns = parseSqliteCreateStatement(ddl);
      expect(columns).toHaveLength(4);
      expect(columns[0]).toEqual({
        name: 'id',
        type: 'INTEGER',
        isPrimaryKey: true,
        nullable: true,
        defaultValue: undefined,
      });
      expect(columns[1].name).toBe('customer_id');
      expect(columns[1].nullable).toBe(false);
      expect(columns[2].name).toBe('total_amount');
      expect(columns[2].defaultValue).toBe('0.00');
    });

    it('builds SQLite master query and table query', () => {
      const listQuery = buildSqliteTableListQuery();
      expect(listQuery).toContain('sqlite_master');
      expect(listQuery).toContain("type IN ('table', 'view')");

      const pageQuery = buildSqlitePageQuery('user_sessions', 100, 200);
      expect(pageQuery).toBe('SELECT * FROM "user_sessions" LIMIT 100 OFFSET 200;');
    });
  });

  describe('Redis Extension', () => {
    it('parses standard and TLS Redis connection URIs', () => {
      const standard = parseRedisUri('redis://:mySecretToken@cache.internal:6379/3');
      expect(standard.isTls).toBe(false);
      expect(standard.password).toBe('mySecretToken');
      expect(standard.host).toBe('cache.internal');
      expect(standard.port).toBe(6379);
      expect(standard.dbIndex).toBe(3);

      const tls = parseRedisUri('rediss://default:pwd@tls-cluster:6380/0');
      expect(tls.isTls).toBe(true);
      expect(tls.password).toBe('pwd');
      expect(tls.port).toBe(6380);
    });

    it('builds CLI commands quoting parameters with spaces', () => {
      const setCmd = buildRedisCommand('SET', ['greeting', 'Hello World', 'EX', 3600]);
      expect(setCmd).toBe('SET greeting "Hello World" EX 3600');

      const getCmd = buildRedisCommand('GET', ['session:123']);
      expect(getCmd).toBe('GET session:123');
    });

    it('infers Redis data types accurately', () => {
      expect(inferRedisType('hello')).toBe('string');
      expect(inferRedisType(42)).toBe('string');
      expect(inferRedisType(['a', 'b', 'c'])).toBe('list');
      expect(inferRedisType(new Set(['x', 'y']))).toBe('set');
      expect(inferRedisType({ name: 'Xivig', ver: 1 })).toBe('hash');
      expect(inferRedisType(null)).toBe('none');
    });
  });
});
