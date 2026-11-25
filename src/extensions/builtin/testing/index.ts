import { BuiltinExtensionModule } from '../../api/types';
import {
  TestExplorerController,
  globalTestExplorer,
  extractTestStructureFromCode,
} from './testExplorerUiPlugin';
import {
  buildJestCliArgs,
  parseJestOutput,
} from './jestRunnerPlugin';
import {
  parsePlaywrightSpecs,
  buildPlaywrightCliArgs,
} from './playwrightPlugin';
import {
  parseCypressSpecs,
  buildCypressCliArgs,
} from './cypressPlugin';
import {
  parseLcovCoverage,
  getLineCoverageStatus,
} from './coverageGuttersPlugin';

export * from './types';
export * from './testExplorerUiPlugin';
export * from './jestRunnerPlugin';
export * from './playwrightPlugin';
export * from './cypressPlugin';
export * from './coverageGuttersPlugin';

// 1. Test Explorer UI
export const testExplorerUiExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.test-explorer-ui',
    name: 'Test Explorer UI',
    publisher: 'Holger Benl',
    version: '2.21.1',
    description: 'Unified test explorer UI pane for running, debugging, and viewing tests in Xivig.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#1e293b',
    iconSymbol: '🧪',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. Jest Runner
export const jestRunnerExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.jest-runner',
    name: 'Jest Runner',
    publisher: 'firsttris',
    version: '0.4.70',
    description: 'Run and debug individual Jest test suites or single test blocks directly from the editor.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#99425b',
    iconSymbol: '🃏',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. Playwright
export const playwrightExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.playwright',
    name: 'Playwright Test for Xivig',
    publisher: 'Microsoft',
    version: '1.1.50',
    description: 'Run and debug end-to-end tests with Playwright, view traces, and inspect fixtures.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#2e7d32',
    iconSymbol: '🎭',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. Cypress
export const cypressExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.cypress',
    name: 'Cypress Support',
    publisher: 'Shelex',
    version: '2.5.0',
    description: 'Cypress test runner integration, cy command inspector, and spec parser.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#17202c',
    iconSymbol: '🌲',
  },
  activate: () => {},
  deactivate: () => {},
};

// 5. Coverage Gutters
export const coverageGuttersExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.coverage-gutters',
    name: 'Coverage Gutters',
    publisher: 'ryanluker',
    version: '2.11.1',
    description: 'Display test coverage status in editor gutters from LCOV reports.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#15803d',
    iconSymbol: '📊',
  },
  activate: () => {},
  deactivate: () => {},
};
