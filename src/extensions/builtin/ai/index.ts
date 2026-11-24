import { BuiltinExtensionModule } from '../../api/types';
import { DEFAULT_COPILOT_CHAT_SETTINGS } from './copilotChatPlugin';
import { DEFAULT_CODEIUM_SETTINGS } from './codeiumPlugin';
import { DEFAULT_CONTINUE_SETTINGS } from './continuePlugin';
import { DEFAULT_TABNINE_SETTINGS } from './tabninePlugin';
import { DEFAULT_AMAZON_Q_SETTINGS } from './amazonQPlugin';

export * from './types';
export * from './copilotChatPlugin';
export * from './codeiumPlugin';
export * from './continuePlugin';
export * from './tabninePlugin';
export * from './amazonQPlugin';

// 1. GitHub Copilot Chat Extension Module
export const copilotChatExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.copilot-chat',
    name: 'GitHub Copilot Chat',
    publisher: 'GitHub',
    version: '0.14.0',
    description: 'AI chat companion: ask questions, generate unit tests, explain code, and execute slash commands.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#1f242c',
    iconSymbol: '💬',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. Codeium Extension Module
export const codeiumExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.codeium',
    name: 'Codeium: Free AI Code Completion & Chat',
    publisher: 'Codeium',
    version: '1.8.0',
    description: 'Ultra-fast, free multi-language code completion, docstring generation, and in-editor chat.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#09b6a2',
    iconSymbol: '⚡',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. Continue Extension Module
export const continueExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.continue',
    name: 'Continue — Open-source Autopilot',
    publisher: 'Continue',
    version: '0.8.0',
    description: 'Open-source autopilot connecting local models (Ollama, LM Studio) and cloud LLMs with custom @context.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#ff6b4a',
    iconSymbol: '⏩',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. Tabnine Extension Module
export const tabnineExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.tabnine',
    name: 'Tabnine AI: Whole-line & Full-function Completions',
    publisher: 'Tabnine',
    version: '3.120.0',
    description: 'AI code completions with privacy-first local mode and zero code sharing.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#172b4d',
    iconSymbol: '🔮',
  },
  activate: () => {},
  deactivate: () => {},
};

// 5. Amazon Q Developer Extension Module
export const amazonQExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.amazon-q',
    name: 'Amazon Q Developer',
    publisher: 'Amazon Web Services',
    version: '1.24.0',
    description: 'Generative AI assistant for software development with automated code security scans.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#232f3e',
    iconSymbol: '☁️',
  },
  activate: () => {},
  deactivate: () => {},
};
