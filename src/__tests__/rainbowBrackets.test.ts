// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { createRainbowDecorations } from '../extensions/builtin/rainbow-brackets/rainbowBrackets';
import { createIndentGuideDecorations } from '../extensions/builtin/rainbow-brackets/indentGuides';
import { RAINBOW_COLORS } from '../extensions/builtin/rainbow-brackets/settings';

describe('Rainbow Brackets & Indent CodeMirror Extensions', () => {
  it('correctly colorizes matching pairs with identical depth colors', () => {
    const doc = 'const fn = () => { return [1, 2]; };';
    const state = EditorState.create({
      doc,
      extensions: [javascript()],
    });

    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const view = new EditorView({ state, parent });

    const decos = createRainbowDecorations(view);
    expect(decos).toBeDefined();

    const collected: Array<{ from: number; to: number; className: string }> = [];
    const iter = decos.iter();
    while (iter.value) {
      collected.push({
        from: iter.from,
        to: iter.to,
        className: (iter.value.spec as any).class,
      });
      iter.next();
    }

    expect(collected.length).toBeGreaterThanOrEqual(6); // () {} []

    // Ensure matching brackets have matching depth color classes
    const classNames = collected.map((c) => c.className);
    expect(classNames.some((c) => c.includes('xivig-rainbow-bracket-red'))).toBe(true);

    view.destroy();
    parent.remove();
  });

  it('cycles through all 6 depth colors for deeply nested structures', () => {
    // 7 nesting levels: level 7 should cycle back to red (level 1)
    const doc = '((((((()))))))';
    const state = EditorState.create({
      doc,
      extensions: [javascript()],
    });

    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const view = new EditorView({ state, parent });

    const decos = createRainbowDecorations(view);
    const collected: Array<{ from: number; to: number; className: string }> = [];
    const iter = decos.iter();
    while (iter.value) {
      collected.push({
        from: iter.from,
        to: iter.to,
        className: (iter.value.spec as any).class,
      });
      iter.next();
    }

    // Outer bracket (from 0) must be red
    expect(collected[0].className).toBe('xivig-rainbow-bracket-red');
    // Inner level 2 must be orange
    expect(collected[1].className).toBe('xivig-rainbow-bracket-orange');
    // Inner level 3 must be yellow
    expect(collected[2].className).toBe('xivig-rainbow-bracket-yellow');
    // Inner level 4 must be green
    expect(collected[3].className).toBe('xivig-rainbow-bracket-green');
    // Inner level 5 must be cyan
    expect(collected[4].className).toBe('xivig-rainbow-bracket-cyan');
    // Inner level 6 must be purple
    expect(collected[5].className).toBe('xivig-rainbow-bracket-purple');
    // Inner level 7 (depth 6) cycles back to red!
    expect(collected[6].className).toBe('xivig-rainbow-bracket-red');

    view.destroy();
    parent.remove();
  });

  it('does not highlight brackets inside strings or comments', () => {
    const doc = `// (comment bracket)
const msg = "(string bracket) [123] {abc}";
const real = (42);`;

    const state = EditorState.create({
      doc,
      extensions: [javascript()],
    });

    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const view = new EditorView({ state, parent });

    const decos = createRainbowDecorations(view);
    const collected: Array<{ from: number; to: number; text: string }> = [];
    const iter = decos.iter();
    while (iter.value) {
      collected.push({
        from: iter.from,
        to: iter.to,
        text: doc.slice(iter.from, iter.to),
      });
      iter.next();
    }

    // Only the real brackets (around 42) should be highlighted
    const bracketChars = collected.map((c) => c.text);
    expect(bracketChars).toEqual(['(', ')']);

    view.destroy();
    parent.remove();
  });

  it('creates rainbow indent guides for spaced and tabbed indentation', () => {
    const doc = `function test() {
    const a = 1;
        const b = 2;
\t\t\tconst c = 3;
}`;

    const state = EditorState.create({ doc });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const view = new EditorView({ state, parent });

    const decos = createIndentGuideDecorations(view, 4);
    const collected: Array<{ from: number; to: number; className: string }> = [];
    const iter = decos.iter();
    while (iter.value) {
      collected.push({
        from: iter.from,
        to: iter.to,
        className: (iter.value.spec as any).class,
      });
      iter.next();
    }

    expect(collected.length).toBeGreaterThan(0);
    // Indent level 0 uses red guide
    expect(collected.some((c) => c.className.includes('xivig-indent-guide-red'))).toBe(true);
    // Indent level 1 uses orange guide
    expect(collected.some((c) => c.className.includes('xivig-indent-guide-orange'))).toBe(true);

    view.destroy();
    parent.remove();
  });
});
