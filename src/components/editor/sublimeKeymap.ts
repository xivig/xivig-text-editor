import { KeyBinding, Command, EditorView } from '@codemirror/view';
import {
  EditorSelection,
  StateCommand,
  SelectionRange,
} from '@codemirror/state';
import {
  copyLineDown,
  copyLineUp,
  moveLineDown,
  moveLineUp,
  deleteLine,
  selectLine,
  addCursorAbove,
  addCursorBelow,
  undoSelection,
  redoSelection,
  indentMore,
  indentLess,
  transposeChars,
  deleteGroupBackward,
  deleteGroupForward,
  deleteToLineEnd,
  deleteToLineStart,
  cursorMatchingBracket,
  selectMatchingBracket,
  selectParentSyntax,
  cursorDocStart,
  cursorDocEnd,
  cursorSubwordBackward,
  cursorSubwordForward,
  selectSubwordBackward,
  selectSubwordForward,
} from '@codemirror/commands';
import { foldCode, unfoldCode, foldAll, unfoldAll } from '@codemirror/language';
import { selectNextOccurrence, selectSelectionMatches } from '@codemirror/search';
import {
  toggleBookmark,
  nextBookmark,
  prevBookmark,
  clearBookmarks,
  selectAllBookmarks,
} from './bookmarks';
import { smartToggleLineComment, smartToggleBlockComment } from '../../utils/commentUtils';

// Saved mark position for Ctrl+K Ctrl+Space (Sublime mark buffer)
let savedMarkPosition: number | null = null;
let yankBuffer: string = '';

// --- Custom Sublime Text commands ---

/**
 * Sublime Text Ctrl+Shift+D:
 * If there is a selection, duplicate the selected text right after it.
 * If no selection, duplicate the entire line down.
 */
export const duplicateLineOrSelection: StateCommand = ({ state, dispatch }) => {
  const changes: { from: number; to?: number; insert: string }[] = [];
  const newRanges: SelectionRange[] = [];
  let offset = 0;

  for (const range of state.selection.ranges) {
    if (range.empty) {
      const line = state.doc.lineAt(range.head);
      const text = '\n' + line.text;
      changes.push({ from: line.to, insert: text });
      const col = range.head - line.from;
      const newPos = line.to + 1 + col + offset;
      newRanges.push(EditorSelection.cursor(newPos));
      offset += text.length;
    } else {
      const text = state.sliceDoc(range.from, range.to);
      changes.push({ from: range.to, insert: text });
      const newFrom = range.to + offset;
      const newTo = newFrom + text.length;
      newRanges.push(EditorSelection.range(newFrom, newTo));
      offset += text.length;
    }
  }

  dispatch(
    state.update({
      changes,
      selection: EditorSelection.create(newRanges),
      userEvent: 'input.duplicate',
    })
  );
  return true;
};

/**
 * Sublime Text Ctrl+Shift+Enter: Insert line above current line with matching indentation
 */
export const insertLineAbove: StateCommand = ({ state, dispatch }) => {
  const changes: { from: number; insert: string }[] = [];
  const newRanges: SelectionRange[] = [];
  let offset = 0;

  for (const range of state.selection.ranges) {
    const line = state.doc.lineAt(range.head);
    const indentMatch = line.text.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0] : '';
    const text = indent + '\n';
    changes.push({ from: line.from, insert: text });
    newRanges.push(EditorSelection.cursor(line.from + indent.length + offset));
    offset += text.length;
  }

  dispatch(
    state.update({
      changes,
      selection: EditorSelection.create(newRanges),
      userEvent: 'input',
    })
  );
  return true;
};

/**
 * Sublime Text Ctrl+Enter: Insert line below current line with matching indentation
 */
export const insertLineBelow: StateCommand = ({ state, dispatch }) => {
  const changes: { from: number; insert: string }[] = [];
  const newRanges: SelectionRange[] = [];
  let offset = 0;

  for (const range of state.selection.ranges) {
    const line = state.doc.lineAt(range.head);
    const indentMatch = line.text.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0] : '';
    const text = '\n' + indent;
    changes.push({ from: line.to, insert: text });
    newRanges.push(EditorSelection.cursor(line.to + text.length + offset));
    offset += text.length;
  }

  dispatch(
    state.update({
      changes,
      selection: EditorSelection.create(newRanges),
      userEvent: 'input',
    })
  );
  return true;
};

/**
 * Sublime Text Ctrl+Shift+L: Split selection into lines (adds a multi-cursor at each selected line)
 */
export const splitSelectionIntoLines: StateCommand = ({ state, dispatch }) => {
  const ranges: SelectionRange[] = [];
  let hasMultiLine = false;

  for (const range of state.selection.ranges) {
    if (range.empty) {
      ranges.push(range);
      continue;
    }
    const startLine = state.doc.lineAt(range.from).number;
    const endLine = state.doc.lineAt(range.to).number;

    if (startLine === endLine) {
      ranges.push(range);
      continue;
    }

    hasMultiLine = true;
    for (let i = startLine; i <= endLine; i++) {
      const line = state.doc.line(i);
      const lineEndInSelection = Math.min(line.to, range.to);
      ranges.push(EditorSelection.cursor(lineEndInSelection));
    }
  }

  if (hasMultiLine && ranges.length > 0) {
    dispatch(state.update({ selection: EditorSelection.create(ranges) }));
    return true;
  }
  return false;
};

/**
 * Sublime Text Ctrl+J / Ctrl+Shift+J: Join lines (joins next line into current line)
 */
export const joinLines: StateCommand = ({ state, dispatch }) => {
  const changes: { from: number; to: number; insert: string }[] = [];

  for (const range of state.selection.ranges) {
    const line = state.doc.lineAt(range.head);
    if (line.number < state.doc.lines) {
      const nextLine = state.doc.line(line.number + 1);
      const indentLen = nextLine.text.match(/^\s*/)?.[0].length || 0;
      changes.push({
        from: line.to,
        to: nextLine.from + indentLen,
        insert: ' ',
      });
    }
  }

  if (changes.length > 0) {
    dispatch(state.update({ changes, userEvent: 'delete' }));
    return true;
  }
  return false;
};

/**
 * Sublime Text F9 / Ctrl+F9: Sort lines
 */
export const sortLines = (caseSensitive = false): StateCommand => ({ state, dispatch }) => {
  const lineNumbers = new Set<number>();
  for (const range of state.selection.ranges) {
    const start = state.doc.lineAt(range.from).number;
    const end = state.doc.lineAt(range.to).number;
    for (let i = start; i <= end; i++) lineNumbers.add(i);
  }

  // If no multiple lines selected, sort entire file
  if (lineNumbers.size <= 1) {
    for (let i = 1; i <= state.doc.lines; i++) lineNumbers.add(i);
  }

  const sortedLineNums = Array.from(lineNumbers).sort((a, b) => a - b);
  const fromLine = state.doc.line(sortedLineNums[0]);
  const toLine = state.doc.line(sortedLineNums[sortedLineNums.length - 1]);
  const linesText = sortedLineNums.map((n) => state.doc.line(n).text);

  linesText.sort((a, b) => {
    if (caseSensitive) {
      return a < b ? -1 : a > b ? 1 : 0;
    }
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });

  dispatch(
    state.update({
      changes: { from: fromLine.from, to: toLine.to, insert: linesText.join('\n') },
      userEvent: 'input',
    })
  );
  return true;
};

/**
 * Sublime Text Ctrl+Up / Ctrl+Down: Scroll lines without moving cursor
 */
export const scrollLines = (direction: 'up' | 'down'): Command => (view) => {
  const amount = direction === 'up' ? -24 : 24;
  view.scrollDOM.scrollTop += amount;
  return true;
};

/**
 * Sublime Text Ctrl+K Ctrl+D: Skip current occurrence and find next
 */
export const skipAndSelectNextOccurrence: StateCommand = (target) => {
  const sel = target.state.selection;
  if (sel.ranges.length > 1) {
    const withoutLast = sel.ranges.slice(0, -1);
    target.dispatch(target.state.update({ selection: EditorSelection.create(withoutLast) }));
  }
  return selectNextOccurrence(target);
};

/**
 * Sublime Text Marks:
 * Ctrl+K Ctrl+Space -> set_mark
 * Ctrl+K Ctrl+A -> select_to_mark
 * Ctrl+K Ctrl+W -> delete_to_mark
 * Ctrl+K Ctrl+X -> swap_with_mark
 * Ctrl+K Ctrl+Y -> yank
 */
export const setMark: Command = (view) => {
  savedMarkPosition = view.state.selection.main.head;
  return true;
};

export const selectToMark: StateCommand = ({ state, dispatch }) => {
  if (savedMarkPosition === null) return false;
  const currentHead = state.selection.main.head;
  dispatch(
    state.update({
      selection: EditorSelection.range(savedMarkPosition, currentHead),
    })
  );
  return true;
};

export const deleteToMark: StateCommand = ({ state, dispatch }) => {
  if (savedMarkPosition === null) return false;
  const currentHead = state.selection.main.head;
  const from = Math.min(savedMarkPosition, currentHead);
  const to = Math.max(savedMarkPosition, currentHead);
  yankBuffer = state.sliceDoc(from, to);
  dispatch(
    state.update({
      changes: { from, to, insert: '' },
      selection: EditorSelection.cursor(from),
      userEvent: 'delete',
    })
  );
  savedMarkPosition = null;
  return true;
};

export const swapWithMark: StateCommand = ({ state, dispatch }) => {
  if (savedMarkPosition === null) return false;
  const currentHead = state.selection.main.head;
  const newMark = currentHead;
  const newHead = savedMarkPosition;
  savedMarkPosition = newMark;
  dispatch(
    state.update({
      selection: EditorSelection.cursor(newHead),
    })
  );
  return true;
};

export const yankMark: StateCommand = ({ state, dispatch }) => {
  if (!yankBuffer) return false;
  const head = state.selection.main.head;
  dispatch(
    state.update({
      changes: { from: head, insert: yankBuffer },
      selection: EditorSelection.cursor(head + yankBuffer.length),
      userEvent: 'input.paste',
    })
  );
  return true;
};

/**
 * Sublime Text Ctrl+K Ctrl+U: Transform selection to UPPERCASE
 */
export const transformToUppercase: StateCommand = ({ state, dispatch }) => {
  const changes: { from: number; to: number; insert: string }[] = [];

  for (const range of state.selection.ranges) {
    if (!range.empty) {
      const text = state.sliceDoc(range.from, range.to);
      changes.push({ from: range.from, to: range.to, insert: text.toUpperCase() });
    }
  }

  if (changes.length > 0) {
    dispatch(state.update({ changes, userEvent: 'input' }));
    return true;
  }
  return false;
};

/**
 * Sublime Text Ctrl+K Ctrl+L: Transform selection to lowercase
 */
export const transformToLowercase: StateCommand = ({ state, dispatch }) => {
  const changes: { from: number; to: number; insert: string }[] = [];

  for (const range of state.selection.ranges) {
    if (!range.empty) {
      const text = state.sliceDoc(range.from, range.to);
      changes.push({ from: range.from, to: range.to, insert: text.toLowerCase() });
    }
  }

  if (changes.length > 0) {
    dispatch(state.update({ changes, userEvent: 'input' }));
    return true;
  }
  return false;
};

/**
 * Sublime Text Ctrl+K Ctrl+C: Center view on cursor
 */
export const centerCursor: Command = (view) => {
  const head = view.state.selection.main.head;
  view.dispatch({
    effects: EditorView.scrollIntoView(head, { y: 'center' }),
  });
  return true;
};

export const sublimeKeybindings: readonly KeyBinding[] = [
  // --- Sublime Multi-Cursor & Selection ---
  { key: 'Mod-d', run: selectNextOccurrence, preventDefault: true },
  { key: 'Alt-F3', run: selectSelectionMatches, preventDefault: true },
  { key: 'Mod-Alt-g', run: selectSelectionMatches, preventDefault: true },
  { key: 'Mod-Shift-l', run: splitSelectionIntoLines, preventDefault: true },
  { key: 'Mod-l', run: selectLine, preventDefault: true },
  { key: 'Mod-Shift-Space', run: selectParentSyntax, preventDefault: true },
  { key: 'Mod-Shift-m', run: selectMatchingBracket, preventDefault: true },
  { key: 'Mod-m', run: cursorMatchingBracket, preventDefault: true },
  { key: 'Mod-u', run: undoSelection, preventDefault: true },
  { key: 'Mod-Shift-u', run: redoSelection, preventDefault: true },
  { key: 'Mod-Alt-ArrowUp', run: addCursorAbove, preventDefault: true },
  { key: 'Mod-Alt-ArrowDown', run: addCursorBelow, preventDefault: true },

  // --- Line & Text Editing ---
  { key: 'Mod-Shift-d', run: duplicateLineOrSelection, preventDefault: true },
  { key: 'Alt-ArrowUp', run: moveLineUp, preventDefault: true },
  { key: 'Alt-ArrowDown', run: moveLineDown, preventDefault: true },
  { key: 'Mod-Shift-ArrowUp', run: moveLineUp, preventDefault: true },
  { key: 'Mod-Shift-ArrowDown', run: moveLineDown, preventDefault: true },
  { key: 'Shift-Alt-ArrowUp', run: copyLineUp, preventDefault: true },
  { key: 'Shift-Alt-ArrowDown', run: copyLineDown, preventDefault: true },
  { key: 'Mod-Shift-k', run: deleteLine, preventDefault: true },
  { key: 'Mod-Enter', run: insertLineBelow, preventDefault: true },
  { key: 'Mod-Shift-Enter', run: insertLineAbove, preventDefault: true },
  { key: 'Mod-j', run: joinLines, preventDefault: true },
  { key: 'Mod-Shift-j', run: joinLines, preventDefault: true },
  { key: 'Mod-t', run: transposeChars, preventDefault: true },
  { key: 'Mod-Backspace', run: deleteGroupBackward, preventDefault: true },
  { key: 'Mod-Delete', run: deleteGroupForward, preventDefault: true },
  { key: 'Mod-Shift-Delete', run: deleteToLineEnd, preventDefault: true },
  { key: 'Mod-Shift-Backspace', run: deleteToLineStart, preventDefault: true },

  // --- Sorting Lines ---
  { key: 'F9', run: sortLines(false), preventDefault: true },
  { key: 'Mod-F9', run: sortLines(true), preventDefault: true },

  // --- Indentation ---
  { key: 'Mod-]', run: indentMore, preventDefault: true },
  { key: 'Mod-[', run: indentLess, preventDefault: true },

  // --- Comments ---
  { key: 'Mod-/', run: (v) => smartToggleLineComment(v), preventDefault: true },
  { key: 'Mod-Shift-/', run: (v) => smartToggleBlockComment(v), preventDefault: true },
  { key: 'Alt-Shift-a', run: (v) => smartToggleBlockComment(v), preventDefault: true },

  // --- Code Folding ---
  { key: 'Mod-Shift-[', run: foldCode, preventDefault: true },
  { key: 'Mod-Shift-]', run: unfoldCode, preventDefault: true },
  { key: 'Mod-Alt-[', run: foldAll, preventDefault: true },
  { key: 'Mod-Alt-]', run: unfoldAll, preventDefault: true },

  // --- Navigation & Scrolling ---
  { key: 'Mod-Home', run: cursorDocStart, preventDefault: true },
  { key: 'Mod-End', run: cursorDocEnd, preventDefault: true },
  { key: 'Alt-ArrowLeft', run: cursorSubwordBackward, preventDefault: true },
  { key: 'Alt-ArrowRight', run: cursorSubwordForward, preventDefault: true },
  { key: 'Shift-Alt-ArrowLeft', run: selectSubwordBackward, preventDefault: true },
  { key: 'Shift-Alt-ArrowRight', run: selectSubwordForward, preventDefault: true },
  { key: 'Mod-ArrowUp', run: scrollLines('up'), preventDefault: true },
  { key: 'Mod-ArrowDown', run: scrollLines('down'), preventDefault: true },

  // --- Bookmarks ---
  { key: 'Mod-F2', run: toggleBookmark, preventDefault: true },
  { key: 'F2', run: nextBookmark, preventDefault: true },
  { key: 'Shift-F2', run: prevBookmark, preventDefault: true },
  { key: 'Mod-Shift-F2', run: clearBookmarks, preventDefault: true },
  { key: 'Alt-F2', run: selectAllBookmarks, preventDefault: true },
];
