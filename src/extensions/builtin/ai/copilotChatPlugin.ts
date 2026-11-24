import { AiSlashCommand, CopilotChatSettings } from './types';

export const DEFAULT_COPILOT_CHAT_SETTINGS: CopilotChatSettings = {
  enabled: true,
  inlineChatShortcut: 'Ctrl+I',
  autoIncludeSelection: true,
  temperature: 0.1,
  model: 'gpt-4o',
};

export const COPILOT_SLASH_COMMANDS: Record<string, AiSlashCommand> = {
  explain: {
    command: '/explain',
    description: 'Explain how the selected code works in clear, concise terms',
    handler: (code) =>
      `Please explain the following code step by step, highlighting its logic, edge cases, and time/space complexity:\n\`\`\`\n${code || ''}\n\`\`\``,
  },
  tests: {
    command: '/tests',
    description: 'Generate comprehensive unit tests for the selected code',
    handler: (code) =>
      `Generate complete, runnable unit tests for the following code using the standard testing framework for its language. Cover normal inputs, edge cases, and error scenarios:\n\`\`\`\n${code || ''}\n\`\`\``,
  },
  fix: {
    command: '/fix',
    description: 'Find and fix bugs or anti-patterns in the selected code',
    handler: (code, extraPrompt) =>
      `Identify any bugs, potential runtime exceptions, or security flaws in the following code and provide a corrected implementation:${extraPrompt ? `\nNote: ${extraPrompt}` : ''}\n\`\`\`\n${code || ''}\n\`\`\``,
  },
  optimize: {
    command: '/optimize',
    description: 'Analyze performance and propose optimized implementation',
    handler: (code) =>
      `Optimize the runtime and memory efficiency of the following code. Explain what was improved:\n\`\`\`\n${code || ''}\n\`\`\``,
  },
  doc: {
    command: '/doc',
    description: 'Generate standard documentation comments (JSDoc, docstrings, PHPDoc)',
    handler: (code) =>
      `Add comprehensive documentation comments (JSDoc/PHPDoc/Docstrings) to every function, method, and class in the following code:\n\`\`\`\n${code || ''}\n\`\`\``,
  },
};

export function parseCopilotChatPrompt(
  input: string,
  selectedCode?: string
): { prompt: string; command?: string } {
  const trimmed = input.trim();
  if (trimmed.startsWith('/')) {
    const spaceIdx = trimmed.indexOf(' ');
    const cmdKey = (spaceIdx !== -1 ? trimmed.slice(1, spaceIdx) : trimmed.slice(1)).toLowerCase();
    const extraPrompt = spaceIdx !== -1 ? trimmed.slice(spaceIdx + 1).trim() : '';

    if (COPILOT_SLASH_COMMANDS[cmdKey]) {
      const generated = COPILOT_SLASH_COMMANDS[cmdKey].handler(selectedCode, extraPrompt);
      return { prompt: generated, command: cmdKey };
    }
  }

  return { prompt: input };
}
