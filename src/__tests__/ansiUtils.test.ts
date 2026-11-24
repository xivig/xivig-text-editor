import { describe, it, expect } from 'vitest';
import { stripAnsi, parseAnsi, formatOutputTimestamp } from '../utils/ansi';

describe('ansi utility functions', () => {
  describe('stripAnsi', () => {
    it('returns raw text unchanged if no ANSI codes present', () => {
      expect(stripAnsi('Hello world')).toBe('Hello world');
      expect(stripAnsi('')).toBe('');
    });

    it('strips standard color codes', () => {
      expect(stripAnsi('\u001b[33m5\u001b[39m')).toBe('5');
      expect(stripAnsi('\u001b[31mError:\u001b[0m File not found')).toBe('Error: File not found');
    });

    it('strips bright colors, bold, and compound codes', () => {
      expect(stripAnsi('\u001b[1;32m[Running]\u001b[0m node a.js')).toBe('[Running] node a.js');
      expect(stripAnsi('\u001b[90mdebug trace\u001b[0m')).toBe('debug trace');
    });

    it('strips cursor and OSC codes', () => {
      expect(stripAnsi('\u001b[2K\u001b[0GCompiling...')).toBe('Compiling...');
    });
  });

  describe('parseAnsi', () => {
    it('returns empty array for empty string', () => {
      expect(parseAnsi('')).toEqual([]);
    });

    it('returns single unstyled span for plain text', () => {
      expect(parseAnsi('plain output')).toEqual([{ text: 'plain output' }]);
    });

    it('parses yellow number output from Node.js (\\u001b[33m5\\u001b[39m)', () => {
      const spans = parseAnsi('\u001b[33m5\u001b[39m');
      expect(spans).toHaveLength(1);
      expect(spans[0].text).toBe('5');
      expect(spans[0].color).toBe('#e5c07b');
    });

    it('parses multiple segments with different colors', () => {
      const spans = parseAnsi('Status: \u001b[32mOK\u001b[0m - \u001b[31mFailed: 0\u001b[0m');
      expect(spans).toHaveLength(4);
      expect(spans[0]).toEqual({ text: 'Status: ', bold: undefined, color: undefined, backgroundColor: undefined, dim: undefined, italic: undefined, underline: undefined });
      expect(spans[1].text).toBe('OK');
      expect(spans[1].color).toBe('#98c379');
      expect(spans[2].text).toBe(' - ');
      expect(spans[3].text).toBe('Failed: 0');
      expect(spans[3].color).toBe('#e06c75');
    });

    it('handles bold and underline modifiers', () => {
      const spans = parseAnsi('\u001b[1;4;34mImportant\u001b[0m');
      expect(spans).toHaveLength(1);
      expect(spans[0].text).toBe('Important');
      expect(spans[0].bold).toBe(true);
      expect(spans[0].underline).toBe(true);
      expect(spans[0].color).toBe('#61afef');
    });

    it('handles 256-color palette', () => {
      const spans = parseAnsi('\u001b[38;5;196mRed 196\u001b[0m');
      expect(spans).toHaveLength(1);
      expect(spans[0].text).toBe('Red 196');
      expect(spans[0].color).toBeDefined();
    });

    it('handles 24-bit truecolor RGB', () => {
      const spans = parseAnsi('\u001b[38;2;255;128;0mOrange\u001b[0m');
      expect(spans).toHaveLength(1);
      expect(spans[0].text).toBe('Orange');
      expect(spans[0].color).toBe('rgb(255, 128, 0)');
    });
  });

  describe('formatOutputTimestamp', () => {
    it('formats a Date object to hh:mm:ss AM/PM', () => {
      const d = new Date(2026, 10, 24, 18, 45, 2);
      expect(formatOutputTimestamp(d)).toBe('06:45:02 PM');
    });

    it('formats a morning Date object', () => {
      const d = new Date(2026, 10, 24, 9, 5, 8);
      expect(formatOutputTimestamp(d)).toBe('09:05:08 AM');
    });

    it('normalizes string timestamps to standard 11-character width', () => {
      expect(formatOutputTimestamp('6:45:02 pm')).toBe('06:45:02 PM');
      expect(formatOutputTimestamp('12:45:02 PM')).toBe('12:45:02 PM');
      expect(formatOutputTimestamp('18:45:02')).toBe('06:45:02 PM');
    });
  });
});
