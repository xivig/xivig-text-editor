import { CodeLldbLaunchConfig } from './types';

/**
 * Constructs a CodeLLDB debug launch configuration for Rust executables.
 */
export function buildCodeLldbLaunchConfig(
  programPath: string,
  args: string[] = [],
  cwd = '${workspaceFolder}',
  stopOnEntry = false
): CodeLldbLaunchConfig {
  const binaryName = programPath.replace(/\\/g, '/').split('/').pop() || 'binary';
  return {
    name: `Debug ${binaryName}`,
    type: 'lldb',
    request: 'launch',
    program: programPath,
    args: args.length > 0 ? args : undefined,
    cwd,
    stopOnEntry,
  };
}

/**
 * Returns arguments to set LLDB breakpoints on Rust standard library panics.
 */
export function buildRustPanicBreakpointArgs(): string[] {
  return [
    'breakpoint set --name rust_panic',
    'breakpoint set --name core::panicking::panic',
  ];
}
