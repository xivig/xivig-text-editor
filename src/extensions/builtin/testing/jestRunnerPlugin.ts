/**
 * Builds CLI argument list for invoking Jest safely without shell interpolation.
 */
export function buildJestCliArgs(
  testFile?: string,
  options: {
    testNamePattern?: string;
    coverage?: boolean;
    watch?: boolean;
    updateSnapshots?: boolean;
    runInBand?: boolean;
  } = {}
): string[] {
  const args = ['jest'];

  if (testFile) {
    args.push(testFile);
  }

  if (options.testNamePattern) {
    args.push('-t', options.testNamePattern);
  }

  if (options.coverage) {
    args.push('--coverage');
  }

  if (options.watch) {
    args.push('--watch');
  }

  if (options.updateSnapshots) {
    args.push('-u');
  }

  if (options.runInBand) {
    args.push('--runInBand');
  }

  return args;
}

/**
 * Parses Jest CLI text output or JSON summary into structured counts.
 */
export function parseJestOutput(stdout: string): {
  testSuitesPassed: number;
  testSuitesFailed: number;
  testSuitesTotal: number;
  testsPassed: number;
  testsFailed: number;
  testsTotal: number;
  timeSeconds: number;
} {
  let testSuitesPassed = 0;
  let testSuitesFailed = 0;
  let testSuitesTotal = 0;
  let testsPassed = 0;
  let testsFailed = 0;
  let testsTotal = 0;
  let timeSeconds = 0;

  // Example: Test Suites: 1 failed, 4 passed, 5 total
  const suitesMatch = stdout.match(/Test Suites:\s*(?:(\d+)\s+failed,?\s*)?(?:(\d+)\s+passed,?\s*)?(\d+)\s+total/i);
  if (suitesMatch) {
    testSuitesFailed = parseInt(suitesMatch[1] || '0', 10);
    testSuitesPassed = parseInt(suitesMatch[2] || '0', 10);
    testSuitesTotal = parseInt(suitesMatch[3] || '0', 10);
  }

  // Example: Tests: 2 failed, 18 passed, 20 total
  const testsMatch = stdout.match(/Tests:\s*(?:(\d+)\s+failed,?\s*)?(?:(\d+)\s+passed,?\s*)?(\d+)\s+total/i);
  if (testsMatch) {
    testsFailed = parseInt(testsMatch[1] || '0', 10);
    testsPassed = parseInt(testsMatch[2] || '0', 10);
    testsTotal = parseInt(testsMatch[3] || '0', 10);
  }

  // Example: Time: 2.451 s
  const timeMatch = stdout.match(/Time:\s*([\d.]+)\s*s/i);
  if (timeMatch) {
    timeSeconds = parseFloat(timeMatch[1]);
  }

  return {
    testSuitesPassed,
    testSuitesFailed,
    testSuitesTotal,
    testsPassed,
    testsFailed,
    testsTotal,
    timeSeconds,
  };
}
