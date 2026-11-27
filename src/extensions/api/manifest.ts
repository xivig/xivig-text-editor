import { ExtensionManifest } from './types';

const APP_VERSION = '2.0.4';

export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates an extension manifest against required fields, semver structure, and permission schemas.
 */
export function validateExtensionManifest(manifest: unknown): ManifestValidationResult {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest must be a non-null object'] };
  }

  const m = manifest as Record<string, any>;

  if (!m.id || typeof m.id !== 'string' || !/^[a-z0-9_.-]+$/i.test(m.id)) {
    errors.push('Manifest "id" must be a non-empty alphanumeric string (hyphens, dots, underscores permitted)');
  }

  if (!m.name || typeof m.name !== 'string') {
    errors.push('Manifest "name" is required and must be a string');
  }

  if (!m.publisher || typeof m.publisher !== 'string') {
    errors.push('Manifest "publisher" is required and must be a string');
  }

  if (!m.version || typeof m.version !== 'string' || !/^\d+\.\d+\.\d+/.test(m.version)) {
    errors.push('Manifest "version" must follow semantic versioning (e.g., 1.0.0)');
  }

  if (!m.engines || typeof m.engines !== 'object' || !m.engines.xivig) {
    errors.push('Manifest "engines.xivig" requirement is missing (e.g., ">=1.2.0")');
  }

  if (m.permissions && !Array.isArray(m.permissions)) {
    errors.push('Manifest "permissions" must be an array of permission strings');
  }

  if (m.contributes) {
    if (typeof m.contributes !== 'object') {
      errors.push('Manifest "contributes" must be an object');
    } else {
      if (m.contributes.settings && !Array.isArray(m.contributes.settings)) {
        errors.push('Manifest "contributes.settings" must be an array');
      }
      if (m.contributes.commands && !Array.isArray(m.contributes.commands)) {
        errors.push('Manifest "contributes.commands" must be an array');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Simple semver compatibility checker for Xivig engine version.
 */
export function isEngineCompatible(engineRange: string, currentVersion = APP_VERSION): boolean {
  if (!engineRange || engineRange === '*' || engineRange === 'any') return true;
  const conditions = engineRange.trim().split(/\s+/);

  for (const cond of conditions) {
    if (cond === '*') continue;

    if (cond.startsWith('^')) {
      const base = cond.slice(1);
      const [major] = base.split('.').map((n) => parseInt(n, 10));
      const [curMajor] = currentVersion.split('.').map((n) => parseInt(n, 10));
      if (curMajor !== major || compareSemver(currentVersion, base) < 0) {
        return false;
      }
    } else if (cond.startsWith('>=')) {
      const base = cond.slice(2);
      if (compareSemver(currentVersion, base) < 0) return false;
    } else if (cond.startsWith('<=')) {
      const base = cond.slice(2);
      if (compareSemver(currentVersion, base) > 0) return false;
    } else if (cond.startsWith('>')) {
      const base = cond.slice(1);
      if (compareSemver(currentVersion, base) <= 0) return false;
    } else if (cond.startsWith('<')) {
      const base = cond.slice(1);
      if (compareSemver(currentVersion, base) >= 0) return false;
    } else if (cond.startsWith('=')) {
      const base = cond.slice(1);
      if (compareSemver(currentVersion, base) !== 0) return false;
    } else {
      if (compareSemver(currentVersion, cond) !== 0) return false;
    }
  }

  return true;
}

function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((x) => parseInt(x, 10) || 0);
  const pb = b.split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}
