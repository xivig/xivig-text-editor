/**
 * Ultra-fast line diff calculation using Longest Common Subsequence (LCS).
 * Suitable for instant desktop side-by-side and unified file comparisons.
 */

export type DiffLineType = 'equal' | 'add' | 'delete';

export interface DiffLine {
  type: DiffLineType;
  oldLineNumber?: number;
  newLineNumber?: number;
  text: string;
}

export interface SideBySideLine {
  oldLineNumber?: number;
  oldText?: string;
  newLineNumber?: number;
  newText?: string;
  type: 'equal' | 'add' | 'delete' | 'modify';
}

export interface DiffResult {
  unifiedLines: DiffLine[];
  sideBySideLines: SideBySideLine[];
  additions: number;
  deletions: number;
}

/**
 * Computes line-by-line diff between two text documents.
 */
export function computeLineDiff(originalText: string, modifiedText: string): DiffResult {
  const origLines = originalText.split(/\r?\n/);
  const modLines = modifiedText.split(/\r?\n/);

  const n = origLines.length;
  const m = modLines.length;

  // LCS Matrix - memory optimized for typical files (cap at 4000 lines for instant UI)
  const maxLines = 4000;
  const safeOrig = origLines.slice(0, maxLines);
  const safeMod = modLines.slice(0, maxLines);

  const dp: number[][] = Array.from({ length: safeOrig.length + 1 }, () =>
    new Array(safeMod.length + 1).fill(0)
  );

  for (let i = 1; i <= safeOrig.length; i++) {
    for (let j = 1; j <= safeMod.length; j++) {
      if (safeOrig[i - 1] === safeMod[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const rawDiff: { type: DiffLineType; origIdx?: number; modIdx?: number; text: string }[] = [];
  let i = safeOrig.length;
  let j = safeMod.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && safeOrig[i - 1] === safeMod[j - 1]) {
      rawDiff.push({
        type: 'equal',
        origIdx: i,
        modIdx: j,
        text: safeOrig[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.push({
        type: 'add',
        modIdx: j,
        text: safeMod[j - 1],
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawDiff.push({
        type: 'delete',
        origIdx: i,
        text: safeOrig[i - 1],
      });
      i--;
    }
  }

  rawDiff.reverse();

  let additions = 0;
  let deletions = 0;

  const unifiedLines: DiffLine[] = rawDiff.map((item) => {
    if (item.type === 'add') additions++;
    if (item.type === 'delete') deletions++;

    return {
      type: item.type,
      oldLineNumber: item.origIdx,
      newLineNumber: item.modIdx,
      text: item.text,
    };
  });

  // Construct Side-by-Side lines
  const sideBySideLines: SideBySideLine[] = [];
  let idx = 0;

  while (idx < rawDiff.length) {
    const item = rawDiff[idx];

    if (item.type === 'equal') {
      sideBySideLines.push({
        type: 'equal',
        oldLineNumber: item.origIdx,
        oldText: item.text,
        newLineNumber: item.modIdx,
        newText: item.text,
      });
      idx++;
    } else {
      // Collect consecutive deletes and adds
      const deletes: typeof rawDiff = [];
      const adds: typeof rawDiff = [];

      while (idx < rawDiff.length && rawDiff[idx].type === 'delete') {
        deletes.push(rawDiff[idx]);
        idx++;
      }
      while (idx < rawDiff.length && rawDiff[idx].type === 'add') {
        adds.push(rawDiff[idx]);
        idx++;
      }

      const count = Math.max(deletes.length, adds.length);
      for (let k = 0; k < count; k++) {
        const del = deletes[k];
        const add = adds[k];

        if (del && add) {
          sideBySideLines.push({
            type: 'modify',
            oldLineNumber: del.origIdx,
            oldText: del.text,
            newLineNumber: add.modIdx,
            newText: add.text,
          });
        } else if (del) {
          sideBySideLines.push({
            type: 'delete',
            oldLineNumber: del.origIdx,
            oldText: del.text,
          });
        } else if (add) {
          sideBySideLines.push({
            type: 'add',
            newLineNumber: add.modIdx,
            newText: add.text,
          });
        }
      }
    }
  }

  return {
    unifiedLines,
    sideBySideLines,
    additions,
    deletions,
  };
}
