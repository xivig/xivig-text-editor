import { EditorView } from '@codemirror/view';
import { EditorSelection, SelectionRange } from '@codemirror/state';
import { toggleComment, toggleBlockComment } from '@codemirror/commands';
import { useEditorStore } from '../stores/editorStore';

export interface CommentTokens {
  line?: string;
  block?: { open: string; close: string };
}

export function getCommentTokens(filenameOrLang = ''): CommentTokens {
  const ext = filenameOrLang.split('.').pop()?.toLowerCase() || filenameOrLang.toLowerCase();

  // HTML / XML / SVG / Vue
  if (['html', 'htm', 'xhtml', 'xml', 'svg', 'vue'].includes(ext)) {
    return {
      block: { open: '<!-- ', close: ' -->' },
    };
  }

  // CSS / SCSS / SASS / LESS
  if (['css', 'scss', 'sass', 'less'].includes(ext)) {
    return {
      line: '// ',
      block: { open: '/* ', close: ' */' },
    };
  }

  // Python / Shell / YAML / TOML
  if (['py', 'python', 'r', 'sh', 'bash', 'yaml', 'yml', 'toml'].includes(ext)) {
    return {
      line: '# ',
      block: { open: '"""\n', close: '\n"""' },
    };
  }

  // SQL / Lua
  if (['sql', 'lua'].includes(ext)) {
    return {
      line: '-- ',
      block: { open: '/* ', close: ' */' },
    };
  }

  // Windows Batch / CMD
  if (['bat', 'cmd', 'batch'].includes(ext)) {
    return {
      line: 'REM ',
    };
  }

  // JavaScript, TypeScript, JSX, TSX, C, C++, C#, Rust, Java, Go, PHP, Kotlin, Swift
  return {
    line: '// ',
    block: { open: '/* ', close: ' */' },
  };
}

/**
 * Toggle block comment on the active selection or cursor position.
 * Uses CodeMirror native toggleBlockComment, with intelligent multi-language fallback.
 */
export function smartToggleBlockComment(view: EditorView, filenameOrLang?: string): boolean {
  // 1. Try CodeMirror's native toggleBlockComment
  try {
    if (toggleBlockComment(view)) {
      return true;
    }
  } catch {
    // fallback to custom implementation
  }

  // 2. Custom multi-language block comment toggle
  const activeDoc = useEditorStore.getState().getActiveDocument();
  const langKey = filenameOrLang || activeDoc?.name || activeDoc?.language || 'file.js';
  const tokens = getCommentTokens(langKey);
  const block = tokens.block || { open: '/* ', close: ' */' };

  const state = view.state;
  const changes: { from: number; to: number; insert: string }[] = [];
  const newRanges: SelectionRange[] = [];

  for (const range of state.selection.ranges) {
    if (range.empty) {
      // If cursor has no selection, insert empty block comment and position cursor inside
      const insertText = `${block.open}${block.close}`;
      changes.push({
        from: range.from,
        to: range.from,
        insert: insertText,
      });
      const cursorPos = range.from + block.open.length;
      newRanges.push(EditorSelection.cursor(cursorPos));
    } else {
      const selectedText = state.sliceDoc(range.from, range.to);
      const openTrim = block.open.trim();
      const closeTrim = block.close.trim();

      // Check if selected text is already wrapped with block comments
      const trimmed = selectedText.trim();
      if (trimmed.startsWith(openTrim) && trimmed.endsWith(closeTrim)) {
        // Uncomment
        let unwrapped = trimmed.slice(openTrim.length, trimmed.length - closeTrim.length);
        if (unwrapped.startsWith(' ') && unwrapped.endsWith(' ')) {
          unwrapped = unwrapped.slice(1, -1);
        }
        changes.push({
          from: range.from,
          to: range.to,
          insert: unwrapped,
        });
        newRanges.push(EditorSelection.range(range.from, range.from + unwrapped.length));
      } else {
        // Wrap in block comment
        const wrapped = `${block.open}${selectedText}${block.close}`;
        changes.push({
          from: range.from,
          to: range.to,
          insert: wrapped,
        });
        newRanges.push(EditorSelection.range(range.from, range.from + wrapped.length));
      }
    }
  }

  if (changes.length > 0) {
    view.dispatch({
      changes,
      selection: EditorSelection.create(newRanges),
      userEvent: 'comment',
    });
    return true;
  }

  return false;
}

/**
 * Toggle line comment on the current line or selection.
 */
export function smartToggleLineComment(view: EditorView, filenameOrLang?: string): boolean {
  try {
    if (toggleComment(view)) {
      return true;
    }
  } catch {
    // fallback
  }

  const activeDoc = useEditorStore.getState().getActiveDocument();
  const langKey = filenameOrLang || activeDoc?.name || activeDoc?.language || 'file.js';
  const tokens = getCommentTokens(langKey);
  const linePrefix = tokens.line || '// ';

  const state = view.state;
  const lineNumbers = new Set<number>();
  for (const range of state.selection.ranges) {
    const start = state.doc.lineAt(range.from).number;
    const end = state.doc.lineAt(range.to).number;
    for (let i = start; i <= end; i++) lineNumbers.add(i);
  }

  const sortedLines = Array.from(lineNumbers).sort((a, b) => a - b);
  const allCommented = sortedLines.every((num) => {
    const text = state.doc.line(num).text.trim();
    return text.startsWith(linePrefix.trim()) || text.length === 0;
  });

  const changes: { from: number; to: number; insert: string }[] = [];

  for (const num of sortedLines) {
    const line = state.doc.line(num);
    const text = line.text;
    if (allCommented) {
      // Remove line comment
      const match = text.match(new RegExp(`^(\\s*)${escapeRegex(linePrefix.trim())}\\s?`));
      if (match) {
        changes.push({
          from: line.from + match[1].length,
          to: line.from + match[0].length,
          insert: '',
        });
      }
    } else {
      // Add line comment
      changes.push({
        from: line.from,
        to: line.from,
        insert: linePrefix,
      });
    }
  }

  if (changes.length > 0) {
    view.dispatch({
      changes,
      userEvent: 'comment',
    });
    return true;
  }

  return false;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
