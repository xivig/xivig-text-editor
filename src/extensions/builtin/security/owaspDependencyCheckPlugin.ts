import type { OwaspDependencyFinding, VulnerabilitySeverity } from './types';

/**
 * Evaluates CVSS v3 score into standardized severity level.
 */
export function evaluateCvssRisk(score: number): VulnerabilitySeverity {
  if (score >= 9.0) return 'CRITICAL';
  if (score >= 7.0) return 'HIGH';
  if (score >= 4.0) return 'MEDIUM';
  if (score > 0) return 'LOW';
  return 'INFO';
}

/**
 * Parses OWASP Dependency-Check JSON report format.
 */
export function parseOwaspReport(jsonString: string): OwaspDependencyFinding[] {
  const findings: OwaspDependencyFinding[] = [];

  try {
    const report = JSON.parse(jsonString);
    const deps = Array.isArray(report.dependencies) ? report.dependencies : [];

    for (const dep of deps) {
      const fileName = dep.fileName || 'unknown-artifact';
      const filePath = dep.filePath || '';
      const cpe = Array.isArray(dep.packages) ? dep.packages.map((p: { id?: string }) => p.id || '') : [];
      const vulns = Array.isArray(dep.vulnerabilities) ? dep.vulnerabilities : [];

      for (const v of vulns) {
        const cve = v.name || 'CVE-UNKNOWN';
        const description = v.description || '';
        const cvssScore = v.cvssv3?.baseScore ?? v.cvssv2?.score ?? 0;
        const baseSeverity = v.cvssv3?.baseSeverity || evaluateCvssRisk(cvssScore);

        findings.push({
          fileName,
          filePath,
          cpe,
          cve,
          cvssV3: {
            score: cvssScore,
            baseSeverity,
          },
          description,
        });
      }
    }
  } catch {
    return [];
  }

  return findings;
}
