import { Text } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { Position, Range, TextEdit } from './types';

/**
 * Converts a CodeMirror document offset to an LSP 0-based Position (line, character).
 */
export function offsetToPosition(doc: Text, offset: number): Position {
  const clampedOffset = Math.max(0, Math.min(offset, doc.length));
  const line = doc.lineAt(clampedOffset);
  return {
    line: line.number - 1,
    character: clampedOffset - line.from,
  };
}

/**
 * Converts an LSP 0-based Position to a CodeMirror document offset.
 */
export function positionToOffset(doc: Text, pos: Position): number {
  const lineNumber = Math.max(1, Math.min(pos.line + 1, doc.lines));
  const line = doc.line(lineNumber);
  return Math.min(line.from + pos.character, line.to);
}

/**
 * Converts an LSP Range to CodeMirror { from, to } offsets.
 */
export function rangeToOffsets(doc: Text, range: Range): { from: number; to: number } {
  const from = positionToOffset(doc, range.start);
  const to = positionToOffset(doc, range.end);
  return { from, to: Math.max(from, to) };
}

/**
 * Applies an array of LSP TextEdits to an active CodeMirror EditorView.
 */
export function applyLspTextEdits(view: EditorView, edits: TextEdit[]): void {
  if (!edits || edits.length === 0) return;

  const doc = view.state.doc;
  const changes = edits.map((edit) => {
    const { from, to } = rangeToOffsets(doc, edit.range);
    return {
      from,
      to,
      insert: edit.newText,
    };
  });

  view.dispatch({
    changes,
    userEvent: 'lsp.format',
  });
}
