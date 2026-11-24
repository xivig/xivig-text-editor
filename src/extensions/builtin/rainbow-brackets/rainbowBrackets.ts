import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { Range } from '@codemirror/state';
import { syntaxTree, ensureSyntaxTree } from '@codemirror/language';
import { RAINBOW_COLORS } from './settings';

const OPEN_TO_CLOSE: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
};

const CLOSE_TO_OPEN: Record<string, string> = {
  ')': '(',
  ']': '[',
  '}': '{',
};

interface BracketStackItem {
  char: string;
  from: number;
  to: number;
  depth: number;
}

/**
 * Checks if a syntax node (or any of its parents) is a comment, string, or regex literal.
 */
function isIgnoredSyntaxNode(node: any): boolean {
  let curr = node;
  while (curr) {
    const name = curr.name || '';
    if (
      name.includes('Comment') ||
      name.includes('String') ||
      name.includes('RegExp') ||
      name === 'TemplateString' ||
      name === 'EscapeSequence' ||
      name === 'StringContent'
    ) {
      return true;
    }
    curr = curr.parent;
  }
  return false;
}

/**
 * Creates rainbow bracket decorations for the current document.
 * Syntax-aware: resolves syntax tree to skip brackets inside strings and comments.
 * Falls back to lexical quote/comment scanning when syntax tree is absent.
 */
export function createRainbowDecorations(view: EditorView): DecorationSet {
  const doc = view.state.doc;
  if (doc.length === 0) {
    return Decoration.none;
  }

  const ranges: Range<Decoration>[] = [];
  const stack: BracketStackItem[] = [];

  // Scan up to viewport end + generous buffer
  const maxScanPos = Math.min(doc.length, Math.max(view.viewport.to + 5000, 10000));
  const tree = ensureSyntaxTree(view.state, maxScanPos, 50) || syntaxTree(view.state);
  const hasTree = tree && tree.length > 0;

  const text = doc.sliceString(0, maxScanPos);

  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    // If syntax tree is available, use resolveInner on bracket candidates
    if (hasTree) {
      if (!OPEN_TO_CLOSE[ch] && !CLOSE_TO_OPEN[ch]) {
        continue;
      }

      // Check if candidate bracket is inside string, comment, or regex
      try {
        const node = tree.resolveInner(i, 1);
        if (isIgnoredSyntaxNode(node)) {
          continue;
        }
      } catch {
        // If node resolution fails, proceed with matching
      }
    } else {
      // Fallback lexical scanning for strings/comments when syntax tree is absent
      const prev = i > 0 ? text[i - 1] : '';
      const next = i + 1 < text.length ? text[i + 1] : '';

      if (inLineComment) {
        if (ch === '\n') inLineComment = false;
        continue;
      }

      if (inBlockComment) {
        if (prev === '*' && ch === '/') inBlockComment = false;
        continue;
      }

      if (inSingleQuote) {
        if (ch === "'" && prev !== '\\') inSingleQuote = false;
        continue;
      }

      if (inDoubleQuote) {
        if (ch === '"' && prev !== '\\') inDoubleQuote = false;
        continue;
      }

      if (inBacktick) {
        if (ch === '`' && prev !== '\\') inBacktick = false;
        continue;
      }

      if (ch === '/' && next === '/') {
        inLineComment = true;
        i++;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        i++;
        continue;
      }
      if (ch === '#' && (i === 0 || text[i - 1] === ' ' || text[i - 1] === '\n')) {
        inLineComment = true;
        continue;
      }

      if (ch === "'") {
        inSingleQuote = true;
        continue;
      }
      if (ch === '"') {
        inDoubleQuote = true;
        continue;
      }
      if (ch === '`') {
        inBacktick = true;
        continue;
      }

      if (!OPEN_TO_CLOSE[ch] && !CLOSE_TO_OPEN[ch]) {
        continue;
      }
    }

    // Match brackets
    if (OPEN_TO_CLOSE[ch]) {
      stack.push({
        char: ch,
        from: i,
        to: i + 1,
        depth: stack.length % RAINBOW_COLORS.length,
      });
      continue;
    }

    if (CLOSE_TO_OPEN[ch]) {
      const expectedOpen = CLOSE_TO_OPEN[ch];
      let matchIdx = -1;
      for (let j = stack.length - 1; j >= 0; j--) {
        if (stack[j].char === expectedOpen) {
          matchIdx = j;
          break;
        }
      }

      if (matchIdx !== -1) {
        const opening = stack[matchIdx];
        const color = RAINBOW_COLORS[opening.depth];
        const decoration = Decoration.mark({
          class: `xivig-rainbow-bracket-${color}`,
        });

        ranges.push(
          decoration.range(opening.from, opening.to),
          decoration.range(i, i + 1)
        );

        stack.splice(matchIdx);
      }
    }
  }

  if (ranges.length === 0) {
    return Decoration.none;
  }

  // Sort ranges in ascending document order for RangeSet
  ranges.sort((a, b) => a.from - b.from || a.to - b.to);

  return Decoration.set(ranges, true);
}

/**
 * CodeMirror ViewPlugin for rainbow bracket highlighting.
 */
export const rainbowBracketsPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = createRainbowDecorations(view);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        syntaxTree(update.state) !== syntaxTree(update.startState)
      ) {
        this.decorations = createRainbowDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
