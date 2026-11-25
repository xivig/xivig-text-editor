import type { SnykIssue, VulnerabilitySeverity } from './types';

/**
 * Parses Snyk CLI JSON output format.
 */
export function parseSnykJsonOutput(jsonString: string): SnykIssue[] {
  const issues: SnykIssue[] = [];

  try {
    const data = JSON.parse(jsonString);
    const vulns = Array.isArray(data.vulnerabilities) ? data.vulnerabilities : [];

    for (const v of vulns) {
      const id = v.id || 'SNYK-UNKNOWN';
      const title = v.title || 'Security Vulnerability';
      const packageName = v.packageName || v.name || 'unknown';
      const version = v.version || 'unknown';
      const severity = (v.severity ? v.severity.toUpperCase() : 'MEDIUM') as VulnerabilitySeverity;

      const cve = Array.isArray(v.identifiers?.CVE) ? v.identifiers.CVE[0] : undefined;
      const cvssScore = typeof v.cvssScore === 'number' ? v.cvssScore : undefined;
      const fixedIn = Array.isArray(v.fixedIn) ? v.fixedIn : undefined;

      issues.push({
        id,
        title,
        packageName,
        version,
        severity,
        cve,
        cvssScore,
        fixedIn,
      });
    }
  } catch {
    return [];
  }

  return issues;
}

/**
 * Builds safe CLI argument list for running Snyk security scans.
 */
export function buildSnykCliArgs(
  targetPath?: string,
  options: {
    severityThreshold?: 'low' | 'medium' | 'high' | 'critical';
    allProjects?: boolean;
    json?: boolean;
  } = {}
): string[] {
  const args = ['snyk', 'test'];

  if (targetPath) {
    args.push(targetPath);
  }

  if (options.severityThreshold) {
    args.push(`--severity-threshold=${options.severityThreshold}`);
  }

  if (options.allProjects) {
    args.push('--all-projects');
  }

  if (options.json !== false) {
    args.push('--json');
  }

  return args;
}
