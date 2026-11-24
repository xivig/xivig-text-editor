import { Extension as CodeMirrorExtension } from '@codemirror/state';

export type ExtensionCategory =
  | 'Themes'
  | 'Languages'
  | 'Productivity'
  | 'Formatters'
  | 'Linters'
  | 'Other';

export interface ExtensionContributionSetting {
  id: string;
  type: 'boolean' | 'string' | 'number';
  default: any;
  description?: string;
}

export interface ExtensionContributionCommand {
  command: string;
  title: string;
  category?: string;
  keybinding?: string;
}

export interface ExtensionContributionTheme {
  id: string;
  label: string;
  isDark: boolean;
}

export interface ExtensionContributions {
  settings?: ExtensionContributionSetting[];
  commands?: ExtensionContributionCommand[];
  themes?: ExtensionContributionTheme[];
  editorExtensions?: () => CodeMirrorExtension[];
}

export interface ExtensionManifest {
  $schema?: string;
  id: string;
  name: string;
  displayName?: string;
  publisher: string;
  version: string;
  description: string;
  categories: ExtensionCategory[];
  engines: {
    xivig: string;
  };
  activationEvents?: string[];
  permissions?: string[];
  contributes?: {
    settings?: ExtensionContributionSetting[];
    commands?: ExtensionContributionCommand[];
    themes?: ExtensionContributionTheme[];
  };
  iconBg?: string;
  iconSymbol?: string;
}

export interface Disposable {
  dispose: () => void | Promise<void>;
}

export interface ExtensionContext {
  extensionId: string;
  subscriptions: Disposable[];
  registerCodeMirrorExtension: (extension: CodeMirrorExtension) => void;
  getSetting: <T = any>(key: string, defaultValue?: T) => T;
}

export interface BuiltinExtensionModule {
  manifest: ExtensionManifest;
  activate: (context: ExtensionContext) => Promise<void> | void;
  deactivate?: () => Promise<void> | void;
  getCodeMirrorExtensions?: () => CodeMirrorExtension[];
  getSnippets?: (language?: string) => any[];
}

export interface ExtensionRuntimeState {
  id: string;
  manifest: ExtensionManifest;
  status: 'installed' | 'enabled' | 'disabled' | 'activating' | 'error';
  error?: string;
  context?: ExtensionContext;
}
