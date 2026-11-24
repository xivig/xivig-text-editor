import { create } from 'zustand';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  proposedCode?: string;
  tokensUsed?: number;
}

export type AiProvider = 'openai' | 'ollama' | 'custom';

interface AiState {
  provider: AiProvider;
  apiKey: string;
  endpoint: string;
  model: string;
  isPrivacyMode: boolean; // Only local models
  messages: AiChatMessage[];
  isLoading: boolean;
  totalTokensUsed: number;

  setProvider: (provider: AiProvider) => void;
  setApiKey: (key: string) => void;
  setEndpoint: (ep: string) => void;
  setModel: (m: string) => void;
  setPrivacyMode: (privacy: boolean) => void;
  addMessage: (role: 'user' | 'assistant', content: string, proposedCode?: string, tokensUsed?: number) => void;
  clearMessages: () => void;
  sendPrompt: (prompt: string, codeContext?: string) => Promise<string | null>;
}

export const useAiStore = create<AiState>((set, get) => ({
  provider: 'ollama',
  apiKey: '',
  endpoint: 'http://localhost:11434/api/generate',
  model: 'codellama',
  isPrivacyMode: true,
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Xivig AI Coding Assistant. I can explain code, generate tests, refactor selections, or suggest bug fixes.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ],
  isLoading: false,
  totalTokensUsed: 0,

  setProvider: (provider) => {
    let ep = 'http://localhost:11434/api/generate';
    let model = 'codellama';
    if (provider === 'openai') {
      ep = 'https://api.openai.com/v1/chat/completions';
      model = 'gpt-4o';
    }
    set({ provider, endpoint: ep, model, isPrivacyMode: provider === 'ollama' });
  },

  setApiKey: (apiKey) => set({ apiKey }),
  setEndpoint: (endpoint) => set({ endpoint }),
  setModel: (model) => set({ model }),
  setPrivacyMode: (isPrivacyMode) => set({ isPrivacyMode }),

  addMessage: (role, content, proposedCode, tokensUsed) => {
    const msg: AiChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role,
      content,
      proposedCode,
      tokensUsed,
      timestamp: new Date().toLocaleTimeString(),
    };
    set((state) => ({
      messages: [...state.messages, msg],
      totalTokensUsed: state.totalTokensUsed + (tokensUsed || 0),
    }));
  },

  clearMessages: () => set({ messages: [] }),

  sendPrompt: async (prompt, codeContext) => {
    const { provider, apiKey, endpoint, model, addMessage } = get();
    set({ isLoading: true });

    let fullPrompt = prompt;
    if (codeContext) {
      fullPrompt = `Context code:\n\`\`\`\n${codeContext}\n\`\`\`\n\nTask: ${prompt}`;
    }

    addMessage('user', prompt);

    try {
      if (provider === 'openai') {
        if (!apiKey) {
          throw new Error('OpenAI API key is missing. Please set your API key in AI settings.');
        }
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || 'gpt-4o',
            messages: [{ role: 'user', content: fullPrompt }],
            temperature: 0.2,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || `OpenAI returned status ${res.status}`);
        }

        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || 'No response generated.';
        const tokens = data.usage?.total_tokens || 0;

        // Check if reply includes a code fence
        const codeMatch = reply.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
        const proposedCode = codeMatch ? codeMatch[1].trim() : undefined;

        addMessage('assistant', reply, proposedCode, tokens);
        set({ isLoading: false });
        return reply;
      } else {
        // Ollama / Local Model API
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
          throw new Error(`Local model endpoint returned HTTP ${res.status}`);
        }

        const data = await res.json();
        const reply = data.response || 'No response generated.';
        const codeMatch = reply.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
        const proposedCode = codeMatch ? codeMatch[1].trim() : undefined;

        addMessage('assistant', reply, proposedCode, 50);
        set({ isLoading: false });
        return reply;
      }
    } catch (err: any) {
      addMessage(
        'assistant',
        `Error: ${err.message}. Ensure your local model or API credentials are running properly.`
      );
      set({ isLoading: false });
      return null;
    }
  },
}));
