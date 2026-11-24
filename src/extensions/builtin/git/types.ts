export interface GitLensSettings {
  enabled: boolean;
  currentLineBlame: boolean;
  blameDateFormat: 'relative' | 'absolute';
  showAuthorAvatar: boolean;
  showCommitMessage: boolean;
  annotationPrefix: string;
}

export interface GitGraphCommitNode {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  parents: string[];
  lane: number;
  branch?: string;
  tags?: string[];
  isHead?: boolean;
}

export interface GitGraphSettings {
  enabled: boolean;
  maxCommits: number;
  showRemoteBranches: boolean;
  laneColors: string[];
}

export interface GitHistoryEntry {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
  diff?: string;
  filesChanged?: number;
}

export interface GitHistorySettings {
  enabled: boolean;
  followRenames: boolean;
  pageSize: number;
}

export interface GitHubItem {
  id: number | string;
  number: number;
  title: string;
  author: string;
  state: 'open' | 'closed' | 'merged';
  createdAt: string;
  labels: { name: string; color: string }[];
  isPullRequest: boolean;
  branch?: string;
  url: string;
}

export interface GitHubSettings {
  enabled: boolean;
  remoteName: string;
  pollIntervalMs: number;
  autoDetectRemote: boolean;
}

export interface CopilotCompletion {
  id: string;
  text: string;
  range?: { from: number; to: number };
}

export interface CopilotSettings {
  enabled: boolean;
  autoTrigger: boolean;
  triggerDelayMs: number;
  model: 'gpt-4o' | 'claude-3.5-sonnet' | 'codellama' | 'deepseek-coder';
  temperature: number;
  ghostTextColor: string;
}
