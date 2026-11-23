import { BrowserWindow, IpcMainInvokeEvent, IpcMainEvent } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync, realpathSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Sets storing strictly canonical, real filesystem paths
const approvedWorkspaces = new Set<string>();
const approvedFiles = new Set<string>();

let expectedRendererDistCanonical: string | null = null;

export function setExpectedRendererDist(distPath: string): void {
  try {
    if (existsSync(distPath)) {
      expectedRendererDistCanonical = realpathSync(path.resolve(distPath));
    } else {
      expectedRendererDistCanonical = path.resolve(distPath);
    }
  } catch {
    expectedRendererDistCanonical = path.resolve(distPath);
  }
}

/**
 * Validates that an IPC call originated from an authorized application window
 * and strictly from the primary top-level frame running local application assets.
 */
export function validateIpcSender(event: IpcMainInvokeEvent | IpcMainEvent): boolean {
  if (!event.sender || !event.senderFrame) {
    console.warn('[Security] Rejected IPC call: Missing sender or senderFrame');
    return false;
  }

  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) {
    console.warn('[Security] Rejected IPC call: Sender webContents does not belong to a valid BrowserWindow');
    return false;
  }

  // Reject IPC invocations from any child frames, iframes, or guest contexts (e.g. web previews)
  if (event.senderFrame !== event.sender.mainFrame) {
    console.warn('[Security] Rejected IPC call: Child frames/iframes are not permitted to invoke IPC APIs');
    return false;
  }

  const frameUrl = event.senderFrame.url;
  const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

  if (isDev) {
    try {
      const devUrl = new URL(process.env.VITE_DEV_SERVER_URL!);
      const parsedFrame = new URL(frameUrl);
      if (
        parsedFrame.protocol === devUrl.protocol &&
        parsedFrame.hostname === devUrl.hostname &&
        parsedFrame.port === devUrl.port
      ) {
        return true;
      }
    } catch (err) {
      console.warn('[Security] Failed to parse dev frame URL:', err);
      return false;
    }
  } else {
    // In production, frame URL must be a file: protocol URL resolving within packaged RENDERER_DIST
    try {
      const parsed = new URL(frameUrl);
      if (parsed.protocol === 'file:') {
        const filePath = fileURLToPath(frameUrl);
        const resolvedPath = path.resolve(filePath);
        const canonicalFrame = existsSync(resolvedPath) ? realpathSync(resolvedPath) : resolvedPath;

        if (expectedRendererDistCanonical) {
          const relative = path.relative(expectedRendererDistCanonical, canonicalFrame);
          if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
            return true;
          }
        }
      }
    } catch (err) {
      console.warn('[Security] Failed to validate production frame URL:', err);
      return false;
    }
  }

  console.warn(`[Security] Rejected IPC call from unauthorized frame URL: ${frameUrl}`);
  return false;
}

/**
 * Registers a workspace directory as approved following explicit user selection via native dialog.
 * Resolves symlinks to ensure the canonical root is recorded.
 */
export function addApprovedWorkspace(folderPath: string): void {
  try {
    const resolved = path.resolve(folderPath);
    if (!existsSync(resolved)) return;
    const stat = statSync(resolved);
    if (!stat.isDirectory()) return;

    const canonical = realpathSync(resolved);
    approvedWorkspaces.add(canonical);
    console.log('[Security] Registered approved workspace root:', canonical);
  } catch (err) {
    console.warn('[Security] Failed to add approved workspace:', err);
  }
}

/**
 * Revokes approval for a workspace directory (e.g. on workspace close).
 */
export function removeApprovedWorkspace(folderPath: string): void {
  try {
    const resolved = path.resolve(folderPath);
    const canonical = existsSync(resolved) ? realpathSync(resolved) : resolved;
    approvedWorkspaces.delete(canonical);
    approvedWorkspaces.delete(resolved);
  } catch {
    approvedWorkspaces.delete(path.resolve(folderPath));
  }
}

/**
 * Registers an individually approved file following explicit user selection via native dialog.
 */
export function addApprovedFile(filePath: string): void {
  try {
    const resolved = path.resolve(filePath);
    if (existsSync(resolved)) {
      approvedFiles.add(realpathSync(resolved));
    }
    // Also track the unresolved target in case it's a new file about to be created
    approvedFiles.add(resolved);
  } catch {
    approvedFiles.add(path.resolve(filePath));
  }
}

/**
 * Validates a filesystem path input string.
 */
export function validatePathInput(rawPath: unknown): string {
  if (typeof rawPath !== 'string' || !rawPath.trim()) {
    throw new Error('Invalid path: Must be a non-empty string');
  }
  if (rawPath.includes('\0')) {
    throw new Error('Invalid path: Null bytes detected');
  }
  return path.resolve(rawPath);
}

/**
 * Validates string content payload size.
 */
export function validateContentPayload(content: unknown, maxBytes = 100 * 1024 * 1024): string {
  if (typeof content !== 'string') {
    throw new Error('Invalid content: Payload must be a string');
  }
  if (Buffer.byteLength(content, 'utf-8') > maxBytes) {
    throw new Error(`Payload exceeds maximum allowed size of ${maxBytes / (1024 * 1024)}MB`);
  }
  return content;
}

/**
 * Checks if a target path is strictly inside an approved workspace or explicitly approved file.
 * Resolves all symlinks to protect against filesystem escapes.
 */
export function isPathAuthorized(targetPath: string): boolean {
  try {
    const resolved = path.resolve(targetPath);

    // 1. Direct check against individually approved files
    if (approvedFiles.has(resolved)) {
      return true;
    }
    if (existsSync(resolved)) {
      const canonicalFile = realpathSync(resolved);
      if (approvedFiles.has(canonicalFile)) {
        return true;
      }
    }

    // 2. Canonical target path evaluation (handling existing vs non-existing files)
    let canonicalTarget: string;
    if (existsSync(resolved)) {
      canonicalTarget = realpathSync(resolved);
    } else {
      // Find the closest existing parent directory to canonicalize
      let currentDir = path.dirname(resolved);
      const remainingSegments: string[] = [path.basename(resolved)];

      while (!existsSync(currentDir)) {
        const parent = path.dirname(currentDir);
        if (parent === currentDir) break; // reached filesystem root
        remainingSegments.unshift(path.basename(currentDir));
        currentDir = parent;
      }

      if (!existsSync(currentDir)) {
        return false;
      }

      const canonicalParent = realpathSync(currentDir);
      canonicalTarget = path.join(canonicalParent, ...remainingSegments);
    }

    // 3. Verify target is within at least one approved workspace canonical root
    for (const root of approvedWorkspaces) {
      const relative = path.relative(root, canonicalTarget);
      if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.warn('[Security] Path authorization check failed:', err);
    return false;
  }
}

/**
 * Ensures a path is authorized before proceeding with a filesystem operation.
 */
export function assertPathAuthorized(targetPath: string, operationName: string): void {
  if (!isPathAuthorized(targetPath)) {
    throw new Error(`Security Exception: [${operationName}] Access denied outside approved workspaces: ${targetPath}`);
  }
}

/**
 * Performs a re-check immediately before a destructive operation to prevent TOCTOU symlink swaps.
 */
export function assertImmediateDestructiveAuthorization(targetPath: string, operationName: string): void {
  const resolved = path.resolve(targetPath);
  if (existsSync(resolved)) {
    const canonical = realpathSync(resolved);
    let authorized = approvedFiles.has(canonical) || approvedFiles.has(resolved);
    if (!authorized) {
      for (const root of approvedWorkspaces) {
        const relative = path.relative(root, canonical);
        if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
          authorized = true;
          break;
        }
      }
    }
    if (!authorized) {
      throw new Error(`Security Exception: [${operationName}] Symlink destination escape detected: ${canonical}`);
    }
  } else {
    assertPathAuthorized(targetPath, operationName);
  }
}

/**
 * Performs an atomic write using a temporary file and atomic rename.
 */
export async function atomicWriteFile(targetPath: string, content: string): Promise<void> {
  const resolved = path.resolve(targetPath);
  const parentDir = path.dirname(resolved);
  await fs.mkdir(parentDir, { recursive: true });

  const tempPath = path.join(
    parentDir,
    `.${path.basename(resolved)}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );

  try {
    await fs.writeFile(tempPath, content, 'utf-8');
    await fs.rename(tempPath, resolved);
  } catch (err) {
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup error
    }
    throw err;
  }
}
