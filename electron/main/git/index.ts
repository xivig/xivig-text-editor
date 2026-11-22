import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

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
  if (!cwd) {
    return { isRepo: false, branch: '', changes: [] };
  }

  try {
    // Check current branch
    const { stdout: branchOut } = await execAsync('git branch --show-current', { cwd });
    const branch = branchOut.trim() || 'detached';

    // Check porcelain status
    const { stdout: statusOut } = await execAsync('git status --porcelain', { cwd });
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
  } catch (err) {
    return {
      isRepo: false,
      branch: '',
      changes: [],
    };
  }
}

export async function commitChanges(cwd: string, message: string): Promise<{ success: boolean; output?: string; error?: string }> {
  if (!cwd || !message.trim()) {
    return { success: false, error: 'Directory or commit message missing' };
  }

  try {
    const escapedMsg = message.replace(/"/g, '\\"');
    const { stdout } = await execAsync(`git add -A && git commit -m "${escapedMsg}"`, { cwd });
    return { success: true, output: stdout.trim() };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
