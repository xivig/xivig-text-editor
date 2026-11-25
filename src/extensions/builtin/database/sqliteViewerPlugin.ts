import { SQLiteTableInfo, TableColumnSchema, SQLiteViewerSettings } from './types';

export const DEFAULT_SQLITE_VIEWER_SETTINGS: SQLiteViewerSettings = {
  enabled: true,
  pageSize: 50,
  enableBlobHexView: true,
};

/**
 * Extracts table column definitions from a SQLite CREATE TABLE statement.
 */
export function parseSqliteCreateStatement(sql: string): TableColumnSchema[] {
  if (!sql) return [];

  // Match: CREATE TABLE "tableName" ( ... )
  const bodyMatch = sql.match(/\(([\s\S]+)\)/);
  if (!bodyMatch) return [];

  const body = bodyMatch[1].trim();
  const columns: TableColumnSchema[] = [];

  // Split lines by comma ignoring parentheses
  const lines: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;

    if (char === ',' && parenDepth === 0) {
      lines.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current.trim());

  for (const line of lines) {
    // Skip table constraints: PRIMARY KEY (col), FOREIGN KEY...
    if (/^(?:CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK)\b/i.test(line)) {
      continue;
    }

    const tokens = line.split(/\s+/).filter(Boolean);
    if (tokens.length < 2) continue;

    const rawColName = tokens[0].replace(/[`"']/g, '');
    const colType = tokens[1].toUpperCase();
    const isPrimaryKey = /PRIMARY\s+KEY/i.test(line);
    const nullable = !/NOT\s+NULL/i.test(line);

    // Extract default value
    const defMatch = line.match(/DEFAULT\s+([^,)]+)/i);
    const defaultValue = defMatch ? defMatch[1].trim() : undefined;

    columns.push({
      name: rawColName,
      type: colType,
      nullable,
      isPrimaryKey,
      defaultValue,
    });
  }

  return columns;
}

/**
 * Generates SQL to list all user tables and views from sqlite_master.
 */
export function buildSqliteTableListQuery(): string {
  return "SELECT name, type, sql FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' ORDER BY name ASC;";
}

/**
 * Generates a paged query for reading a SQLite table.
 */
export function buildSqlitePageQuery(tableName: string, limit = 50, offset = 0): string {
  const clean = tableName.replace(/[`"']/g, '');
  return `SELECT * FROM "${clean}" LIMIT ${limit} OFFSET ${offset};`;
}
