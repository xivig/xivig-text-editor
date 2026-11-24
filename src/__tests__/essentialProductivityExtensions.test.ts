import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  formatWithPrettier,
  DEFAULT_PRETTIER_SETTINGS,
  lintJavaScriptCode,
  DEFAULT_ESLINT_SETTINGS,
  parseEditorConfig,
  applyEditorConfigTransform,
  checkSpellingInCode,
  createPathCompletionSource,
  findMatchingTag,
  scanDocumentForTodos,
} from '../extensions/builtin/productivity/index';
import { extensionManager } from '../extensions/runtime/extensionManager';
import { BUILTIN_EXTENSIONS } from '../extensions/builtin/index';

describe('Category 1: Essential Productivity Extensions Suite', () => {
  beforeEach(async () => {
    // Ensure runtime is initialized
    await extensionManager.init();
  });

  afterEach(async () => {
    // Cleanup any activated test extension
    await extensionManager.deactivateExtension('xivig.eslint');
    await extensionManager.deactivateExtension('xivig.error-lens');
    await extensionManager.deactivateExtension('xivig.better-comments');
  });

  describe('1. Prettier - Code Formatter', () => {
    it('formats JSON with configurable indentation', () => {
      const unformatted = '{"name":"xivig","version":1,"tools":["editor","terminal"]}';
      const formatted = formatWithPrettier(unformatted, 'json', {
        ...DEFAULT_PRETTIER_SETTINGS,
        tabWidth: 2,
      });

      expect(formatted).toContain('{\n  "name": "xivig"');
      expect(formatted).toContain('  "version": 1');
      expect(formatted.endsWith('\n')).toBe(true);
    });

    it('formats JavaScript with single quotes and semicolons', () => {
      const code = 'const greeting = "hello world"; const count = 10';
      const formatted = formatWithPrettier(code, 'javascript', {
        ...DEFAULT_PRETTIER_SETTINGS,
        singleQuote: true,
        semi: true,
      });

      expect(formatted).toContain("'hello world'");
    });

    it('strips semicolons when semi is disabled', () => {
      const code = 'const x = 5;\nconst y = 10;';
      const formatted = formatWithPrettier(code, 'javascript', {
        ...DEFAULT_PRETTIER_SETTINGS,
        semi: false,
      });

      expect(formatted).not.toContain('const x = 5;');
      expect(formatted).toContain('const x = 5');
    });
  });

  describe('2. ESLint - JavaScript/TypeScript Linting', () => {
    it('detects debugger statements and provides removal action', () => {
      const code = 'function test() {\n  debugger;\n  return true;\n}';
      const diagnostics = lintJavaScriptCode(code, DEFAULT_ESLINT_SETTINGS);

      const debuggerDiag = diagnostics.find((d) => d.source === 'eslint(no-debugger)');
      expect(debuggerDiag).toBeDefined();
      expect(debuggerDiag?.severity).toBe('error');
      expect(debuggerDiag?.message).toContain('debugger');
      expect(debuggerDiag?.actions?.[0].name).toBe('Remove debugger');
    });

    it('detects eqeqeq violations and offers === replacement', () => {
      const code = 'if (status == 200) { doSomething(); }';
      const diagnostics = lintJavaScriptCode(code, DEFAULT_ESLINT_SETTINGS);

      const eqDiag = diagnostics.find((d) => d.source === 'eslint(eqeqeq)');
      expect(eqDiag).toBeDefined();
      expect(eqDiag?.message).toContain('Expected "==="');
      expect(eqDiag?.actions?.[0].name).toContain('Replace with "==="');
    });

    it('flags unexpected "var" and suggests let or const', () => {
      const code = 'var counter = 0;';
      const diagnostics = lintJavaScriptCode(code, DEFAULT_ESLINT_SETTINGS);

      const varDiag = diagnostics.find((d) => d.source === 'eslint(no-var)');
      expect(varDiag).toBeDefined();
      expect(varDiag?.message).toContain('Unexpected "var"');
    });

    it('flags unused variables defined in scope', () => {
      const code = 'const unusedValue = 42;\nfunction run() { return 1; }';
      const diagnostics = lintJavaScriptCode(code, DEFAULT_ESLINT_SETTINGS);

      const unusedDiag = diagnostics.find((d) => d.source === 'eslint(no-unused-vars)');
      expect(unusedDiag).toBeDefined();
      expect(unusedDiag?.message).toContain("'unusedValue' is defined but never used");
    });
  });

  describe('3. EditorConfig - Consistent Coding Styles', () => {
    it('parses .editorconfig rules for indentation and whitespace', () => {
      const editorConfigContent = `
# EditorConfig is awesome
root = true

[*]
indent_style = space
indent_size = 4
end_of_line = lf
trim_trailing_whitespace = true
insert_final_newline = true
max_line_length = 100
`;
      const rules = parseEditorConfig(editorConfigContent, 'app.ts');
      expect(rules.indentStyle).toBe('space');
      expect(rules.indentSize).toBe(4);
      expect(rules.endOfLine).toBe('lf');
      expect(rules.trimTrailingWhitespace).toBe(true);
      expect(rules.insertFinalNewline).toBe(true);
      expect(rules.maxLineLength).toBe(100);
    });

    it('applies trim_trailing_whitespace and final newline', () => {
      const dirtyCode = 'function hello() {   \n  return true; \t \n}';
      const cleaned = applyEditorConfigTransform(dirtyCode, {
        trimTrailingWhitespace: true,
        insertFinalNewline: true,
        endOfLine: 'lf',
      });

      expect(cleaned).toBe('function hello() {\n  return true;\n}\n');
    });
  });

  describe('4. Error Lens - Inline Error Highlighting', () => {
    it('registers Error Lens module in builtin registry with CodeMirror extensions', () => {
      const module = BUILTIN_EXTENSIONS['xivig.error-lens'];
      expect(module).toBeDefined();
      expect(module.manifest.id).toBe('xivig.error-lens');
      expect(typeof module.getCodeMirrorExtensions).toBe('function');

      const exts = module.getCodeMirrorExtensions?.();
      expect(exts).toBeDefined();
      expect(exts?.length).toBeGreaterThan(0);
    });
  });

  describe('5. Code Spell Checker - Detect Typos', () => {
    it('detects typos in camelCase and snake_case tokens', () => {
      const code = 'const userNamme = "test";\nconst calculatedValuue = 10;';
      const diags = checkSpellingInCode(code);

      expect(diags.length).toBeGreaterThan(0);
      const words = diags.map((d) => d.message);
      expect(words.some((m) => m.includes('namme') || m.includes('valuue'))).toBe(true);
    });

    it('ignores whitelisted standard programming words', () => {
      const code = 'const asyncFunction = async () => { return "xivig"; };';
      const diags = checkSpellingInCode(code);
      const names = diags.map((d) => d.message);
      expect(names.some((m) => m.includes('async'))).toBe(false);
      expect(names.some((m) => m.includes('xivig'))).toBe(false);
    });
  });

  describe('6. Path Intellisense - Auto-complete File Paths', () => {
    it('provides path completions for relative directories and files', () => {
      const source = createPathCompletionSource(['App.tsx', 'main.ts', 'components/']);
      // Mock completion context at `'./'`
      const mockContext: any = {
        pos: 3,
        matchBefore: () => ({ text: "'./", from: 0, to: 3 }),
      };

      const result = source(mockContext);
      expect(result).toBeDefined();
      expect(result?.options.length).toBe(3);
      expect(result?.options.some((opt) => opt.label === 'App.tsx')).toBe(true);
      expect(result?.options.some((opt) => opt.label === 'components/')).toBe(true);
    });
  });

  describe('7 & 8. Auto Rename Tag & Auto Close Tag', () => {
    it('finds matching closing tag for an opening tag', () => {
      const html = '<div class="container">\n  <h1>Title</h1>\n</div>';
      const match = findMatchingTag(html, 1, true, 'div');
      expect(match).toBeDefined();
      expect(html.slice(match!.from, match!.to).toLowerCase()).toBe('div');
    });

    it('finds matching opening tag for a closing tag', () => {
      const html = '<section id="main">\n  <p>Hello</p>\n</section>';
      const match = findMatchingTag(html, html.length - 1, false, 'section');
      expect(match).toBeDefined();
      expect(html.slice(match!.from, match!.to).toLowerCase()).toBe('section');
    });
  });

  describe('9. Better Comments - Organized Code Comments', () => {
    it('registers Better Comments module with active view plugin', () => {
      const module = BUILTIN_EXTENSIONS['xivig.better-comments'];
      expect(module).toBeDefined();
      expect(module.manifest.id).toBe('xivig.better-comments');

      const exts = module.getCodeMirrorExtensions?.();
      expect(exts).toBeDefined();
      expect(exts?.length).toBe(1);
    });
  });

  describe('10. Todo Tree - Track TODO/FIXME Comments', () => {
    it('scans and parses TODO and FIXME items with line and column positions', () => {
      const doc = `
// TODO: Refactor database connection
const db = connect();

/* FIXME: Handle network reconnect edge case */
function sync() {}

# NOTE: Supported on Linux and Windows
`;
      const todos = scanDocumentForTodos(doc, 'src/db.ts');
      expect(todos.length).toBe(3);

      expect(todos[0].type).toBe('TODO');
      expect(todos[0].text).toBe('Refactor database connection');
      expect(todos[0].line).toBe(2);

      expect(todos[1].type).toBe('FIXME');
      expect(todos[1].text).toBe('Handle network reconnect edge case');
      expect(todos[1].line).toBe(5);

      expect(todos[2].type).toBe('NOTE');
      expect(todos[2].text).toBe('Supported on Linux and Windows');
    });
  });

  describe('Runtime Activation & Marketplace Integration', () => {
    it('activates and deactivates productivity extensions cleanly through ExtensionManager', async () => {
      const activated = await extensionManager.activateExtension('xivig.eslint');
      expect(activated).toBe(true);
      expect(extensionManager.isExtensionActive('xivig.eslint')).toBe(true);

      const activeExts = extensionManager.getActiveCodeMirrorExtensions();
      expect(activeExts.length).toBeGreaterThan(0);

      await extensionManager.deactivateExtension('xivig.eslint');
      expect(extensionManager.isExtensionActive('xivig.eslint')).toBe(false);
    });
  });
});
