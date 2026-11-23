import { BrowserWindow, IpcMainInvokeEvent, IpcMainEvent } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync, realpathSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface WindowPermissions {
  workspaces: Set<string>;
  files: Set<string>;
}

// Per-window authorization isolation
const permissionsByWindow = new Map<number, WindowPermissions>();

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
 * Validates the IPC sender and returns the validated BrowserWindow instance.
 * Never accepts a window ID supplied by the renderer.
 */
export function getValidatedWindow(event: IpcMainInvokeEvent | IpcMainEvent): BrowserWindow {
  if (!validateIpcSender(event)) {
    throw new Error('Security Exception: Unauthorized IPC sender');
  }
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) {
    throw new Error('Security Exception: No valid BrowserWindow for IPC sender');
  }
  return win;
}

export function getOrCreateWindowPermissions(winId: number): WindowPermissions {
  let perms = permissionsByWindow.get(winId);
  if (!perms) {
    perms = {
      workspaces: new Set<string>(),
      files: new Set<string>(),
    };
    permissionsByWindow.set(winId, perms);
  }
  return perms;
}

export function clearWindowPermissions(winId: number): void {
  permissionsByWindow.delete(winId);
  console.log(`[Security Win-${winId}] Cleared window authorization permissions`);
}

/**
 * Registers a workspace directory as approved following explicit user selection via native dialog in a specific window.
 * Resolves symlinks to ensure the canonical root is recorded.
 */
export function addApprovedWorkspace(winId: number, folderPath: string): void {
  try {
    const resolved = path.resolve(folderPath);
    if (!existsSync(resolved)) return;
    const stat = statSync(resolved);
    if (!stat.isDirectory()) return;

    const canonical = realpathSync(resolved);
    const perms = getOrCreateWindowPermissions(winId);
    perms.workspaces.add(canonical);
    console.log(`[Security Win-${winId}] Registered approved workspace root:`, canonical);
  } catch (err) {
    console.warn(`[Security Win-${winId}] Failed to add approved workspace:`, err);
  }
}

/**
 * Revokes approval for a workspace directory for a specific window (e.g. on workspace close).
 */
export function removeApprovedWorkspace(winId: number, folderPath: string): void {
  try {
    const perms = permissionsByWindow.get(winId);
    if (!perms) return;
    const resolved = path.resolve(folderPath);
    const canonical = existsSync(resolved) ? realpathSync(resolved) : resolved;
    perms.workspaces.delete(canonical);
    perms.workspaces.delete(resolved);
    console.log(`[Security Win-${winId}] Revoked approved workspace root:`, canonical);
  } catch {
    const perms = permissionsByWindow.get(winId);
    if (perms) perms.workspaces.delete(path.resolve(folderPath));
  }
}

/**
 * Registers an individually approved file following explicit user selection via native dialog for a specific window.
 */
export function addApprovedFile(winId: number, filePath: string): void {
  try {
    const perms = getOrCreateWindowPermissions(winId);
    const resolved = path.resolve(filePath);
    if (existsSync(resolved)) {
      perms.files.add(realpathSync(resolved));
    }
    // Also track the unresolved target in case it's a new file about to be created
    perms.files.add(resolved);
    console.log(`[Security Win-${winId}] Registered approved file:`, resolved);
  } catch {
    const perms = getOrCreateWindowPermissions(winId);
    perms.files.add(path.resolve(filePath));
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
 * Checks if a target path is strictly inside an approved workspace or explicitly approved file for a specific window.
 * Resolves all symlinks to protect against filesystem escapes.
 */
export function isPathAuthorized(winId: number, targetPath: string): boolean {
  try {
    const perms = permissionsByWindow.get(winId);
    if (!perms) return false;

    const resolved = path.resolve(targetPath);

    // 1. Direct check against individually approved files for THIS window
    if (perms.files.has(resolved)) {
      return true;
    }
    if (existsSync(resolved)) {
      const canonicalFile = realpathSync(resolved);
      if (perms.files.has(canonicalFile)) {
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

    // 3. Verify target is within at least one approved workspace canonical root for THIS window
    for (const root of perms.workspaces) {
      const relative = path.relative(root, canonicalTarget);
      if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.warn(`[Security Win-${winId}] Path authorization check failed:`, err);
    return false;
  }
}

/**
 * Ensures a path is authorized before proceeding with a filesystem operation in a specific window.
 */
export function assertPathAuthorized(winId: number, targetPath: string, operationName: string): void {
  if (!isPathAuthorized(winId, targetPath)) {
    throw new Error(`Security Exception: [${operationName}] Access denied outside approved workspaces for window ${winId}: ${targetPath}`);
  }
}

/**
 * Performs a re-check immediately before a destructive operation to prevent TOCTOU symlink swaps.
 */
export function assertImmediateDestructiveAuthorization(winId: number, targetPath: string, operationName: string): void {
  const perms = permissionsByWindow.get(winId);
  if (!perms) {
    throw new Error(`Security Exception: [${operationName}] No authorization context found for window ${winId}`);
  }

  const resolved = path.resolve(targetPath);
  if (existsSync(resolved)) {
    const canonical = realpathSync(resolved);
    let authorized = perms.files.has(canonical) || perms.files.has(resolved);
    if (!authorized) {
      for (const root of perms.workspaces) {
        const relative = path.relative(root, canonical);
        if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
          authorized = true;
          break;
        }
      }
    }
    if (!authorized) {
      throw new Error(`Security Exception: [${operationName}] Symlink destination escape detected for window ${winId}: ${canonical}`);
    }
  } else {
    assertPathAuthorized(winId, targetPath, operationName);
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
