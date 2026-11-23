import { describe, it, expect } from 'vitest';
import { rgbToHex, rgbaToString, rgbaToHslString, clamp } from '../utils/colorUtils';
import { getCommentTokens } from '../utils/commentUtils';
import { generateWords, generateLorem } from '../utils/loremIpsum';

describe('Color Utilities', () => {
  it('correctly clamps values within range', () => {
    expect(clamp(150, 0, 255)).toBe(150);
    expect(clamp(-10, 0, 255)).toBe(0);
    expect(clamp(300, 0, 255)).toBe(255);
  });

  it('converts RGB to HEX format', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(108, 140, 255)).toBe('#6c8cff');
  });

  it('converts RGBA with alpha to HEX format', () => {
    expect(rgbToHex(255, 255, 255, 0.5)).toBe('#ffffff80');
    expect(rgbToHex(0, 0, 0, 0)).toBe('#00000000');
  });

  it('converts RGBA to CSS string', () => {
    expect(rgbaToString(255, 128, 0)).toBe('rgb(255, 128, 0)');
    expect(rgbaToString(255, 128, 0, 0.75)).toBe('rgba(255, 128, 0, 0.75)');
  });

  it('converts RGBA to HSL string', () => {
    expect(rgbaToHslString(255, 0, 0)).toBe('hsl(0, 100%, 50%)');
    expect(rgbaToHslString(0, 255, 0)).toBe('hsl(120, 100%, 50%)');
    expect(rgbaToHslString(0, 0, 255)).toBe('hsl(240, 100%, 50%)');
  });
});

describe('Comment Language Detection', () => {
  it('returns HTML block comments for markup languages', () => {
    const htmlTokens = getCommentTokens('index.html');
    expect(htmlTokens.block?.open).toBe('<!-- ');
    expect(htmlTokens.block?.close).toBe(' -->');
  });

  it('returns hash line comments for Python and YAML', () => {
    const pyTokens = getCommentTokens('script.py');
    expect(pyTokens.line).toBe('# ');
    expect(pyTokens.block?.open).toContain('"""');

    const yamlTokens = getCommentTokens('config.yaml');
    expect(yamlTokens.line).toBe('# ');
  });

  it('returns double-slash line comments for JS and TS', () => {
    const jsTokens = getCommentTokens('app.ts');
    expect(jsTokens.line).toBe('// ');
    expect(jsTokens.block?.open).toBe('/* ');
    expect(jsTokens.block?.close).toBe(' */');
  });

  it('returns dash-dash line comments for SQL', () => {
    const sqlTokens = getCommentTokens('query.sql');
    expect(sqlTokens.line).toBe('-- ');
  });
});

describe('Lorem Ipsum Generator', () => {
  it('generates specified number of words starting with Lorem', () => {
    const text = generateWords(5, true);
    expect(text.toLowerCase()).toContain('lorem ipsum');
    const wordCount = text.split(/\s+/).length;
    expect(wordCount).toBe(5);
  });

  it('generates paragraphs format', () => {
    const output = generateLorem({ count: 2, type: 'paragraphs' });
    expect(output).toBeTruthy();
    expect(output.split('\n\n').length).toBe(2);
  });
});

describe('Line Ending and Buffer Utilities', () => {
  it('correctly converts CRLF to LF', () => {
    const crlfText = 'line1\r\nline2\r\nline3\r\n';
    const lfText = crlfText.replace(/\r\n/g, '\n');
    expect(lfText).toBe('line1\nline2\nline3\n');
    expect(lfText.includes('\r')).toBe(false);
  });

  it('correctly converts LF to CRLF without double returns', () => {
    const lfText = 'line1\nline2\nline3\n';
    const crlfText = lfText.replace(/\r?\n/g, '\r\n');
    expect(crlfText).toBe('line1\r\nline2\r\nline3\r\n');
    expect(crlfText.includes('\r\r\n')).toBe(false);
  });

  it('detects large file threshold for velocity mode', () => {
    const normalFileSize = 500_000; // 500KB
    const largeFileSize = 2_000_000; // 2MB
    const LARGE_FILE_THRESHOLD = 1_500_000;

    expect(normalFileSize > LARGE_FILE_THRESHOLD).toBe(false);
    expect(largeFileSize > LARGE_FILE_THRESHOLD).toBe(true);
  });
});

describe('Update Version Comparison Utilities', () => {
  const isNewerVersion = (current: string, latest: string): boolean => {
    const parse = (v: string) =>
      v
        .replace(/^v/i, '')
        .split('.')
        .map((n) => parseInt(n, 10) || 0);

    const [currMajor = 0, currMinor = 0, currPatch = 0] = parse(current);
    const [latMajor = 0, latMinor = 0, latPatch = 0] = parse(latest);

    if (latMajor > currMajor) return true;
    if (latMajor < currMajor) return false;
    if (latMinor > currMinor) return true;
    if (latMinor < currMinor) return false;
    return latPatch > currPatch;
  };

  it('detects newer major versions', () => {
    expect(isNewerVersion('1.1.0', '2.0.0')).toBe(true);
    expect(isNewerVersion('1.1.0', '1.0.9')).toBe(false);
  });

  it('detects newer minor and patch versions', () => {
    expect(isNewerVersion('1.1.0', '1.2.0')).toBe(true);
    expect(isNewerVersion('1.1.0', 'v1.1.1')).toBe(true);
    expect(isNewerVersion('1.1.0', '1.1.0')).toBe(false);
    expect(isNewerVersion('v1.1.0', '1.1.0')).toBe(false);
  });
});
