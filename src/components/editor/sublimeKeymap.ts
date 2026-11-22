import { KeyBinding } from '@codemirror/view';
import {
  copyLineDown,
  copyLineUp,
  moveLineDown,
  moveLineUp,
  deleteLine,
  selectLine,
  toggleComment,
  insertBlankLine,
  addCursorAbove,
  addCursorBelow,
  undoSelection,
  redoSelection,
} from '@codemirror/commands';
import { selectNextOccurrence } from '@codemirror/search';

export const sublimeKeybindings: readonly KeyBinding[] = [
  // Sublime's iconic multi-cursor word selection
  { key: 'Mod-d', run: selectNextOccurrence, preventDefault: true },

  // Moving lines
  { key: 'Alt-ArrowUp', run: moveLineUp, preventDefault: true },
  { key: 'Alt-ArrowDown', run: moveLineDown, preventDefault: true },

  // Duplicate lines
  { key: 'Shift-Alt-ArrowUp', run: copyLineUp, preventDefault: true },
  { key: 'Shift-Alt-ArrowDown', run: copyLineDown, preventDefault: true },

  // Comments
  { key: 'Mod-/', run: toggleComment, preventDefault: true },

  // Line editing
  { key: 'Mod-Shift-k', run: deleteLine, preventDefault: true },
  { key: 'Mod-l', run: selectLine, preventDefault: true },
  { key: 'Mod-Enter', run: insertBlankLine, preventDefault: true },

  // Multi-cursor vertical expansion
  { key: 'Mod-Alt-ArrowUp', run: addCursorAbove, preventDefault: true },
  { key: 'Mod-Alt-ArrowDown', run: addCursorBelow, preventDefault: true },

  // Selection undo/redo
  { key: 'Mod-u', run: undoSelection, preventDefault: true },
  { key: 'Mod-Shift-u', run: redoSelection, preventDefault: true },
];
