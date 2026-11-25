import { ParsedTestCase, JestSettings } from './types';

export const DEFAULT_JEST_SETTINGS: JestSettings = {
  enabled: true,
  jestCommand: 'npx jest',
  coverage: false,
  verbose: true,
};

/**
 * Checks if a file path is a Jest/Vitest test file.
 */
export function isJestTestFile(filePath: string): boolean {
  if (!filePath) return false;
  const norm = filePath.replace(/\\/g, '/');
  return (
    /\.(test|spec)\.[jt]sx?$/i.test(norm) ||
    /\/__tests__\/.*\.[jt]sx?$/i.test(norm)
  );
}

/**
 * Parses describe, it, and test blocks from JavaScript/TypeScript test files.
 */
export function parseJestTestCases(code: string): ParsedTestCase[] {
  if (!code) return [];

  const results: ParsedTestCase[] = [];
  const lines = code.split('\n');
  const suiteStack: { name: string; braceDepth: number }[] = [];
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNum = i + 1;

    // Describe block
    const describeMatch = trimmed.match(/^describe(?:\.(skip|only))?\s*\(\s*['"`](.*?)['"`]/);
    if (describeMatch) {
      results.push({
        id: `suite-${lineNum}`,
        name: describeMatch[2],
        line: lineNum,
        type: 'describe',
        skipped: describeMatch[1] === 'skip',
        only: describeMatch[1] === 'only',
      });

      const openCount = (line.match(/\{/g) || []).length;
      const closeCount = (line.match(/\}/g) || []).length;
      suiteStack.push({ name: describeMatch[2], braceDepth: braceDepth + (openCount - closeCount) });
      braceDepth += (openCount - closeCount);
      continue;
    }

    // It / Test block
    const testMatch = trimmed.match(/^(?:it|test)(?:\.(skip|only|concurrent))?\s*\(\s*['"`](.*?)['"`]/);
    if (testMatch) {
      const modifier = testMatch[1];
      const activeSuite = suiteStack.length > 0 ? suiteStack[suiteStack.length - 1].name : undefined;
      results.push({
        id: `test-${lineNum}`,
        name: testMatch[2],
        suiteName: activeSuite,
        line: lineNum,
        type: trimmed.startsWith('test') ? 'test' : 'it',
        skipped: modifier === 'skip',
        only: modifier === 'only',
      });
    }

    // Track braces to know when describe blocks close
    const openCount = (line.match(/\{/g) || []).length;
    const closeCount = (line.match(/\}/g) || []).length;
    braceDepth += (openCount - closeCount);

    while (suiteStack.length > 0 && braceDepth < suiteStack[suiteStack.length - 1].braceDepth) {
      suiteStack.pop();
    }
  }

  return results;
}

/**
 * Generates command line invocation for Jest runner.
 */
export function generateJestCommand(options?: {
  filePath?: string;
  testNamePattern?: string;
  coverage?: boolean;
  updateSnapshots?: boolean;
  baseCommand?: string;
}): string {
  const cmd = options?.baseCommand || DEFAULT_JEST_SETTINGS.jestCommand;
  const args: string[] = [cmd];

  if (options?.filePath) {
    args.push(`"${options.filePath}"`);
  }
  if (options?.testNamePattern) {
    args.push(`-t "${options.testNamePattern.replace(/"/g, '\\"')}"`);
  }
  if (options?.coverage) {
    args.push('--coverage');
  }
  if (options?.updateSnapshots) {
    args.push('-u');
  }

  return args.join(' ');
}
