/**
 * Parses dependencies from Cargo.toml with their line numbers for inline lens indicators.
 */
export function parseCratesDependencies(
  cargoTomlContent: string
): Array<{ name: string; currentVersion: string; line: number }> {
  if (!cargoTomlContent || !cargoTomlContent.trim()) return [];

  const results: Array<{ name: string; currentVersion: string; line: number }> = [];
  const lines = cargoTomlContent.split(/\r?\n/);
  let inDependencies = false;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();
    const lineNum = idx + 1;

    if (!trimmed || trimmed.startsWith('#')) continue;

    if (/^\[(?:dev-)?dependencies\]$/i.test(trimmed)) {
      inDependencies = true;
      continue;
    } else if (trimmed.startsWith('[')) {
      inDependencies = false;
      continue;
    }

    if (inDependencies) {
      const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*(?:["']([^"']+)["']|\{\s*version\s*=\s*["']([^"']+)["'])/);
      if (match) {
        const name = match[1];
        const version = match[2] || match[3] || '*';
        results.push({
          name,
          currentVersion: version,
          line: lineNum,
        });
      }
    }
  }

  return results;
}

/**
 * Checks if current dependencies have updates available in crates.io registry.
 */
export function checkCratesUpdates(
  currentDeps: Array<{ name: string; currentVersion: string }>,
  registry: Record<string, string> = {}
): Array<{ name: string; current: string; latest: string; hasUpdate: boolean }> {
  return currentDeps.map((dep) => {
    const latest = registry[dep.name] || dep.currentVersion;
    const cleanCurrent = dep.currentVersion.replace(/^[\^~>=<]/, '');
    const cleanLatest = latest.replace(/^[\^~>=<]/, '');

    const hasUpdate = cleanCurrent !== cleanLatest && latest !== '*';

    return {
      name: dep.name,
      current: dep.currentVersion,
      latest,
      hasUpdate,
    };
  });
}
