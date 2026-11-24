// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { LspProcess } from '../main/lsp/lspProcess';

describe('LSP: Capability Filtering & Unsupported Method Handling', () => {
  it('correctly filters methods when server capabilities lack inlayHintProvider, codeLensProvider, or semanticTokensProvider', () => {
    const proc = new LspProcess({
      id: 'html',
      name: 'HTML Language Server',
      languages: ['html'],
      fileExtensions: ['.html', '.htm'],
      command: 'vscode-html-language-server',
      args: ['--stdio'],
      enabled: true,
      autoStart: true,
      status: 'running',
    });

    // Before handshake / capabilities set
    expect(proc.supportsMethod('initialize')).toBe(true);
    expect(proc.supportsMethod('textDocument/inlayHint')).toBe(false);

    // Simulate HTML Language Server capabilities (which supports hover, completion, documentHighlight, documentSymbol, formatting)
    // but DOES NOT support inlay hints, code lenses, or semantic tokens
    proc.serverCapabilities = {
      hoverProvider: true,
      completionProvider: { resolveProvider: true },
      documentHighlightProvider: true,
      documentSymbolProvider: true,
      documentFormattingProvider: true,
    };

    // Supported methods
    expect(proc.supportsMethod('textDocument/hover')).toBe(true);
    expect(proc.supportsMethod('textDocument/completion')).toBe(true);
    expect(proc.supportsMethod('textDocument/documentHighlight')).toBe(true);
    expect(proc.supportsMethod('textDocument/documentSymbol')).toBe(true);
    expect(proc.supportsMethod('textDocument/formatting')).toBe(true);
    expect(proc.supportsMethod('initialize')).toBe(true);
    expect(proc.supportsMethod('shutdown')).toBe(true);

    // Unsupported methods that previously failed with "Unhandled method"
    expect(proc.supportsMethod('textDocument/inlayHint')).toBe(false);
    expect(proc.supportsMethod('textDocument/codeLens')).toBe(false);
    expect(proc.supportsMethod('textDocument/semanticTokens/full')).toBe(false);
    expect(proc.supportsMethod('textDocument/semanticTokens/range')).toBe(false);
  });

  it('correctly recognizes supported methods when server declares providers', () => {
    const proc = new LspProcess({
      id: 'typescript',
      name: 'TypeScript Language Server',
      languages: ['typescript', 'javascript'],
      fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
      command: 'typescript-language-server',
      args: ['--stdio'],
      enabled: true,
      autoStart: true,
      status: 'running',
    });

    proc.serverCapabilities = {
      hoverProvider: true,
      inlayHintProvider: true,
      codeLensProvider: { resolveProvider: true },
      semanticTokensProvider: {
        full: true,
        range: true,
      },
      definitionProvider: true,
      referencesProvider: true,
      codeActionProvider: true,
      renameProvider: true,
    };

    expect(proc.supportsMethod('textDocument/inlayHint')).toBe(true);
    expect(proc.supportsMethod('textDocument/codeLens')).toBe(true);
    expect(proc.supportsMethod('textDocument/semanticTokens/full')).toBe(true);
    expect(proc.supportsMethod('textDocument/semanticTokens/range')).toBe(true);
    expect(proc.supportsMethod('textDocument/definition')).toBe(true);
    expect(proc.supportsMethod('textDocument/references')).toBe(true);
    expect(proc.supportsMethod('textDocument/codeAction')).toBe(true);
    expect(proc.supportsMethod('textDocument/rename')).toBe(true);
  });

  it('gracefully resolves unhandled method or -32601 responses as null', async () => {
    const proc = new LspProcess({
      id: 'html',
      name: 'HTML Language Server',
      languages: ['html'],
      fileExtensions: ['.html'],
      command: 'vscode-html-language-server',
      args: ['--stdio'],
      enabled: true,
      autoStart: true,
      status: 'running',
    });

    // Mock childProcess with dummy stdin so sendRequest can enqueue
    (proc as any).childProcess = {
      stdin: { writable: true, write: () => true },
      killed: false,
    };

    // 1. Unhandled method error response
    const promise1 = proc.sendRequest('textDocument/inlayHint', {});
    (proc as any).handleIncomingMessage({
      jsonrpc: '2.0',
      id: 1,
      error: { code: -32601, message: 'Unhandled method textDocument/inlayHint' },
    });
    const result1 = await promise1;
    expect(result1).toBeNull();

    // 2. Normal error (e.g. invalid params) should still reject
    const promise2 = proc.sendRequest('textDocument/hover', {});
    (proc as any).handleIncomingMessage({
      jsonrpc: '2.0',
      id: 2,
      error: { code: -32602, message: 'Invalid params' },
    });
    await expect(promise2).rejects.toThrow('Invalid params');

    // 3. Normal successful response should resolve
    const promise3 = proc.sendRequest('textDocument/formatting', {});
    (proc as any).handleIncomingMessage({
      jsonrpc: '2.0',
      id: 3,
      result: [{ newText: '<html></html>' }],
    });
    const result3 = await promise3;
    expect(result3).toEqual([{ newText: '<html></html>' }]);
  });
});
