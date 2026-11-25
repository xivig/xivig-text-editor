import { JavaLaunchConfig } from './types';

/**
 * Builds the standard JVM JDWP debugging argument string.
 */
export function buildJdwpArgument(port = 5005, suspend = false): string {
  const suspChar = suspend ? 'y' : 'n';
  return `-agentlib:jdwp=transport=dt_socket,server=y,suspend=${suspChar},address=*:${port}`;
}

/**
 * Builds a standardized Java launch configuration for the debugger.
 */
export function buildJavaLaunchConfig(
  mainClass: string,
  projectName?: string,
  vmArgs?: string,
  args?: string
): JavaLaunchConfig {
  return {
    name: `Launch ${mainClass.split('.').pop() || 'Java Program'}`,
    type: 'java',
    request: 'launch',
    mainClass,
    projectName,
    vmArgs,
    args,
  };
}

/**
 * Checks if a specific line of Java source code is eligible for setting a breakpoint.
 */
export function isValidJavaBreakpointLine(lineText: string): boolean {
  if (!lineText) return false;
  const trimmed = lineText.trim();

  if (!trimmed) return false;
  if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.endsWith('*/')) {
    return false;
  }
  if (trimmed.startsWith('package ') || trimmed.startsWith('import ')) {
    return false;
  }
  if (trimmed.startsWith('@') && !trimmed.includes('{')) {
    return false;
  }
  if (trimmed === '{' || trimmed === '}' || trimmed === '};') {
    return false;
  }

  return true;
}
