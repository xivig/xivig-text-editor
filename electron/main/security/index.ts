import { BrowserWindow, IpcMainInvokeEvent, IpcMainEvent } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync, realpathSync } from 'node:fs';

const approvedWorkspaces = new Set<string>();
const approvedFiles = new Set<string>();

/**
 * Validates that an IPC call originated from an authorized application window
 * and frame running our local renderer assets.
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

  const frameUrl = event.senderFrame.url;
  const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

  if (isDev) {
    if (frameUrl.startsWith(process.env.VITE_DEV_SERVER_URL!)) {
      return true;
    }
  } else {
    if (frameUrl.startsWith('file://')) {
      return true;
    }
  }

  console.warn(`[Security] Rejected IPC call from unauthorized frame URL: ${frameUrl}`);
  return false;
}

/**
 * Registers a workspace directory as approved for file read/write operations.
 */
export function addApprovedWorkspace(folderPath: string): void {
  try {
    const resolved = path.resolve(folderPath);
    approvedWorkspaces.add(resolved);
  } catch {
    // Ignore invalid paths
  }
}

/**
 * Registers an individually approved file (e.g. from an open/save file dialog).
 */
export function addApprovedFile(filePath: string): void {
  try {
    const resolved = path.resolve(filePath);
    approvedFiles.add(resolved);
  } catch {
    // Ignore invalid paths
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
 */
export function isPathAuthorized(targetPath: string): boolean {
  const resolved = path.resolve(targetPath);

  // Check if explicitly approved individual file
  if (approvedFiles.has(resolved)) {
    return true;
  }

  // Check if inside any approved workspace directory
  for (const root of approvedWorkspaces) {
    const relative = path.relative(root, resolved);
    if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
      return true;
    }
  }

  return false;
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
 * Performs an atomic write using a temporary file and atomic rename.
 */
export async function atomicWriteFile(targetPath: string, content: string): Promise<void> {
  const resolved = path.resolve(targetPath);
  const parentDir = path.dirname(resolved);
  await fs.mkdir(parentDir, { recursive: true });

  const tempPath = path.join(parentDir, `.${path.basename(resolved)}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

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
