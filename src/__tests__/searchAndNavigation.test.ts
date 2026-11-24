import { describe, it, expect, beforeEach } from 'vitest';
import { navigationHistory } from '../utils/navigationHistory';
import { extractDocumentSymbols } from '../components/editor/codeIntelligence';

describe('Search and Navigation Engine', () => {
  beforeEach(() => {
    navigationHistory.clear();
  });

  describe('Navigation History Stack (Alt+Left / Alt+Right)', () => {
    it('initializes with empty history and cannot navigate', () => {
      expect(navigationHistory.canGoBack()).toBe(false);
      expect(navigationHistory.canGoForward()).toBe(false);
    });

    it('pushes locations and enables back navigation', () => {
      navigationHistory.pushLocation({ docId: 'doc1', line: 10, col: 1 });
      navigationHistory.pushLocation({ docId: 'doc1', line: 50, col: 5 });

      expect(navigationHistory.canGoBack()).toBe(true);
      expect(navigationHistory.canGoForward()).toBe(false);
    });

    it('updates column without creating duplicate jump points for adjacent lines in same doc', () => {
      navigationHistory.pushLocation({ docId: 'doc1', line: 10, col: 1 });
      navigationHistory.pushLocation({ docId: 'doc1', line: 10, col: 15 });

      // Should coalesce same-line cursor movement
      expect(navigationHistory.canGoBack()).toBe(false);
    });

    it('supports cross-document jump locations', () => {
      navigationHistory.pushLocation({ docId: 'doc1', line: 10, col: 1 });
      navigationHistory.pushLocation({ docId: 'doc2', line: 20, col: 1 });
      navigationHistory.pushLocation({ docId: 'doc3', line: 30, col: 1 });

      expect(navigationHistory.canGoBack()).toBe(true);
      const backOk = navigationHistory.goBack();
      expect(backOk).toBe(true);
      expect(navigationHistory.canGoForward()).toBe(true);

      const fwdOk = navigationHistory.goForward();
      expect(fwdOk).toBe(true);
    });
  });

  describe('Document Symbol Extraction (Outline & Workspace Symbols)', () => {
    it('extracts JavaScript/TypeScript function and arrow declarations', () => {
      const code = `
export function calculateTax(amount: number) {
  return amount * 0.2;
}

const formatCurrency = (val: number) => {
  return '$' + val;
};
      `;

      const symbols = extractDocumentSymbols(code, 'typescript');
      expect(symbols.length).toBeGreaterThanOrEqual(2);

      const calc = symbols.find((s) => s.name.startsWith('calculateTax'));
      expect(calc).toBeDefined();
      expect(calc?.kind).toBe('function');
      expect(calc?.line).toBe(2);

      const fmt = symbols.find((s) => s.name.startsWith('formatCurrency'));
      expect(fmt).toBeDefined();
      expect(fmt?.kind).toBe('function');
      expect(fmt?.line).toBe(6);
    });

    it('extracts classes, interfaces, and methods', () => {
      const code = `
export class EditorManager {
  public focus(): void {
    // focus
  }
}

export interface EditorConfig {
  theme: string;
}
      `;

      const symbols = extractDocumentSymbols(code, 'typescript');
      const cls = symbols.find((s) => s.name === 'EditorManager');
      expect(cls).toBeDefined();
      expect(cls?.kind).toBe('class');

      const iface = symbols.find((s) => s.name === 'EditorConfig');
      expect(iface).toBeDefined();
      expect(iface?.kind).toBe('interface');

      const method = symbols.find((s) => s.name.startsWith('focus'));
      expect(method).toBeDefined();
      expect(method?.kind).toBe('method');
    });

    it('extracts Markdown outline headings with levels', () => {
      const doc = `
# Title
## Section 1
### Details
      `;

      const symbols = extractDocumentSymbols(doc, 'markdown');
      expect(symbols.length).toBe(3);
      expect(symbols[0].name).toBe('# Title');
      expect(symbols[0].detail).toBe('Level 1');
      expect(symbols[1].name).toBe('## Section 1');
      expect(symbols[1].detail).toBe('Level 2');
    });
  });

  describe('Go to Line and Column Parsing', () => {
    it('correctly matches line and column syntax patterns', () => {
      const parse = (q: string) => {
        const match = q.match(/^:(\d+)(?:[:,\s](\d+))?$/);
        if (!match) return null;
        return {
          line: parseInt(match[1], 10),
          col: match[2] ? parseInt(match[2], 10) : 1,
        };
      };

      expect(parse(':42')).toEqual({ line: 42, col: 1 });
      expect(parse(':42:15')).toEqual({ line: 42, col: 15 });
      expect(parse(':42,15')).toEqual({ line: 42, col: 15 });
      expect(parse(':42 15')).toEqual({ line: 42, col: 15 });
      expect(parse('invalid')).toBeNull();
    });
  });
});
