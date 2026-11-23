import { app, shell } from 'electron';
import https from 'node:https';

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName?: string;
  releaseNotes?: string;
  publishedAt?: string;
  downloadUrl?: string;
  htmlUrl?: string;
  error?: string;
}

/**
 * Compares two semver strings (e.g. "1.1.0" and "1.2.0" or "v1.2.0").
 * Returns true if latest is strictly newer than current.
 */
export function isNewerVersion(current: string, latest: string): boolean {
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
}

/**
 * Queries GitHub Releases API for the latest release tag and metadata.
 */
export async function checkGitHubRelease(): Promise<UpdateCheckResult> {
  const currentVersion = app.getVersion() || '1.1.0';

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/xivig/xivig-text-editor/releases/latest',
      headers: {
        'User-Agent': `Xivig-Update-Checker/${currentVersion}`,
        Accept: 'application/vnd.github.v3+json',
      },
      timeout: 10000,
    };

    const req = https.get(options, (res) => {
      let data = '';

      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve({
          updateAvailable: false,
          currentVersion,
          latestVersion: currentVersion,
          error: 'Release endpoint redirected',
        });
      }

      if (res.statusCode === 404) {
        return resolve({
          updateAvailable: false,
          currentVersion,
          latestVersion: currentVersion,
          error: 'No releases found on GitHub repository yet',
        });
      }

      if (res.statusCode !== 200) {
        return resolve({
          updateAvailable: false,
          currentVersion,
          latestVersion: currentVersion,
          error: `GitHub API returned status code ${res.statusCode}`,
        });
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const rawTag = json.tag_name || json.name || '';
          const latestVersion = rawTag.replace(/^v/i, '').trim();

          const updateAvailable = Boolean(latestVersion && isNewerVersion(currentVersion, latestVersion));

          resolve({
            updateAvailable,
            currentVersion,
            latestVersion: latestVersion || currentVersion,
            releaseName: json.name || `Xivig v${latestVersion}`,
            releaseNotes: json.body || '',
            publishedAt: json.published_at,
            htmlUrl: json.html_url || 'https://github.com/xivig/xivig-text-editor/releases',
          });
        } catch (err: any) {
          resolve({
            updateAvailable: false,
            currentVersion,
            latestVersion: currentVersion,
            error: `Failed to parse release metadata: ${err.message}`,
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        updateAvailable: false,
        currentVersion,
        latestVersion: currentVersion,
        error: `Network error checking updates: ${err.message}`,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        updateAvailable: false,
        currentVersion,
        latestVersion: currentVersion,
        error: 'Update check timed out',
      });
    });
  });
}

/**
 * Safely opens the release download page in the system browser.
 */
export function openReleaseUrl(url?: string): void {
  const target = url && url.startsWith('https://github.com/xivig/xivig-text-editor/releases')
    ? url
    : 'https://github.com/xivig/xivig-text-editor/releases/latest';

  shell.openExternal(target);
}
