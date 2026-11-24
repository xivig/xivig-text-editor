import { GitHubItem, GitHubSettings } from './types';

export const DEFAULT_GITHUB_SETTINGS: GitHubSettings = {
  enabled: true,
  remoteName: 'origin',
  pollIntervalMs: 60000,
  autoDetectRemote: true,
};

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  provider: 'github' | 'gitlab' | 'bitbucket' | 'custom';
}

/**
 * Extracts owner and repo from standard git remote URLs:
 * - https://github.com/xivig/xivig-text-editor.git
 * - git@github.com:xivig/xivig-text-editor.git
 */
export function parseRemoteUrl(url: string): GitHubRepoInfo | null {
  if (!url || typeof url !== 'string') return null;

  const clean = url.trim().replace(/\.git$/, '');

  // SSH style: git@github.com:owner/repo
  const sshMatch = /git@([a-zA-Z0-9.\-]+):([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)/.exec(clean);
  if (sshMatch) {
    const host = sshMatch[1].toLowerCase();
    return {
      provider: host.includes('github') ? 'github' : host.includes('gitlab') ? 'gitlab' : 'custom',
      owner: sshMatch[2],
      repo: sshMatch[3],
    };
  }

  // HTTPS style: https://github.com/owner/repo
  const httpsMatch = /https?:\/\/([a-zA-Z0-9.\-]+)\/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)/.exec(clean);
  if (httpsMatch) {
    const host = httpsMatch[1].toLowerCase();
    return {
      provider: host.includes('github') ? 'github' : host.includes('gitlab') ? 'gitlab' : 'custom',
      owner: httpsMatch[2],
      repo: httpsMatch[3],
    };
  }

  return null;
}

export function buildGitHubWebUrl(info: GitHubRepoInfo, itemType: 'pr' | 'issue' | 'commit', id: string | number): string {
  const base = `https://${info.provider === 'github' ? 'github.com' : info.provider}/${info.owner}/${info.repo}`;
  if (itemType === 'pr') return `${base}/pull/${id}`;
  if (itemType === 'issue') return `${base}/issues/${id}`;
  return `${base}/commit/${id}`;
}

export function filterGitHubItems(items: GitHubItem[], filter: 'all' | 'open' | 'closed' | 'prs' | 'issues'): GitHubItem[] {
  return items.filter((item) => {
    if (filter === 'open') return item.state === 'open';
    if (filter === 'closed') return item.state === 'closed' || item.state === 'merged';
    if (filter === 'prs') return item.isPullRequest;
    if (filter === 'issues') return !item.isPullRequest;
    return true;
  });
}
