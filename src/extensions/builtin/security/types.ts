export type VulnerabilitySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface SecurityDiagnostic {
  ruleId: string;
  source: 'sonarlint' | 'snyk' | 'codeql' | 'trivy' | 'owasp';
  message: string;
  severity: VulnerabilitySeverity;
  file?: string;
  line?: number;
  column?: number;
  cve?: string;
  cwe?: string[];
  cvss?: number;
  fixRecommendation?: string;
}

export interface SonarLintRuleMatch {
  ruleKey: string;
  type: 'BUG' | 'VULNERABILITY' | 'CODE_SMELL' | 'SECURITY_HOTSPOT';
  severity: VulnerabilitySeverity;
  message: string;
  line: number;
}

export interface SnykIssue {
  id: string;
  title: string;
  packageName: string;
  version: string;
  severity: VulnerabilitySeverity;
  cve?: string;
  cvssScore?: number;
  fixedIn?: string[];
}

export interface CodeQlSarifResult {
  ruleId: string;
  level: 'error' | 'warning' | 'note';
  message: string;
  locations: { uri: string; line: number; column?: number }[];
}

export interface TrivyVulnerability {
  vulnId: string;
  pkgName: string;
  installedVersion: string;
  fixedVersion?: string;
  severity: VulnerabilitySeverity;
  title: string;
  primaryUrl?: string;
}

export interface OwaspDependencyFinding {
  fileName: string;
  filePath: string;
  cpe: string[];
  cve: string;
  cvssV3?: { score: number; baseSeverity: string };
  description: string;
}
