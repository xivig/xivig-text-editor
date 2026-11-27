import path from 'node:path';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';

/**
 * Extracts a target file or folder path from command-line arguments (process.argv).
 * Skips the executable, electron flags (--...), and relative root pointers ('.').
 */
export function extractPathFromArgv(argv: string[]): string | null {
  if (!Array.isArray(argv) || argv.length <= 1) return null;
  for (let i = 1; i < argv.length; i++) {
    const candidate = argv[i];
    if (!candidate) continue;
    if (
      candidate.startsWith('--') ||
      candidate.startsWith('-') ||
      candidate === '.' ||
      candidate === './' ||
      candidate === '.\\'
    ) {
      continue;
    }
    try {
      const resolved = path.resolve(candidate);
      if (fsSync.existsSync(resolved)) {
        return resolved;
      }
    } catch {}
  }
  return null;
}

/**
 * Reads file contents safely, encoding binary images (PNG, JPG, GIF, WebP, BMP, ICO)
 * into Base64 Data URLs so the renderer can display them natively in image viewers.
 */
export async function readFileContent(
  filePath: string
): Promise<{ content: string; isBinary?: boolean; dataUrl?: string }> {
  const ext = path.extname(filePath).toLowerCase();
  const isBinaryImage = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico'].includes(ext);

  if (isBinaryImage) {
    const buffer = await fs.readFile(filePath);
    const mime =
      ext === '.png'
        ? 'image/png'
        : ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.gif'
        ? 'image/gif'
        : ext === '.webp'
        ? 'image/webp'
        : ext === '.bmp'
        ? 'image/bmp'
        : ext === '.ico'
        ? 'image/x-icon'
        : 'application/octet-stream';

    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    return { content: dataUrl, isBinary: true, dataUrl };
  }

  const content = await fs.readFile(filePath, 'utf-8');
  return { content, isBinary: false };
}
