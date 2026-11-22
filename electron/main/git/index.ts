import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';

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

export async function getGitStatus(cwd: string): Promise<GitStatusResult> {
  if (!cwd || typeof cwd !== 'string' || !fs.existsSync(cwd)) {
    return { isRepo: false, branch: '', changes: [] };
  }

  const safeCwd = path.resolve(cwd);

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

export async function commitChanges(
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

  try {
    // Stage all changes safely without constructing shell strings
    await execFileAsync('git', ['add', '-A'], { cwd: safeCwd });

    // Commit changes with message passed directly as an argument array item (no shell interpolation)
    const { stdout } = await execFileAsync('git', ['commit', '-m', message], { cwd: safeCwd });
    return { success: true, output: stdout.trim() };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
