import type { FileCoverage } from './types';

/**
 * Parses LCOV test coverage data string into structured file coverage reports.
 */
export function parseLcovCoverage(lcovText: string): Map<string, FileCoverage> {
  const report = new Map<string, FileCoverage>();
  const lines = lcovText.replace(/\r\n/g, '\n').split('\n');

  let currentFile: string | null = null;
  let linesFound = 0;
  let linesHit = 0;
  let lineDetails = new Map<number, number>();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('SF:')) {
      currentFile = line.slice(3).trim();
      linesFound = 0;
      linesHit = 0;
      lineDetails = new Map<number, number>();
      continue;
    }

    if (line.startsWith('DA:') && currentFile) {
      // DA:<line number>,<execution count>[,<checksum>]
      const parts = line.slice(3).split(',');
      const lineNum = parseInt(parts[0], 10);
      const hitCount = parseInt(parts[1], 10);
      lineDetails.set(lineNum, hitCount);
      continue;
    }

    if (line.startsWith('LF:')) {
      linesFound = parseInt(line.slice(3), 10);
      continue;
    }

    if (line.startsWith('LH:')) {
      linesHit = parseInt(line.slice(3), 10);
      continue;
    }

    if (line === 'end_of_record' && currentFile) {
      const coveragePercent = linesFound > 0 ? (linesHit / linesFound) * 100 : 100;
      report.set(currentFile, {
        sourceFile: currentFile,
        linesFound,
        linesHit,
        coveragePercent: Math.round(coveragePercent * 10) / 10,
        lineDetails,
      });
      currentFile = null;
    }
  }

  return report;
}

/**
 * Returns coverage status for a specific line number in a file.
 */
export function getLineCoverageStatus(
  coverage: FileCoverage,
  line: number
): 'covered' | 'uncovered' | 'none' {
  if (!coverage.lineDetails.has(line)) {
    return 'none';
  }

  const hits = coverage.lineDetails.get(line) || 0;
  return hits > 0 ? 'covered' : 'uncovered';
}
