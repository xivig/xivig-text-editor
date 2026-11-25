import type { CodeQlSarifResult, SecurityDiagnostic } from './types';

/**
 * Parses SARIF (Static Analysis Results Interchange Format) 2.1.0 output from CodeQL.
 */
export function parseSarifReport(sarifJsonString: string): CodeQlSarifResult[] {
  const results: CodeQlSarifResult[] = [];

  try {
    const sarif = JSON.parse(sarifJsonString);
    const runs = Array.isArray(sarif.runs) ? sarif.runs : [];

    for (const run of runs) {
      const runResults = Array.isArray(run.results) ? run.results : [];

      for (const res of runResults) {
        const ruleId = res.ruleId || 'unknown-rule';
        const level: 'error' | 'warning' | 'note' = res.level === 'error' ? 'error' : res.level === 'note' ? 'note' : 'warning';
        const message = res.message?.text || 'CodeQL diagnostic';

        const locations: { uri: string; line: number; column?: number }[] = [];
        if (Array.isArray(res.locations)) {
          for (const loc of res.locations) {
            const phys = loc.physicalLocation;
            const uri = phys?.artifactLocation?.uri || '';
            const line = phys?.region?.startLine || 1;
            const column = phys?.region?.startColumn;
            locations.push({ uri, line, column });
          }
        }

        results.push({
          ruleId,
          level,
          message,
          locations,
        });
      }
    }
  } catch {
    return [];
  }

  return results;
}

/**
 * Converts CodeQL SARIF results into uniform SecurityDiagnostics.
 */
export function convertSarifToDiagnostics(results: CodeQlSarifResult[]): SecurityDiagnostic[] {
  return results.map((res) => {
    const loc = res.locations[0];
    const severity = res.level === 'error' ? 'HIGH' : res.level === 'warning' ? 'MEDIUM' : 'INFO';

    return {
      ruleId: res.ruleId,
      source: 'codeql',
      message: res.message,
      severity,
      file: loc?.uri,
      line: loc?.line,
      column: loc?.column,
    };
  });
}

/**
 * Builds CodeQL CLI execution arguments safely.
 */
export function buildCodeQlCliArgs(
  subcommand: 'database create' | 'database analyze',
  dbPath: string,
  options: {
    language?: string;
    sourceRoot?: string;
    format?: string;
    output?: string;
  } = {}
): string[] {
  const parts = subcommand.split(' ');
  const args = ['codeql', ...parts, dbPath];

  if (options.language) {
    args.push(`--language=${options.language}`);
  }

  if (options.sourceRoot) {
    args.push(`--source-root=${options.sourceRoot}`);
  }

  if (options.format) {
    args.push(`--format=${options.format}`);
  }

  if (options.output) {
    args.push(`--output=${options.output}`);
  }

  return args;
}
