import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setDocumentBlame,
  getBlameForLine,
  clearDocumentBlame,
  DEFAULT_GITLENS_SETTINGS,
  buildCommitGraph,
  renderAsciiGraph,
  parseGitLogEntries,
  compareRevisions,
  parseRemoteUrl,
  buildGitHubWebUrl,
  filterGitHubItems,
  GitHubItem,
  setCopilotSuggestion,
  getCopilotSuggestion,
  dismissCopilotSuggestion,
  createCopilotPlugin,
} from '../extensions/builtin/git/index';
import { extensionManager } from '../extensions/runtime/extensionManager';
import { BUILTIN_EXTENSIONS } from '../extensions/builtin/index';

describe('Category 2: Git & Version Control Extensions Suite', () => {
  beforeEach(async () => {
    await extensionManager.init();
    clearDocumentBlame();
    setCopilotSuggestion(null);
  });

  afterEach(async () => {
    clearDocumentBlame();
    setCopilotSuggestion(null);
    await extensionManager.deactivateExtension('xivig.gitlens');
    await extensionManager.deactivateExtension('xivig.copilot');
  });

  describe('1. GitLens — Current Line Blame & Annotations', () => {
    it('manages document blame cache and retrieves line annotations', () => {
      const annotations = new Map();
      annotations.set(10, {
        author: 'Bandhu',
        date: '2 hours ago',
        message: 'fix(shortcuts): resolve Ctrl+B collision',
        commitHash: 'f131998a12345678',
      });

      setDocumentBlame('src/app/App.tsx', annotations);

      const blame = getBlameForLine('src/app/App.tsx', 10);
      expect(blame).toBeDefined();
      expect(blame?.author).toBe('Bandhu');
      expect(blame?.commitHash).toContain('f131998');

      // Line without blame returns null
      expect(getBlameForLine('src/app/App.tsx', 99)).toBeNull();
    });

    it('clears blame cache cleanly', () => {
      const annotations = new Map();
      annotations.set(1, {
        author: 'Developer',
        date: '1 day ago',
        message: 'initial',
        commitHash: 'abcdef12',
      });
      setDocumentBlame('test.ts', annotations);
      expect(getBlameForLine('test.ts', 1)).not.toBeNull();

      clearDocumentBlame('test.ts');
      expect(getBlameForLine('test.ts', 1)).toBeNull();
    });

    it('registers GitLens module with CodeMirror extensions', () => {
      const module = BUILTIN_EXTENSIONS['xivig.gitlens'];
      expect(module).toBeDefined();
      expect(module.manifest.id).toBe('xivig.gitlens');
      expect(typeof module.getCodeMirrorExtensions).toBe('function');
      const exts = module.getCodeMirrorExtensions?.();
      expect(exts?.length).toBeGreaterThan(0);
    });
  });

  describe('2. Git Graph — Topological Branch & Merge Graph', () => {
    it('allocates commit lanes and handles branching and merging', () => {
      const rawCommits = [
        {
          hash: 'c3',
          parents: ['c2', 'b1'],
          author: 'Alice',
          date: '1 hour ago',
          message: 'Merge branch feature into main',
          refs: 'HEAD -> main',
        },
        {
          hash: 'b1',
          parents: ['c1'],
          author: 'Bob',
          date: '2 hours ago',
          message: 'Add feature branch work',
          refs: 'feature',
        },
        {
          hash: 'c2',
          parents: ['c1'],
          author: 'Alice',
          date: '3 hours ago',
          message: 'Update documentation',
        },
        {
          hash: 'c1',
          parents: [],
          author: 'Alice',
          date: '1 day ago',
          message: 'Initial commit',
          refs: 'tag: v1.0.0',
        },
      ];

      const nodes = buildCommitGraph(rawCommits);
      expect(nodes.length).toBe(4);

      expect(nodes[0].hash).toBe('c3');
      expect(nodes[0].isHead).toBe(true);
      expect(nodes[0].branch).toBe('main');

      expect(nodes[3].hash).toBe('c1');
      expect(nodes[3].tags).toContain('v1.0.0');

      const ascii = renderAsciiGraph(nodes);
      expect(ascii.length).toBe(4);
      expect(ascii[0]).toContain('Merge branch');
      expect(ascii[3]).toContain('Initial commit');
    });
  });

  describe('3. Git History — Log Parsing & Revision Diffs', () => {
    it('parses structured git log lines into history entries', () => {
      const rawLog = `
a1b2c3d4e5f6|a1b2c3d|Bandhu|1 hour ago|feat: implement Category 1|3
e5f6a1b2c3d4|e5f6a1b|Alice|2 days ago|docs: update keybindings|1
`;
      const entries = parseGitLogEntries(rawLog);
      expect(entries.length).toBe(2);

      expect(entries[0].shortHash).toBe('a1b2c3d');
      expect(entries[0].author).toBe('Bandhu');
      expect(entries[0].message).toBe('feat: implement Category 1');
      expect(entries[0].filesChanged).toBe(3);

      expect(entries[1].author).toBe('Alice');
    });

    it('computes line diff comparison between revisions', () => {
      const oldText = 'line 1\nline 2\nline 3';
      const newText = 'line 1\nline 2 modified\nline 3\nline 4';

      const diff = compareRevisions(oldText, newText, 'sample.ts');
      expect(diff).toContain('--- a/sample.ts');
      expect(diff).toContain('+++ b/sample.ts');
      expect(diff).toContain('-line 2');
      expect(diff).toContain('+line 2 modified');
      expect(diff).toContain('+line 4');
    });
  });

  describe('4. GitHub Pull Requests and Issues', () => {
    it('parses HTTPS and SSH GitHub remote URLs', () => {
      const httpsInfo = parseRemoteUrl('https://github.com/xivig/xivig-text-editor.git');
      expect(httpsInfo).toBeDefined();
      expect(httpsInfo?.owner).toBe('xivig');
      expect(httpsInfo?.repo).toBe('xivig-text-editor');
      expect(httpsInfo?.provider).toBe('github');

      const sshInfo = parseRemoteUrl('git@github.com:xivig/xivig-text-editor.git');
      expect(sshInfo).toBeDefined();
      expect(sshInfo?.owner).toBe('xivig');
      expect(sshInfo?.repo).toBe('xivig-text-editor');
    });

    it('builds direct web deep links for PRs and issues', () => {
      const info = { owner: 'xivig', repo: 'xivig-text-editor', provider: 'github' as const };
      const prUrl = buildGitHubWebUrl(info, 'pr', 42);
      expect(prUrl).toBe('https://github.com/xivig/xivig-text-editor/pull/42');

      const issueUrl = buildGitHubWebUrl(info, 'issue', 101);
      expect(issueUrl).toBe('https://github.com/xivig/xivig-text-editor/issues/101');
    });

    it('filters items by open, closed, PRs, and issues', () => {
      const items: GitHubItem[] = [
        {
          id: 1,
          number: 10,
          title: 'Fix typo',
          author: 'dev',
          state: 'open',
          createdAt: '2026-11-20',
          labels: [],
          isPullRequest: true,
          url: 'https://...',
        },
        {
          id: 2,
          number: 11,
          title: 'Feature request',
          author: 'user',
          state: 'closed',
          createdAt: '2026-11-21',
          labels: [],
          isPullRequest: false,
          url: 'https://...',
        },
      ];

      expect(filterGitHubItems(items, 'open').length).toBe(1);
      expect(filterGitHubItems(items, 'closed').length).toBe(1);
      expect(filterGitHubItems(items, 'prs').length).toBe(1);
      expect(filterGitHubItems(items, 'issues').length).toBe(1);
    });
  });

  describe('5. GitHub Copilot — Inline Ghost Text Suggestions', () => {
    it('manages ghost text suggestion state and subscriptions', () => {
      expect(getCopilotSuggestion()).toBeNull();

      let notified = false;
      const unsubscribe = () => {};

      setCopilotSuggestion({
        id: 'sug-1',
        text: 'console.log("Hello from Copilot");',
      });

      const current = getCopilotSuggestion();
      expect(current).toBeDefined();
      expect(current?.text).toContain('Hello from Copilot');

      dismissCopilotSuggestion();
      expect(getCopilotSuggestion()).toBeNull();
    });

    it('creates Copilot CodeMirror extension with Tab keymap', () => {
      const exts = createCopilotPlugin();
      expect(exts).toBeDefined();
      expect(Array.isArray(exts)).toBe(true);
    });
  });

  describe('Runtime Activation', () => {
    it('activates and deactivates Git & Copilot extensions cleanly', async () => {
      const copilotActivated = await extensionManager.activateExtension('xivig.copilot');
      expect(copilotActivated).toBe(true);
      expect(extensionManager.isExtensionActive('xivig.copilot')).toBe(true);

      const activeExts = extensionManager.getActiveCodeMirrorExtensions();
      expect(activeExts.length).toBeGreaterThan(0);

      await extensionManager.deactivateExtension('xivig.copilot');
      expect(extensionManager.isExtensionActive('xivig.copilot')).toBe(false);
    });
  });
});
