import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { validateRepoRelativePath } from '../main/git';

describe('Git Integration: Spaces, Unicode, and Path Traversal Hardening', () => {
  const repoRoot = path.resolve('E:/workspace/project');

  it('correctly normalizes paths containing single and multiple spaces', () => {
    expect(validateRepoRelativePath(repoRoot, 'src/my components/Button.tsx')).toBe('src/my components/Button.tsx');
    expect(validateRepoRelativePath(repoRoot, 'documents and settings/user manual.md')).toBe('documents and settings/user manual.md');
    expect(validateRepoRelativePath(repoRoot, './assets/cool images/banner logo.png')).toBe('assets/cool images/banner logo.png');
  });

  it('handles international Unicode and non-ASCII file paths (CJK, Cyrillic, Accents, Emojis)', () => {
    // CJK characters
    expect(validateRepoRelativePath(repoRoot, 'docs/用户指南.md')).toBe('docs/用户指南.md');
    expect(validateRepoRelativePath(repoRoot, 'src/日本語/設定.json')).toBe('src/日本語/設定.json');

    // Cyrillic characters
    expect(validateRepoRelativePath(repoRoot, 'src/привет_мир.ts')).toBe('src/привет_мир.ts');

    // Accented / Latin-1 characters
    expect(validateRepoRelativePath(repoRoot, 'src/modèle/données.ts')).toBe('src/modèle/données.ts');
    expect(validateRepoRelativePath(repoRoot, 'i18n/español.json')).toBe('i18n/español.json');

    // Emoji in filenames
    expect(validateRepoRelativePath(repoRoot, 'assets/⚡-fast.svg')).toBe('assets/⚡-fast.svg');
    expect(validateRepoRelativePath(repoRoot, 'notes/📝-todo.txt')).toBe('notes/📝-todo.txt');
  });

  it('blocks path traversal escaping repository root via parent segments', () => {
    expect(() => validateRepoRelativePath(repoRoot, '../outside.txt')).toThrow(/escapes repository root/);
    expect(() => validateRepoRelativePath(repoRoot, 'src/../../escaped.key')).toThrow(/escapes repository root/);
    expect(() => validateRepoRelativePath(repoRoot, '..\\..\\Windows\\System32\\cmd.exe')).toThrow(/escapes repository root/);
  });

  it('blocks absolute paths pointing outside the repository', () => {
    const outsideAbs = path.resolve('C:/Windows/System32/drivers/etc/hosts');
    expect(() => validateRepoRelativePath(repoRoot, outsideAbs)).toThrow(/escapes repository root/);
  });

  it('blocks null byte injections', () => {
    expect(() => validateRepoRelativePath(repoRoot, 'safe.txt\0.bad')).toThrow(/null byte detected/);
    expect(() => validateRepoRelativePath(repoRoot, '\0package.json')).toThrow(/null byte detected/);
  });

  it('blocks empty or whitespace-only paths', () => {
    expect(() => validateRepoRelativePath(repoRoot, '')).toThrow(/non-empty string/);
    expect(() => validateRepoRelativePath(repoRoot, '   ')).toThrow(/non-empty string/);
    expect(() => validateRepoRelativePath(repoRoot, null as any)).toThrow(/non-empty string/);
  });
});
