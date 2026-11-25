import { describe, it, expect } from 'vitest';
import {
  detectCppCompilers,
  buildCompileCommand,
  generateCompileCommandsJson,
  createCppCompletionSource,
  parseCMakeLists,
  buildCMakeConfigureAndBuildCommands,
  createCMakeCompletionSource,
  resolveCodeRunnerCommand,
  generateClangFormatConfig,
  validateClangdConfig,
} from '../extensions/builtin/cpp';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';

describe('Category 13: C/C++ Development Extensions', () => {
  describe('C/C++ Core & Compilers', () => {
    it('detects Clang, GCC, and MSVC compilers from paths', () => {
      const candidates = [
        '/usr/bin/clang++',
        '/usr/bin/g++',
        'C:/Program Files/Microsoft Visual Studio/2022/Enterprise/VC/Tools/MSVC/14.38.33130/bin/Hostx64/x64/cl.exe',
      ];

      const compilers = detectCppCompilers(candidates);
      expect(compilers).toHaveLength(3);

      expect(compilers[0].type).toBe('clang');
      expect(compilers[1].type).toBe('gcc');
      expect(compilers[2].type).toBe('msvc');
    });

    it('builds standard GCC/Clang and MSVC compilation commands', () => {
      const gccCmd = buildCompileCommand('g++', 'src/main.cpp', 'bin/app', ['-std=c++20', '-O3']);
      expect(gccCmd).toBe('g++ -std=c++20 -O3 src/main.cpp -o bin/app');

      const msvcCmd = buildCompileCommand('cl.exe', 'src/main.cpp', 'bin/app.exe');
      expect(msvcCmd).toBe('cl.exe /W4 /O2 /EHsc src/main.cpp /Fe:bin/app.exe');
    });

    it('generates compile_commands.json with proper directories and compiler arguments', () => {
      const entries = [
        { file: 'src/main.cpp', directory: '/home/user/project', compiler: 'clang++' },
        { file: 'src/engine.cpp', directory: '/home/user/project', compiler: 'clang++' },
      ];

      const jsonStr = generateCompileCommandsJson(entries);
      const parsed = JSON.parse(jsonStr);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].file).toBe('src/main.cpp');
      expect(parsed[0].command).toContain('clang++ -std=c++20 -Wall -O2 -c "src/main.cpp" -o "src/main.o"');
    });

    it('provides CodeMirror completion for C++ keywords and stdlib types', () => {
      const state = EditorState.create({ doc: 'const' });
      const context = new CompletionContext(state, 5, true);
      const source = createCppCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels).toContain('constexpr');
    });
  });

  describe('CMake Tools', () => {
    const cmakeContent = `
cmake_minimum_required(VERSION 3.25)
project(XivigGraphicsEngine LANGUAGES CXX)

add_library(graphics_core STATIC src/renderer.cpp src/pipeline.cpp)
add_executable(sandbox src/main.cpp)
target_link_libraries(sandbox PRIVATE graphics_core)
    `;

    it('parses CMakeLists.txt and extracts targets with sources', () => {
      const project = parseCMakeLists(cmakeContent);
      expect(project).not.toBeNull();
      expect(project?.name).toBe('XivigGraphicsEngine');
      expect(project?.minimumVersion).toBe('3.25');
      expect(project?.targets).toHaveLength(2);

      const lib = project?.targets.find((t) => t.type === 'library');
      expect(lib?.name).toBe('graphics_core');
      expect(lib?.sources).toEqual(['src/renderer.cpp', 'src/pipeline.cpp']);

      const exe = project?.targets.find((t) => t.type === 'executable');
      expect(exe?.name).toBe('sandbox');
      expect(exe?.sources).toEqual(['src/main.cpp']);
    });

    it('builds CMake configure and build commands', () => {
      const cmds = buildCMakeConfigureAndBuildCommands('build-dir', 'Debug', 'Ninja');
      expect(cmds.configure).toBe('cmake -B build-dir -S . -DCMAKE_BUILD_TYPE=Debug -G "Ninja"');
      expect(cmds.build).toBe('cmake --build build-dir --config Debug');
    });

    it('provides CodeMirror completion for CMake commands', () => {
      const state = EditorState.create({ doc: 'add_' });
      const context = new CompletionContext(state, 4, true);
      const source = createCMakeCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels.some((l) => l.includes('add_executable'))).toBe(true);
    });
  });

  describe('Code Runner', () => {
    it('resolves execution commands across C, C++, Python, JavaScript, and Rust', () => {
      const cppRun = resolveCodeRunnerCommand('E:/workspace/app/main.cpp');
      expect(cppRun).not.toBeNull();
      expect(cppRun?.command).toBe('g++ -std=c++20 "main.cpp" -o "main" && "./main"');

      const pyRun = resolveCodeRunnerCommand('scripts/analyze.py');
      expect(pyRun).not.toBeNull();
      expect(pyRun?.command).toBe('python -u "analyze.py"');

      const rsRun = resolveCodeRunnerCommand('src/main.rs');
      expect(rsRun).not.toBeNull();
      expect(rsRun?.command).toBe('rustc "main.rs" && "./main"');
    });

    it('supports custom executor mappings', () => {
      const custom = {
        cpp: 'clang++ "$fileName" -o "$fileNameWithoutExt" && "./$fileNameWithoutExt"',
      };
      const run = resolveCodeRunnerCommand('test.cpp', custom);
      expect(run?.command).toBe('clang++ "test.cpp" -o "test" && "./test"');
    });
  });

  describe('clangd & ClangFormat', () => {
    it('generates standard .clang-format YAML specification', () => {
      const cfg = generateClangFormatConfig('Google', 2);
      expect(cfg).toContain('BasedOnStyle: Google');
      expect(cfg).toContain('IndentWidth: 2');
      expect(cfg).toContain('ColumnLimit: 100');
    });

    it('validates .clangd configuration sections', () => {
      const validClangd = `
CompileFlags:
  Add: [-Wall, -Wextra]
Diagnostics:
  UnusedIncludes: Strict
      `;
      const val = validateClangdConfig(validClangd);
      expect(val.valid).toBe(true);
      expect(val.errors).toHaveLength(0);

      const invalidClangd = `
UnknownSection:
  Foo: Bar
      `;
      const invalidVal = validateClangdConfig(invalidClangd);
      expect(invalidVal.valid).toBe(false);
      expect(invalidVal.errors[0]).toContain("Unrecognized top-level .clangd section 'UnknownSection'");
    });
  });
});
