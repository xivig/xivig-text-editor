/**
 * Category 13: C/C++ Development Extensions
 * Type definitions & configuration interfaces
 */

export interface CppCompiler {
  type: 'gcc' | 'clang' | 'msvc';
  path: string;
  name: string;
  isDefault?: boolean;
}

export interface CompileCommandItem {
  directory: string;
  command: string;
  file: string;
  output?: string;
  arguments?: string[];
}

export interface CMakeTarget {
  name: string;
  type: 'executable' | 'library';
  sources: string[];
}

export interface CMakeProject {
  name: string;
  minimumVersion?: string;
  targets: CMakeTarget[];
}

export interface CodeRunnerSettings {
  enabled: boolean;
  clearPreviousOutput: boolean;
  saveFileBeforeRun: boolean;
  executorMap: Record<string, string>;
}

export interface ClangdSettings {
  enabled: boolean;
  compilationDatabasePath?: string;
  fallbackFlags: string[];
  formatStyle: 'LLVM' | 'Google' | 'Chromium' | 'Mozilla' | 'WebKit';
}
