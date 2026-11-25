import { DatabaseConnectionConfig, DatabaseDialect, SqlToolsSettings } from './types';

export const DEFAULT_SQL_TOOLS_SETTINGS: SqlToolsSettings = {
  enabled: true,
  defaultDialect: 'mysql',
  autoFormatOnRun: true,
  maxQueryResults: 500,
};

export const DEFAULT_PORTS: Record<DatabaseDialect, number> = {
  mysql: 3306,
  postgresql: 5432,
  mariadb: 3306,
  sqlserver: 1433,
  mongodb: 27017,
  redis: 6379,
  sqlite: 0,
};

/**
 * Validates a database connection configuration.
 */
export function validateConnectionConfig(config: Partial<DatabaseConnectionConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.name || !config.name.trim()) {
    errors.push('Connection name is required');
  }

  if (!config.dialect) {
    errors.push('Database dialect is required');
  }

  if (config.dialect === 'sqlite') {
    if (!config.filename && !config.database) {
      errors.push('SQLite database file path is required');
    }
  } else if (config.dialect) {
    if (!config.host) {
      errors.push('Database host is required');
    }
    if (config.port !== undefined && (config.port < 1 || config.port > 65535)) {
      errors.push('Invalid port number');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Splits a multi-statement SQL script by semicolons, respecting quotes.
 */
export function splitSqlStatements(script: string): string[] {
  if (!script || !script.trim()) return [];

  const statements: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;

  for (let i = 0; i < script.length; i++) {
    const char = script[i];
    const prev = i > 0 ? script[i - 1] : '';

    if (char === "'" && prev !== '\\' && !inDoubleQuote && !inBacktick) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && prev !== '\\' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
    }

    if (char === ';' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      const trimmed = current.trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      current = '';
    } else {
      current += char;
    }
  }

  const remainder = current.trim();
  if (remainder) {
    statements.push(remainder);
  }

  return statements;
}

/**
 * Formats standard SQL clauses onto new lines with structured indentation.
 */
export function formatSqlQuery(sql: string): string {
  if (!sql || !sql.trim()) return '';

  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'INNER JOIN', 'LEFT JOIN',
    'RIGHT JOIN', 'CROSS JOIN', 'ON', 'GROUP BY', 'HAVING', 'ORDER BY',
    'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
    'UNION', 'UNION ALL',
  ];

  let formatted = sql.replace(/\s+/g, ' ').trim();

  for (const kw of keywords) {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(regex, (match) => `\n${match.toUpperCase()}`);
  }

  return formatted
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (
        line.startsWith('AND ') ||
        line.startsWith('OR ') ||
        line.startsWith('ON ')
      ) {
        return `  ${line}`;
      }
      return line;
    })
    .join('\n');
}
