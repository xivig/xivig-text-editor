import { GitHistoryEntry, GitHistorySettings } from './types';

export const DEFAULT_GITHISTORY_SETTINGS: GitHistorySettings = {
  enabled: true,
  followRenames: true,
  pageSize: 25,
};

export function parseGitLogEntries(rawLog: string): GitHistoryEntry[] {
  if (!rawLog.trim()) return [];

  const lines = rawLog.split('\n');
  const entries: GitHistoryEntry[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split('|');
    if (parts.length >= 6) {
      entries.push({
        hash: parts[0].trim(),
        shortHash: parts[1].trim() || parts[0].slice(0, 7),
        author: parts[2].trim(),
        date: parts[3].trim(),
        message: parts[4].trim(),
        filesChanged: parts[5] ? parseInt(parts[5].trim(), 10) || 1 : 1,
      });
    } else if (parts.length >= 5) {
      entries.push({
        hash: parts[0].trim(),
        shortHash: parts[0].trim().slice(0, 7),
        author: parts[1].trim(),
        date: parts[2].trim(),
        message: parts[3].trim(),
        filesChanged: parts[4] ? parseInt(parts[4].trim(), 10) || 1 : 1,
      });
    }
  }

  return entries;
}

export function compareRevisions(
  oldContent: string,
  newContent: string,
  filename = 'file'
): string {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const diffHeader = `--- a/${filename}\n+++ b/${filename}\n@@ -1,${oldLines.length} +1,${newLines.length} @@\n`;
  const diffBody: string[] = [];

  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    const oldL = oldLines[i];
    const newL = newLines[i];

    if (oldL === newL) {
      if (oldL !== undefined) diffBody.push(` ${oldL}`);
    } else {
      if (oldL !== undefined) diffBody.push(`-${oldL}`);
      if (newL !== undefined) diffBody.push(`+${newL}`);
    }
  }

  return diffHeader + diffBody.join('\n');
}
