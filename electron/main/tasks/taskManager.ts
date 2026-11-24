import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { BrowserWindow } from 'electron';
import { assertPathAuthorized } from '../security';

export interface TaskDefinition {
  label: string;
  type?: 'shell' | 'process';
  command: string;
  args?: string[];
  cwd?: string;
  isBackground?: boolean;
  problemMatcher?: string | string[];
  dependsOn?: string[];
  group?: { kind: string; isDefault?: boolean };
}

export interface TaskFile {
  version: string;
  tasks: TaskDefinition[];
}

export interface TaskProblem {
  file: string;
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  source?: string;
}

export class TaskManager {
  private runningTasks = new Map<string, ChildProcess>();

  public loadWorkspaceTasks(workspaceRoot: string): TaskDefinition[] {
    if (!workspaceRoot || !fs.existsSync(workspaceRoot)) return [];

    const candidates = [
      path.join(workspaceRoot, '.xivig', 'tasks.json'),
      path.join(workspaceRoot, '.vscode', 'tasks.json'),
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        try {
          const raw = fs.readFileSync(cand, 'utf8');
          const parsed: TaskFile = JSON.parse(raw);
          if (Array.isArray(parsed.tasks)) {
            return parsed.tasks;
          }
        } catch {
          // ignore malformed
        }
      }
    }

    return [];
  }

  public runTask(
    win: BrowserWindow,
    workspaceRoot: string,
    task: TaskDefinition
  ): { success: boolean; taskId: string; error?: string } {
    try {
      assertPathAuthorized(win.id, path.resolve(workspaceRoot), 'task:run');
    } catch (err: any) {
      return { success: false, taskId: '', error: err.message };
    }

    const taskId = `${task.label}-${Date.now()}`;
    const taskCwd = task.cwd ? path.resolve(workspaceRoot, task.cwd) : workspaceRoot;

    try {
      const proc = spawn(task.command, task.args || [], {
        cwd: taskCwd,
        shell: true,
        env: { ...process.env },
      });

      this.runningTasks.set(taskId, proc);

      proc.stdout?.on('data', (chunk) => {
        const text = chunk.toString('utf8');
        if (!win.isDestroyed()) {
          win.webContents.send('task:output', { taskId, label: task.label, output: text, stream: 'stdout' });
          this.parseProblems(text, task.problemMatcher, (problem) => {
            win.webContents.send('task:problem', { taskId, problem });
          });
        }
      });

      proc.stderr?.on('data', (chunk) => {
        const text = chunk.toString('utf8');
        if (!win.isDestroyed()) {
          win.webContents.send('task:output', { taskId, label: task.label, output: text, stream: 'stderr' });
          this.parseProblems(text, task.problemMatcher, (problem) => {
            win.webContents.send('task:problem', { taskId, problem });
          });
        }
      });

      proc.on('close', (code) => {
        this.runningTasks.delete(taskId);
        if (!win.isDestroyed()) {
          win.webContents.send('task:completed', { taskId, label: task.label, code: code ?? 0 });
        }
      });

      return { success: true, taskId };
    } catch (err: any) {
      return { success: false, taskId: '', error: err.message };
    }
  }

  public stopTask(taskId: string): boolean {
    const proc = this.runningTasks.get(taskId);
    if (proc) {
      try {
        proc.kill();
      } catch {
        // ignore
      }
      this.runningTasks.delete(taskId);
      return true;
    }
    return false;
  }

  private parseProblems(text: string, matcher: string | string[] | undefined, onProblem: (p: TaskProblem) => void) {
    if (!matcher) return;
    const lines = text.split('\n');

    for (const line of lines) {
      // TypeScript matcher: file.ts(12,5): error TS2322: Type 'string' is not assignable to type 'number'.
      const tsMatch = line.match(/^([^(]+)\((\d+),(\d+)\):\s*(error|warning)\s*TS\d+:\s*(.*)$/);
      if (tsMatch) {
        onProblem({
          file: tsMatch[1].trim(),
          line: parseInt(tsMatch[2], 10),
          column: parseInt(tsMatch[3], 10),
          severity: tsMatch[4] === 'error' ? 'error' : 'warning',
          message: tsMatch[5].trim(),
          source: 'tsc',
        });
        continue;
      }

      // GCC/Clang/Rust matcher: file.c:12:5: error: expected ';'
      const gccMatch = line.match(/^([^:]+):(\d+):(\d+):\s*(error|warning):\s*(.*)$/);
      if (gccMatch) {
        onProblem({
          file: gccMatch[1].trim(),
          line: parseInt(gccMatch[2], 10),
          column: parseInt(gccMatch[3], 10),
          severity: gccMatch[4] === 'error' ? 'error' : 'warning',
          message: gccMatch[5].trim(),
          source: 'compiler',
        });
      }
    }
  }
}

export const taskManager = new TaskManager();
