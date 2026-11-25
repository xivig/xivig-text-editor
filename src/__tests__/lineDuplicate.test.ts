import { describe, it, expect } from 'vitest';
import { EditorState, EditorSelection } from '@codemirror/state';
import { duplicateLineOrSelection } from '../components/editor/sublimeKeymap';

describe('duplicateLineOrSelection', () => {
  it('duplicates single line down when selection is empty', () => {
    let state = EditorState.create({
      doc: 'first line\nsecond line\nthird line',
      selection: EditorSelection.cursor(5), // on 'first line'
    });

    const dispatch = (tr: any) => {
      state = tr.state;
    };

    const res = duplicateLineOrSelection({ state, dispatch });
    expect(res).toBe(true);

    expect(state.doc.toString()).toBe('first line\nfirst line\nsecond line\nthird line');
    // Cursor should be on the duplicated line at column 5 (line index 1: from 11 + 5 = 16)
    expect(state.selection.main.head).toBe(16);
  });

  it('duplicates last line down without trailing newline', () => {
    let state = EditorState.create({
      doc: 'only line',
      selection: EditorSelection.cursor(4),
    });

    const dispatch = (tr: any) => {
      state = tr.state;
    };

    const res = duplicateLineOrSelection({ state, dispatch });
    expect(res).toBe(true);
    expect(state.doc.toString()).toBe('only line\nonly line');
    // 'only line\n' is 10 chars. 10 + 4 = 14
    expect(state.selection.main.head).toBe(14);
  });

  it('duplicates selected text inline when selection is non-empty', () => {
    let state = EditorState.create({
      doc: 'hello world',
      selection: EditorSelection.range(0, 5), // 'hello'
    });

    const dispatch = (tr: any) => {
      state = tr.state;
    };

    const res = duplicateLineOrSelection({ state, dispatch });
    expect(res).toBe(true);
    expect(state.doc.toString()).toBe('hellohello world');
    // New range should cover the duplicated 'hello'
    expect(state.selection.main.from).toBe(5);
    expect(state.selection.main.to).toBe(10);
  });
});
