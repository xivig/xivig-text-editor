import { describe, it, expect } from 'vitest';
import {
  analyzeSonarLint,
} from '../extensions/builtin/security/sonarLintPlugin';
import {
  parseSnykJsonOutput,
  buildSnykCliArgs,
} from '../extensions/builtin/security/snykSecurityPlugin';
import {
  parseSarifReport,
  convertSarifToDiagnostics,
  buildCodeQlCliArgs,
} from '../extensions/builtin/security/codeQlPlugin';
import {
  parseTrivyJsonOutput,
  buildTrivyCliArgs,
} from '../extensions/builtin/security/trivyPlugin';
import {
  parseOwaspReport,
  evaluateCvssRisk,
} from '../extensions/builtin/security/owaspDependencyCheckPlugin';

describe('Security Extension Suite (Category 20)', () => {
  describe('SonarLint Static Analysis', () => {
    it('detects hardcoded credentials, secrets, and API tokens', () => {
      const code = `
const apiKey = "sk_live_12345678abcdefgh";
const password = "super_secret_password_123";
`;
      const matches = analyzeSonarLint(code);
      const rules = matches.map((m) => m.ruleKey);
      expect(rules).toContain('typescript:S2068');
      expect(matches.some((m) => m.severity === 'CRITICAL')).toBe(true);
    });

    it('detects insecure eval and Function constructors', () => {
      const code = `
const result = eval(userCode);
const dynamicFn = new Function("a", "b", "return a + b");
`;
      const matches = analyzeSonarLint(code);
      const rules = matches.map((m) => m.ruleKey);
      expect(rules).toContain('typescript:S1523');
      expect(matches.filter((m) => m.ruleKey === 'typescript:S1523')).toHaveLength(2);
    });

    it('flags nested ternary expressions as code smells', () => {
      const code = `const val = a ? b ? 1 : 2 : 3;`;
      const matches = analyzeSonarLint(code);
      expect(matches.some((m) => m.ruleKey === 'typescript:S3358')).toBe(true);
    });

    it('flags deprecated API calls', () => {
      const code = `const clean = unescape(str);`;
      const matches = analyzeSonarLint(code);
      expect(matches.some((m) => m.ruleKey === 'typescript:S1874')).toBe(true);
    });

    it('detects potential SSRF security hotspots', () => {
      const code = `const res = await fetch(req.body.targetUrl);`;
      const matches = analyzeSonarLint(code);
      expect(matches.some((m) => m.ruleKey === 'typescript:S5144')).toBe(true);
    });
  });

  describe('Snyk Security', () => {
    it('parses Snyk CLI JSON output with packages, CVEs, and fix versions', () => {
      const snykJson = JSON.stringify({
        vulnerabilities: [
          {
            id: 'SNYK-JS-LODASH-1018905',
            title: 'Prototype Pollution',
            packageName: 'lodash',
            version: '4.17.15',
            severity: 'high',
            identifiers: { CVE: ['CVE-2020-8203'] },
            cvssScore: 7.4,
            fixedIn: ['4.17.21'],
          },
        ],
      });

      const issues = parseSnykJsonOutput(snykJson);
      expect(issues).toHaveLength(1);

      const issue = issues[0];
      expect(issue.id).toBe('SNYK-JS-LODASH-1018905');
      expect(issue.packageName).toBe('lodash');
      expect(issue.severity).toBe('HIGH');
      expect(issue.cve).toBe('CVE-2020-8203');
      expect(issue.cvssScore).toBe(7.4);
      expect(issue.fixedIn).toEqual(['4.17.21']);
    });

    it('builds Snyk CLI arguments safely', () => {
      const args = buildSnykCliArgs('./package.json', {
        severityThreshold: 'high',
        allProjects: true,
      });

      expect(args[0]).toBe('snyk');
      expect(args[1]).toBe('test');
      expect(args).toContain('./package.json');
      expect(args).toContain('--severity-threshold=high');
      expect(args).toContain('--all-projects');
      expect(args).toContain('--json');
    });
  });

  describe('CodeQL SARIF Parser', () => {
    it('parses SARIF 2.1.0 output and converts to uniform diagnostics', () => {
      const sarif = JSON.stringify({
        version: '2.1.0',
        runs: [
          {
            results: [
              {
                ruleId: 'js/sql-injection',
                level: 'error',
                message: { text: 'Untrusted user input flows to SQL query' },
                locations: [
                  {
                    physicalLocation: {
                      artifactLocation: { uri: 'src/db.ts' },
                      region: { startLine: 42, startColumn: 8 },
                    },
                  },
                ],
              },
            ],
          },
        ],
      });

      const sarifResults = parseSarifReport(sarif);
      expect(sarifResults).toHaveLength(1);
      expect(sarifResults[0].ruleId).toBe('js/sql-injection');

      const diagnostics = convertSarifToDiagnostics(sarifResults);
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].source).toBe('codeql');
      expect(diagnostics[0].severity).toBe('HIGH');
      expect(diagnostics[0].file).toBe('src/db.ts');
      expect(diagnostics[0].line).toBe(42);
    });

    it('builds CodeQL database analysis CLI arguments', () => {
      const args = buildCodeQlCliArgs('database analyze', './codeql-db', {
        format: 'sarif-latest',
        output: 'codeql-results.sarif',
      });

      expect(args).toEqual([
        'codeql',
        'database',
        'analyze',
        './codeql-db',
        '--format=sarif-latest',
        '--output=codeql-results.sarif',
      ]);
    });
  });

  describe('Trivy Scanner', () => {
    it('parses Trivy JSON scan findings with severities and titles', () => {
      const trivyJson = JSON.stringify({
        Results: [
          {
            Target: 'package-lock.json',
            Vulnerabilities: [
              {
                VulnerabilityID: 'CVE-2023-26136',
                PkgName: 'tough-cookie',
                InstalledVersion: '2.5.0',
                FixedVersion: '4.1.3',
                Severity: 'CRITICAL',
                Title: 'Prototype Pollution in tough-cookie',
                PrimaryURL: 'https://avd.aquasec.com/nvd/cve-2023-26136',
              },
            ],
          },
        ],
      });

      const vulns = parseTrivyJsonOutput(trivyJson);
      expect(vulns).toHaveLength(1);
      expect(vulns[0].vulnId).toBe('CVE-2023-26136');
      expect(vulns[0].pkgName).toBe('tough-cookie');
      expect(vulns[0].severity).toBe('CRITICAL');
      expect(vulns[0].fixedVersion).toBe('4.1.3');
    });

    it('builds Trivy filesystem scan CLI arguments', () => {
      const args = buildTrivyCliArgs('.', 'fs', {
        severity: 'HIGH,CRITICAL',
        exitCode: 1,
        ignoreUnfixed: true,
      });

      expect(args).toEqual([
        'trivy',
        'fs',
        '.',
        '--format',
        'json',
        '--severity',
        'HIGH,CRITICAL',
        '--exit-code',
        '1',
        '--ignore-unfixed',
      ]);
    });
  });

  describe('OWASP Dependency Check', () => {
    it('evaluates CVSS v3 score risk thresholds', () => {
      expect(evaluateCvssRisk(9.8)).toBe('CRITICAL');
      expect(evaluateCvssRisk(7.5)).toBe('HIGH');
      expect(evaluateCvssRisk(5.3)).toBe('MEDIUM');
      expect(evaluateCvssRisk(3.1)).toBe('LOW');
      expect(evaluateCvssRisk(0)).toBe('INFO');
    });

    it('parses OWASP Dependency Check report findings', () => {
      const owaspJson = JSON.stringify({
        dependencies: [
          {
            fileName: 'log4j-core-2.14.1.jar',
            filePath: '/libs/log4j-core-2.14.1.jar',
            packages: [{ id: 'pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1' }],
            vulnerabilities: [
              {
                name: 'CVE-2021-44228',
                description: 'Remote code execution via JNDI lookup',
                cvssv3: {
                  baseScore: 10.0,
                  baseSeverity: 'CRITICAL',
                },
              },
            ],
          },
        ],
      });

      const findings = parseOwaspReport(owaspJson);
      expect(findings).toHaveLength(1);
      expect(findings[0].fileName).toBe('log4j-core-2.14.1.jar');
      expect(findings[0].cve).toBe('CVE-2021-44228');
      expect(findings[0].cvssV3?.score).toBe(10.0);
      expect(findings[0].cvssV3?.baseSeverity).toBe('CRITICAL');
    });
  });
});
