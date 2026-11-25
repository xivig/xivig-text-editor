import type { CypressTestSpec } from './types';

/**
 * Parses Cypress spec file into structured specs and inspected cy commands.
 */
export function parseCypressSpecs(code: string): CypressTestSpec[] {
  const specs: CypressTestSpec[] = [];
  const lines = code.replace(/\r\n/g, '\n').split('\n');

  let currentSuite: string | undefined;
  let currentSpec: CypressTestSpec | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    const describeMatch = line.match(/\b(?:describe|context)\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (describeMatch) {
      currentSuite = describeMatch[1];
      continue;
    }

    const itMatch = line.match(/\bit(?:\.only|\.skip)?\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (itMatch) {
      if (currentSpec) {
        specs.push(currentSpec);
      }
      currentSpec = {
        title: itMatch[1],
        line: lineNum,
        suite: currentSuite,
        cyCommands: [],
      };
      continue;
    }

    if (currentSpec && line.includes('cy.')) {
      const methodMatches = line.matchAll(/\.([a-zA-Z0-9_]+)\s*\(/g);
      for (const m of methodMatches) {
        const cmd = m[1];
        if (!currentSpec.cyCommands.includes(cmd)) {
          currentSpec.cyCommands.push(cmd);
        }
      }
    }
  }

  if (currentSpec) {
    specs.push(currentSpec);
  }

  return specs;
}

/**
 * Builds CLI argument array for Cypress execution.
 */
export function buildCypressCliArgs(
  specFile?: string,
  options: {
    browser?: 'chrome' | 'firefox' | 'electron' | 'edge';
    headless?: boolean;
    component?: boolean;
    config?: Record<string, string>;
  } = {}
): string[] {
  const args = ['cypress', 'run'];

  if (specFile) {
    args.push('--spec', specFile);
  }

  if (options.browser) {
    args.push('--browser', options.browser);
  }

  if (options.headless) {
    args.push('--headless');
  }

  if (options.component) {
    args.push('--component');
  }

  return args;
}
