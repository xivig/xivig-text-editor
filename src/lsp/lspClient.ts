import {
  Position,
  Range,
  Location,
  LocationLink,
  CompletionItem,
  CompletionList,
  Hover,
  SignatureHelp,
  Diagnostic,
  CodeAction,
  DocumentSymbol,
  SymbolInformation,
  SemanticTokens,
  InlayHint,
  CodeLens,
  FoldingRange,
  FormattingOptions,
  TextEdit,
  WorkspaceEdit,
  LanguageServerProfile,
} from './types';

export class LspClient {
  public static isAvailable(): boolean {
    return typeof window !== 'undefined' && Boolean(window.xivig?.lsp);
  }

  public static async listServers(): Promise<LanguageServerProfile[]> {
    if (!this.isAvailable()) return [];
    try {
      return (await window.xivig!.lsp!.listServers()) || [];
    } catch (err) {
      console.warn('[LspClient] listServers failed:', err);
      return [];
    }
  }

  public static async startServer(serverId: string, rootPath?: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      return await window.xivig!.lsp!.startServer(serverId, rootPath);
    } catch (err) {
      console.error(`[LspClient] startServer('${serverId}') failed:`, err);
      return false;
    }
  }

  public static async stopServer(serverId: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      return await window.xivig!.lsp!.stopServer(serverId);
    } catch (err) {
      console.error(`[LspClient] stopServer('${serverId}') failed:`, err);
      return false;
    }
  }

  public static async restartServer(serverId: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      return await window.xivig!.lsp!.restartServer(serverId);
    } catch (err) {
      console.error(`[LspClient] restartServer('${serverId}') failed:`, err);
      return false;
    }
  }

  public static async updateConfig(serverId: string, patch: Partial<LanguageServerProfile>): Promise<any> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.updateConfig(serverId, patch);
    } catch (err) {
      console.error(`[LspClient] updateConfig('${serverId}') failed:`, err);
      return null;
    }
  }

  public static async setWorkspaceRoot(rootPath: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      return await window.xivig!.lsp!.setWorkspaceRoot(rootPath);
    } catch {
      return false;
    }
  }

  public static async openDocument(doc: { uri: string; languageId: string; version: number; text: string }, filePath: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await window.xivig!.lsp!.openDocument(doc, filePath);
    } catch (err) {
      console.debug('[LspClient] openDocument error:', err);
    }
  }

  public static async changeDocument(uri: string, text: string, filePath: string, languageId?: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await window.xivig!.lsp!.changeDocument(uri, text, filePath, languageId);
    } catch (err) {
      console.debug('[LspClient] changeDocument error:', err);
    }
  }

  public static async saveDocument(uri: string, filePath: string, text?: string, languageId?: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await window.xivig!.lsp!.saveDocument(uri, filePath, text, languageId);
    } catch (err) {
      console.debug('[LspClient] saveDocument error:', err);
    }
  }

  public static async closeDocument(uri: string, filePath: string, languageId?: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await window.xivig!.lsp!.closeDocument(uri, filePath, languageId);
    } catch (err) {
      console.debug('[LspClient] closeDocument error:', err);
    }
  }

  // --- Feature Queries ---

  public static async getCompletions(
    filePath: string,
    position: Position,
    languageId?: string
  ): Promise<CompletionItem[] | CompletionList | null> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.sendRequest(
        { filePath, languageId },
        'textDocument/completion',
        {
          textDocument: { uri: this.pathToUri(filePath) },
          position,
        }
      );
    } catch {
      return null;
    }
  }

  public static async getHover(
    filePath: string,
    position: Position,
    languageId?: string
  ): Promise<Hover | null> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.sendRequest(
        { filePath, languageId },
        'textDocument/hover',
        {
          textDocument: { uri: this.pathToUri(filePath) },
          position,
        }
      );
    } catch {
      return null;
    }
  }

  public static async getSignatureHelp(
    filePath: string,
    position: Position,
    languageId?: string
  ): Promise<SignatureHelp | null> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.sendRequest(
        { filePath, languageId },
        'textDocument/signatureHelp',
        {
          textDocument: { uri: this.pathToUri(filePath) },
          position,
        }
      );
    } catch {
      return null;
    }
  }

  public static async getDefinition(
    filePath: string,
    position: Position,
    languageId?: string
  ): Promise<Location | Location[] | LocationLink[] | null> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.sendRequest(
        { filePath, languageId },
        'textDocument/definition',
        {
          textDocument: { uri: this.pathToUri(filePath) },
          position,
        }
      );
    } catch {
      return null;
    }
  }

  public static async getReferences(
    filePath: string,
    position: Position,
    languageId?: string,
    includeDeclaration = true
  ): Promise<Location[] | null> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.sendRequest(
        { filePath, languageId },
        'textDocument/references',
        {
          textDocument: { uri: this.pathToUri(filePath) },
          position,
          context: { includeDeclaration },
        }
      );
    } catch {
      return null;
    }
  }

  public static async renameSymbol(
    filePath: string,
    position: Position,
    newName: string,
    languageId?: string
  ): Promise<WorkspaceEdit | null> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.sendRequest(
        { filePath, languageId },
        'textDocument/rename',
        {
          textDocument: { uri: this.pathToUri(filePath) },
          position,
          newName,
        }
      );
    } catch {
      return null;
    }
  }

  public static async getCodeActions(
    filePath: string,
    range: Range,
    diagnostics: Diagnostic[],
    languageId?: string
  ): Promise<CodeAction[] | null> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.sendRequest(
        { filePath, languageId },
        'textDocument/codeAction',
        {
          textDocument: { uri: this.pathToUri(filePath) },
          range,
          context: { diagnostics },
        }
      );
    } catch {
      return null;
    }
  }

  public static async getSemanticTokens(filePath: string, languageId?: string): Promise<SemanticTokens | null> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.sendRequest(
        { filePath, languageId },
        'textDocument/semanticTokens/full',
        {
          textDocument: { uri: this.pathToUri(filePath) },
        }
      );
    } catch {
      return null;
    }
  }

  public static async getInlayHints(filePath: string, range: Range, languageId?: string): Promise<InlayHint[] | null> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.sendRequest(
        { filePath, languageId },
        'textDocument/inlayHint',
        {
          textDocument: { uri: this.pathToUri(filePath) },
          range,
        }
      );
    } catch {
      return null;
    }
  }

  public static async getCodeLenses(filePath: string, languageId?: string): Promise<CodeLens[] | null> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.sendRequest(
        { filePath, languageId },
        'textDocument/codeLens',
        {
          textDocument: { uri: this.pathToUri(filePath) },
        }
      );
    } catch {
      return null;
    }
  }

  public static async getFoldingRanges(filePath: string, languageId?: string): Promise<FoldingRange[] | null> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.sendRequest(
        { filePath, languageId },
        'textDocument/foldingRange',
        {
          textDocument: { uri: this.pathToUri(filePath) },
        }
      );
    } catch {
      return null;
    }
  }

  public static async formatDocument(
    filePath: string,
    options: FormattingOptions,
    languageId?: string
  ): Promise<TextEdit[] | null> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.sendRequest(
        { filePath, languageId },
        'textDocument/formatting',
        {
          textDocument: { uri: this.pathToUri(filePath) },
          options,
        }
      );
    } catch {
      return null;
    }
  }

  public static async formatRange(
    filePath: string,
    range: Range,
    options: FormattingOptions,
    languageId?: string
  ): Promise<TextEdit[] | null> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.sendRequest(
        { filePath, languageId },
        'textDocument/rangeFormatting',
        {
          textDocument: { uri: this.pathToUri(filePath) },
          range,
          options,
        }
      );
    } catch {
      return null;
    }
  }

  public static async getDocumentSymbols(
    filePath: string,
    languageId?: string
  ): Promise<DocumentSymbol[] | SymbolInformation[] | null> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.sendRequest(
        { filePath, languageId },
        'textDocument/documentSymbol',
        {
          textDocument: { uri: this.pathToUri(filePath) },
        }
      );
    } catch {
      return null;
    }
  }

  public static async getWorkspaceSymbols(query: string, languageId?: string): Promise<SymbolInformation[] | null> {
    if (!this.isAvailable()) return null;
    try {
      return await window.xivig!.lsp!.sendRequest(
        { languageId },
        'workspace/symbol',
        { query }
      );
    } catch {
      return null;
    }
  }

  public static pathToUri(filePath: string): string {
    const normalized = filePath.replace(/\\/g, '/');
    return normalized.startsWith('file://') ? normalized : `file:///${normalized.replace(/^\//, '')}`;
  }

  public static uriToPath(uri: string): string {
    if (uri.startsWith('file:///')) {
      const pathPart = uri.replace('file:///', '');
      return process.platform === 'win32' ? pathPart.replace(/\//g, '\\') : `/${pathPart}`;
    }
    return uri;
  }
}
