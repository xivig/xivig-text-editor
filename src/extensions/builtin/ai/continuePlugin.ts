import { ContinueSettings } from './types';

export const DEFAULT_CONTINUE_SETTINGS: ContinueSettings = {
  enabled: true,
  defaultModel: 'codellama',
  ollamaEndpoint: 'http://localhost:11434',
  enableSlashCommands: true,
  contextProviders: ['file', 'code', 'terminal', 'docs'],
};

export interface ExtractedContext {
  files: string[];
  mentionsTerminal: boolean;
  cleanPrompt: string;
}

/**
 * Extracts @context references (e.g. "@file:App.tsx", "@terminal") from user prompt.
 */
export function extractContinueContext(prompt: string): ExtractedContext {
  const fileMatches = Array.from(prompt.matchAll(/@file:([^\s]+)/g)).map((m) => m[1]);
  const mentionsTerminal = /@terminal\b/i.test(prompt);

  const cleanPrompt = prompt
    .replace(/@file:[^\s]+/g, '')
    .replace(/@terminal\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    files: fileMatches,
    mentionsTerminal,
    cleanPrompt,
  };
}

/**
 * Formats a payload for local Ollama / Continue autopilot models.
 */
export function buildContinuePayload(
  prompt: string,
  model = 'codellama',
  codeContext?: string,
  extraFiles?: { path: string; content: string }[]
): { model: string; prompt: string; stream: boolean } {
  let combined = '';

  if (extraFiles && extraFiles.length > 0) {
    for (const f of extraFiles) {
      combined += `// File: ${f.path}\n${f.content}\n\n`;
    }
  }

  if (codeContext) {
    combined += `// Active Selection:\n${codeContext}\n\n`;
  }

  combined += `User Request:\n${prompt}`;

  return {
    model,
    prompt: combined,
    stream: false,
  };
}
