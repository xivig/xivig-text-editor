import { GitGraphCommitNode, GitGraphSettings } from './types';

export const DEFAULT_GITGRAPH_SETTINGS: GitGraphSettings = {
  enabled: true,
  maxCommits: 100,
  showRemoteBranches: true,
  laneColors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'],
};

/**
 * Builds an interactive topological commit graph with lane assignment.
 */
export function buildCommitGraph(
  rawCommits: {
    hash: string;
    parents?: string[];
    author: string;
    email?: string;
    date: string;
    message: string;
    refs?: string;
  }[]
): GitGraphCommitNode[] {
  const nodes: GitGraphCommitNode[] = [];
  const activeLanes: (string | null)[] = []; // tracks commit hash in each lane

  for (let i = 0; i < rawCommits.length; i++) {
    const raw = rawCommits[i];
    const parents = raw.parents || [];

    // Find if this commit was expected in an active lane
    let assignedLane = activeLanes.indexOf(raw.hash);
    if (assignedLane === -1) {
      // Find first empty slot or append
      assignedLane = activeLanes.indexOf(null);
      if (assignedLane === -1) {
        assignedLane = activeLanes.length;
        activeLanes.push(raw.hash);
      } else {
        activeLanes[assignedLane] = raw.hash;
      }
    }

    // Replace current commit with its first parent in this lane
    if (parents.length > 0) {
      activeLanes[assignedLane] = parents[0];

      // Any additional parents get new lanes (merges)
      for (let p = 1; p < parents.length; p++) {
        const parentHash = parents[p];
        if (!activeLanes.includes(parentHash)) {
          const emptySlot = activeLanes.indexOf(null);
          if (emptySlot === -1) {
            activeLanes.push(parentHash);
          } else {
            activeLanes[emptySlot] = parentHash;
          }
        }
      }
    } else {
      activeLanes[assignedLane] = null;
    }

    // Parse ref decorations like "HEAD -> master, origin/master, tag: v1.5.0"
    const tags: string[] = [];
    let branchName: string | undefined;
    let isHead = false;

    if (raw.refs) {
      const parts = raw.refs.replace(/[()]/g, '').split(',').map((p) => p.trim());
      for (const part of parts) {
        if (part.startsWith('HEAD ->')) {
          isHead = true;
          branchName = part.replace('HEAD ->', '').trim();
        } else if (part.startsWith('tag:')) {
          tags.push(part.replace('tag:', '').trim());
        } else if (!branchName && !part.startsWith('refs/')) {
          branchName = part;
        }
      }
    }

    nodes.push({
      hash: raw.hash,
      shortHash: raw.hash.slice(0, 7),
      author: raw.author,
      email: raw.email || '',
      date: raw.date,
      message: raw.message,
      parents,
      lane: assignedLane,
      branch: branchName,
      tags: tags.length > 0 ? tags : undefined,
      isHead,
    });
  }

  return nodes;
}

/**
 * Generates an ASCII preview of the git graph for quick terminal or tooltip rendering.
 */
export function renderAsciiGraph(nodes: GitGraphCommitNode[]): string[] {
  return nodes.map((node) => {
    const lanePads = '  '.repeat(node.lane);
    const symbol = node.parents.length > 1 ? '⬡' : '●';
    const tagText = node.tags ? ` [${node.tags.join(', ')}]` : '';
    const branchText = node.branch ? ` (${node.branch})` : '';
    return `${lanePads}${symbol} ${node.shortHash}${branchText}${tagText} - ${node.message} (${node.author})`;
  });
}
