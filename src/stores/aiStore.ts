import { create } from 'zustand';
import { generateBuiltinAiResponse } from './builtinAiEngine';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  proposedCode?: string;
  tokensUsed?: number;
  fileName?: string;
}

export type AiProvider = 'builtin' | 'openai' | 'gemini' | 'anthropic' | 'ollama' | 'custom';

interface AiState {
  provider: AiProvider;
  apiKey: string;
  endpoint: string;
  model: string;
  isPrivacyMode: boolean;
  messages: AiChatMessage[];
  isLoading: boolean;
  totalTokensUsed: number;
  includeContext: boolean;

  setProvider: (provider: AiProvider) => void;
  setApiKey: (key: string) => void;
  setEndpoint: (ep: string) => void;
  setModel: (m: string) => void;
  setPrivacyMode: (privacy: boolean) => void;
  setIncludeContext: (include: boolean) => void;
  addMessage: (role: 'user' | 'assistant', content: string, proposedCode?: string, tokensUsed?: number, fileName?: string) => void;
  clearMessages: () => void;
  sendPrompt: (prompt: string, codeContext?: string, fileName?: string, fileLanguage?: string) => Promise<string | null>;
  loadSavedSettings: () => void;
}

const STORAGE_KEY_CONFIG = 'xivig_ai_config_v1';
const STORAGE_KEY_MESSAGES = 'xivig_ai_messages_v1';

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },
};

export const useAiStore = create<AiState>((set, get) => ({
  provider: 'builtin',
  apiKey: '',
  endpoint: '',
  model: 'builtin-heuristic-v1',
  isPrivacyMode: true,
  includeContext: true,
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Xivig AI Coding Assistant.\n\nI can explain code, find bugs, generate unit tests, and refactor selections. Select any code in your editor and choose a quick action, or type a custom prompt below!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ],
  isLoading: false,
  totalTokensUsed: 0,

  loadSavedSettings: () => {
    try {
      const savedConfig = safeStorage.getItem(STORAGE_KEY_CONFIG);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        set((state) => ({ ...state, ...parsed }));
      }
      const savedMessages = safeStorage.getItem(STORAGE_KEY_MESSAGES);
      if (savedMessages) {
        const parsedMsgs = JSON.parse(savedMessages);
        if (Array.isArray(parsedMsgs) && parsedMsgs.length > 0) {
          set({ messages: parsedMsgs });
        }
      }
    } catch {
      // Ignore storage read errors
    }
  },

  setProvider: (provider) => {
    let ep = '';
    let model = 'builtin-heuristic-v1';
    let isPrivacyMode = true;

    if (provider === 'openai') {
      ep = 'https://api.openai.com/v1/chat/completions';
      model = 'gpt-4o';
      isPrivacyMode = false;
    } else if (provider === 'gemini') {
      ep = 'https://generativelanguage.googleapis.com/v1beta/models';
      model = 'gemini-1.5-flash';
      isPrivacyMode = false;
    } else if (provider === 'anthropic') {
      ep = 'https://api.anthropic.com/v1/messages';
      model = 'claude-3-5-sonnet-20241022';
      isPrivacyMode = false;
    } else if (provider === 'ollama') {
      ep = 'http://localhost:11434/api/generate';
      model = 'codellama';
      isPrivacyMode = true;
    } else if (provider === 'custom') {
      ep = 'http://localhost:1234/v1/chat/completions';
      model = 'local-model';
      isPrivacyMode = true;
    }

    set({ provider, endpoint: ep, model, isPrivacyMode });
    safeStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({
      provider,
      endpoint: ep,
      model,
      isPrivacyMode,
      apiKey: get().apiKey,
    }));
  },

  setApiKey: (apiKey) => {
    set({ apiKey });
    safeStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({
      provider: get().provider,
      endpoint: get().endpoint,
      model: get().model,
      isPrivacyMode: get().isPrivacyMode,
      apiKey,
    }));
  },

  setEndpoint: (endpoint) => {
    set({ endpoint });
    safeStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({
      provider: get().provider,
      endpoint,
      model: get().model,
      isPrivacyMode: get().isPrivacyMode,
      apiKey: get().apiKey,
    }));
  },

  setModel: (model) => {
    set({ model });
    safeStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({
      provider: get().provider,
      endpoint: get().endpoint,
      model,
      isPrivacyMode: get().isPrivacyMode,
      apiKey: get().apiKey,
    }));
  },

  setPrivacyMode: (isPrivacyMode) => set({ isPrivacyMode }),
  setIncludeContext: (includeContext) => set({ includeContext }),

  addMessage: (role, content, proposedCode, tokensUsed, fileName) => {
    const msg: AiChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role,
      content,
      proposedCode,
      tokensUsed,
      fileName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => {
      const updated = [...state.messages, msg];
      safeStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(updated.slice(-50)));
      return {
        messages: updated,
        totalTokensUsed: state.totalTokensUsed + (tokensUsed || 0),
      };
    });
  },

  clearMessages: () => {
    const defaultMsg: AiChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: 'Chat history cleared. How can I help you code today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set({ messages: [defaultMsg] });
    safeStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify([defaultMsg]));
  },

  sendPrompt: async (prompt, codeContext, fileName, fileLanguage) => {
    const { provider, apiKey, endpoint, model, addMessage } = get();
    set({ isLoading: true });

    addMessage('user', prompt, undefined, undefined, fileName);

    let fullPrompt = prompt;
    if (codeContext) {
      fullPrompt = `File: ${fileName || 'Active Buffer'} (${fileLanguage || 'code'})\n\`\`\`${fileLanguage || ''}\n${codeContext}\n\`\`\`\n\nInstruction: ${prompt}`;
    }

    try {
      // 1. Built-in Local Intelligence Engine
      if (provider === 'builtin') {
        // Simulate small natural latency for smooth UI feel
        await new Promise((r) => setTimeout(r, 200));
        const res = generateBuiltinAiResponse(prompt, codeContext, fileName, fileLanguage);
        addMessage('assistant', res.reply, res.proposedCode, res.tokensUsed, fileName);
        set({ isLoading: false });
        return res.reply;
      }

      // 2. OpenAI / Custom OpenAI-compatible Endpoint
      if (provider === 'openai' || provider === 'custom') {
        if (provider === 'openai' && !apiKey) {
          throw new Error('OpenAI API key is missing. Please configure your API key in AI Settings or switch to the Built-in Engine.');
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({
            model: model || 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are an expert software engineer and in-editor assistant for Xivig Code Editor. Be concise, precise, and format proposed code within markdown code blocks (```language).',
              },
              { role: 'user', content: fullPrompt },
            ],
            temperature: 0.2,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || `API returned status HTTP ${res.status}`);
        }

        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || 'No response generated.';
        const tokens = data.usage?.total_tokens || 0;

        const codeMatch = reply.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
        const proposedCode = codeMatch ? codeMatch[1].trim() : undefined;

        addMessage('assistant', reply, proposedCode, tokens, fileName);
        set({ isLoading: false });
        return reply;
      }

      // 3. Google Gemini API
      if (provider === 'gemini') {
        if (!apiKey) {
          throw new Error('Google Gemini API key is missing. Please enter your API key in AI Settings.');
        }
        const geminiUrl = `${endpoint}/${model || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Gemini API returned status HTTP ${res.status}`);
        }

        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
        const codeMatch = reply.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
        const proposedCode = codeMatch ? codeMatch[1].trim() : undefined;

        addMessage('assistant', reply, proposedCode, 80, fileName);
        set({ isLoading: false });
        return reply;
      }

      // 4. Anthropic Claude API
      if (provider === 'anthropic') {
        if (!apiKey) {
          throw new Error('Anthropic API key is missing. Please enter your API key in AI Settings.');
        }
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: model || 'claude-3-5-sonnet-20241022',
            max_tokens: 2048,
            messages: [{ role: 'user', content: fullPrompt }],
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Anthropic API returned status HTTP ${res.status}`);
        }

        const data = await res.json();
        const reply = data.content?.[0]?.text || 'No response generated.';
        const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

        const codeMatch = reply.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
        const proposedCode = codeMatch ? codeMatch[1].trim() : undefined;

        addMessage('assistant', reply, proposedCode, tokens, fileName);
        set({ isLoading: false });
        return reply;
      }

      // 5. Ollama / Local Model API
      if (provider === 'ollama') {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model || 'codellama',
            prompt: fullPrompt,
            stream: false,
          }),
        });

        if (!res.ok) {
          throw new Error(`Local Ollama endpoint returned HTTP ${res.status}. Ensure Ollama is running at ${endpoint}`);
        }

        const data = await res.json();
        const reply = data.response || 'No response generated.';
        const codeMatch = reply.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
        const proposedCode = codeMatch ? codeMatch[1].trim() : undefined;

        addMessage('assistant', reply, proposedCode, 50, fileName);
        set({ isLoading: false });
        return reply;
      }

      throw new Error(`Unsupported AI provider: ${provider}`);
    } catch (err: any) {
      const errorMsg = `⚠️ **Assistant Error:** ${err.message}\n\n*Suggestion:* You can switch to the **Built-in Offline Engine** in AI Settings for instant, zero-setup code assistance.`;
      addMessage('assistant', errorMsg);
      set({ isLoading: false });
      return null;
    }
  },
}));
