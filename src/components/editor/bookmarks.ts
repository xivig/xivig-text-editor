import { StateField, StateEffect, RangeSet, EditorSelection, SelectionRange } from '@codemirror/state';
import { EditorView, gutter, GutterMarker } from '@codemirror/view';
import { Command } from '@codemirror/view';

export const toggleBookmarkEffect = StateEffect.define<number>();
export const clearBookmarksEffect = StateEffect.define<void>();

class BookmarkMarker extends GutterMarker {
  toDOM() {
    const el = document.createElement('div');
    el.title = 'Bookmark (F2 to jump, Shift+F2 previous, Ctrl+F2 to toggle)';
    el.style.width = '12px';
    el.style.height = '12px';
    el.style.display = 'inline-flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = '#38bdf8';
    el.style.cursor = 'pointer';
    el.innerHTML = `
      <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
        <path d="M1 0h8a1 1 0 0 1 1 1v11L5 8.5 0 12V1a1 1 0 0 1 1-1z"/>
      </svg>
    `;
    return el;
  }
}

const bookmarkMarker = new BookmarkMarker();

export const bookmarkField = StateField.define<RangeSet<GutterMarker>>({
  create() {
    return RangeSet.empty;
  },
  update(bookmarks, tr) {
    bookmarks = bookmarks.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(clearBookmarksEffect)) {
        bookmarks = RangeSet.empty;
      } else if (e.is(toggleBookmarkEffect)) {
        const linePos = e.value;
        let exists = false;
        const builder: { from: number; to: number; value: GutterMarker }[] = [];

        const iter = bookmarks.iter();
        while (iter.value) {
          if (iter.from === linePos) {
            exists = true;
          } else {
            builder.push({ from: iter.from, to: iter.to, value: iter.value });
          }
          iter.next();
        }

        if (!exists) {
          builder.push({ from: linePos, to: linePos, value: bookmarkMarker });
          builder.sort((a, b) => a.from - b.from);
        }

        bookmarks = RangeSet.of(builder.map((b) => b.value.range(b.from)));
      }
    }
    return bookmarks;
  },
});

export function toggleBookmarkAtPos(view: EditorView, pos: number) {
  view.dispatch({
    effects: toggleBookmarkEffect.of(pos),
  });
}

export const bookmarkGutter = gutter({
  class: 'cm-bookmark-gutter',
  markers: (v) => v.state.field(bookmarkField),
  initialSpacer: () => bookmarkMarker,
  domEventHandlers: {
    mousedown(view, line) {
      toggleBookmarkAtPos(view, line.from);
      return true;
    },
  },
});

export const toggleBookmark: Command = (view) => {
  const pos = view.state.doc.lineAt(view.state.selection.main.head).from;
  view.dispatch({
    effects: toggleBookmarkEffect.of(pos),
  });
  return true;
};

export const nextBookmark: Command = (view) => {
  const bookmarks = view.state.field(bookmarkField);
  const currentHead = view.state.selection.main.head;
  const positions: number[] = [];

  const iter = bookmarks.iter();
  while (iter.value) {
    positions.push(iter.from);
    iter.next();
  }

  if (positions.length === 0) return false;

  // Find next bookmark after current head
  const next = positions.find((p) => p > currentHead);
  const targetPos = next !== undefined ? next : positions[0];

  view.dispatch({
    selection: { anchor: targetPos, head: targetPos },
    scrollIntoView: true,
  });
  return true;
};

export const prevBookmark: Command = (view) => {
  const bookmarks = view.state.field(bookmarkField);
  const currentHead = view.state.selection.main.head;
  const positions: number[] = [];

  const iter = bookmarks.iter();
  while (iter.value) {
    positions.push(iter.from);
    iter.next();
  }

  if (positions.length === 0) return false;

  // Find previous bookmark before current head
  const prevPositions = positions.filter((p) => p < currentHead);
  const targetPos = prevPositions.length > 0 ? prevPositions[prevPositions.length - 1] : positions[positions.length - 1];

  view.dispatch({
    selection: { anchor: targetPos, head: targetPos },
    scrollIntoView: true,
  });
  return true;
};

export const clearBookmarks: Command = (view) => {
  view.dispatch({
    effects: clearBookmarksEffect.of(),
  });
  return true;
};

export const selectAllBookmarks: Command = (view) => {
  const bookmarks = view.state.field(bookmarkField);
  const ranges: SelectionRange[] = [];
  const iter = bookmarks.iter();
  while (iter.value) {
    ranges.push(EditorSelection.cursor(iter.from));
    iter.next();
  }

  if (ranges.length > 0) {
    view.dispatch({
      selection: EditorSelection.create(ranges),
    });
    return true;
  }
  return false;
};
