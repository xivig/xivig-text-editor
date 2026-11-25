import { CppCompiler, CompileCommandItem } from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

const CPP_KEYWORDS = [
  '#include', '#define', '#ifdef', '#ifndef', '#endif', '#pragma once',
  'auto', 'const', 'constexpr', 'template', 'typename', 'namespace',
  'using', 'struct', 'class', 'public', 'private', 'protected',
  'virtual', 'override', 'final', 'noexcept', 'static_cast', 'dynamic_cast',
  'reinterpret_cast', 'const_cast', 'decltype', 'concept', 'requires',
  'co_await', 'co_yield', 'co_return', 'static', 'inline', 'friend',
];

const CPP_STDLIB = [
  'std::cout', 'std::cin', 'std::endl', 'std::string', 'std::vector',
  'std::map', 'std::unordered_map', 'std::set', 'std::unordered_set',
  'std::unique_ptr', 'std::shared_ptr', 'std::weak_ptr', 'std::make_unique',
  'std::make_shared', 'std::move', 'std::forward', 'std::optional',
  'std::variant', 'std::tuple', 'std::pair', 'std::function', 'std::span',
  'std::chrono', 'std::thread', 'std::mutex', 'std::atomic',
];

/**
 * Detects C/C++ compilers available in candidate paths.
 */
export function detectCppCompilers(candidatePaths: string[]): CppCompiler[] {
  const compilers: CppCompiler[] = [];
  const seenPaths = new Set<string>();

  for (const p of candidatePaths) {
    if (!p) continue;
    const clean = p.replace(/\\/g, '/');
    const lower = clean.toLowerCase();

    if (seenPaths.has(clean)) continue;
    seenPaths.add(clean);

    if (lower.endsWith('clang++') || lower.endsWith('clang++.exe') || lower.endsWith('clang') || lower.endsWith('clang.exe')) {
      compilers.push({
        type: 'clang',
        path: clean,
        name: 'Clang / LLVM C++ Compiler',
        isDefault: compilers.length === 0,
      });
    } else if (lower.endsWith('g++') || lower.endsWith('g++.exe') || lower.endsWith('gcc') || lower.endsWith('gcc.exe')) {
      compilers.push({
        type: 'gcc',
        path: clean,
        name: 'GCC / G++ Compiler',
        isDefault: compilers.length === 0,
      });
    } else if (lower.endsWith('cl.exe')) {
      compilers.push({
        type: 'msvc',
        path: clean,
        name: 'Microsoft Visual C++ (MSVC)',
        isDefault: compilers.length === 0,
      });
    }
  }

  return compilers;
}

/**
 * Builds a compiler CLI command for single or multi-source compilation.
 */
export function buildCompileCommand(
  compiler: string,
  sourceFile: string,
  outputFile: string,
  flags: string[] = []
): string {
  const isMsvc = compiler.toLowerCase().includes('cl.exe');
  const cleanComp = compiler.includes(' ') ? `"${compiler}"` : compiler;
  const cleanSrc = sourceFile.includes(' ') ? `"${sourceFile}"` : sourceFile;
  const cleanOut = outputFile.includes(' ') ? `"${outputFile}"` : outputFile;

  if (isMsvc) {
    const defaultFlags = flags.length > 0 ? flags.join(' ') : '/W4 /O2 /EHsc';
    return `${cleanComp} ${defaultFlags} ${cleanSrc} /Fe:${cleanOut}`;
  }

  const defaultFlags = flags.length > 0 ? flags.join(' ') : '-std=c++20 -Wall -Wextra -O2';
  return `${cleanComp} ${defaultFlags} ${cleanSrc} -o ${cleanOut}`;
}

/**
 * Generates compile_commands.json database representation.
 */
export function generateCompileCommandsJson(
  entries: Array<{ file: string; directory: string; compiler?: string; flags?: string[] }>
): string {
  const items: CompileCommandItem[] = entries.map((e) => {
    const comp = e.compiler || 'g++';
    const flagsStr = (e.flags || ['-std=c++20', '-Wall', '-O2']).join(' ');
    const outFile = e.file.replace(/\.[^/.]+$/, '.o');
    return {
      directory: e.directory,
      file: e.file,
      command: `${comp} ${flagsStr} -c "${e.file}" -o "${outFile}"`,
      output: outFile,
    };
  });

  return JSON.stringify(items, null, 2);
}

/**
 * Autocompletion source for C/C++ keywords, preprocessors, and std library.
 */
export function createCppCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[#a-zA-Z0-9_:]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const norm = word.text;
    const options: any[] = [];

    for (const kw of CPP_KEYWORDS) {
      if (kw.startsWith(norm)) {
        options.push({
          label: kw,
          type: 'keyword',
          detail: 'C/C++ Keyword',
          boost: 3,
        });
      }
    }

    for (const std of CPP_STDLIB) {
      if (std.startsWith(norm)) {
        options.push({
          label: std,
          type: 'variable',
          detail: 'C++ Standard Library',
          boost: 2,
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
