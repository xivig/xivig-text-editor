import { app, shell, BrowserWindow } from 'electron';
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { URL } from 'node:url';

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName?: string;
  releaseNotes?: string;
  publishedAt?: string;
  downloadUrl?: string;
  assetName?: string;
  assetSize?: number;
  htmlUrl?: string;
  error?: string;
}

export interface UpdateProgress {
  percent: number;
  transferred: number;
  total: number;
}

export interface DownloadedUpdateInfo {
  version: string;
  filePath: string;
  assetName: string;
  releaseName?: string;
}

let activeDownloadResult: UpdateCheckResult | null = null;
let downloadedUpdate: DownloadedUpdateInfo | null = null;
let isDownloading = false;

export interface ParsedSemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease: Array<string | number>;
  build?: string;
}

/**
 * Parses a Semantic Versioning 2.0.0 compliant string.
 * Strips leading 'v', ignores build metadata in precedence,
 * and splits dot-separated pre-release identifiers into numeric/string parts.
 */
export function parseSemVer(v: string): ParsedSemVer {
  const cleaned = v.trim().replace(/^v/i, '');
  // Ignore build metadata (+...) for precedence
  const [withoutBuild, build] = cleaned.split('+');
  const [versionPart, prereleasePart] = withoutBuild.split('-');

  const [majorStr = '0', minorStr = '0', patchStr = '0'] = versionPart.split('.');
  const major = parseInt(majorStr, 10) || 0;
  const minor = parseInt(minorStr, 10) || 0;
  const patch = parseInt(patchStr, 10) || 0;

  const prerelease: Array<string | number> = [];
  if (prereleasePart) {
    const rawIdentifiers = prereleasePart.split('.');
    for (const id of rawIdentifiers) {
      if (/^\d+$/.test(id)) {
        prerelease.push(parseInt(id, 10));
      } else {
        prerelease.push(id);
      }
    }
  }

  return { major, minor, patch, prerelease, build };
}

/**
 * Compares two SemVer 2.0.0 versions according to specification precedence rules:
 * 1. Compare major, minor, and patch numerically.
 * 2. When major.minor.patch are equal, a normal release has higher precedence than a pre-release.
 * 3. Precedence for two pre-release versions with the same major.minor.patch:
 *    - Identifiers consisting of only digits are compared numerically.
 *    - Identifiers with letters or hyphens are compared lexically in ASCII sort order.
 *    - Numeric identifiers always have lower precedence than non-numeric identifiers.
 *    - A larger set of pre-release fields has a higher precedence than a smaller set.
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if v1 === v2.
 */
export function compareSemVer(v1: string, v2: string): number {
  const p1 = parseSemVer(v1);
  const p2 = parseSemVer(v2);

  if (p1.major !== p2.major) return p1.major > p2.major ? 1 : -1;
  if (p1.minor !== p2.minor) return p1.minor > p2.minor ? 1 : -1;
  if (p1.patch !== p2.patch) return p1.patch > p2.patch ? 1 : -1;

  // Rule 9: When major.minor.patch are equal, pre-release version has lower precedence than normal version
  const hasPre1 = p1.prerelease.length > 0;
  const hasPre2 = p2.prerelease.length > 0;

  if (!hasPre1 && hasPre2) return 1;  // normal > pre-release
  if (hasPre1 && !hasPre2) return -1; // pre-release < normal
  if (!hasPre1 && !hasPre2) return 0; // both normal releases equal

  // Both have pre-release identifiers; compare step-by-step
  const maxLen = Math.max(p1.prerelease.length, p2.prerelease.length);
  for (let i = 0; i < maxLen; i++) {
    const id1 = p1.prerelease[i];
    const id2 = p2.prerelease[i];

    if (id1 === undefined) return -1; // p2 has larger set of fields -> p2 > p1
    if (id2 === undefined) return 1;  // p1 has larger set of fields -> p1 > p2

    const isNum1 = typeof id1 === 'number';
    const isNum2 = typeof id2 === 'number';

    if (isNum1 && isNum2) {
      if (id1 !== id2) return (id1 as number) > (id2 as number) ? 1 : -1;
    } else if (isNum1 && !isNum2) {
      // Numeric identifiers have lower precedence than non-numeric
      return -1;
    } else if (!isNum1 && isNum2) {
      // Non-numeric identifiers have higher precedence than numeric
      return 1;
    } else {
      // Both non-numeric: ASCII lexical comparison
      const str1 = String(id1);
      const str2 = String(id2);
      if (str1 !== str2) {
        return str1 > str2 ? 1 : -1;
      }
    }
  }

  return 0;
}

/**
 * Compares two semver strings (e.g. "1.1.0" and "1.2.0" or "v1.2.0-rc.1").
 * Returns true if latest is strictly newer than current according to SemVer 2.0.0 rules.
 */
export function isNewerVersion(current: string, latest: string): boolean {
  return compareSemVer(latest, current) > 0;
}

/**
 * Identifies the best asset binary for the current operating system from the release assets list.
 */
function findBestPlatformAsset(assets: any[]): { downloadUrl?: string; assetName?: string; assetSize?: number } {
  if (!Array.isArray(assets) || assets.length === 0) return {};

  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  const isLinux = process.platform === 'linux';

  let matched: any = null;

  if (isWin) {
    // Prefer Setup.exe installer, then any non-blockmap .exe
    matched =
      assets.find(
        (a: any) =>
          typeof a.name === 'string' &&
          (a.name.toLowerCase().endsWith('-setup.exe') || (a.name.toLowerCase().includes('setup') && a.name.endsWith('.exe')))
      ) ||
      assets.find(
        (a: any) =>
          typeof a.name === 'string' &&
          a.name.endsWith('.exe') &&
          !a.name.toLowerCase().includes('blockmap')
      );
  } else if (isLinux) {
    matched =
      assets.find((a: any) => typeof a.name === 'string' && a.name.endsWith('.AppImage')) ||
      assets.find((a: any) => typeof a.name === 'string' && a.name.endsWith('.deb'));
  } else if (isMac) {
    matched =
      assets.find((a: any) => typeof a.name === 'string' && a.name.endsWith('.dmg')) ||
      assets.find((a: any) => typeof a.name === 'string' && a.name.endsWith('.zip'));
  }

  if (matched) {
    return {
      downloadUrl: matched.browser_download_url,
      assetName: matched.name,
      assetSize: matched.size,
    };
  }

  return {};
}

/**
 * Downloads a remote file over HTTP/HTTPS following 301/302 redirects with progress reporting.
 */
function downloadFile(
  rawUrl: string,
  destPath: string,
  onProgress?: (p: UpdateProgress) => void,
  redirectCount = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (redirectCount > 6) {
      return reject(new Error('Too many redirects while downloading update'));
    }

    const parsedUrl = new URL(rawUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const req = client.get(
      rawUrl,
      {
        headers: {
          'User-Agent': `Xivig-Update-Downloader/${app.getVersion() || '2.0.2'}`,
          Accept: 'application/octet-stream',
        },
      },
      (res) => {
        // Handle HTTP 301 / 302 / 307 / 308 redirects (GitHub release downloads always redirect to AWS S3/Azure)
        if (
          res.statusCode === 301 ||
          res.statusCode === 302 ||
          res.statusCode === 307 ||
          res.statusCode === 308
        ) {
          const redirectUrl = res.headers.location;
          if (!redirectUrl) {
            return reject(new Error('Redirect header missing location'));
          }
          res.resume();
          return resolve(downloadFile(redirectUrl, destPath, onProgress, redirectCount + 1));
        }

        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`Failed to download update, server responded with status code: ${res.statusCode}`));
        }

        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        let transferredBytes = 0;
        let lastReportTime = 0;

        const dir = path.dirname(destPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const tempDest = `${destPath}.part`;
        const fileStream = fs.createWriteStream(tempDest);

        res.on('data', (chunk: Buffer) => {
          transferredBytes += chunk.length;
          fileStream.write(chunk);

          const now = Date.now();
          if (now - lastReportTime > 120) {
            lastReportTime = now;
            const percent = totalBytes > 0 ? Math.min(100, Math.round((transferredBytes / totalBytes) * 100)) : 0;
            onProgress?.({ percent, transferred: transferredBytes, total: totalBytes });
          }
        });

        res.on('end', () => {
          fileStream.end(() => {
            try {
              if (fs.existsSync(destPath)) {
                fs.unlinkSync(destPath);
              }
              fs.renameSync(tempDest, destPath);

              if (process.platform !== 'win32') {
                try {
                  fs.chmodSync(destPath, 0o755);
                } catch {}
              }

              onProgress?.({ percent: 100, transferred: transferredBytes, total: totalBytes || transferredBytes });
              resolve(destPath);
            } catch (renameErr) {
              reject(renameErr);
            }
          });
        });

        res.on('error', (err) => {
          fileStream.destroy();
          try {
            if (fs.existsSync(tempDest)) fs.unlinkSync(tempDest);
          } catch {}
          reject(err);
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Download connection timed out'));
    });
  });
}

/**
 * Queries GitHub Releases API for the latest release tag and metadata.
 */
export async function checkGitHubRelease(): Promise<UpdateCheckResult> {
  const currentVersion = app.getVersion() || '2.0.2';

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
          const assetInfo = findBestPlatformAsset(json.assets || []);

          const result: UpdateCheckResult = {
            updateAvailable,
            currentVersion,
            latestVersion: latestVersion || currentVersion,
            releaseName: json.name || `Xivig v${latestVersion}`,
            releaseNotes: json.body || '',
            publishedAt: json.published_at,
            downloadUrl: assetInfo.downloadUrl,
            assetName: assetInfo.assetName,
            assetSize: assetInfo.assetSize,
            htmlUrl: json.html_url || 'https://github.com/xivig/xivig-text-editor/releases',
          };

          if (updateAvailable) {
            activeDownloadResult = result;
          }

          resolve(result);
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
 * Downloads the update in the background with progress reporting.
 */
export async function startDownloadUpdate(
  win?: BrowserWindow | null
): Promise<{ success: boolean; error?: string }> {
  if (isDownloading) {
    return { success: false, error: 'Download is already in progress' };
  }

  if (!activeDownloadResult || !activeDownloadResult.downloadUrl || !activeDownloadResult.assetName) {
    const check = await checkGitHubRelease();
    if (!check.updateAvailable || !check.downloadUrl || !check.assetName) {
      return { success: false, error: 'No update package is currently available for download' };
    }
    activeDownloadResult = check;
  }

  const downloadUrl = activeDownloadResult.downloadUrl;
  const assetName = activeDownloadResult.assetName;
  const latestVersion = activeDownloadResult.latestVersion;
  const releaseName = activeDownloadResult.releaseName;

  if (!downloadUrl || !assetName) {
    return { success: false, error: 'Download URL or asset name missing in update metadata' };
  }

  const updatesDir = path.join(app.getPath('temp'), 'xivig-updates');
  const targetFilePath = path.join(updatesDir, assetName);

  isDownloading = true;

  try {
    const downloadedPath = await downloadFile(downloadUrl, targetFilePath, (progress) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('updater:download-progress', progress);
      }
    });

    downloadedUpdate = {
      version: latestVersion,
      filePath: downloadedPath,
      assetName,
      releaseName,
    };

    isDownloading = false;

    if (win && !win.isDestroyed()) {
      win.webContents.send('updater:downloaded', downloadedUpdate);
    }

    return { success: true };
  } catch (err: any) {
    isDownloading = false;
    return { success: false, error: err.message };
  }
}

/**
 * Applies the downloaded update seamlessly and restarts the application without manual installer wizard prompts.
 */
export function applyUpdateAndRestart(): { success: boolean; error?: string } {
  if (!downloadedUpdate || !fs.existsSync(downloadedUpdate.filePath)) {
    // If running in development mode or without a downloaded installer, trigger clean app relaunch
    app.relaunch();
    app.quit();
    return { success: true };
  }

  const { filePath } = downloadedUpdate;
  const isWin = process.platform === 'win32';

  try {
    if (isWin && filePath.toLowerCase().endsWith('.exe')) {
      // NSIS installer with /S and --updated flags installs seamlessly in-place without deleting old versions or settings.
      // Detach the installer process with --force-run so it completes in-place and launches the updated IDE.
      const child = spawn(filePath, ['/S', '--updated', '--force-run'], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();

      app.quit();
      return { success: true };
    } else if (process.platform === 'linux' && filePath.endsWith('.AppImage')) {
      const child = spawn(filePath, [], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      app.quit();
      return { success: true };
    } else {
      shell.openPath(filePath);
      app.quit();
      return { success: true };
    }
  } catch (err: any) {
    console.error('[Updater] Failed to apply update and restart:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Returns current downloaded update info if available.
 */
export function getDownloadedUpdateInfo(): DownloadedUpdateInfo | null {
  return downloadedUpdate;
}

/**
 * Safely opens the release download page in the system browser.
 */
export function openReleaseUrl(url?: string): void {
  const target =
    url && url.startsWith('https://github.com/xivig/xivig-text-editor/releases')
      ? url
      : 'https://github.com/xivig/xivig-text-editor/releases/latest';

  shell.openExternal(target);
}
