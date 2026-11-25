import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateBuiltinAiResponse } from '../stores/builtinAiEngine';
import { useAiStore } from '../stores/aiStore';

describe('AI Assistant & Intelligence Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAiStore.setState({
      provider: 'builtin',
      messages: [],
      totalTokensUsed: 0,
      apiKey: '',
      endpoint: '',
      model: 'builtin-heuristic-v1',
    });
  });

  describe('Built-in Offline Intelligence Engine', () => {
    it('generates Vitest unit test suite for provided functions', () => {
      const sampleCode = `
export function calculateTax(amount: number, rate: number): number {
  if (amount < 0 || rate < 0) throw new Error('Invalid input');
  return amount * rate;
}
`;
      const res = generateBuiltinAiResponse('generate unit tests for this function', sampleCode, 'taxCalculator.ts', 'typescript');
      
      expect(res.reply).toContain('Unit Test Suite Generated');
      expect(res.proposedCode).toBeDefined();
      expect(res.proposedCode).toContain('describe');
      expect(res.proposedCode).toContain('calculateTax');
      expect(res.tokensUsed).toBeGreaterThan(0);
    });

    it('identifies loose equality and security pitfalls when analyzing bugs', () => {
      const buggyCode = `
function verifyUser(id) {
  var active = true;
  if (id == 42) {
    console.log('User found');
    return true;
  }
  return false;
}
`;
      const res = generateBuiltinAiResponse('find bugs and fix this code', buggyCode, 'auth.js', 'javascript');

      expect(res.reply).toContain('Code Security & Quality Inspection');
      expect(res.reply).toContain('Loose equality comparison');
      expect(res.proposedCode).toBeDefined();
      expect(res.proposedCode).toContain('===');
      expect(res.proposedCode).not.toContain('var active');
    });

    it('refactors code with modern syntax and early returns', () => {
      const legacyCode = `
var items = [1, 2, 3];
var result = [];
for (var i = 0; i < items.length; i++) {
  result.push(items[i] * 2);
}
`;
      const res = generateBuiltinAiResponse('refactor and clean this code', legacyCode, 'items.js', 'javascript');

      expect(res.reply).toContain('Refactored Code Analysis');
      expect(res.proposedCode).toBeDefined();
      expect(res.proposedCode).toContain('const items');
    });

    it('adds standardized JSDoc comments to functions', () => {
      const sampleCode = `
function processPayment(userId: string, amount: number) {
  return true;
}
`;
      const res = generateBuiltinAiResponse('add JSDoc comments and documentation', sampleCode, 'payment.ts', 'typescript');

      expect(res.reply).toContain('JSDoc & Type Documentation Generated');
      expect(res.proposedCode).toContain('/**');
      expect(res.proposedCode).toContain('@param');
      expect(res.proposedCode).toContain('@returns');
    });

    it('explains code complexity and execution flow', () => {
      const sampleCode = `
async function fetchOrders(customerId: string) {
  const res = await api.get('/orders/' + customerId);
  return res.data;
}
`;
      const res = generateBuiltinAiResponse('explain this code', sampleCode, 'orders.ts', 'typescript');

      expect(res.reply).toContain('Code Explanation & Architectural Breakdown');
      expect(res.reply).toContain('Time Complexity');
      expect(res.reply).toContain('Space Complexity');
    });

    it('handles general programming queries without active code context', () => {
      const res = generateBuiltinAiResponse('how does react useEffect work?');

      expect(res.reply).toContain('React Hooks & Lifecycle');
      expect(res.proposedCode).toContain('useEffect');
    });
  });

  describe('useAiStore state and provider management', () => {
    it('initializes with builtin offline engine as default provider', () => {
      const state = useAiStore.getState();
      expect(state.provider).toBe('builtin');
      expect(state.isPrivacyMode).toBe(true);
    });

    it('switches providers and updates endpoints accordingly', () => {
      const { setProvider } = useAiStore.getState();

      setProvider('openai');
      expect(useAiStore.getState().provider).toBe('openai');
      expect(useAiStore.getState().endpoint).toContain('api.openai.com');
      expect(useAiStore.getState().model).toBe('gpt-4o');

      setProvider('gemini');
      expect(useAiStore.getState().provider).toBe('gemini');
      expect(useAiStore.getState().model).toBe('gemini-1.5-flash');

      setProvider('anthropic');
      expect(useAiStore.getState().provider).toBe('anthropic');
      expect(useAiStore.getState().model).toBe('claude-3-5-sonnet-20241022');

      setProvider('builtin');
      expect(useAiStore.getState().provider).toBe('builtin');
      expect(useAiStore.getState().isPrivacyMode).toBe(true);
    });

    it('executes sendPrompt with builtin provider without error', async () => {
      const { sendPrompt } = useAiStore.getState();

      const reply = await sendPrompt('explain this function', 'function add(a, b) { return a + b; }', 'math.js', 'javascript');

      expect(reply).toBeTruthy();
      const messages = useAiStore.getState().messages;
      expect(messages.length).toBe(2); // user + assistant
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].content).toContain('Code Explanation');
    });

    it('clears chat messages properly', () => {
      const { addMessage, clearMessages } = useAiStore.getState();

      addMessage('user', 'Hello AI');
      addMessage('assistant', 'Hello human');
      expect(useAiStore.getState().messages.length).toBe(2);

      clearMessages();
      expect(useAiStore.getState().messages.length).toBe(1);
      expect(useAiStore.getState().messages[0].id).toBe('welcome');
    });
  });
});
