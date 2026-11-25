import { VitestTestNode, VitestExplorerSettings } from './types';
import { parseJestTestCases } from './jestPlugin';

export const DEFAULT_VITEST_EXPLORER_SETTINGS: VitestExplorerSettings = {
  enabled: true,
  testFilePatterns: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  runOnSave: false,
  watchMode: false,
};

/**
 * Builds a hierarchical test suite tree from a test file's source code.
 */
export function buildVitestTestTree(filePath: string, code: string): VitestTestNode {
  const fileName = filePath.split(/[/\\]/).pop() || filePath;
  const cases = parseJestTestCases(code);

  const rootNode: VitestTestNode = {
    id: `file-${filePath}`,
    name: fileName,
    filePath,
    type: 'file',
    status: 'idle',
    children: [],
  };

  const suiteMap = new Map<string, VitestTestNode>();

  for (const c of cases) {
    if (c.type === 'describe') {
      const suiteNode: VitestTestNode = {
        id: `suite-${filePath}-${c.line}`,
        name: c.name,
        filePath,
        type: 'suite',
        status: c.skipped ? 'skipped' : 'idle',
        children: [],
      };
      suiteMap.set(c.name, suiteNode);
      rootNode.children?.push(suiteNode);
    } else {
      const testNode: VitestTestNode = {
        id: `test-${filePath}-${c.line}`,
        name: c.name,
        filePath,
        type: 'test',
        status: c.skipped ? 'skipped' : 'idle',
      };

      if (c.suiteName && suiteMap.has(c.suiteName)) {
        suiteMap.get(c.suiteName)!.children?.push(testNode);
      } else {
        rootNode.children?.push(testNode);
      }
    }
  }

  return rootNode;
}

/**
 * Generates the shell command line invocation for running Vitest.
 */
export function generateVitestCommand(options?: {
  filePath?: string;
  testPattern?: string;
  runMode?: 'run' | 'watch';
  coverage?: boolean;
}): string {
  const mode = options?.runMode === 'watch' ? 'watch' : 'run';
  const args: string[] = ['npx', 'vitest', mode];

  if (options?.filePath) {
    args.push(`"${options.filePath}"`);
  }
  if (options?.testPattern) {
    args.push(`-t "${options.testPattern.replace(/"/g, '\\"')}"`);
  }
  if (options?.coverage) {
    args.push('--coverage');
  }

  return args.join(' ');
}

export interface VitestReportSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  success: boolean;
}

/**
 * Parses Vitest JSON report string into structured test metrics.
 */
export function parseVitestJsonReport(jsonOutput: string): VitestReportSummary {
  try {
    const data = JSON.parse(jsonOutput);
    const numTotalTests = data.numTotalTests || 0;
    const numPassedTests = data.numPassedTests || 0;
    const numFailedTests = data.numFailedTests || 0;
    const numPendingTests = (data.numPendingTests || 0) + (data.numTodoTests || 0);
    const startTime = data.startTime || 0;
    const durationMs = startTime ? Math.max(0, Date.now() - startTime) : 0;

    return {
      total: numTotalTests,
      passed: numPassedTests,
      failed: numFailedTests,
      skipped: numPendingTests,
      durationMs,
      success: numFailedTests === 0,
    };
  } catch {
    // Basic regex fallback if output mixed with stdout strings
    const passMatch = jsonOutput.match(/Tests\s+([0-9]+)\s+passed/);
    const failMatch = jsonOutput.match(/([0-9]+)\s+failed/);
    const passed = passMatch ? parseInt(passMatch[1], 10) : 0;
    const failed = failMatch ? parseInt(failMatch[1], 10) : 0;

    return {
      total: passed + failed,
      passed,
      failed,
      skipped: 0,
      durationMs: 0,
      success: failed === 0,
    };
  }
}
