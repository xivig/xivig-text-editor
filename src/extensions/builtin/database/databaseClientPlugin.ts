import { DatabaseDialect, TableSchema, DatabaseClientSettings } from './types';

export const DEFAULT_DATABASE_CLIENT_SETTINGS: DatabaseClientSettings = {
  enabled: true,
  pageSize: 50,
  showNullAsBadge: true,
  autoConnectOnStartup: false,
};

/**
 * Builds a dialect-aware pagination query.
 */
export function createSelectPageQuery(
  tableName: string,
  dialect: DatabaseDialect = 'mysql',
  pageSize = 50,
  page = 1
): string {
  const cleanTable = tableName.replace(/[`'"]/g, '');
  const offset = Math.max(0, (page - 1) * pageSize);

  switch (dialect) {
    case 'sqlserver':
      return `SELECT * FROM [${cleanTable}] ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY;`;
    case 'postgresql':
      return `SELECT * FROM "${cleanTable}" LIMIT ${pageSize} OFFSET ${offset};`;
    case 'sqlite':
      return `SELECT * FROM "${cleanTable}" LIMIT ${pageSize} OFFSET ${offset};`;
    case 'mysql':
    case 'mariadb':
    default:
      return `SELECT * FROM \`${cleanTable}\` LIMIT ${pageSize} OFFSET ${offset};`;
  }
}

/**
 * Formats table schema into a readable Markdown representation.
 */
export function formatTableSchemaMarkdown(schema: TableSchema): string {
  const lines: string[] = [
    `### Table: \`${schema.name}\``,
    schema.rowCountEstimate !== undefined ? `*Estimated rows: ${schema.rowCountEstimate.toLocaleString()}*` : '',
    '',
    '| Column | Type | Nullable | Key | Default |',
    '| :--- | :--- | :--- | :--- | :--- |',
  ];

  for (const col of schema.columns) {
    const keyBadge = col.isPrimaryKey ? '🔑 PK' : '';
    const nullableBadge = col.nullable ? 'YES' : 'NO';
    const def = col.defaultValue !== undefined ? `\`${col.defaultValue}\`` : '-';
    lines.push(`| **${col.name}** | \`${col.type}\` | ${nullableBadge} | ${keyBadge} | ${def} |`);
  }

  return lines.filter(Boolean).join('\n');
}
