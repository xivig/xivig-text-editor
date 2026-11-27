import { DebugConfiguration } from '../../../stores/debugStore';

/**
 * Builds an LLDB debug launch configuration for Swift binaries or scripts.
 */
export function buildSwiftDebugLaunchConfig(
  programPath: string,
  args: string[] = [],
  cwd = '${workspaceFolder}',
  stopOnEntry = false
): DebugConfiguration {
  const binaryName = programPath.replace(/\\/g, '/').split('/').pop() || 'swift-app';
  return {
    name: `Debug ${binaryName} (LLDB)`,
    type: 'swift',
    request: 'launch',
    program: programPath,
    args: args.length > 0 ? args : undefined,
    cwd,
    stopOnEntry,
  };
}

/**
 * Returns arguments to set LLDB breakpoints on Swift fatal errors, precondition failures, and runtime panics.
 */
export function buildSwiftFatalErrorBreakpointArgs(): string[] {
  return [
    'breakpoint set --name _swift_runtime_on_report',
    'breakpoint set --name swift_willThrow',
    'breakpoint set --name _swift_failed_assertion',
  ];
}
