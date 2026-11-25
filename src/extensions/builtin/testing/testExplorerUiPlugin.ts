import type { TestRunSummary, UnifiedTestItem } from './types';

export class TestExplorerController {
  private rootItems: Map<string, UnifiedTestItem> = new Map();

  public registerItem(item: UnifiedTestItem): void {
    this.rootItems.set(item.id, item);
  }

  public getItem(id: string): UnifiedTestItem | undefined {
    return this.rootItems.get(id);
  }

  public getAllRoots(): UnifiedTestItem[] {
    return Array.from(this.rootItems.values());
  }

  public updateStatus(id: string, status: UnifiedTestItem['status'], durationMs?: number, error?: string): boolean {
    const updateRecursive = (item: UnifiedTestItem): boolean => {
      if (item.id === id) {
        item.status = status;
        if (durationMs !== undefined) item.durationMs = durationMs;
        if (error !== undefined) item.error = error;
        return true;
      }
      if (item.children) {
        for (const child of item.children) {
          if (updateRecursive(child)) return true;
        }
      }
      return false;
    };

    for (const root of this.rootItems.values()) {
      if (updateRecursive(root)) return true;
    }
    return false;
  }

  /**
   * Aggregates execution statistics across all registered test trees.
   */
  public getSummary(): TestRunSummary {
    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let durationMs = 0;

    const countItem = (item: UnifiedTestItem) => {
      if (item.type === 'test') {
        total++;
        if (item.status === 'passed') passed++;
        else if (item.status === 'failed') failed++;
        else if (item.status === 'skipped') skipped++;
        durationMs += item.durationMs || 0;
      }
      if (item.children) {
        for (const child of item.children) {
          countItem(child);
        }
      }
    };

    for (const root of this.rootItems.values()) {
      countItem(root);
    }

    return { total, passed, failed, skipped, durationMs };
  }

  public clear(): void {
    this.rootItems.clear();
  }
}

export const globalTestExplorer = new TestExplorerController();

/**
 * Extracts test describe and test/it blocks from code to populate test tree.
 */
export function extractTestStructureFromCode(code: string, filename = 'test.spec.ts'): UnifiedTestItem {
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  const rootSuite: UnifiedTestItem = {
    id: filename,
    label: filename,
    file: filename,
    type: 'suite',
    status: 'enqueued',
    children: [],
  };

  let currentSuite = rootSuite;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Matches describe('title', ...) or suite('title', ...)
    const describeMatch = line.match(/\b(?:describe|suite)\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (describeMatch) {
      const suiteItem: UnifiedTestItem = {
        id: `${filename}:${lineNum}:suite`,
        label: describeMatch[1],
        file: filename,
        line: lineNum,
        type: 'suite',
        status: 'enqueued',
        children: [],
      };
      rootSuite.children?.push(suiteItem);
      currentSuite = suiteItem;
      continue;
    }

    // Matches it('title', ...) or test('title', ...)
    const testMatch = line.match(/\b(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (testMatch) {
      const testItem: UnifiedTestItem = {
        id: `${filename}:${lineNum}:test`,
        label: testMatch[1],
        file: filename,
        line: lineNum,
        type: 'test',
        status: 'enqueued',
      };
      currentSuite.children?.push(testItem);
    }
  }

  return rootSuite;
}
