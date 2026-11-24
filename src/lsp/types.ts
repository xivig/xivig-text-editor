/**
 * Language Server Protocol (LSP 3.17) Core Types & Interfaces
 * Shared between LSP Client, State Stores, and CodeMirror Extensions
 */

export interface Position {
  line: number; // 0-based
  character: number; // 0-based
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Location {
  uri: string;
  range: Range;
}

export interface LocationLink {
  originSelectionRange?: Range;
  targetUri: string;
  targetRange: Range;
  targetSelectionRange: Range;
}

export interface TextDocumentIdentifier {
  uri: string;
}

export interface VersionedTextDocumentIdentifier extends TextDocumentIdentifier {
  version: number;
}

export interface TextDocumentItem {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}

export interface TextDocumentContentChangeEvent {
  range?: Range;
  rangeLength?: number;
  text: string;
}

export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

export enum InsertTextFormat {
  PlainText = 1,
  Snippet = 2,
}

export interface CompletionItem {
  label: string;
  kind?: CompletionItemKind;
  tags?: number[];
  detail?: string;
  documentation?: string | MarkupContent;
  deprecated?: boolean;
  preselect?: boolean;
  sortText?: string;
  filterText?: string;
  insertText?: string;
  insertTextFormat?: InsertTextFormat;
  textEdit?: TextEdit | InsertReplaceEdit;
  additionalTextEdits?: TextEdit[];
  commitCharacters?: string[];
  command?: Command;
  data?: any;
}

export interface InsertReplaceEdit {
  newText: string;
  insert: Range;
  replace: Range;
}

export interface CompletionList {
  isIncomplete: boolean;
  items: CompletionItem[];
}

export interface MarkupContent {
  kind: 'plaintext' | 'markdown';
  value: string;
}

export interface Hover {
  contents: MarkupContent | string | Array<MarkupContent | string>;
  range?: Range;
}

export interface ParameterInformation {
  label: string | [number, number];
  documentation?: string | MarkupContent;
}

export interface SignatureInformation {
  label: string;
  documentation?: string | MarkupContent;
  parameters?: ParameterInformation[];
  activeParameter?: number;
}

export interface SignatureHelp {
  signatures: SignatureInformation[];
  activeSignature?: number;
  activeParameter?: number;
}

export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

export interface DiagnosticRelatedInformation {
  location: Location;
  message: string;
}

export interface Diagnostic {
  range: Range;
  severity?: DiagnosticSeverity;
  code?: number | string;
  codeDescription?: { href: string };
  source?: string;
  message: string;
  tags?: number[];
  relatedInformation?: DiagnosticRelatedInformation[];
  data?: any;
}

export interface PublishDiagnosticsParams {
  uri: string;
  version?: number;
  diagnostics: Diagnostic[];
}

export interface TextEdit {
  range: Range;
  newText: string;
}

export interface WorkspaceEdit {
  changes?: { [uri: string]: TextEdit[] };
  documentChanges?: any[];
}

export interface CodeActionContext {
  diagnostics: Diagnostic[];
  only?: string[];
}

export interface CodeAction {
  title: string;
  kind?: string;
  diagnostics?: Diagnostic[];
  isPreferred?: boolean;
  disabled?: { reason: string };
  edit?: WorkspaceEdit;
  command?: Command;
  data?: any;
}

export enum SymbolKind {
  File = 1,
  Module = 2,
  Namespace = 3,
  Package = 4,
  Class = 5,
  Method = 6,
  Property = 7,
  Field = 8,
  Constructor = 9,
  Enum = 10,
  Interface = 11,
  Function = 12,
  Variable = 13,
  Constant = 14,
  String = 15,
  Number = 16,
  Boolean = 17,
  Array = 18,
  Object = 19,
  Key = 20,
  Null = 21,
  EnumMember = 22,
  Struct = 23,
  Event = 24,
  Operator = 25,
  TypeParameter = 26,
}

export interface DocumentSymbol {
  name: string;
  detail?: string;
  kind: SymbolKind;
  tags?: number[];
  deprecated?: boolean;
  range: Range;
  selectionRange: Range;
  children?: DocumentSymbol[];
}

export interface SymbolInformation {
  name: string;
  kind: SymbolKind;
  tags?: number[];
  deprecated?: boolean;
  location: Location;
  containerName?: string;
}

export interface SemanticTokensLegend {
  tokenTypes: string[];
  tokenModifiers: string[];
}

export interface SemanticTokens {
  resultId?: string;
  data: number[];
}

export enum InlayHintKind {
  Type = 1,
  Parameter = 2,
}

export interface InlayHint {
  position: Position;
  label: string;
  kind?: InlayHintKind;
  textEdits?: TextEdit[];
  tooltip?: string | MarkupContent;
  paddingLeft?: boolean;
  paddingRight?: boolean;
  data?: any;
}

export interface CodeLens {
  range: Range;
  command?: Command;
  data?: any;
}

export interface Command {
  title: string;
  command: string;
  arguments?: any[];
}

export enum FoldingRangeKind {
  Comment = 'comment',
  Imports = 'imports',
  Region = 'region',
}

export interface FoldingRange {
  startLine: number;
  startCharacter?: number;
  endLine: number;
  endCharacter?: number;
  kind?: string;
  collapsedText?: string;
}

export interface FormattingOptions {
  tabSize: number;
  insertSpaces: boolean;
  trimTrailingWhitespace?: boolean;
  insertFinalNewline?: boolean;
  trimFinalNewlines?: boolean;
}

// Server Configuration & Runtime State
export type LspServerStatus = 'stopped' | 'starting' | 'running' | 'error' | 'uninstalled';

export interface LanguageServerProfile {
  id: string; // e.g. 'typescript', 'pyright', 'intelephense', 'clangd'
  name: string; // e.g. 'TypeScript Language Server'
  languages: string[]; // e.g. ['typescript', 'javascript', 'typescriptreact', 'javascriptreact']
  fileExtensions: string[]; // e.g. ['.ts', '.tsx', '.js', '.jsx']
  command: string; // executable binary or npm command
  args: string[]; // e.g. ['--stdio']
  env?: Record<string, string>;
  enabled: boolean;
  autoStart: boolean;
  status: LspServerStatus;
  statusMessage?: string;
  pid?: number;
  port?: number;
  installGuide?: string;
  capabilities?: any;
}
