import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { assertPathAuthorized } from '../security';

const execFileAsync = promisify(execFile);

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
  const safeCwd = path.resolve(cwd);
  assertPathAuthorized(winId, safeCwd, 'git:stageFile');

  try {
    await execFileAsync('git', ['add', '--', filePath], { cwd: safeCwd });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function unstageFile(winId: number, cwd: string, filePath: string): Promise<{ success: boolean; error?: string }> {
  const safeCwd = path.resolve(cwd);
  assertPathAuthorized(winId, safeCwd, 'git:unstageFile');

  try {
    await execFileAsync('git', ['restore', '--staged', '--', filePath], { cwd: safeCwd });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function stageAll(winId: number, cwd: string): Promise<{ success: boolean; error?: string }> {
  const safeCwd = path.resolve(cwd);
  assertPathAuthorized(winId, safeCwd, 'git:stageAll');

  try {
    await execFileAsync('git', ['add', '-A'], { cwd: safeCwd });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function unstageAll(winId: number, cwd: string): Promise<{ success: boolean; error?: string }> {
  const safeCwd = path.resolve(cwd);
  assertPathAuthorized(winId, safeCwd, 'git:unstageAll');

  try {
    await execFileAsync('git', ['restore', '--staged', '.'], { cwd: safeCwd });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function discardChanges(winId: number, cwd: string, filePath: string): Promise<{ success: boolean; error?: string }> {
  const safeCwd = path.resolve(cwd);
  assertPathAuthorized(winId, safeCwd, 'git:discardChanges');

  try {
    await execFileAsync('git', ['restore', '--', filePath], { cwd: safeCwd });
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
  const safeCwd = path.resolve(cwd);
  assertPathAuthorized(winId, safeCwd, 'git:diff');

  try {
    const args = ['diff'];
    if (staged) args.push('--cached');
    if (filePath) {
      args.push('--', filePath);
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
  message: string
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
    // Check if there are staged changes; if not, do NOT silently commit everything.
    // git diff --cached --quiet exits with 1 if there are staged changes, 0 if clean.
    let hasStaged = false;
    try {
      await execFileAsync('git', ['diff', '--cached', '--quiet'], { cwd: safeCwd });
      hasStaged = false;
    } catch {
      hasStaged = true;
    }

    if (!hasStaged) {
      return {
        success: false,
        error: 'No changes are staged for commit. Please stage your files first before committing.',
      };
    }

    // Commit already staged files with message passed directly as an argument array item (no shell interpolation)
    const { stdout } = await execFileAsync('git', ['commit', '-m', message.trim()], { cwd: safeCwd });
    return { success: true, output: stdout.trim() };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
