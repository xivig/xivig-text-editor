export type AiModelProvider = 'copilot' | 'codeium' | 'continue' | 'tabnine' | 'amazonq' | 'openai' | 'ollama';

export interface CopilotChatSettings {
  enabled: boolean;
  inlineChatShortcut: string;
  autoIncludeSelection: boolean;
  temperature: number;
  model: string;
}

export interface CodeiumSettings {
  enabled: boolean;
  apiKey?: string;
  enableDocstringGen: boolean;
  maxSuggestions: number;
  fastMode: boolean;
}

export interface ContinueSettings {
  enabled: boolean;
  defaultModel: string;
  ollamaEndpoint: string;
  enableSlashCommands: boolean;
  contextProviders: ('file' | 'code' | 'terminal' | 'docs')[];
}

export interface TabnineSettings {
  enabled: boolean;
  localModeOnly: boolean;
  enableWholeLine: boolean;
  snippetThreshold: number;
}

export interface AmazonQSettings {
  enabled: boolean;
  region: string;
  enableSecurityScans: boolean;
  autoSuggestAwsCdk: boolean;
}

export interface AiSlashCommand {
  command: string;
  description: string;
  handler: (contextCode?: string, userPrompt?: string) => string;
}

export interface SecurityVulnerability {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  line: number;
  remediation?: string;
}
