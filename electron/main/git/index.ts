import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { assertPathAuthorized } from '../security';

const execFileAsync = promisify(execFile);

/**
 * Validates that a git target file path resolves strictly within the repository boundary.
 * Rejects path traversal attempts (e.g. '../secret', null bytes, absolute paths outside repo).
 * Returns the normalized POSIX repository-relative path.
 */
export function validateRepoRelativePath(repoRoot: string, filePath: string): string {
  if (!filePath || typeof filePath !== 'string' || !filePath.trim()) {
    throw new Error('Invalid git target path: must be a non-empty string');
  }
  if (filePath.includes('\0')) {
    throw new Error('Invalid git target path: null byte detected');
  }

  const safeRoot = path.resolve(repoRoot);
  const resolved = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(safeRoot, filePath);

  const rel = path.relative(safeRoot, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Git target path '${filePath}' escapes repository root '${safeRoot}'`);
  }

  return rel.replace(/\\/g, '/');
}

export interface GitFileChange {
  path: string;
  status: 'M' | 'A' | 'D' | 'U' | '?';
  staged: boolean;
}

export interface GitStatusResult {
  isRepo: boolean;
  branch: string;
  changes: GitFileChange[];
}

export async function getGitStatus(winId: number, cwd: string): Promise<GitStatusResult> {
  if (!cwd || typeof cwd !== 'string' || !fs.existsSync(cwd)) {
    return { isRepo: false, branch: '', changes: [] };
  }

  const safeCwd = path.resolve(cwd);
  try {
    assertPathAuthorized(winId, safeCwd, 'git:status');
  } catch {
    return { isRepo: false, branch: '', changes: [] };
  }

  try {
    // Check current branch
    const { stdout: branchOut } = await execFileAsync('git', ['branch', '--show-current'], { cwd: safeCwd });
    const branch = branchOut.trim() || 'detached';

    // Check porcelain status
    const { stdout: statusOut } = await execFileAsync('git', ['status', '--porcelain'], { cwd: safeCwd });
    const lines = statusOut.split('\n').filter(Boolean);

    const changes: GitFileChange[] = lines.map((line) => {
      const indexStatus = line[0];
      const workTreeStatus = line[1];
      const filePath = line.slice(3).trim();

      let status: 'M' | 'A' | 'D' | 'U' | '?' = 'M';
      let staged = false;

      if (indexStatus !== ' ' && indexStatus !== '?') {
        staged = true;
        status = (indexStatus as any) || 'M';
      } else if (workTreeStatus === '?') {
        status = '?';
      } else {
        status = (workTreeStatus as any) || 'M';
      }

      return {
        path: filePath,
        status,
        staged,
      };
    });

    return {
      isRepo: true,
      branch,
      changes,
    };
  } catch {
    return {
      isRepo: false,
      branch: '',
      changes: [],
    };
  }
}

export async function stageFile(winId: number, cwd: string, filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    const safeRel = validateRepoRelativePath(safeCwd, filePath);
    assertPathAuthorized(winId, safeCwd, 'git:stageFile');
    assertPathAuthorized(winId, path.resolve(safeCwd, safeRel), 'git:stageFile');

    await execFileAsync('git', ['add', '--', safeRel], { cwd: safeCwd });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function unstageFile(winId: number, cwd: string, filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    const safeRel = validateRepoRelativePath(safeCwd, filePath);
    assertPathAuthorized(winId, safeCwd, 'git:unstageFile');
    assertPathAuthorized(winId, path.resolve(safeCwd, safeRel), 'git:unstageFile');

    await execFileAsync('git', ['restore', '--staged', '--', safeRel], { cwd: safeCwd });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function stageAll(winId: number, cwd: string): Promise<{ success: boolean; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    assertPathAuthorized(winId, safeCwd, 'git:stageAll');

    await execFileAsync('git', ['add', '-A'], { cwd: safeCwd });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function unstageAll(winId: number, cwd: string): Promise<{ success: boolean; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    assertPathAuthorized(winId, safeCwd, 'git:unstageAll');

    await execFileAsync('git', ['restore', '--staged', '.'], { cwd: safeCwd });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function discardChanges(winId: number, cwd: string, filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    const safeRel = validateRepoRelativePath(safeCwd, filePath);
    assertPathAuthorized(winId, safeCwd, 'git:discardChanges');
    assertPathAuthorized(winId, path.resolve(safeCwd, safeRel), 'git:discardChanges');

    await execFileAsync('git', ['restore', '--', safeRel], { cwd: safeCwd });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getGitDiff(
  winId: number,
  cwd: string,
  filePath?: string,
  staged = false
): Promise<{ success: boolean; diff?: string; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    assertPathAuthorized(winId, safeCwd, 'git:diff');

    const args = ['diff'];
    if (staged) args.push('--cached');
    if (filePath) {
      const safeRel = validateRepoRelativePath(safeCwd, filePath);
      assertPathAuthorized(winId, path.resolve(safeCwd, safeRel), 'git:diff');
      args.push('--', safeRel);
    }
    const { stdout } = await execFileAsync('git', args, { cwd: safeCwd });
    return { success: true, diff: stdout };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function commitChanges(
  winId: number,
  cwd: string,
  message: string,
  amend = false
): Promise<{ success: boolean; output?: string; error?: string }> {
  if (!cwd || typeof cwd !== 'string' || !fs.existsSync(cwd)) {
    return { success: false, error: 'Valid working directory is required' };
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return { success: false, error: 'Commit message is required' };
  }

  const safeCwd = path.resolve(cwd);
  assertPathAuthorized(winId, safeCwd, 'git:commit');

  try {
    let hasStaged = false;
    try {
      await execFileAsync('git', ['diff', '--cached', '--quiet'], { cwd: safeCwd });
      hasStaged = false;
    } catch {
      hasStaged = true;
    }

    if (!hasStaged && !amend) {
      return {
        success: false,
        error: 'No changes are staged for commit. Please stage your files first before committing.',
      };
    }

    const args = ['commit'];
    if (amend) args.push('--amend');
    args.push('-m', message.trim());

    const { stdout } = await execFileAsync('git', args, { cwd: safeCwd });
    return { success: true, output: stdout.trim() };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface GitBranchInfo {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
}

export async function getGitBranches(
  winId: number,
  cwd: string
): Promise<{ success: boolean; branches: GitBranchInfo[]; currentBranch: string; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    assertPathAuthorized(winId, safeCwd, 'git:branches');

    const { stdout } = await execFileAsync('git', ['branch', '-a', '--no-color'], { cwd: safeCwd });
    const lines = stdout.split('\n').filter(Boolean);
    const branches: GitBranchInfo[] = [];
    let currentBranch = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      const isCurrent = rawLine.startsWith('*');
      const name = line.replace(/^\*\s*/, '').trim();
      if (!name || name.includes('->')) continue; // Skip symref like HEAD -> origin/master

      const isRemote = name.startsWith('remotes/');
      const cleanName = isRemote ? name.replace(/^remotes\//, '') : name;

      if (isCurrent) currentBranch = cleanName;

      branches.push({
        name: cleanName,
        isCurrent,
        isRemote,
      });
    }

    return { success: true, branches, currentBranch };
  } catch (err: any) {
    return { success: false, branches: [], currentBranch: '', error: err.message };
  }
}

export async function createBranch(
  winId: number,
  cwd: string,
  branchName: string,
  checkout = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    assertPathAuthorized(winId, safeCwd, 'git:createBranch');

    const clean = branchName.trim();
    if (!clean) return { success: false, error: 'Branch name is required' };

    const args = checkout ? ['checkout', '-b', clean] : ['branch', clean];
    await execFileAsync('git', args, { cwd: safeCwd });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteBranch(
  winId: number,
  cwd: string,
  branchName: string,
  force = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    assertPathAuthorized(winId, safeCwd, 'git:deleteBranch');

    const args = ['branch', force ? '-D' : '-d', branchName.trim()];
    await execFileAsync('git', args, { cwd: safeCwd });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function switchBranch(
  winId: number,
  cwd: string,
  branchName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    assertPathAuthorized(winId, safeCwd, 'git:switchBranch');

    await execFileAsync('git', ['checkout', branchName.trim()], { cwd: safeCwd });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function mergeBranch(
  winId: number,
  cwd: string,
  branchName: string
): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    assertPathAuthorized(winId, safeCwd, 'git:mergeBranch');

    const { stdout } = await execFileAsync('git', ['merge', branchName.trim()], { cwd: safeCwd });
    return { success: true, output: stdout.trim() };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function rebaseBranch(
  winId: number,
  cwd: string,
  branchName: string
): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    assertPathAuthorized(winId, safeCwd, 'git:rebaseBranch');

    const { stdout } = await execFileAsync('git', ['rebase', branchName.trim()], { cwd: safeCwd });
    return { success: true, output: stdout.trim() };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface GitStashItem {
  id: string;
  name: string;
  message: string;
}

export async function gitStash(
  winId: number,
  cwd: string,
  action: 'save' | 'pop' | 'list',
  message?: string
): Promise<{ success: boolean; stashes?: GitStashItem[]; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    assertPathAuthorized(winId, safeCwd, 'git:stash');

    if (action === 'save') {
      const args = ['stash', 'push'];
      if (message && message.trim()) args.push('-m', message.trim());
      await execFileAsync('git', args, { cwd: safeCwd });
      return { success: true };
    } else if (action === 'pop') {
      await execFileAsync('git', ['stash', 'pop'], { cwd: safeCwd });
      return { success: true };
    } else {
      const { stdout } = await execFileAsync('git', ['stash', 'list'], { cwd: safeCwd });
      const lines = stdout.split('\n').filter(Boolean);
      const stashes: GitStashItem[] = lines.map((l, idx) => {
        const parts = l.split(':');
        return {
          id: `stash@{${idx}}`,
          name: parts[0]?.trim() || `stash@{${idx}}`,
          message: parts.slice(1).join(':').trim(),
        };
      });
      return { success: true, stashes };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface GitCommitLogItem {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
}

export async function getGitLog(
  winId: number,
  cwd: string,
  maxCount = 50,
  filePath?: string
): Promise<{ success: boolean; commits: GitCommitLogItem[]; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    assertPathAuthorized(winId, safeCwd, 'git:log');

    const format = '%H|%h|%an|%ae|%ad|%s';
    const args = ['log', `--max-count=${maxCount}`, `--pretty=format:${format}`, '--date=relative'];
    if (filePath) {
      const safeRel = validateRepoRelativePath(safeCwd, filePath);
      args.push('--', safeRel);
    }

    const { stdout } = await execFileAsync('git', args, { cwd: safeCwd });
    const lines = stdout.split('\n').filter(Boolean);
    const commits: GitCommitLogItem[] = lines.map((line) => {
      const [hash, shortHash, author, email, date, ...rest] = line.split('|');
      return {
        hash: hash || '',
        shortHash: shortHash || '',
        author: author || '',
        email: email || '',
        date: date || '',
        message: rest.join('|') || '',
      };
    });

    return { success: true, commits };
  } catch (err: any) {
    return { success: false, commits: [], error: err.message };
  }
}

export interface GitBlameLine {
  line: number;
  commit: string;
  author: string;
  date: string;
  content: string;
}

export async function getGitBlame(
  winId: number,
  cwd: string,
  filePath: string
): Promise<{ success: boolean; lines: GitBlameLine[]; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    const safeRel = validateRepoRelativePath(safeCwd, filePath);
    assertPathAuthorized(winId, safeCwd, 'git:blame');
    assertPathAuthorized(winId, path.resolve(safeCwd, safeRel), 'git:blame');

    const { stdout } = await execFileAsync('git', ['blame', '--line-porcelain', '--', safeRel], { cwd: safeCwd });
    const lines = stdout.split('\n');
    const result: GitBlameLine[] = [];

    let currentCommit = '';
    let currentAuthor = '';
    let currentDate = '';
    let currentLineNo = 1;

    for (const rawLine of lines) {
      if (/^[0-9a-f]{40}/.test(rawLine)) {
        const parts = rawLine.split(' ');
        currentCommit = parts[0].slice(0, 8);
        currentLineNo = parseInt(parts[2], 10) || currentLineNo;
      } else if (rawLine.startsWith('author ')) {
        currentAuthor = rawLine.replace('author ', '').trim();
      } else if (rawLine.startsWith('author-time ')) {
        const timestamp = parseInt(rawLine.replace('author-time ', '').trim(), 10);
        currentDate = !isNaN(timestamp) ? new Date(timestamp * 1000).toLocaleDateString() : '';
      } else if (rawLine.startsWith('\t')) {
        result.push({
          line: currentLineNo,
          commit: currentCommit,
          author: currentAuthor,
          date: currentDate,
          content: rawLine.slice(1),
        });
      }
    }

    return { success: true, lines: result };
  } catch (err: any) {
    return { success: false, lines: [], error: err.message };
  }
}

export async function gitRemoteOperation(
  winId: number,
  cwd: string,
  operation: 'fetch' | 'pull' | 'push',
  remote = 'origin',
  branch?: string
): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    const safeCwd = path.resolve(cwd);
    assertPathAuthorized(winId, safeCwd, `git:${operation}`);

    const args: string[] = [operation];
    if (operation === 'push' || operation === 'pull') {
      args.push(remote);
      if (branch) args.push(branch);
    }

    const { stdout, stderr } = await execFileAsync('git', args, { cwd: safeCwd });
    return { success: true, output: (stdout || stderr).trim() };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

