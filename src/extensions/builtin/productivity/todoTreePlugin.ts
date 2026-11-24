import { TodoItem, TodoTreeSettings } from './types';

export const DEFAULT_TODO_TREE_SETTINGS: TodoTreeSettings = {
  enabled: true,
  tags: ['TODO', 'FIXME', 'BUG', 'HACK', 'NOTE', 'XXX'],
  trackInGutter: true,
};

export function scanDocumentForTodos(
  content: string,
  filePath = '',
  settings: TodoTreeSettings = DEFAULT_TODO_TREE_SETTINGS
): TodoItem[] {
  if (!settings.enabled || !content) return [];

  const todos: TodoItem[] = [];
  const lines = content.split('\n');
  const tagPattern = settings.tags.join('|');
  const regex = new RegExp(`(?:\\/\\/|#|<!--|/\\*)\\s*(${tagPattern})[:\\s]+([^\\n*]+)`, 'gi');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;

    while ((match = regex.exec(line)) !== null) {
      const type = match[1].toUpperCase() as TodoItem['type'];
      const text = match[2].trim().replace(/-->|\*\//g, '').trim();

      todos.push({
        id: `${filePath || 'doc'}:${i + 1}:${match.index}`,
        type,
        text,
        line: i + 1,
        col: match.index + 1,
        filePath,
      });
    }
  }

  return todos;
}
