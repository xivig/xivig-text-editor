import { BuiltinExtensionModule } from '../../api/types';
import { createGitLensPlugin, DEFAULT_GITLENS_SETTINGS } from './gitLensPlugin';
import { DEFAULT_GITGRAPH_SETTINGS } from './gitGraphPlugin';
import { DEFAULT_GITHISTORY_SETTINGS } from './gitHistoryPlugin';
import { DEFAULT_GITHUB_SETTINGS } from './githubPrsPlugin';
import { createCopilotPlugin, DEFAULT_COPILOT_SETTINGS } from './copilotPlugin';

export * from './types';
export * from './gitLensPlugin';
export * from './gitGraphPlugin';
export * from './gitHistoryPlugin';
export * from './githubPrsPlugin';
export * from './copilotPlugin';

// 1. GitLens Extension Module
export const gitLensExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.gitlens',
    name: 'GitLens — Git supercharged',
    publisher: 'GitKraken',
    version: '15.0.0',
    description: 'Supercharge Git within Xivig: current line blame, commit navigation, and authorship annotations.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#0f766e',
    iconSymbol: '🔭',
  },
  activate: () => {},
  deactivate: () => {},
  getCodeMirrorExtensions: () => [createGitLensPlugin(DEFAULT_GITLENS_SETTINGS)],
};

// 2. Git Graph Extension Module
export const gitGraphExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.git-graph',
    name: 'Git Graph',
    publisher: 'mhutchie',
    version: '1.30.0',
    description: 'View a Git Graph of your repository and easily perform Git actions from the graph.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#f97316',
    iconSymbol: '📊',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. Git History Extension Module
export const gitHistoryExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.git-history',
    name: 'Git History',
    publisher: 'Don Jayamanne',
    version: '0.6.20',
    description: 'View git log, file history, and compare branches or commits side by side.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#e11d48',
    iconSymbol: '📜',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. GitHub Pull Requests and Issues Extension Module
export const githubPrsExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.github-prs',
    name: 'GitHub Pull Requests and Issues',
    publisher: 'GitHub',
    version: '0.84.0',
    description: 'Enables reviewing and managing GitHub pull requests and issues directly from Xivig.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#24292f',
    iconSymbol: '🐙',
  },
  activate: () => {},
  deactivate: () => {},
};

// 5. GitHub Copilot Extension Module
export const copilotExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.copilot',
    name: 'GitHub Copilot',
    publisher: 'GitHub',
    version: '1.180.0',
    description: 'Your AI pair programmer: inline ghost-text code completions with Tab accept.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#1f242c',
    iconSymbol: '🤖',
  },
  activate: () => {},
  deactivate: () => {},
  getCodeMirrorExtensions: () => [createCopilotPlugin(DEFAULT_COPILOT_SETTINGS)],
};
