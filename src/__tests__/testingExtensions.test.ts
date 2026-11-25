import { describe, it, expect } from 'vitest';
import {
  TestExplorerController,
  extractTestStructureFromCode,
} from '../extensions/builtin/testing/testExplorerUiPlugin';
import {
  buildJestCliArgs,
  parseJestOutput,
} from '../extensions/builtin/testing/jestRunnerPlugin';
import {
  parsePlaywrightSpecs,
  buildPlaywrightCliArgs,
} from '../extensions/builtin/testing/playwrightPlugin';
import {
  parseCypressSpecs,
  buildCypressCliArgs,
} from '../extensions/builtin/testing/cypressPlugin';
import {
  parseLcovCoverage,
  getLineCoverageStatus,
} from '../extensions/builtin/testing/coverageGuttersPlugin';

describe('Testing Extension Suite (Category 19)', () => {
  describe('Test Explorer UI', () => {
    it('manages test hierarchy, updates statuses, and aggregates summaries', () => {
      const controller = new TestExplorerController();

      controller.registerItem({
        id: 'suite-1',
        label: 'Auth Module',
        type: 'suite',
        status: 'enqueued',
        children: [
          { id: 'test-1', label: 'should login with valid token', type: 'test', status: 'enqueued' },
          { id: 'test-2', label: 'should reject invalid password', type: 'test', status: 'enqueued' },
          { id: 'test-3', label: 'should refresh expired session', type: 'test', status: 'enqueued' },
        ],
      });

      controller.updateStatus('test-1', 'passed', 45);
      controller.updateStatus('test-2', 'failed', 22, 'AssertionError: expected 401 but got 200');
      controller.updateStatus('test-3', 'skipped', 0);

      const summary = controller.getSummary();
      expect(summary.total).toBe(3);
      expect(summary.passed).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.skipped).toBe(1);
      expect(summary.durationMs).toBe(67);
    });

    it('extracts test describes and test/it blocks from source code', () => {
      const code = `describe('Payment Gateway', () => {
  it('processes card charge', async () => {});
  test('handles decline gracefully', () => {});
});`;

      const tree = extractTestStructureFromCode(code, 'payment.test.ts');
      expect(tree.type).toBe('suite');
      expect(tree.children).toHaveLength(1);

      const suite = tree.children?.[0];
      expect(suite?.label).toBe('Payment Gateway');
      expect(suite?.children).toHaveLength(2);
      expect(suite?.children?.[0].label).toBe('processes card charge');
      expect(suite?.children?.[1].label).toBe('handles decline gracefully');
    });
  });

  describe('Jest Runner', () => {
    it('builds safe CLI argument lists for targeting specific tests', () => {
      const args = buildJestCliArgs('src/__tests__/auth.test.ts', {
        testNamePattern: 'should login',
        coverage: true,
        runInBand: true,
      });

      expect(args[0]).toBe('jest');
      expect(args).toContain('src/__tests__/auth.test.ts');
      expect(args).toContain('-t');
      expect(args).toContain('should login');
      expect(args).toContain('--coverage');
      expect(args).toContain('--runInBand');
    });

    it('parses Jest stdout metrics into structured totals', () => {
      const sampleOutput = `
PASS src/__tests__/app.test.ts
Test Suites: 1 failed, 4 passed, 5 total
Tests:       2 failed, 18 passed, 20 total
Snapshots:   0 total
Time:        3.452 s
`;

      const result = parseJestOutput(sampleOutput);
      expect(result.testSuitesPassed).toBe(4);
      expect(result.testSuitesFailed).toBe(1);
      expect(result.testSuitesTotal).toBe(5);
      expect(result.testsPassed).toBe(18);
      expect(result.testsFailed).toBe(2);
      expect(result.testsTotal).toBe(20);
      expect(result.timeSeconds).toBe(3.452);
    });
  });

  describe('Playwright', () => {
    it('parses Playwright test specs and extracts injected fixtures', () => {
      const code = `import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('adds item to cart', async ({ page, request }) => {
    await page.goto('/shop');
  });
});`;

      const specs = parsePlaywrightSpecs(code);
      expect(specs).toHaveLength(1);
      expect(specs[0].title).toBe('adds item to cart');
      expect(specs[0].suite).toBe('Checkout Flow');
      expect(specs[0].fixtures).toEqual(['page', 'request']);
    });

    it('builds Playwright CLI execution arguments', () => {
      const args = buildPlaywrightCliArgs('e2e/checkout.spec.ts', {
        headed: true,
        project: 'firefox',
        trace: 'retain-on-failure',
      });

      expect(args).toContain('playwright');
      expect(args).toContain('test');
      expect(args).toContain('e2e/checkout.spec.ts');
      expect(args).toContain('--headed');
      expect(args).toContain('--project=firefox');
      expect(args).toContain('--trace=retain-on-failure');
    });
  });

  describe('Cypress', () => {
    it('parses Cypress spec and inspects cy commands used', () => {
      const code = `describe('User Profile', () => {
  it('updates display name', () => {
    cy.visit('/profile');
    cy.get('input#name').type('New Name');
    cy.get('button[type="submit"]').click();
  });
});`;

      const specs = parseCypressSpecs(code);
      expect(specs).toHaveLength(1);
      expect(specs[0].title).toBe('updates display name');
      expect(specs[0].cyCommands).toContain('visit');
      expect(specs[0].cyCommands).toContain('get');
      expect(specs[0].cyCommands).toContain('type');
      expect(specs[0].cyCommands).toContain('click');
    });

    it('builds Cypress CLI execution arguments', () => {
      const args = buildCypressCliArgs('cypress/e2e/profile.cy.ts', {
        browser: 'chrome',
        headless: true,
      });

      expect(args).toContain('cypress');
      expect(args).toContain('run');
      expect(args).toContain('--spec');
      expect(args).toContain('cypress/e2e/profile.cy.ts');
      expect(args).toContain('--browser');
      expect(args).toContain('chrome');
      expect(args).toContain('--headless');
    });
  });

  describe('Coverage Gutters', () => {
    it('parses LCOV coverage format and computes percentage', () => {
      const lcov = `SF:src/utils/math.ts
DA:1,10
DA:2,10
DA:3,0
DA:4,10
LF:4
LH:3
end_of_record`;

      const report = parseLcovCoverage(lcov);
      expect(report.has('src/utils/math.ts')).toBe(true);

      const file = report.get('src/utils/math.ts')!;
      expect(file.linesFound).toBe(4);
      expect(file.linesHit).toBe(3);
      expect(file.coveragePercent).toBe(75);

      expect(getLineCoverageStatus(file, 1)).toBe('covered');
      expect(getLineCoverageStatus(file, 3)).toBe('uncovered');
      expect(getLineCoverageStatus(file, 99)).toBe('none');
    });
  });
});
