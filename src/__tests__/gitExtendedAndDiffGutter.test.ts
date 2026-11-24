// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { parseDiffHunks } from '../components/editor/gitDiffGutter';
import { useGitStore } from '../stores/gitStore';

describe('Git Extended Features & Inline Diff Gutter', () => {
  beforeEach(() => {
    useGitStore.setState({
      branches: [],
      currentBranch: 'main',
      commits: [],
      stashes: [],
      blameLines: [],
      commitMessage: '',
      isAmending: false,
      commitHistory: ['feat: initial commit', 'fix: resolve bug'],
      historyIndex: -1,
    });
  });

  it('accurately parses unified diff hunks into added, modified, and deleted lines', () => {
    const diffText = `--- a/src/app.ts
+++ b/src/app.ts
@@ -10,4 +10,5 @@
 const a = 1;
-const b = 2;
+const b = 20;
+const c = 30;
 const d = 4;
`;
    const lineMap = parseDiffHunks(diffText);
    expect(lineMap.get(11)).toBe('added');
    expect(lineMap.get(12)).toBe('added');
  });

  it('cycles through commit message history upwards and downwards', () => {
    const store = useGitStore.getState();

    // Cycle up to first previous commit
    store.cycleCommitHistory('up');
    expect(useGitStore.getState().commitMessage).toBe('feat: initial commit');

    // Cycle up to second previous commit
    store.cycleCommitHistory('up');
    expect(useGitStore.getState().commitMessage).toBe('fix: resolve bug');

    // Cycle down back
    store.cycleCommitHistory('down');
    expect(useGitStore.getState().commitMessage).toBe('feat: initial commit');

    // Cycle down to empty draft
    store.cycleCommitHistory('down');
    expect(useGitStore.getState().commitMessage).toBe('');
  });

  it('updates commit amending state', () => {
    const store = useGitStore.getState();
    expect(store.isAmending).toBe(false);

    store.setIsAmending(true);
    expect(useGitStore.getState().isAmending).toBe(true);
  });
});
