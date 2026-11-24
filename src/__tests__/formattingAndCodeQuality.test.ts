// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { useFormatStore } from '../formatting/formatStore';
import { applyEditorConfigToText, EditorConfigRules } from '../formatting/editorConfig';

describe('Formatting & Code Quality Engine', () => {
  beforeEach(() => {
    useFormatStore.setState({
      formatOnSave: true,
      formatOnPaste: false,
      lintOnSave: false,
      organizeImportsOnSave: false,
      formatters: [
        { id: 'prettier', name: 'Prettier', languages: ['javascript', 'typescript'], command: 'prettier', isAvailable: true, type: 'formatter' },
        { id: 'eslint', name: 'ESLint', languages: ['javascript', 'typescript'], command: 'eslint', isAvailable: true, type: 'linter' },
        { id: 'ruff', name: 'Ruff', languages: ['python'], command: 'ruff', isAvailable: true, type: 'formatter' },
        { id: 'black', name: 'Black', languages: ['python'], command: 'black', isAvailable: true, type: 'formatter' },
        { id: 'pint', name: 'Pint', languages: ['php'], command: 'pint', isAvailable: true, type: 'formatter' },
        { id: 'php-cs-fixer', name: 'PHP-CS-Fixer', languages: ['php'], command: 'php-cs-fixer', isAvailable: true, type: 'formatter' },
      ],
    });
  });

  it('correctly sets and retrieves default formatter per language', () => {
    const store = useFormatStore.getState();
    expect(store.defaultFormatterByLanguage['javascript']).toBe('prettier');
    expect(store.defaultFormatterByLanguage['python']).toBe('ruff');

    store.setDefaultFormatter('python', 'black');
    expect(useFormatStore.getState().defaultFormatterByLanguage['python']).toBe('black');
  });

  it('detects formatter conflicts when multiple tools are available for the same language', () => {
    const store = useFormatStore.getState();
    const phpConflicts = store.getConflictingFormatters('php');
    expect(phpConflicts.length).toBe(2);
    expect(phpConflicts.map((c) => c.id)).toContain('pint');
    expect(phpConflicts.map((c) => c.id)).toContain('php-cs-fixer');

    const pyConflicts = store.getConflictingFormatters('python');
    expect(pyConflicts.length).toBe(2);
    expect(pyConflicts.map((c) => c.id)).toContain('ruff');
    expect(pyConflicts.map((c) => c.id)).toContain('black');
  });

  it('updates formatting automation options', () => {
    const store = useFormatStore.getState();
    store.setFormatOnSave(false);
    expect(useFormatStore.getState().formatOnSave).toBe(false);

    store.setFormatOnPaste(true);
    expect(useFormatStore.getState().formatOnPaste).toBe(true);

    store.setLintOnSave(true);
    expect(useFormatStore.getState().lintOnSave).toBe(true);

    store.setOrganizeImportsOnSave(true);
    expect(useFormatStore.getState().organizeImportsOnSave).toBe(true);
  });

  it('applies EditorConfig trim_trailing_whitespace rule to content', () => {
    const raw = 'const a = 1;   \nconst b = 2;\t\t\nconst c = 3;';
    const rules: EditorConfigRules = { trim_trailing_whitespace: true };
    const cleaned = applyEditorConfigToText(raw, rules);
    expect(cleaned).toBe('const a = 1;\nconst b = 2;\nconst c = 3;');
  });

  it('applies EditorConfig end_of_line normalization', () => {
    const mixed = 'line 1\r\nline 2\rline 3\n';
    const lfRules: EditorConfigRules = { end_of_line: 'lf' };
    const cleanedLf = applyEditorConfigToText(mixed, lfRules);
    expect(cleanedLf).toBe('line 1\nline 2\nline 3\n');

    const crlfRules: EditorConfigRules = { end_of_line: 'crlf' };
    const cleanedCrlf = applyEditorConfigToText(mixed, crlfRules);
    expect(cleanedCrlf).toBe('line 1\r\nline 2\r\nline 3\r\n');
  });

  it('applies EditorConfig insert_final_newline rule', () => {
    const noNewline = 'console.log("hello");';
    const rules: EditorConfigRules = { insert_final_newline: true, end_of_line: 'lf' };
    const withNewline = applyEditorConfigToText(noNewline, rules);
    expect(withNewline).toBe('console.log("hello");\n');
  });
});
