import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export const MYSQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
  'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'TRUNCATE TABLE',
  'AUTO_INCREMENT', 'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES',
  'ENGINE=InnoDB', 'ENGINE=MyISAM', 'DEFAULT CHARSET=utf8mb4', 'COLLATE=utf8mb4_unicode_ci',
  'SHOW TABLES', 'SHOW DATABASES', 'DESCRIBE', 'EXPLAIN', 'USE',
  'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN', 'ON',
  'GROUP BY', 'ORDER BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'HAVING',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CONCAT', 'NOW', 'DATE_FORMAT',
];

export const MYSQL_DATA_TYPES = [
  'INT', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'BIGINT',
  'DECIMAL(10,2)', 'FLOAT', 'DOUBLE',
  'VARCHAR(255)', 'CHAR(36)', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT',
  'DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'YEAR',
  'BOOLEAN', 'JSON', 'BLOB', 'LONGBLOB', 'ENUM',
];

export function buildMySqlTableInspectorQuery(tableName: string): string {
  const clean = tableName.replace(/[`'"]/g, '');
  return `DESCRIBE \`${clean}\`;`;
}

export function buildMySqlSelectQuery(tableName: string, limit = 100, offset = 0): string {
  const clean = tableName.replace(/[`'"]/g, '');
  return `SELECT * FROM \`${clean}\` LIMIT ${limit} OFFSET ${offset};`;
}

/**
 * CodeMirror 6 autocompletion source for MySQL keywords and data types.
 */
export function createMySqlCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z0-9_]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const norm = word.text.toUpperCase();
    const kwMatches = MYSQL_KEYWORDS.filter((k) => k.toUpperCase().startsWith(norm));
    const typeMatches = MYSQL_DATA_TYPES.filter((t) => t.toUpperCase().startsWith(norm));

    const options = [
      ...kwMatches.map((k) => ({
        label: k,
        type: 'keyword',
        detail: 'MySQL Keyword',
        boost: 3,
      })),
      ...typeMatches.map((t) => ({
        label: t,
        type: 'type',
        detail: 'MySQL Type',
        boost: 2,
      })),
    ];

    if (options.length === 0) return null;

    return {
      from: word.from,
      options,
    };
  };
}
