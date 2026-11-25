import type { WslDistro } from './types';

/**
 * Parses wsl.exe -l -v table output into typed WslDistro list.
 * Strips UTF-16 null characters and handles Windows CLI artifacts.
 */
export function parseWslListOutput(output: string): WslDistro[] {
  const distros: WslDistro[] = [];
  // Strip null bytes (often emitted by Windows wsl.exe stdout in UTF-16)
  const clean = output.replace(/\0/g, '').replace(/\r\n/g, '\n');
  const lines = clean.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.toLowerCase().startsWith('name') || trimmed.includes('---')) {
      continue;
    }

    const isDefault = line.startsWith('*');
    // Strip leading asterisk
    const content = line.replace(/^\s*\*\s*/, '').trim();
    const columns = content.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);

    if (columns.length >= 2) {
      const name = columns[0];
      const stateStr = columns[1];
      const versionStr = columns[2] || '2';

      const state: 'Running' | 'Stopped' = stateStr.toLowerCase().includes('running') ? 'Running' : 'Stopped';
      const version: 1 | 2 = versionStr === '1' ? 1 : 2;

      distros.push({
        name,
        state,
        version,
        isDefault,
      });
    }
  }

  return distros;
}

/**
 * Translates Windows path to WSL POSIX path.
 * e.g. C:\Users\Alice\app -> /mnt/c/Users/Alice/app
 * e.g. \\wsl$\Ubuntu\home\alice\app -> /home/alice/app
 */
export function translateWindowsPathToWsl(winPath: string): string {
  const normalized = winPath.replace(/\\/g, '/');

  // \\wsl$\Distro\... or \\wsl.localhost\Distro\...
  const wslShareMatch = normalized.match(/^\/\/(?:wsl\$|wsl\.localhost)\/[^/]+(\/.*)$/i);
  if (wslShareMatch) {
    return wslShareMatch[1];
  }

  // Windows drive letter: C:/Users/... -> /mnt/c/Users/...
  const driveMatch = normalized.match(/^([a-zA-Z]):(\/.*)?$/);
  if (driveMatch) {
    const drive = driveMatch[1].toLowerCase();
    const rest = driveMatch[2] || '';
    return `/mnt/${drive}${rest}`;
  }

  return normalized;
}

/**
 * Translates WSL POSIX path to Windows path or WSL UNC share path.
 * e.g. /mnt/c/Users/Alice/app -> C:\Users\Alice\app
 * e.g. /home/alice/app -> \\wsl$\Ubuntu\home\alice\app
 */
export function translateWslPathToWindows(wslPath: string, distro = 'Ubuntu'): string {
  // Mount path: /mnt/c/... -> C:\...
  const mntMatch = wslPath.match(/^\/mnt\/([a-zA-Z])(\/.*)?$/);
  if (mntMatch) {
    const drive = mntMatch[1].toUpperCase();
    const rest = (mntMatch[2] || '').replace(/\//g, '\\');
    return `${drive}:${rest || '\\'}`;
  }

  // Pure linux path: /home/... -> \\wsl$\<distro>\home\...
  const cleanPath = wslPath.replace(/\//g, '\\');
  return `\\\\wsl$\\${distro}${cleanPath.startsWith('\\') ? cleanPath : '\\' + cleanPath}`;
}

/**
 * Builds safe wsl.exe process invocation arguments.
 */
export function buildWslCliCommand(
  distro: string,
  command: string,
  workDir?: string
): { binary: string; args: string[] } {
  const args = ['-d', distro];
  if (workDir) {
    args.push('--cd', workDir);
  }
  args.push('--', 'bash', '-c', command);

  return {
    binary: 'wsl.exe',
    args,
  };
}
