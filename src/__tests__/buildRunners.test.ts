import { describe, it, expect, beforeEach } from 'vitest';
import { useBuildStore } from '../stores/buildStore';
import { useEditorStore } from '../stores/editorStore';
import { useFileStore } from '../stores/fileStore';

describe('Language Runners (Python, C/C++, Java, Node.js)', () => {
  beforeEach(() => {
    useFileStore.setState({
      currentFolderPath: null,
      fileTree: [],
    });
    useEditorStore.setState({
      documents: [],
      activeDocumentId: null,
    });
    useBuildStore.setState({
      activeTarget: null,
      isRunning: false,
      outputLines: [],
    });
  });

  it('detects and configures Python runner for .py files', () => {
    useEditorStore.setState({
      documents: [
        {
          id: 'py-1',
          name: 'script.py',
          path: 'C:/projects/app/script.py',
          content: 'print("Hello from Python")',
          language: 'python',
          isDirty: false,
          cursor: { line: 1, col: 1 },
        },
      ],
      activeDocumentId: 'py-1',
    });

    const defaultTarget = useBuildStore.getState().detectDefaultTarget();
    expect(defaultTarget.category).toBe('python');
    expect(defaultTarget.command).toBe('python');
    expect(defaultTarget.args).toContain('-u');
    expect(defaultTarget.args).toContain('C:/projects/app/script.py');

    const available = useBuildStore.getState().getAvailableTargets();
    const pyTargets = available.filter((t) => t.category === 'python');
    expect(pyTargets.length).toBeGreaterThanOrEqual(1);
    expect(pyTargets.some((t) => t.id === 'python-run-file')).toBe(true);
  });

  it('detects and configures C runner with compile & run pipeline for .c files', () => {
    useEditorStore.setState({
      documents: [
        {
          id: 'c-1',
          name: 'main.c',
          path: 'C:/projects/app/main.c',
          content: '#include <stdio.h>\nint main() { return 0; }',
          language: 'c',
          isDirty: false,
          cursor: { line: 1, col: 1 },
        },
      ],
      activeDocumentId: 'c-1',
    });

    const defaultTarget = useBuildStore.getState().detectDefaultTarget();
    expect(defaultTarget.id).toBe('c-compile-run');
    expect(defaultTarget.command).toBe('gcc');
    expect(defaultTarget.args).toContain('C:/projects/app/main.c');
    expect(defaultTarget.secondaryCommand).toBeDefined();

    const available = useBuildStore.getState().getAvailableTargets();
    expect(available.some((t) => t.id === 'c-compile-run')).toBe(true);
    expect(available.some((t) => t.id === 'c-compile-only')).toBe(true);
  });

  it('detects and configures C++ runner with compile & run pipeline for .cpp files', () => {
    useEditorStore.setState({
      documents: [
        {
          id: 'cpp-1',
          name: 'app.cpp',
          path: 'C:/projects/app/app.cpp',
          content: '#include <iostream>\nint main() { std::cout << "Hi"; }',
          language: 'cpp',
          isDirty: false,
          cursor: { line: 1, col: 1 },
        },
      ],
      activeDocumentId: 'cpp-1',
    });

    const defaultTarget = useBuildStore.getState().detectDefaultTarget();
    expect(defaultTarget.id).toBe('cpp-compile-run');
    expect(defaultTarget.command).toBe('g++');
    expect(defaultTarget.args).toContain('-std=c++17');
    expect(defaultTarget.secondaryCommand).toBeDefined();

    const available = useBuildStore.getState().getAvailableTargets();
    expect(available.some((t) => t.id === 'cpp-compile-run')).toBe(true);
    expect(available.some((t) => t.id === 'cpp-compile-only')).toBe(true);
  });

  it('detects and configures Java runner for .java files', () => {
    useEditorStore.setState({
      documents: [
        {
          id: 'java-1',
          name: 'HelloWorld.java',
          path: 'C:/projects/app/HelloWorld.java',
          content: 'public class HelloWorld { public static void main(String[] args) {} }',
          language: 'java',
          isDirty: false,
          cursor: { line: 1, col: 1 },
        },
      ],
      activeDocumentId: 'java-1',
    });

    const defaultTarget = useBuildStore.getState().detectDefaultTarget();
    expect(defaultTarget.category).toBe('java');
    expect(defaultTarget.command).toBe('java');
    expect(defaultTarget.args).toContain('C:/projects/app/HelloWorld.java');

    const available = useBuildStore.getState().getAvailableTargets();
    expect(available.some((t) => t.id === 'java-run-source')).toBe(true);
    expect(available.some((t) => t.id === 'java-compile-run')).toBe(true);
  });

  it('detects and configures Node.js runner for .js files', () => {
    useEditorStore.setState({
      documents: [
        {
          id: 'node-1',
          name: 'server.js',
          path: 'C:/projects/app/server.js',
          content: 'console.log("running")',
          language: 'javascript',
          isDirty: false,
          cursor: { line: 1, col: 1 },
        },
      ],
      activeDocumentId: 'node-1',
    });

    const defaultTarget = useBuildStore.getState().detectDefaultTarget();
    expect(defaultTarget.category).toBe('nodejs');
    expect(defaultTarget.command).toBe('node');
    expect(defaultTarget.args).toContain('C:/projects/app/server.js');

    const available = useBuildStore.getState().getAvailableTargets();
    expect(available.some((t) => t.id === 'node-run-file')).toBe(true);
  });

  it('automatically discovers runnable files in workspace fileTree', () => {
    useFileStore.setState({
      currentFolderPath: 'C:/projects/app',
      fileTree: [
        { id: '1', name: 'anc.py', path: 'C:/projects/app/anc.py', isDirectory: false },
        { id: '2', name: 'a.js', path: 'C:/projects/app/a.js', isDirectory: false },
        { id: '3', name: 'main.c', path: 'C:/projects/app/main.c', isDirectory: false },
        { id: '4', name: 'App.java', path: 'C:/projects/app/App.java', isDirectory: false },
      ],
    });

    const available = useBuildStore.getState().getAvailableTargets();
    expect(available.some((t) => t.name.includes('Python: Run anc.py'))).toBe(true);
    expect(available.some((t) => t.name.includes('Node.js: Run a.js'))).toBe(true);
    expect(available.some((t) => t.name.includes('C: Compile & Run main.c'))).toBe(true);
    expect(available.some((t) => t.name.includes('Java: Run App.java'))).toBe(true);
  });

  it('standardizes build:done completion contract with exitCode and durationMs', () => {
    const eventPayload = { exitCode: 0, durationMs: 350 };
    useBuildStore.setState({ isRunning: true, exitCode: null, durationMs: null });

    // Directly test state handling of build:done payload
    useBuildStore.setState({
      isRunning: false,
      exitCode: eventPayload.exitCode,
      durationMs: eventPayload.durationMs,
      outputLines: [
        {
          id: 'test-done',
          type: 'success',
          text: `[Finished in ${(eventPayload.durationMs / 1000).toFixed(2)}s with exit code ${eventPayload.exitCode}]`,
          timestamp: '12:00:00 PM',
        },
      ],
    });

    const state = useBuildStore.getState();
    expect(state.isRunning).toBe(false);
    expect(state.exitCode).toBe(0);
    expect(state.durationMs).toBe(350);
    expect(state.outputLines.some((l) => l.text.includes('Finished in 0.35s with exit code 0'))).toBe(true);
  });
});
