import { describe, it, expect } from 'vitest';
import { parseSemVer, compareSemVer, isNewerVersion } from '../main/updater';

describe('SemVer 2.0.0 Pre-release Rules (P2 Finding)', () => {
  it('parses major, minor, patch, and dot-separated prerelease parts', () => {
    const parsed = parseSemVer('v1.2.3-beta.4+build.2026');
    expect(parsed.major).toBe(1);
    expect(parsed.minor).toBe(2);
    expect(parsed.patch).toBe(3);
    expect(parsed.prerelease).toEqual(['beta', 4]);
    expect(parsed.build).toBe('build.2026');
  });

  it('correctly orders normal releases higher than pre-releases of same version', () => {
    // 1.0.0 > 1.0.0-rc.1
    expect(compareSemVer('1.0.0', '1.0.0-rc.1')).toBe(1);
    expect(compareSemVer('1.0.0-rc.1', '1.0.0')).toBe(-1);
    expect(isNewerVersion('1.0.0-rc.1', '1.0.0')).toBe(true);
    expect(isNewerVersion('1.0.0', '1.0.0-rc.1')).toBe(false);
  });

  it('correctly compares pre-release progression (alpha < beta < rc)', () => {
    expect(compareSemVer('1.0.0-alpha', '1.0.0-alpha.1')).toBe(-1);
    expect(compareSemVer('1.0.0-alpha.1', '1.0.0-alpha.beta')).toBe(-1);
    expect(compareSemVer('1.0.0-alpha.beta', '1.0.0-beta')).toBe(-1);
    expect(compareSemVer('1.0.0-beta', '1.0.0-beta.2')).toBe(-1);
    expect(compareSemVer('1.0.0-beta.2', '1.0.0-beta.11')).toBe(-1);
    expect(compareSemVer('1.0.0-beta.11', '1.0.0-rc.1')).toBe(-1);
    expect(compareSemVer('1.0.0-rc.1', '1.0.0')).toBe(-1);
  });

  it('numeric identifiers have lower precedence than non-numeric identifiers', () => {
    // 1.0.0-1 < 1.0.0-alpha
    expect(compareSemVer('1.0.0-1', '1.0.0-alpha')).toBe(-1);
    expect(compareSemVer('1.0.0-alpha', '1.0.0-1')).toBe(1);
  });

  it('numerical identifiers are compared as integers, not lexicographically', () => {
    // 1.0.0-beta.2 < 1.0.0-beta.10
    expect(compareSemVer('1.0.0-beta.2', '1.0.0-beta.10')).toBe(-1);
    expect(isNewerVersion('1.0.0-beta.2', '1.0.0-beta.10')).toBe(true);
    expect(isNewerVersion('1.0.0-beta.10', '1.0.0-beta.2')).toBe(false);
  });

  it('ignores build metadata in precedence comparison', () => {
    expect(compareSemVer('1.1.0+20260101', '1.1.0+20261124')).toBe(0);
    expect(isNewerVersion('1.1.0+1', '1.1.0+2')).toBe(false);
  });
});
