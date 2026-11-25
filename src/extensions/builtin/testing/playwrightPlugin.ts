import type { PlaywrightTestSpec } from './types';

/**
 * Parses Playwright test file into structured test specifications.
 */
export function parsePlaywrightSpecs(code: string): PlaywrightTestSpec[] {
  const specs: PlaywrightTestSpec[] = [];
  const lines = code.replace(/\r\n/g, '\n').split('\n');

  let currentSuite: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    const suiteMatch = line.match(/test\.describe\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (suiteMatch) {
      currentSuite = suiteMatch[1];
      continue;
    }

    // Matches test('...', async ({ page, request }) => { ... })
    const testMatch = line.match(/test(?:\.only|\.skip)?\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*async\s*\(\s*\{([^}]*)\}\s*\)/);
    if (testMatch) {
      const title = testMatch[1];
      const fixturesRaw = testMatch[2] || '';
      const fixtures = fixturesRaw.split(',').map((f) => f.trim()).filter(Boolean);

      specs.push({
        title,
        line: lineNum,
        suite: currentSuite,
        fixtures,
      });
    }
  }

  return specs;
}

/**
 * Builds Playwright CLI command invocation arguments safely.
 */
export function buildPlaywrightCliArgs(
  specFile?: string,
  options: {
    headed?: boolean;
    project?: 'chromium' | 'firefox' | 'webkit' | string;
    debug?: boolean;
    trace?: 'on' | 'off' | 'retain-on-failure';
    grep?: string;
  } = {}
): string[] {
  const args = ['playwright', 'test'];

  if (specFile) {
    args.push(specFile);
  }

  if (options.headed) {
    args.push('--headed');
  }

  if (options.project) {
    args.push(`--project=${options.project}`);
  }

  if (options.debug) {
    args.push('--debug');
  }

  if (options.trace) {
    args.push(`--trace=${options.trace}`);
  }

  if (options.grep) {
    args.push('-g', options.grep);
  }

  return args;
}
