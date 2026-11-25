export type TestItemStatus = 'passed' | 'failed' | 'running' | 'skipped' | 'enqueued';

export interface UnifiedTestItem {
  id: string;
  label: string;
  file?: string;
  line?: number;
  type: 'suite' | 'test';
  status: TestItemStatus;
  durationMs?: number;
  error?: string;
  children?: UnifiedTestItem[];
}

export interface TestRunSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
}

export interface PlaywrightTestSpec {
  title: string;
  line: number;
  suite?: string;
  fixtures: string[];
}

export interface CypressTestSpec {
  title: string;
  line: number;
  suite?: string;
  cyCommands: string[];
}

export interface LineCoverage {
  lineNumber: number;
  hitCount: number;
  status: 'covered' | 'uncovered';
}

export interface FileCoverage {
  sourceFile: string;
  linesFound: number;
  linesHit: number;
  coveragePercent: number;
  lineDetails: Map<number, number>;
}
