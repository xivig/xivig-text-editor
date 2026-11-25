import { CMakeProject, CMakeTarget } from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

const CMAKE_COMMANDS = [
  'cmake_minimum_required(VERSION 3.20)',
  'project(MyProject LANGUAGES CXX)',
  'add_executable(target_name main.cpp)',
  'add_library(lib_name STATIC src.cpp)',
  'target_link_libraries(target_name PRIVATE other_lib)',
  'target_include_directories(target_name PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)',
  'target_compile_features(target_name PRIVATE cxx_std_20)',
  'find_package(PackageName REQUIRED)',
  'set(CMAKE_CXX_STANDARD 20)',
  'set(CMAKE_CXX_STANDARD_REQUIRED ON)',
  'option(BUILD_TESTS "Build test suite" ON)',
  'add_subdirectory(tests)',
];

/**
 * Parses CMakeLists.txt content into structured project and target models.
 */
export function parseCMakeLists(content: string): CMakeProject | null {
  if (!content || !content.trim()) return null;

  const minVerMatch = content.match(/cmake_minimum_required\s*\(\s*VERSION\s+([0-9.]+)\s*\)/i);
  const projMatch = content.match(/project\s*\(\s*([a-zA-Z0-9_-]+)/i);

  const targets: CMakeTarget[] = [];

  // Match add_executable(name src1 src2 ...)
  const exeMatches = content.matchAll(/add_executable\s*\(\s*([a-zA-Z0-9_-]+)\s+([\s\S]*?)\)/gi);
  for (const m of exeMatches) {
    const name = m[1];
    const rawSources = m[2].trim().split(/\s+/).filter((s) => s && !s.startsWith('#'));
    targets.push({
      name,
      type: 'executable',
      sources: rawSources,
    });
  }

  // Match add_library(name [STATIC|SHARED|INTERFACE] src1 ...)
  const libMatches = content.matchAll(/add_library\s*\(\s*([a-zA-Z0-9_-]+)(?:\s+(STATIC|SHARED|INTERFACE))?\s+([\s\S]*?)\)/gi);
  for (const m of libMatches) {
    const name = m[1];
    const rawSources = m[3].trim().split(/\s+/).filter((s) => s && !s.startsWith('#'));
    targets.push({
      name,
      type: 'library',
      sources: rawSources,
    });
  }

  return {
    name: projMatch?.[1] || 'UntitledProject',
    minimumVersion: minVerMatch?.[1],
    targets,
  };
}

/**
 * Builds standard CMake configure and build execution CLI commands.
 */
export function buildCMakeConfigureAndBuildCommands(
  buildDir = 'build',
  config = 'Release',
  generator?: string
): { configure: string; build: string } {
  const genFlag = generator ? ` -G "${generator}"` : '';
  const configure = `cmake -B ${buildDir} -S . -DCMAKE_BUILD_TYPE=${config}${genFlag}`;
  const build = `cmake --build ${buildDir} --config ${config}`;

  return { configure, build };
}

/**
 * Autocompletion source for CMakeLists.txt commands.
 */
export function createCMakeCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z0-9_]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const norm = word.text.toLowerCase();
    const options: any[] = [];

    for (const cmd of CMAKE_COMMANDS) {
      if (cmd.toLowerCase().startsWith(norm)) {
        options.push({
          label: cmd,
          type: 'snippet',
          detail: 'CMake Command',
          boost: 3,
        });
      }
    }

    if (options.length === 0) return null;

    return {
      from: word.from,
      options,
    };
  };
}
