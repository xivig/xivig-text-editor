import { create } from 'zustand';
import { useUIStore } from './uiStore';
import { useEditorStore } from './editorStore';
import { useFileStore } from './fileStore';

export type RunnerCategory = 'nodejs' | 'python' | 'c' | 'cpp' | 'java' | 'workspace' | 'general';

export interface BuildTarget {
  id: string;
  name: string;
  command: string;
  program?: string;
  args: string[];
  description: string;
  icon?: string;
  category?: RunnerCategory;
  secondaryCommand?: {
    command: string;
    program?: string;
    args?: string[];
    cwd?: string;
  };
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
      const activeDoc = useEditorStore.getState().getActiveDocument();
      const ext = activeDoc?.name?.split('.').pop()?.toLowerCase();
      const targets = get().getAvailableTargets();

      if (ext === 'py' || ext === 'pyw') {
        const py = targets.find((t) => t.category === 'python');
        if (py) return py;
      } else if (ext === 'c') {
        const cTarget = targets.find((t) => t.id === 'c-compile-run');
        if (cTarget) return cTarget;
      } else if (ext === 'cpp' || ext === 'cxx' || ext === 'cc' || ext === 'c++') {
        const cppTarget = targets.find((t) => t.id === 'cpp-compile-run');
        if (cppTarget) return cppTarget;
      } else if (ext === 'java') {
        const javaTarget = targets.find((t) => t.category === 'java');
        if (javaTarget) return javaTarget;
      } else if (ext === 'js' || ext === 'mjs' || ext === 'cjs' || ext === 'ts' || ext === 'mts' || ext === 'cts') {
        const nodeTarget = targets.find((t) => t.category === 'nodejs');
        if (nodeTarget) return nodeTarget;
      }

      return targets[0] || {
        id: 'default-node',
        name: 'Node.js Runner',
        command: 'node',
        args: [],
        description: 'Execute with Node.js runtime',
        category: 'nodejs',
      };
    },

    getAvailableTargets: () => {
      const activeDoc = useEditorStore.getState().getActiveDocument();
      const workspacePath = useFileStore.getState().currentFolderPath;
      const fileTree = useFileStore.getState().fileTree;
      const targets: BuildTarget[] = [];

      const docPath = activeDoc?.path;
      const docName = activeDoc?.name || '';
      const ext = docName.split('.').pop()?.toLowerCase();
      const isWin = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase().includes('windows') : true;
      const exeSuffix = isWin ? '.exe' : '';

      // 1. Current File execution targets
      if (docPath) {
        const fileDir = docPath.replace(/[/\\][^/\\]+$/, '');
        const baseName = docName.replace(/\.[^.]+$/, '');
        const outExe = `${baseName}${exeSuffix}`;

        // --- Python Runner ---
        if (ext === 'py' || ext === 'pyw') {
          targets.push({
            id: 'python-run-file',
            name: `Python: Run ${docName}`,
            command: 'python',
            args: ['-u', docPath],
            description: `Execute current script (${docName}) with Python interpreter`,
            category: 'python',
          });
          targets.push({
            id: 'python-test-file',
            name: `Python: Test ${docName} (unittest)`,
            command: 'python',
            args: ['-u', '-m', 'unittest', docPath],
            description: `Run unit tests in ${docName} with Python unittest module`,
            category: 'python',
          });
        }

        // --- C Runner ---
        else if (ext === 'c') {
          targets.push({
            id: 'c-compile-run',
            name: `C: Compile & Run ${docName}`,
            command: 'gcc',
            args: ['-Wall', docPath, '-o', outExe],
            secondaryCommand: {
              command: outExe,
              args: [],
              cwd: fileDir,
            },
            description: `Compile ${docName} with GCC and immediately execute ${outExe}`,
            category: 'c',
          });
          targets.push({
            id: 'c-compile-only',
            name: `C: Compile ${docName} (GCC)`,
            command: 'gcc',
            args: ['-Wall', '-O2', docPath, '-o', outExe],
            description: `Compile ${docName} with optimization (-O2)`,
            category: 'c',
          });
          targets.push({
            id: 'c-run-binary',
            name: `C: Run ${outExe}`,
            command: outExe,
            args: [],
            description: `Execute compiled binary ${outExe}`,
            category: 'c',
          });
        }

        // --- C++ Runner ---
        else if (ext === 'cpp' || ext === 'cxx' || ext === 'cc' || ext === 'c++') {
          targets.push({
            id: 'cpp-compile-run',
            name: `C++: Compile & Run ${docName}`,
            command: 'g++',
            args: ['-Wall', '-std=c++17', docPath, '-o', outExe],
            secondaryCommand: {
              command: outExe,
              args: [],
              cwd: fileDir,
            },
            description: `Compile ${docName} with G++ (C++17) and immediately execute ${outExe}`,
            category: 'cpp',
          });
          targets.push({
            id: 'cpp-compile-only',
            name: `C++: Compile ${docName} (G++ -std=c++17)`,
            command: 'g++',
            args: ['-Wall', '-std=c++17', '-O2', docPath, '-o', outExe],
            description: `Compile ${docName} with C++17 standards into binary`,
            category: 'cpp',
          });
          targets.push({
            id: 'cpp-run-binary',
            name: `C++: Run ${outExe}`,
            command: outExe,
            args: [],
            description: `Execute compiled binary ${outExe}`,
            category: 'cpp',
          });
        }

        // --- Java Runner ---
        else if (ext === 'java') {
          targets.push({
            id: 'java-run-source',
            name: `Java: Run ${docName} (Source Code)`,
            command: 'java',
            args: [docPath],
            description: `Execute ${docName} directly with Java runtime (Java 11+)`,
            category: 'java',
          });
          targets.push({
            id: 'java-compile-run',
            name: `Java: Compile & Run ${docName}`,
            command: 'javac',
            args: [docPath],
            secondaryCommand: {
              command: 'java',
              args: ['-cp', fileDir, baseName],
              cwd: fileDir,
            },
            description: `Compile with javac and execute ${baseName}.class with java`,
            category: 'java',
          });
          targets.push({
            id: 'java-compile-only',
            name: `Java: Compile ${docName} (javac)`,
            command: 'javac',
            args: [docPath],
            description: `Compile ${docName} into JVM bytecode (.class)`,
            category: 'java',
          });
        }

        // --- Node.js & TypeScript Runner ---
        else if (ext === 'js' || ext === 'mjs' || ext === 'cjs') {
          targets.push({
            id: 'node-run-file',
            name: `Node.js: Run ${docName}`,
            command: 'node',
            args: [docPath],
            description: `Execute current file (${docName}) with Node.js runtime`,
            category: 'nodejs',
          });
          targets.push({
            id: 'node-run-trace',
            name: `Node.js: Run with Warnings (${docName})`,
            command: 'node',
            args: ['--trace-warnings', docPath],
            description: `Execute with detailed stack trace warnings`,
            category: 'nodejs',
          });
        } else if (ext === 'ts' || ext === 'mts' || ext === 'cts') {
          targets.push({
            id: 'tsx-run-file',
            name: `TypeScript: Run ${docName} (tsx)`,
            command: 'npx',
            args: ['--yes', 'tsx', docPath],
            description: `Execute TypeScript file (${docName}) directly with tsx loader`,
            category: 'nodejs',
          });
          targets.push({
            id: 'ts-check-file',
            name: `TypeScript: Typecheck ${docName}`,
            command: 'npx',
            args: ['--yes', 'tsc', '--noEmit', docPath],
            description: `Run TypeScript type-checker in check-only mode`,
            category: 'nodejs',
          });
        } else if (ext === 'rs') {
          targets.push({
            id: 'rust-cargo-run',
            name: 'Cargo: Run Project',
            command: 'cargo',
            args: ['run'],
            description: 'Build and run Rust application with cargo',
            category: 'general',
          });
        } else if (ext === 'html') {
          targets.push({
            id: 'open-html',
            name: `Browser: Preview ${docName}`,
            command: isWin ? 'start' : 'open',
            args: [docPath],
            description: `Open HTML document in default browser`,
            category: 'general',
          });
        }
      }

      // 2. Discover runnable project files in workspace root
      if (fileTree && fileTree.length > 0) {
        const rootFiles = fileTree.filter((f) => !f.isDirectory && f.path !== docPath);

        for (const f of rootFiles) {
          const fExt = f.name.split('.').pop()?.toLowerCase();
          const fBase = f.name.replace(/\.[^.]+$/, '');
          const fDir = f.path.replace(/[/\\][^/\\]+$/, '');
          const fExe = `${fBase}${exeSuffix}`;

          if (fExt === 'py') {
            targets.push({
              id: `ws-py-${f.name}`,
              name: `Python: Run ${f.name}`,
              command: 'python',
              args: ['-u', f.path],
              description: `Execute workspace script ${f.name} with Python`,
              category: 'python',
            });
          } else if (fExt === 'js') {
            targets.push({
              id: `ws-node-${f.name}`,
              name: `Node.js: Run ${f.name}`,
              command: 'node',
              args: [f.path],
              description: `Execute workspace script ${f.name} with Node.js`,
              category: 'nodejs',
            });
          } else if (fExt === 'c') {
            targets.push({
              id: `ws-c-${f.name}`,
              name: `C: Compile & Run ${f.name}`,
              command: 'gcc',
              args: ['-Wall', f.path, '-o', fExe],
              secondaryCommand: { command: fExe, args: [], cwd: fDir },
              description: `Compile and run workspace C program ${f.name}`,
              category: 'c',
            });
          } else if (fExt === 'cpp' || fExt === 'cc' || fExt === 'cxx') {
            targets.push({
              id: `ws-cpp-${f.name}`,
              name: `C++: Compile & Run ${f.name}`,
              command: 'g++',
              args: ['-Wall', '-std=c++17', f.path, '-o', fExe],
              secondaryCommand: { command: fExe, args: [], cwd: fDir },
              description: `Compile and run workspace C++ program ${f.name}`,
              category: 'cpp',
            });
          } else if (fExt === 'java') {
            targets.push({
              id: `ws-java-${f.name}`,
              name: `Java: Run ${f.name}`,
              command: 'java',
              args: [f.path],
              description: `Execute workspace Java source file ${f.name}`,
              category: 'java',
            });
          }
        }
      }

      // 3. Workspace npm targets if in a project
      if (workspacePath) {
        targets.push({
          id: 'npm-start',
          name: 'npm: start',
          command: 'npm',
          args: ['start'],
          description: 'Start application via npm start',
          category: 'workspace',
        });
        targets.push({
          id: 'npm-test',
          name: 'npm: test',
          command: 'npm',
          args: ['test'],
          description: 'Run project test suite via npm',
          category: 'workspace',
        });
        targets.push({
          id: 'npm-build',
          name: 'npm: run build',
          command: 'npm',
          args: ['run', 'build'],
          description: 'Execute build script in package.json',
          category: 'workspace',
        });
      }

      // 4. Always provide standard runner presets so all 4 runners are directly discoverable
      const hasNode = targets.some((t) => t.category === 'nodejs');
      const hasPy = targets.some((t) => t.category === 'python');
      const hasC = targets.some((t) => t.category === 'c' || t.category === 'cpp');
      const hasJava = targets.some((t) => t.category === 'java');

      if (!hasNode) {
        targets.push({
          id: 'generic-node',
          name: 'Node.js Runner',
          command: 'node',
          args: docPath && ext?.match(/^(js|mjs|cjs)$/) ? [docPath] : ['-v'],
          description: 'Execute JavaScript with Node.js',
          category: 'nodejs',
        });
      }

      if (!hasPy) {
        targets.push({
          id: 'generic-python',
          name: 'Python Runner',
          command: 'python',
          args: docPath && ext === 'py' ? ['-u', docPath] : ['--version'],
          description: 'Execute Python scripts with real-time output',
          category: 'python',
        });
      }

      if (!hasC) {
        targets.push({
          id: 'generic-c-cpp',
          name: 'C/C++ Runner (GCC/G++)',
          command: 'gcc',
          args: ['--version'],
          description: 'Compile and run C and C++ source programs',
          category: 'c',
        });
      }

      if (!hasJava) {
        targets.push({
          id: 'generic-java',
          name: 'Java Runner',
          command: 'java',
          args: docPath && ext === 'java' ? [docPath] : ['-version'],
          description: 'Run Java source code directly (Java 11+)',
          category: 'java',
        });
      }

      return targets;
    },

    executeBuild: async (chosenTarget) => {
      const activeDoc = useEditorStore.getState().getActiveDocument();
      let target = chosenTarget;
      if (!target) {
        if (get().activeTarget && activeDoc && get().activeTarget?.name.includes(activeDoc.name)) {
          target = get().activeTarget!;
        } else {
          target = get().detectDefaultTarget();
        }
      }
      set({ activeTarget: target });

      // Automatically open the Bottom Panel and activate the Output tab
      const uiStore = useUIStore.getState();
      if (!uiStore.isBottomPanelOpen) {
        uiStore.toggleBottomPanel('output');
      } else if (uiStore.activeBottomTab !== 'output') {
        uiStore.setBottomTab('output');
      }

      const workspacePath = useFileStore.getState().currentFolderPath;
      const cwd = workspacePath || (activeDoc?.path ? activeDoc.path.replace(/[/\\][^/\\]+$/, '') : undefined);

      if (window.xivig?.buildRun) {
        await window.xivig.buildRun({
          program: target.program || target.command,
          command: target.command,
          args: target.args,
          cwd,
          secondaryCommand: target.secondaryCommand,
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
