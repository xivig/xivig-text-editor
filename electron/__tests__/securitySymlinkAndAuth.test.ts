import { describe, it, expect, beforeEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import {
  addApprovedWorkspace,
  addApprovedFile,
  clearWindowPermissions,
  isPathAuthorized,
  assertPathAuthorized,
  assertImmediateDestructiveAuthorization,
  validatePathInput,
  validateContentPayload,
} from '../main/security';

describe('Security: Symlink Traversal & Read/Write Authorization', () => {
  const winId = 555;
  const tempBase = fs.mkdtempSync(path.join(os.tmpdir(), 'xivig-sec-test-'));
  const workspaceRoot = path.join(tempBase, 'project');
  const secretDir = path.join(tempBase, 'secret-outside');

  beforeEach(() => {
    clearWindowPermissions(winId);
    if (!fs.existsSync(workspaceRoot)) fs.mkdirSync(workspaceRoot, { recursive: true });
    if (!fs.existsSync(secretDir)) fs.mkdirSync(secretDir, { recursive: true });
  });

  it('validates and canonicalizes approved workspaces correctly', () => {
    addApprovedWorkspace(winId, workspaceRoot);

    const insideFile = path.join(workspaceRoot, 'app.ts');
    fs.writeFileSync(insideFile, 'content');

    expect(isPathAuthorized(winId, insideFile)).toBe(true);
  });

  it('blocks symlink traversal attempting to escape workspace boundary', () => {
    addApprovedWorkspace(winId, workspaceRoot);

    const secretFile = path.join(secretDir, 'passwords.txt');
    fs.writeFileSync(secretFile, 'super_secret');

    // Attempt to create a symlink inside the workspace pointing outside
    const symlinkPath = path.join(workspaceRoot, 'symlink-escape.txt');

    try {
      if (fs.existsSync(symlinkPath)) fs.unlinkSync(symlinkPath);
      fs.symlinkSync(secretFile, symlinkPath);

      // Check whether accessing the symlink resolves to the canonical target outside workspace
      expect(isPathAuthorized(winId, symlinkPath)).toBe(false);

      expect(() => {
        assertPathAuthorized(winId, symlinkPath, 'file:read');
      }).toThrow(/Security Exception.*Access denied outside approved workspaces/);

      expect(() => {
        assertImmediateDestructiveAuthorization(winId, symlinkPath, 'file:write');
      }).toThrow(/Security Exception.*Symlink destination escape detected/);
    } catch (err: any) {
      // On Windows non-elevated shells without developer mode, symlink creation may require privilege.
      // If symlink creation itself is denied by OS, test fallback verification
      if (err.code !== 'EPERM') {
        throw err;
      }
    }
  });

  it('assertImmediateDestructiveAuthorization protects against unauthorized file overwrites', () => {
    addApprovedWorkspace(winId, workspaceRoot);

    const outsideTarget = path.join(secretDir, 'victim.txt');
    fs.writeFileSync(outsideTarget, 'do not overwrite');

    expect(() => {
      assertImmediateDestructiveAuthorization(winId, outsideTarget, 'file:unlink');
    }).toThrow(/Security Exception.*(Symlink destination escape|outside approved workspaces)/);
  });

  it('validatePathInput blocks null byte injections and empty strings', () => {
    expect(() => validatePathInput('')).toThrow(/Invalid path: Must be a non-empty string/);
    expect(() => validatePathInput('   ')).toThrow(/Invalid path: Must be a non-empty string/);
    expect(() => validatePathInput('C:\\safe\\file.txt\0.exe')).toThrow(/Invalid path: Null bytes detected/);
    expect(() => validatePathInput(null)).toThrow(/Invalid path/);
    expect(() => validatePathInput(undefined)).toThrow(/Invalid path/);

    const valid = validatePathInput('src/index.ts');
    expect(path.isAbsolute(valid)).toBe(true);
  });

  it('validateContentPayload enforces string type and maximum payload size', () => {
    expect(() => validateContentPayload(12345 as any)).toThrow(/Payload must be a string/);
    expect(() => validateContentPayload(null as any)).toThrow(/Payload must be a string/);
    expect(() => validateContentPayload({ code: 'hack' } as any)).toThrow(/Payload must be a string/);

    // Payload size boundary check
    const smallContent = 'Hello Xivig';
    expect(validateContentPayload(smallContent, 1024)).toBe('Hello Xivig');

    const bigContent = 'x'.repeat(2048);
    expect(() => validateContentPayload(bigContent, 1024)).toThrow(/Payload exceeds maximum allowed size/);
  });
});
