import { create } from 'zustand';
import { useFileStore } from './fileStore';

export interface GitBranchItem {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
}

export interface GitCommitItem {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
}

export interface GitStashItem {
  id: string;
  name: string;
  message: string;
}

export interface GitBlameLine {
  line: number;
  commit: string;
  author: string;
  date: string;
  content: string;
}

interface GitState {
  branches: GitBranchItem[];
  currentBranch: string;
  commits: GitCommitItem[];
  stashes: GitStashItem[];
  blameLines: GitBlameLine[];
  activeFileDiff: string | null;
  commitMessage: string;
  isAmending: boolean;
  commitHistory: string[];
  historyIndex: number;
  isLoading: boolean;
  statusMessage: string | null;

  // Actions
  setCommitMessage: (msg: string) => void;
  setIsAmending: (amending: boolean) => void;
  cycleCommitHistory: (direction: 'up' | 'down') => void;
  loadBranches: () => Promise<void>;
  createBranch: (name: string, checkout?: boolean) => Promise<boolean>;
  deleteBranch: (name: string, force?: boolean) => Promise<boolean>;
  switchBranch: (name: string) => Promise<boolean>;
  mergeBranch: (name: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  rebaseBranch: (name: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  loadStashes: () => Promise<void>;
  saveStash: (msg?: string) => Promise<boolean>;
  popStash: () => Promise<boolean>;
  loadCommits: (maxCount?: number, filePath?: string) => Promise<void>;
  loadBlame: (filePath: string) => Promise<void>;
  loadFileDiff: (filePath: string, staged?: boolean) => Promise<string | null>;
  remoteFetch: (remote?: string) => Promise<boolean>;
  remotePull: (remote?: string, branch?: string) => Promise<boolean>;
  remotePush: (remote?: string, branch?: string) => Promise<boolean>;
  commitWithHistory: (message: string, amend?: boolean) => Promise<{ success: boolean; error?: string }>;
}

export const useGitStore = create<GitState>((set, get) => ({
  branches: [],
  currentBranch: 'main',
  commits: [],
  stashes: [],
  blameLines: [],
  activeFileDiff: null,
  commitMessage: '',
  isAmending: false,
  commitHistory: [],
  historyIndex: -1,
  isLoading: false,
  statusMessage: null,

  setCommitMessage: (msg: string) => set({ commitMessage: msg }),
  setIsAmending: (amending: boolean) => set({ isAmending: amending }),

  cycleCommitHistory: (direction: 'up' | 'down') => {
    const { commitHistory, historyIndex } = get();
    if (commitHistory.length === 0) return;

    let nextIdx = historyIndex;
    if (direction === 'up') {
      nextIdx = historyIndex + 1 < commitHistory.length ? historyIndex + 1 : historyIndex;
    } else {
      nextIdx = historyIndex > 0 ? historyIndex - 1 : -1;
    }

    set({
      historyIndex: nextIdx,
      commitMessage: nextIdx >= 0 ? commitHistory[nextIdx] : '',
    });
  },

  loadBranches: async () => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.gitBranches) return;

    set({ isLoading: true });
    try {
      const res = await window.xivig.gitBranches(cwd);
      if (res.success) {
        set({
          branches: res.branches || [],
          currentBranch: res.currentBranch || 'main',
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  createBranch: async (name: string, checkout = true) => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.gitCreateBranch) return false;

    const res = await window.xivig.gitCreateBranch(cwd, name, checkout);
    if (res.success) {
      await get().loadBranches();
      await useFileStore.getState().loadGitStatus();
      return true;
    }
    return false;
  },

  deleteBranch: async (name: string, force = false) => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.gitDeleteBranch) return false;

    const res = await window.xivig.gitDeleteBranch(cwd, name, force);
    if (res.success) {
      await get().loadBranches();
      return true;
    }
    return false;
  },

  switchBranch: async (name: string) => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.gitSwitchBranch) return false;

    const res = await window.xivig.gitSwitchBranch(cwd, name);
    if (res.success) {
      await get().loadBranches();
      await useFileStore.getState().loadGitStatus();
      await useFileStore.getState().refreshCurrentFolder();
      return true;
    }
    return false;
  },

  mergeBranch: async (name: string) => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.gitMergeBranch) {
      return { success: false, error: 'Git not available' };
    }
    const res = await window.xivig.gitMergeBranch(cwd, name);
    await useFileStore.getState().loadGitStatus();
    await useFileStore.getState().refreshCurrentFolder();
    return res;
  },

  rebaseBranch: async (name: string) => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.gitRebaseBranch) {
      return { success: false, error: 'Git not available' };
    }
    const res = await window.xivig.gitRebaseBranch(cwd, name);
    await useFileStore.getState().loadGitStatus();
    await useFileStore.getState().refreshCurrentFolder();
    return res;
  },

  loadStashes: async () => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.gitStash) return;

    try {
      const res = await window.xivig.gitStash(cwd, 'list');
      if (res.success) {
        set({ stashes: res.stashes || [] });
      }
    } catch {
      // ignore
    }
  },

  saveStash: async (msg?: string) => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.gitStash) return false;

    const res = await window.xivig.gitStash(cwd, 'save', msg);
    if (res.success) {
      await get().loadStashes();
      await useFileStore.getState().loadGitStatus();
      await useFileStore.getState().refreshCurrentFolder();
      return true;
    }
    return false;
  },

  popStash: async () => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.gitStash) return false;

    const res = await window.xivig.gitStash(cwd, 'pop');
    if (res.success) {
      await get().loadStashes();
      await useFileStore.getState().loadGitStatus();
      await useFileStore.getState().refreshCurrentFolder();
      return true;
    }
    return false;
  },

  loadCommits: async (maxCount = 50, filePath?: string) => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.gitLog) return;

    try {
      const res = await window.xivig.gitLog(cwd, maxCount, filePath);
      if (res.success) {
        set({ commits: res.commits || [] });
      }
    } catch {
      // ignore
    }
  },

  loadBlame: async (filePath: string) => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.gitBlame) return;

    try {
      const res = await window.xivig.gitBlame(cwd, filePath);
      if (res.success) {
        set({ blameLines: res.lines || [] });
      }
    } catch {
      // ignore
    }
  },

  loadFileDiff: async (filePath: string, staged = false) => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.getGitDiff) return null;

    try {
      const res = await window.xivig.getGitDiff(cwd, filePath, staged);
      if (res.success) {
        set({ activeFileDiff: res.diff || null });
        return res.diff || null;
      }
    } catch {
      // ignore
    }
    return null;
  },

  remoteFetch: async (remote = 'origin') => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.gitRemoteOperation) return false;
    set({ isLoading: true, statusMessage: 'Fetching remotes...' });

    const res = await window.xivig.gitRemoteOperation(cwd, 'fetch', remote);
    set({ isLoading: false, statusMessage: res.success ? 'Fetch complete' : 'Fetch failed' });
    if (res.success) {
      await get().loadBranches();
      await useFileStore.getState().loadGitStatus();
      return true;
    }
    return false;
  },

  remotePull: async (remote = 'origin', branch?: string) => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.gitRemoteOperation) return false;
    set({ isLoading: true, statusMessage: 'Pulling changes...' });

    const res = await window.xivig.gitRemoteOperation(cwd, 'pull', remote, branch);
    set({ isLoading: false, statusMessage: res.success ? 'Pull successful' : 'Pull failed' });
    if (res.success) {
      await get().loadBranches();
      await useFileStore.getState().loadGitStatus();
      await useFileStore.getState().refreshCurrentFolder();
      return true;
    }
    return false;
  },

  remotePush: async (remote = 'origin', branch?: string) => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.gitRemoteOperation) return false;
    set({ isLoading: true, statusMessage: 'Pushing changes...' });

    const res = await window.xivig.gitRemoteOperation(cwd, 'push', remote, branch);
    set({ isLoading: false, statusMessage: res.success ? 'Push successful' : 'Push failed' });
    if (res.success) {
      await get().loadBranches();
      await useFileStore.getState().loadGitStatus();
      return true;
    }
    return false;
  },

  commitWithHistory: async (message: string, amend = false) => {
    const trimmed = message.trim();
    if (!trimmed) return { success: false, error: 'Commit message is required' };

    const { commitHistory } = get();
    const res = await useFileStore.getState().commitGitChanges(trimmed);

    if (res.success) {
      set({
        commitMessage: '',
        isAmending: false,
        historyIndex: -1,
        commitHistory: [trimmed, ...commitHistory.filter((m) => m !== trimmed)].slice(0, 50),
      });
      await get().loadBranches();
    }
    return res;
  },
}));
