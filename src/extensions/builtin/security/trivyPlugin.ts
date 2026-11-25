import type { TrivyVulnerability, VulnerabilitySeverity } from './types';

/**
 * Parses Trivy JSON vulnerability scanner report.
 */
export function parseTrivyJsonOutput(jsonString: string): TrivyVulnerability[] {
  const vulns: TrivyVulnerability[] = [];

  try {
    const data = JSON.parse(jsonString);
    const results = Array.isArray(data.Results) ? data.Results : [];

    for (const r of results) {
      const items = Array.isArray(r.Vulnerabilities) ? r.Vulnerabilities : [];

      for (const item of items) {
        const vulnId = item.VulnerabilityID || 'TRIVY-UNKNOWN';
        const pkgName = item.PkgName || 'unknown-package';
        const installedVersion = item.InstalledVersion || 'unknown';
        const fixedVersion = item.FixedVersion;
        const severity = (item.Severity ? item.Severity.toUpperCase() : 'MEDIUM') as VulnerabilitySeverity;
        const title = item.Title || item.Description?.slice(0, 80) || 'Security vulnerability';
        const primaryUrl = item.PrimaryURL;

        vulns.push({
          vulnId,
          pkgName,
          installedVersion,
          fixedVersion,
          severity,
          title,
          primaryUrl,
        });
      }
    }
  } catch {
    return [];
  }

  return vulns;
}

/**
 * Builds Trivy CLI execution arguments.
 */
export function buildTrivyCliArgs(
  target: string,
  type: 'fs' | 'image' | 'config' = 'fs',
  options: {
    severity?: string;
    exitCode?: number;
    ignoreUnfixed?: boolean;
  } = {}
): string[] {
  const args = ['trivy', type, target, '--format', 'json'];

  if (options.severity) {
    args.push('--severity', options.severity);
  }

  if (options.exitCode !== undefined) {
    args.push('--exit-code', String(options.exitCode));
  }

  if (options.ignoreUnfixed) {
    args.push('--ignore-unfixed');
  }

  return args;
}
