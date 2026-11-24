import { describe, expect, it } from 'vitest';
import { interpolateMarkdownAnchors } from '../utils/markdownScrollSync';

describe('Markdown scroll anchor interpolation', () => {
  const anchors = [
    { line: 1, top: 16 },
    { line: 10, top: 196 },
    { line: 30, top: 796 },
    { line: 60, top: 1396 },
  ];

  it('maps source lines to measured preview positions', () => {
    expect(interpolateMarkdownAnchors(anchors, 20, 'line')).toBe(496);
  });

  it('maps preview positions back to source lines', () => {
    expect(interpolateMarkdownAnchors(anchors, 496, 'top')).toBe(20);
  });

  it('clamps values before and after the available anchors', () => {
    expect(interpolateMarkdownAnchors(anchors, 0, 'line')).toBe(16);
    expect(interpolateMarkdownAnchors(anchors, 100, 'line')).toBe(1396);
    expect(interpolateMarkdownAnchors(anchors, 0, 'top')).toBe(1);
    expect(interpolateMarkdownAnchors(anchors, 2000, 'top')).toBe(60);
  });

  it('returns null when the preview has no line anchors', () => {
    expect(interpolateMarkdownAnchors([], 12, 'line')).toBeNull();
  });

  it('handles adjacent anchors without division by zero', () => {
    expect(
      interpolateMarkdownAnchors(
        [{ line: 4, top: 80 }, { line: 4, top: 120 }],
        4,
        'line',
      ),
    ).toBe(80);
  });
});
