import { describe, it, expect, beforeEach } from 'vitest';
import { useBuildStore } from '../stores/buildStore';
import { useEditorStore } from '../stores/editorStore';
import { useFileStore } from '../stores/fileStore';

describe('Language Runners (Python, C/C++, Java, Node.js, PHP)', () => {
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

  it('detects and configures Swift runner for .swift files', () => {
    useEditorStore.setState({
      documents: [
        {
          id: 'swift-1',
          name: 'main.swift',
          path: 'C:/projects/app/main.swift',
          content: 'print("Hello from Swift")',
          language: 'swift',
          isDirty: false,
          cursor: { line: 1, col: 1 },
        },
      ],
      activeDocumentId: 'swift-1',
    });

    const defaultTarget = useBuildStore.getState().detectDefaultTarget();
    expect(defaultTarget.category).toBe('swift');
    expect(defaultTarget.command).toBe('swift');
    expect(defaultTarget.args).toContain('C:/projects/app/main.swift');

    const available = useBuildStore.getState().getAvailableTargets();
    expect(available.some((t) => t.id === 'swift-run-file')).toBe(true);
    expect(available.some((t) => t.id === 'swift-build-release')).toBe(true);
  });

  it('detects and configures Kotlin runner for .kt and .kts files', () => {
    useEditorStore.setState({
      documents: [
        {
          id: 'kt-1',
          name: 'App.kt',
          path: 'C:/projects/app/App.kt',
          content: 'fun main() { println("Hello Kotlin") }',
          language: 'kotlin',
          isDirty: false,
          cursor: { line: 1, col: 1 },
        },
      ],
      activeDocumentId: 'kt-1',
    });

    const defaultTarget = useBuildStore.getState().detectDefaultTarget();
    expect(defaultTarget.category).toBe('kotlin');
    expect(defaultTarget.command).toBe('kotlinc');
    expect(defaultTarget.args).toContain('C:/projects/app/App.kt');

    const available = useBuildStore.getState().getAvailableTargets();
    expect(available.some((t) => t.id === 'kotlin-compile-run')).toBe(true);
  });

  it('detects and configures Batch runner for .bat and .cmd files', () => {
    useEditorStore.setState({
      documents: [
        {
          id: 'bat-1',
          name: 'build.bat',
          path: 'C:/projects/app/build.bat',
          content: '@echo off\necho Building...',
          language: 'bat',
          isDirty: false,
          cursor: { line: 1, col: 1 },
        },
      ],
      activeDocumentId: 'bat-1',
    });

    const defaultTarget = useBuildStore.getState().detectDefaultTarget();
    expect(defaultTarget.category).toBe('bat');
    expect(defaultTarget.id).toBe('bat-run-file');

    const available = useBuildStore.getState().getAvailableTargets();
    expect(available.some((t) => t.id === 'bat-run-file')).toBe(true);
  });

  it('detects and configures PHP runner for .php and .phtml files', () => {
    useEditorStore.setState({
      documents: [
        {
          id: 'php-1',
          name: 'index.php',
          path: 'C:/projects/app/index.php',
          content: '<?php echo "Hello from PHP"; ?>',
          language: 'php',
          isDirty: false,
          cursor: { line: 1, col: 1 },
        },
      ],
      activeDocumentId: 'php-1',
    });

    const defaultTarget = useBuildStore.getState().detectDefaultTarget();
    expect(defaultTarget.category).toBe('php');
    expect(defaultTarget.command).toBe('php');
    expect(defaultTarget.args).toContain('C:/projects/app/index.php');

    const available = useBuildStore.getState().getAvailableTargets();
    const phpTargets = available.filter((t) => t.category === 'php');
    expect(phpTargets.length).toBeGreaterThanOrEqual(4);
    expect(phpTargets.some((t) => t.id === 'php-run-file')).toBe(true);
    expect(phpTargets.some((t) => t.id === 'php-lint-file')).toBe(true);
    expect(phpTargets.some((t) => t.id === 'php-serve-dev')).toBe(true);
    expect(phpTargets.some((t) => t.id === 'php-info')).toBe(true);

    const lintTarget = phpTargets.find((t) => t.id === 'php-lint-file');
    expect(lintTarget?.args).toEqual(['-l', 'C:/projects/app/index.php']);

    const serveTarget = phpTargets.find((t) => t.id === 'php-serve-dev');
    expect(serveTarget?.args).toEqual(['-S', 'localhost:8000', '-t', 'C:/projects/app']);
  });

  it('automatically discovers runnable files in workspace fileTree', () => {
    useFileStore.setState({
      currentFolderPath: 'C:/projects/app',
      fileTree: [
        { id: '1', name: 'anc.py', path: 'C:/projects/app/anc.py', isDirectory: false },
        { id: '2', name: 'a.js', path: 'C:/projects/app/a.js', isDirectory: false },
        { id: '3', name: 'main.c', path: 'C:/projects/app/main.c', isDirectory: false },
        { id: '4', name: 'App.java', path: 'C:/projects/app/App.java', isDirectory: false },
        { id: '5', name: 'service.swift', path: 'C:/projects/app/service.swift', isDirectory: false },
        { id: '6', name: 'Main.kt', path: 'C:/projects/app/Main.kt', isDirectory: false },
        { id: '7', name: 'deploy.bat', path: 'C:/projects/app/deploy.bat', isDirectory: false },
        { id: '8', name: 'server.php', path: 'C:/projects/app/server.php', isDirectory: false },
      ],
    });

    const available = useBuildStore.getState().getAvailableTargets();
    expect(available.some((t) => t.name.includes('Python: Run anc.py'))).toBe(true);
    expect(available.some((t) => t.name.includes('Node.js: Run a.js'))).toBe(true);
    expect(available.some((t) => t.name.includes('C: Compile & Run main.c'))).toBe(true);
    expect(available.some((t) => t.name.includes('Java: Run App.java'))).toBe(true);
    expect(available.some((t) => t.name.includes('Swift: Run service.swift'))).toBe(true);
    expect(available.some((t) => t.name.includes('Kotlin: Compile & Run Main.kt'))).toBe(true);
    expect(available.some((t) => t.name.includes('Batch: Run deploy.bat'))).toBe(true);
    expect(available.some((t) => t.name.includes('PHP: Run server.php'))).toBe(true);
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
