import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { extractPathFromArgv } from '../main/pathUtils';

describe('Windows Explorer "Open with" & In-Place Update Pipeline', () => {
  describe('extractPathFromArgv', () => {
    it('returns null when no file or folder arguments are provided', () => {
      const res = extractPathFromArgv(['Xivig Text Editor.exe']);
      expect(res).toBeNull();
    });

    it('ignores CLI flags and options', () => {
      const res = extractPathFromArgv([
        'Xivig Text Editor.exe',
        '--updated',
        '--force-run',
        '-v',
        '--disable-gpu',
        '.',
      ]);
      expect(res).toBeNull();
    });

    it('resolves an existing target file path passed as argument', () => {
      const packageJsonPath = path.resolve(__dirname, '../../package.json');
      const res = extractPathFromArgv(['Xivig Text Editor.exe', packageJsonPath]);
      expect(res).toBe(packageJsonPath);
    });

    it('resolves an existing target directory path passed as argument', () => {
      const electronDir = path.resolve(__dirname, '..');
      const res = extractPathFromArgv(['electron.exe', '.', electronDir]);
      expect(res).toBe(electronDir);
    });
  });

  describe('NSIS In-Place Update & Explorer Context Menu Configuration', () => {
    const installerNshPath = path.resolve(__dirname, '../../build/installer.nsh');
    const packageJsonPath = path.resolve(__dirname, '../../package.json');

    it('ensures build/installer.nsh exists and is properly formatted', () => {
      expect(fs.existsSync(installerNshPath)).toBe(true);
      const content = fs.readFileSync(installerNshPath, 'utf-8');

      // Verifies right-click context menu registration for files, directories, and background
      expect(content).toContain('WriteRegStr SHELL_CONTEXT "Software\\Classes\\*\\shell\\Open with Xivig Text Editor"');
      expect(content).toContain('WriteRegStr SHELL_CONTEXT "Software\\Classes\\Directory\\shell\\Open with Xivig Text Editor"');
      expect(content).toContain('WriteRegStr SHELL_CONTEXT "Software\\Classes\\Directory\\Background\\shell\\Open with Xivig Text Editor"');

      // Verifies in-place update protection (does not delete $INSTDIR during update)
      expect(content).toContain('customRemoveFiles');
      expect(content).toContain('${ifNot} ${isUpdated}');
      expect(content).toContain('RMDir /r $INSTDIR');
    });

    it('ensures package.json includes build/installer.nsh and disables app data deletion on uninstall', () => {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(pkg.build?.nsis?.include).toBe('build/installer.nsh');
      expect(pkg.build?.nsis?.deleteAppDataOnUninstall).toBe(false);
      expect(pkg.build?.nsis?.differentialPackage).toBe(true);
      expect(pkg.build?.fileAssociations).toBeDefined();
      expect(pkg.build?.fileAssociations.length).toBeGreaterThan(0);
    });
  });
});
