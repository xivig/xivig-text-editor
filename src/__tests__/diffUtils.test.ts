import { describe, it, expect } from 'vitest';
import { computeLineDiff } from '../utils/diffUtils';

describe('diffUtils - computeLineDiff', () => {
  it('returns equal lines when texts are identical', () => {
    const text = 'line 1\nline 2\nline 3';
    const diff = computeLineDiff(text, text);

    expect(diff.additions).toBe(0);
    expect(diff.deletions).toBe(0);
    expect(diff.unifiedLines.every((l) => l.type === 'equal')).toBe(true);
    expect(diff.sideBySideLines.length).toBe(3);
  });

  it('correctly detects additions', () => {
    const orig = 'line 1\nline 3';
    const mod = 'line 1\nline 2\nline 3';
    const diff = computeLineDiff(orig, mod);

    expect(diff.additions).toBe(1);
    expect(diff.deletions).toBe(0);
    const added = diff.unifiedLines.find((l) => l.type === 'add');
    expect(added?.text).toBe('line 2');
  });

  it('correctly detects deletions', () => {
    const orig = 'line 1\nline 2\nline 3';
    const mod = 'line 1\nline 3';
    const diff = computeLineDiff(orig, mod);

    expect(diff.additions).toBe(0);
    expect(diff.deletions).toBe(1);
    const deleted = diff.unifiedLines.find((l) => l.type === 'delete');
    expect(deleted?.text).toBe('line 2');
  });

  it('correctly detects modifications in side-by-side mode', () => {
    const orig = 'const x = 10;';
    const mod = 'const x = 20;';
    const diff = computeLineDiff(orig, mod);

    expect(diff.additions).toBe(1);
    expect(diff.deletions).toBe(1);
    expect(diff.sideBySideLines.some((l) => l.type === 'modify')).toBe(true);
  });
});
