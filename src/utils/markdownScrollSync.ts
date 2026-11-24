export interface MarkdownScrollAnchor {
  line: number;
  top: number;
}

/**
 * Interpolates between source-line anchors and their rendered preview positions.
 * Anchors must be sorted by `line` and `top` in document order.
 */
export function interpolateMarkdownAnchors(
  anchors: MarkdownScrollAnchor[],
  value: number,
  input: 'line' | 'top',
): number | null {
  if (anchors.length === 0) return null;

  const inputValue = (anchor: MarkdownScrollAnchor) =>
    input === 'line' ? anchor.line : anchor.top;
  const outputValue = (anchor: MarkdownScrollAnchor) =>
    input === 'line' ? anchor.top : anchor.line;

  if (value <= inputValue(anchors[0])) return outputValue(anchors[0]);

  const last = anchors[anchors.length - 1];
  if (value >= inputValue(last)) return outputValue(last);

  let low = 0;
  let high = anchors.length - 1;

  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (inputValue(anchors[middle]) <= value) low = middle;
    else high = middle;
  }

  const before = anchors[low];
  const after = anchors[high];
  const inputSpan = inputValue(after) - inputValue(before);
  if (inputSpan <= 0) return outputValue(before);

  const progress = Math.max(
    0,
    Math.min(1, (value - inputValue(before)) / inputSpan),
  );

  return outputValue(before) +
    progress * (outputValue(after) - outputValue(before));
}
