import { AmazonQSettings, SecurityVulnerability } from './types';

export const DEFAULT_AMAZON_Q_SETTINGS: AmazonQSettings = {
  enabled: true,
  region: 'us-east-1',
  enableSecurityScans: true,
  autoSuggestAwsCdk: true,
};

/**
 * Scans code for common security vulnerabilities (hardcoded secrets, SQL injection, insecure evals).
 */
export function scanCodeForSecurityVulnerabilities(code: string): SecurityVulnerability[] {
  const vulnerabilities: SecurityVulnerability[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Hardcoded AWS access key ID (AKIA...)
    const awsKeyMatch = /\b(AKIA[0-9A-Z]{16})\b/.exec(line);
    if (awsKeyMatch) {
      vulnerabilities.push({
        id: `vuln-aws-key-${i + 1}`,
        severity: 'CRITICAL',
        title: 'Hardcoded AWS Access Key',
        description: 'Hardcoded AWS access key ID detected. Move credentials to AWS Secrets Manager or environment variables.',
        line: i + 1,
        remediation: 'process.env.AWS_ACCESS_KEY_ID',
      });
    }

    // 2. Hardcoded private API keys / secrets
    const secretMatch = /(?:api[_-]?key|secret|password|token)\s*[:=]\s*["']([a-zA-Z0-9_\-]{16,})["']/i.exec(line);
    if (secretMatch && !awsKeyMatch) {
      vulnerabilities.push({
        id: `vuln-secret-${i + 1}`,
        severity: 'HIGH',
        title: 'Hardcoded API Secret',
        description: 'Plaintext secret or token committed in source code.',
        line: i + 1,
        remediation: 'Use environment variables or secure vault configuration.',
      });
    }

    // 3. Raw SQL string concatenation
    const sqlMatch = /(?:SELECT|INSERT|UPDATE|DELETE)\s+.*?\+\s*[a-zA-Z0-9_$]+/i.exec(line);
    if (sqlMatch) {
      vulnerabilities.push({
        id: `vuln-sql-${i + 1}`,
        severity: 'HIGH',
        title: 'Potential SQL Injection',
        description: 'String concatenation detected in SQL query statement.',
        line: i + 1,
        remediation: 'Use parameterized queries or prepared statements.',
      });
    }

    // 4. eval() execution
    const evalMatch = /\beval\s*\(/.exec(line);
    if (evalMatch && !line.trim().startsWith('//')) {
      vulnerabilities.push({
        id: `vuln-eval-${i + 1}`,
        severity: 'HIGH',
        title: 'Arbitrary Code Execution via eval()',
        description: 'eval() is dangerous and can execute untrusted user-supplied code.',
        line: i + 1,
        remediation: 'Refactor using structured parsers or JSON.parse().',
      });
    }
  }

  return vulnerabilities;
}
