export interface PrettierSettings {
  enabled: boolean;
  printWidth: number;
  tabWidth: number;
  useTabs: boolean;
  semi: boolean;
  singleQuote: boolean;
  trailingComma: 'none' | 'es5' | 'all';
  bracketSpacing: boolean;
  arrowParens: 'avoid' | 'always';
}

export interface ESLintSettings {
  enabled: boolean;
  runOnType: boolean;
  noUnusedVars: boolean;
  noUndef: boolean;
  eqeqeq: boolean;
  noDebugger: boolean;
  preferConst: boolean;
  noExtraSemi: boolean;
}

export interface EditorConfigSettings {
  enabled: boolean;
  respectRootConfig: boolean;
  defaultIndentStyle: 'space' | 'tab';
  defaultIndentSize: number;
  trimTrailingWhitespace: boolean;
  insertFinalNewline: boolean;
}

export interface ErrorLensSettings {
  enabled: boolean;
  displayMode: 'end-of-line' | 'inline' | 'both';
  errorColor: string;
  warningColor: string;
  infoColor: string;
  hintColor: string;
  prefix: string;
}

export interface SpellCheckerSettings {
  enabled: boolean;
  checkStrings: boolean;
  checkComments: boolean;
  checkIdentifiers: boolean;
  minWordLength: number;
  ignoredWords: string[];
}

export interface PathIntellisenseSettings {
  enabled: boolean;
  showHiddenFiles: boolean;
  autoSlash: boolean;
  supportedFileExtensions: string[];
}

export interface AutoTagSettings {
  autoClose: boolean;
  autoRename: boolean;
  selfClosingTags: string[];
}

export interface BetterCommentsSettings {
  enabled: boolean;
  highlightAlerts: boolean;
  highlightQueries: boolean;
  highlightHighlights: boolean;
  highlightTodos: boolean;
  highlightStrikethrough: boolean;
}

export interface TodoItem {
  id: string;
  type: 'TODO' | 'FIXME' | 'BUG' | 'HACK' | 'NOTE' | 'XXX';
  text: string;
  line: number;
  col: number;
  filePath?: string;
}

export interface TodoTreeSettings {
  enabled: boolean;
  tags: string[];
  trackInGutter: boolean;
}
