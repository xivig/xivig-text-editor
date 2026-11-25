import { CargoPackage, CargoDependency } from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

const TOML_CARGO_SECTIONS = [
  '[package]\nname = "my_crate"\nversion = "0.1.0"\nedition = "2021"',
  '[dependencies]\n',
  '[dev-dependencies]\n',
  '[build-dependencies]\n',
  '[features]\ndefault = []\n',
  '[workspace]\nmembers = []\n',
  '[profile.release]\nopt-level = 3\nlto = true',
];

/**
 * Parses Cargo.toml manifest into a typed CargoPackage model.
 */
export function parseCargoToml(tomlContent: string): CargoPackage | null {
  if (!tomlContent || !tomlContent.trim()) return null;

  const lines = tomlContent.split(/\r?\n/);
  let currentSection = '';

  let pkgName = '';
  let pkgVersion = '';
  let pkgEdition = '2021';
  const dependencies: Record<string, CargoDependency> = {};
  const devDependencies: Record<string, CargoDependency> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const secMatch = trimmed.match(/^\[([a-zA-Z0-9_.-]+)\]$/);
    if (secMatch) {
      currentSection = secMatch[1].toLowerCase();
      continue;
    }

    const kvMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*(.+)$/);
    if (!kvMatch) continue;

    const key = kvMatch[1].trim();
    const rawVal = kvMatch[2].trim();

    if (currentSection === 'package') {
      const cleanVal = rawVal.replace(/^["']|["']$/g, '');
      if (key === 'name') pkgName = cleanVal;
      else if (key === 'version') pkgVersion = cleanVal;
      else if (key === 'edition') pkgEdition = cleanVal;
    } else if (currentSection === 'dependencies' || currentSection === 'dev-dependencies') {
      const targetMap = currentSection === 'dependencies' ? dependencies : devDependencies;

      if (rawVal.startsWith('{')) {
        // Table dependency: { version = "1.0", features = ["derive"] }
        const verMatch = rawVal.match(/version\s*=\s*["']([^"']+)["']/);
        const featMatch = rawVal.match(/features\s*=\s*\[([^\]]+)\]/);
        const features = featMatch
          ? featMatch[1].split(',').map((f) => f.trim().replace(/^["']|["']$/g, ''))
          : undefined;

        targetMap[key] = {
          name: key,
          version: verMatch?.[1] || '*',
          features,
        };
      } else {
        // String dependency: serde = "1.0"
        const cleanVer = rawVal.replace(/^["']|["']$/g, '');
        targetMap[key] = {
          name: key,
          version: cleanVer,
        };
      }
    }
  }

  if (!pkgName && Object.keys(dependencies).length === 0) {
    return null;
  }

  return {
    name: pkgName,
    version: pkgVersion,
    edition: pkgEdition,
    dependencies,
    devDependencies,
  };
}

/**
 * Validates basic Cargo.toml structure and semantic versions.
 */
export function validateCargoToml(tomlContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const parsed = parseCargoToml(tomlContent);

  if (!parsed) {
    return { valid: false, errors: ['Invalid or unparseable Cargo.toml manifest'] };
  }

  if (!parsed.name) {
    errors.push('Missing "name" under [package]');
  }

  if (!parsed.version) {
    errors.push('Missing "version" under [package]');
  } else {
    const semverRegex = /^[0-9]+\.[0-9]+(\.[0-9]+)?/;
    if (!semverRegex.test(parsed.version)) {
      errors.push(`Invalid semantic version '${parsed.version}' in [package]`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Autocompletion for Cargo.toml sections.
 */
export function createTomlCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\[?[a-zA-Z0-9_.-]*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const norm = word.text.toLowerCase();
    const options: any[] = [];

    for (const sec of TOML_CARGO_SECTIONS) {
      if (sec.toLowerCase().startsWith(norm)) {
        options.push({
          label: sec,
          type: 'snippet',
          detail: 'Cargo.toml Section',
          boost: 3,
        });
      }
    }

    if (options.length === 0) return null;

    return {
      from: word.from,
      options,
    };
  };
}
