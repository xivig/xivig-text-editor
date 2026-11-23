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
