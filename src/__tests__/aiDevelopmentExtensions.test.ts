import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  parseCopilotChatPrompt,
  COPILOT_SLASH_COMMANDS,
  generateDocstring,
  getCachedSuggestions,
  setCachedSuggestions,
  clearCodeiumCache,
  extractContinueContext,
  buildContinuePayload,
  predictWholeLine,
  scanCodeForSecurityVulnerabilities,
} from '../extensions/builtin/ai/index';
import { extensionManager } from '../extensions/runtime/extensionManager';
import { BUILTIN_EXTENSIONS } from '../extensions/builtin/index';

describe('Category 3: AI Development Extensions Suite', () => {
  beforeEach(async () => {
    await extensionManager.init();
    clearCodeiumCache();
  });

  afterEach(async () => {
    clearCodeiumCache();
    await extensionManager.deactivateExtension('xivig.copilot-chat');
    await extensionManager.deactivateExtension('xivig.codeium');
    await extensionManager.deactivateExtension('xivig.continue');
    await extensionManager.deactivateExtension('xivig.tabnine');
    await extensionManager.deactivateExtension('xivig.amazon-q');
  });

  describe('1. GitHub Copilot Chat — Slash Commands & Context', () => {
    it('parses /explain slash command and wraps code context', () => {
      const code = 'function fib(n) { return n <= 1 ? n : fib(n-1) + fib(n-2); }';
      const parsed = parseCopilotChatPrompt('/explain', code);

      expect(parsed.command).toBe('explain');
      expect(parsed.prompt).toContain('Please explain the following code step by step');
      expect(parsed.prompt).toContain(code);
    });

    it('parses /tests slash command to request test generation', () => {
      const code = 'export function add(a: number, b: number): number { return a + b; }';
      const parsed = parseCopilotChatPrompt('/tests', code);

      expect(parsed.command).toBe('tests');
      expect(parsed.prompt).toContain('Generate complete, runnable unit tests');
      expect(parsed.prompt).toContain(code);
    });

    it('parses /fix command with extra user-provided context', () => {
      const code = 'const x = undefined; console.log(x.name);';
      const parsed = parseCopilotChatPrompt('/fix avoid TypeError when x is null', code);

      expect(parsed.command).toBe('fix');
      expect(parsed.prompt).toContain('Identify any bugs');
      expect(parsed.prompt).toContain('avoid TypeError when x is null');
      expect(parsed.prompt).toContain(code);
    });

    it('passes regular non-slash prompt untouched', () => {
      const parsed = parseCopilotChatPrompt('What is the difference between let and const?');
      expect(parsed.command).toBeUndefined();
      expect(parsed.prompt).toBe('What is the difference between let and const?');
    });
  });

  describe('2. Codeium — Fast Completion Caching & Docstrings', () => {
    it('caches and retrieves autocompletion suggestions', () => {
      expect(getCachedSuggestions('prefix:fetch')).toBeNull();

      setCachedSuggestions('prefix:fetch', ['fetch(url, options)', 'fetchUser(id)']);
      const cached = getCachedSuggestions('prefix:fetch');
      expect(cached).toBeDefined();
      expect(cached?.length).toBe(2);
      expect(cached?.[0]).toContain('fetch(url');

      clearCodeiumCache();
      expect(getCachedSuggestions('prefix:fetch')).toBeNull();
    });

    it('generates JSDoc comments for TypeScript functions', () => {
      const fn = 'function calculateTotal(price: number, taxRate: number, discount = 0)';
      const doc = generateDocstring(fn, 'typescript');

      expect(doc).toContain('/**');
      expect(doc).toContain('* calculateTotal description.');
      expect(doc).toContain('@param price');
      expect(doc).toContain('@param taxRate');
      expect(doc).toContain('@param discount');
      expect(doc).toContain('*/');
    });

    it('generates Python triple-quoted docstrings with :param tags', () => {
      const fn = 'def create_user(username, email, is_admin=False):';
      const doc = generateDocstring(fn, 'python');

      expect(doc).toContain('"""');
      expect(doc).toContain('create_user implementation.');
      expect(doc).toContain(':param username');
      expect(doc).toContain(':param email');
      expect(doc).toContain(':return: Result');
    });
  });

  describe('3. Continue — Context Extraction & Autopilot Payload', () => {
    it('extracts @file and @terminal references from prompt', () => {
      const rawPrompt = 'Refactor @file:src/App.tsx based on the error in @terminal and check types';
      const extracted = extractContinueContext(rawPrompt);

      expect(extracted.files).toContain('src/App.tsx');
      expect(extracted.mentionsTerminal).toBe(true);
      expect(extracted.cleanPrompt).toBe('Refactor based on the error in and check types');
    });

    it('builds Continue autopilot payload including multi-file context', () => {
      const payload = buildContinuePayload(
        'Implement authentication middleware',
        'codellama',
        'const auth = null;',
        [{ path: 'auth.ts', content: 'export interface Session {}' }]
      );

      expect(payload.model).toBe('codellama');
      expect(payload.prompt).toContain('// File: auth.ts');
      expect(payload.prompt).toContain('export interface Session');
      expect(payload.prompt).toContain('// Active Selection:');
      expect(payload.prompt).toContain('const auth = null;');
      expect(payload.prompt).toContain('User Request:');
      expect(payload.prompt).toContain('Implement authentication middleware');
    });
  });

  describe('4. Tabnine — Whole-line Prediction Engine', () => {
    it('predicts remainder of TypeScript statements based on prefix', () => {
      const pred1 = predictWholeLine('if (!response.ok', 'typescript');
      expect(pred1).toBeDefined();
      expect(pred1).toContain('throw new Error');

      const pred2 = predictWholeLine('const { data', 'typescript');
      expect(pred2).toBeDefined();
      expect(pred2).toContain('error } = await query;');
    });

    it('predicts common Python idiom from prefix', () => {
      const pred = predictWholeLine('if __name__', 'python');
      expect(pred).toBeDefined();
      expect(pred).toContain('== "__main__":');
    });

    it('returns null for prefixes that are too short', () => {
      expect(predictWholeLine('if', 'typescript')).toBeNull();
      expect(predictWholeLine('  ', 'typescript')).toBeNull();
    });
  });

  describe('5. Amazon Q Developer — Security Scans & Code Quality', () => {
    it('detects CRITICAL hardcoded AWS access keys', () => {
      const code = 'const credentials = { accessKeyId: "AKIAIOSFODNN7EXAMPLE" };';
      const vulns = scanCodeForSecurityVulnerabilities(code);

      const awsVuln = vulns.find((v) => v.title === 'Hardcoded AWS Access Key');
      expect(awsVuln).toBeDefined();
      expect(awsVuln?.severity).toBe('CRITICAL');
      expect(awsVuln?.remediation).toContain('AWS_ACCESS_KEY_ID');
      expect(awsVuln?.line).toBe(1);
    });

    it('detects SQL injection string concatenation', () => {
      const code = 'const query = "SELECT * FROM users WHERE id = " + userId;';
      const vulns = scanCodeForSecurityVulnerabilities(code);

      const sqlVuln = vulns.find((v) => v.title === 'Potential SQL Injection');
      expect(sqlVuln).toBeDefined();
      expect(sqlVuln?.severity).toBe('HIGH');
      expect(sqlVuln?.remediation).toContain('parameterized queries');
    });

    it('detects dangerous eval() invocations', () => {
      const code = 'function runDynamic(str) {\n  return eval(str);\n}';
      const vulns = scanCodeForSecurityVulnerabilities(code);

      const evalVuln = vulns.find((v) => v.title.includes('eval()'));
      expect(evalVuln).toBeDefined();
      expect(evalVuln?.line).toBe(2);
    });
  });

  describe('Runtime Activation & Registry', () => {
    it('activates and deactivates all Category 3 AI modules cleanly in extensionManager', async () => {
      const chatActivated = await extensionManager.activateExtension('xivig.copilot-chat');
      expect(chatActivated).toBe(true);
      expect(extensionManager.isExtensionActive('xivig.copilot-chat')).toBe(true);

      const codeiumActivated = await extensionManager.activateExtension('xivig.codeium');
      expect(codeiumActivated).toBe(true);
      expect(extensionManager.isExtensionActive('xivig.codeium')).toBe(true);

      const continueActivated = await extensionManager.activateExtension('xivig.continue');
      expect(continueActivated).toBe(true);

      const tabnineActivated = await extensionManager.activateExtension('xivig.tabnine');
      expect(tabnineActivated).toBe(true);

      const amazonQActivated = await extensionManager.activateExtension('xivig.amazon-q');
      expect(amazonQActivated).toBe(true);

      await extensionManager.deactivateExtension('xivig.copilot-chat');
      expect(extensionManager.isExtensionActive('xivig.copilot-chat')).toBe(false);
    });
  });
});
