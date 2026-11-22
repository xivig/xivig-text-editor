import { create } from 'zustand';
import { useUIStore } from './uiStore';
import { useEditorStore } from './editorStore';
import { useFileStore } from './fileStore';

export interface BuildTarget {
  id: string;
  name: string;
  command: string;
  args: string[];
  description: string;
  icon?: string;
}

export interface OutputLine {
  id: string;
  type: 'stdout' | 'stderr' | 'system' | 'success' | 'error';
  text: string;
  timestamp: string;
}

interface BuildState {
  isRunning: boolean;
  activeTarget: BuildTarget | null;
  outputLines: OutputLine[];
  exitCode: number | null;
  durationMs: number | null;
  lastCommand: string;

  executeBuild: (target?: BuildTarget) => Promise<void>;
  stopBuild: () => Promise<void>;
  clearOutput: () => void;
  getAvailableTargets: () => BuildTarget[];
  detectDefaultTarget: () => BuildTarget;
}

export const useBuildStore = create<BuildState>((set, get) => {
  // Listen to IPC build data and status events if window.xivig is available
  if (typeof window !== 'undefined' && window.xivig) {
    window.xivig.onBuildStart?.((data) => {
      set({
        isRunning: true,
        exitCode: null,
        durationMs: null,
        lastCommand: `${data.command} ${data.args.join(' ')}`.trim(),
        outputLines: [
          ...get().outputLines,
          {
            id: `sys-${Date.now()}`,
            type: 'system',
            text: `[Running] ${data.command} ${data.args.join(' ')}`.trim(),
            timestamp: data.timestamp,
          },
          {
            id: `cwd-${Date.now()}`,
            type: 'system',
            text: `[Working Directory] ${data.cwd}`,
            timestamp: data.timestamp,
          },
        ],
      });
    });

    window.xivig.onBuildData?.((data) => {
      set((state) => ({
        outputLines: [
          ...state.outputLines,
          {
            id: `data-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: data.type === 'stderr' ? 'stderr' : 'stdout',
            text: data.text,
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
      }));
    });

    window.xivig.onBuildDone?.((data) => {
      const durSec = (data.durationMs / 1000).toFixed(2);
      const isSuccess = data.exitCode === 0;

      set((state) => ({
        isRunning: false,
        exitCode: data.exitCode,
        durationMs: data.durationMs,
        outputLines: [
          ...state.outputLines,
          {
            id: `done-${Date.now()}`,
            type: isSuccess ? 'success' : 'error',
            text: `[Finished in ${durSec}s with exit code ${data.exitCode}]`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
      }));
    });
  }

  return {
    isRunning: false,
    activeTarget: null,
    outputLines: [
      {
        id: 'init-1',
        type: 'system',
        text: 'Xivig Build System & Task Runner Initialized.\r\nPress Ctrl+B to run build, Ctrl+Shift+B to select build target.',
        timestamp: new Date().toLocaleTimeString(),
      },
    ],
    exitCode: null,
    durationMs: null,
    lastCommand: '',

    detectDefaultTarget: () => {
      const targets = get().getAvailableTargets();
      return targets[0] || {
        id: 'default',
        name: 'Default Node.js Runner',
        command: 'node',
        args: [],
        description: 'Execute with Node.js',
      };
    },

    getAvailableTargets: () => {
      const activeDoc = useEditorStore.getState().getActiveDocument();
      const workspacePath = useFileStore.getState().currentFolderPath;
      const targets: BuildTarget[] = [];

      const docPath = activeDoc?.path;
      const docName = activeDoc?.name || '';
      const ext = docName.split('.').pop()?.toLowerCase();

      // 1. Current File execution targets
      if (docPath) {
        if (ext === 'js' || ext === 'mjs' || ext === 'cjs') {
          targets.push({
            id: 'node-file',
            name: `Node.js: Run ${docName}`,
            command: 'node',
            args: [`"${docPath}"`],
            description: `Execute current file (${docName}) with Node.js runtime`,
          });
        } else if (ext === 'ts') {
          targets.push({
            id: 'tsx-file',
            name: `TypeScript: Run ${docName}`,
            command: 'npx',
            args: ['--yes', 'tsx', `"${docPath}"`],
            description: `Execute TypeScript file (${docName}) directly with tsx`,
          });
        } else if (ext === 'py') {
          targets.push({
            id: 'python-file',
            name: `Python: Run ${docName}`,
            command: 'python',
            args: [`"${docPath}"`],
            description: `Execute current script (${docName}) with Python interpreter`,
          });
        } else if (ext === 'rs') {
          targets.push({
            id: 'rust-cargo-run',
            name: 'Cargo: Run Project',
            command: 'cargo',
            args: ['run'],
            description: 'Build and run Rust application with cargo',
          });
          targets.push({
            id: 'rust-cargo-check',
            name: 'Cargo: Check',
            command: 'cargo',
            args: ['check'],
            description: 'Fast compile-check Rust package without producing binaries',
          });
        } else if (ext === 'cpp' || ext === 'cxx' || ext === 'cc') {
          const outName = docName.replace(/\.[^.]+$/, '');
          targets.push({
            id: 'cpp-build-run',
            name: `C++: Compile & Run ${docName}`,
            command: 'g++',
            args: [`"${docPath}"`, '-o', `"${outName}.exe"`, '&&', `".\\${outName}.exe"`],
            description: `Compile with g++ and immediately run`,
          });
        } else if (ext === 'c') {
          const outName = docName.replace(/\.[^.]+$/, '');
          targets.push({
            id: 'c-build-run',
            name: `C: Compile & Run ${docName}`,
            command: 'gcc',
            args: [`"${docPath}"`, '-o', `"${outName}.exe"`, '&&', `".\\${outName}.exe"`],
            description: `Compile with gcc and immediately run`,
          });
        } else if (ext === 'html') {
          targets.push({
            id: 'open-html',
            name: `Browser: Preview ${docName}`,
            command: 'start',
            args: [`"${docPath}"`],
            description: `Open HTML document in default browser`,
          });
        }
      }

      // 2. Workspace npm targets if in a project
      if (workspacePath) {
        targets.push({
          id: 'npm-build',
          name: 'npm: run build',
          command: 'npm',
          args: ['run', 'build'],
          description: 'Execute build script in package.json',
        });
        targets.push({
          id: 'npm-test',
          name: 'npm: test',
          command: 'npm',
          args: ['test'],
          description: 'Run project test suite via npm',
        });
        targets.push({
          id: 'npm-start',
          name: 'npm: start',
          command: 'npm',
          args: ['start'],
          description: 'Start application via npm start',
        });
      }

      // Fallback if no specific target detected
      if (targets.length === 0) {
        targets.push({
          id: 'system-echo',
          name: 'Xivig Shell Task',
          command: 'echo',
          args: ['Ready to execute build command.'],
          description: 'Echo test task',
        });
      }

      return targets;
    },

    executeBuild: async (chosenTarget) => {
      const target = chosenTarget || get().activeTarget || get().detectDefaultTarget();
      set({ activeTarget: target });

      // Automatically open the Bottom Panel and activate the Output tab
      const uiStore = useUIStore.getState();
      if (!uiStore.isBottomPanelOpen) {
        uiStore.toggleBottomPanel('output');
      } else if (uiStore.activeBottomTab !== 'output') {
        uiStore.setBottomTab('output');
      }

      const activeDoc = useEditorStore.getState().getActiveDocument();
      const workspacePath = useFileStore.getState().currentFolderPath;
      const cwd = workspacePath || (activeDoc?.path ? activeDoc.path.replace(/[/\\][^/\\]+$/, '') : undefined);

      if (window.xivig?.buildRun) {
        await window.xivig.buildRun({
          command: target.command,
          args: target.args,
          cwd,
        });
      } else {
        console.warn('[BuildStore] window.xivig.buildRun not available');
      }
    },

    stopBuild: async () => {
      if (window.xivig?.buildStop) {
        await window.xivig.buildStop();
      }
      set({ isRunning: false });
    },

    clearOutput: () => {
      set({ outputLines: [] });
    },
  };
});
