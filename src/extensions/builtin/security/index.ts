import { BuiltinExtensionModule } from '../../api/types';
import { analyzeSonarLint } from './sonarLintPlugin';
import { parseSnykJsonOutput, buildSnykCliArgs } from './snykSecurityPlugin';
import { parseSarifReport, convertSarifToDiagnostics, buildCodeQlCliArgs } from './codeQlPlugin';
import { parseTrivyJsonOutput, buildTrivyCliArgs } from './trivyPlugin';
import { parseOwaspReport, evaluateCvssRisk } from './owaspDependencyCheckPlugin';

export * from './types';
export * from './sonarLintPlugin';
export * from './snykSecurityPlugin';
export * from './codeQlPlugin';
export * from './trivyPlugin';
export * from './owaspDependencyCheckPlugin';

// 1. SonarLint
export const sonarLintExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.sonarlint',
    name: 'SonarLint',
    publisher: 'SonarSource',
    version: '4.14.0',
    description: 'SonarLint detects code smells, bugs, and security vulnerabilities on the fly.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#cb2027',
    iconSymbol: '🔍',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. Snyk Security
export const snykSecurityExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.snyk-security',
    name: 'Snyk Security',
    publisher: 'Snyk',
    version: '2.19.0',
    description: 'Find and automatically fix open source vulnerabilities in project dependencies.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#4c5467',
    iconSymbol: '🐕',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. CodeQL
export const codeQlExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.codeql',
    name: 'CodeQL',
    publisher: 'GitHub',
    version: '1.14.0',
    description: 'Semantic code analysis engine for discovering vulnerabilities and parsing SARIF reports.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#1f2328',
    iconSymbol: '🛡️',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. Trivy
export const trivyExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.trivy',
    name: 'Trivy Vulnerability Scanner',
    publisher: 'Aqua Security',
    version: '0.12.0',
    description: 'Comprehensive vulnerability and secret scanner for containers, repos, and configs.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#1976d2',
    iconSymbol: '🌊',
  },
  activate: () => {},
  deactivate: () => {},
};

// 5. OWASP Dependency Check
export const owaspDependencyCheckExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.owasp-dependency-check',
    name: 'OWASP Dependency-Check',
    publisher: 'OWASP',
    version: '8.4.0',
    description: 'Software composition analysis utility that detects publicly disclosed CVEs in dependencies.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#212529',
    iconSymbol: '🔒',
  },
  activate: () => {},
  deactivate: () => {},
};
