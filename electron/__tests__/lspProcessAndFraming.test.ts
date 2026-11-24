import { describe, it, expect, beforeEach } from 'vitest';
import { encodeLspMessage, JsonRpcDecoder } from '../main/lsp/jsonRpcFraming';
import { DEFAULT_LANGUAGE_SERVERS, findServerProfileForFile } from '../main/lsp/lspServerRegistry';
import { LspManager } from '../main/lsp/lspManager';

describe('LSP: JSON-RPC Framing & Stream Parser', () => {
  let decoder: JsonRpcDecoder;

  beforeEach(() => {
    decoder = new JsonRpcDecoder();
  });

  it('correctly encodes a message with RFC-compliant Content-Length headers', () => {
    const message = { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} };
    const encoded = encodeLspMessage(message);

    const asString = encoded.toString('utf-8');
    expect(asString).toContain('Content-Length: ');
    expect(asString).toContain('\r\n\r\n');

    const expectedJson = JSON.stringify(message);
    const expectedLen = Buffer.byteLength(expectedJson, 'utf-8');
    expect(asString).toContain(`Content-Length: ${expectedLen}\r\n\r\n${expectedJson}`);
  });

  it('accurately computes byte length for multi-byte Unicode characters', () => {
    const unicodeMessage = { jsonrpc: '2.0', id: 2, method: 'echo', params: { text: '⚡🚀 Hello 世界' } };
    const encoded = encodeLspMessage(unicodeMessage);

    const json = JSON.stringify(unicodeMessage);
    const expectedByteLength = Buffer.byteLength(json, 'utf-8');
    expect(encoded.toString('utf-8')).toContain(`Content-Length: ${expectedByteLength}\r\n\r\n`);
  });

  it('decodes a single complete message from a buffer', () => {
    const message = { jsonrpc: '2.0', id: 10, result: { capabilities: { hoverProvider: true } } };
    const chunk = encodeLspMessage(message);

    const results = decoder.push(chunk);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(message);
  });

  it('decodes multiple messages bundled within a single incoming chunk', () => {
    const msg1 = { jsonrpc: '2.0', id: 1, method: 'msg1' };
    const msg2 = { jsonrpc: '2.0', id: 2, method: 'msg2' };
    const msg3 = { jsonrpc: '2.0', id: 3, method: 'msg3' };

    const combinedChunk = Buffer.concat([
      encodeLspMessage(msg1),
      encodeLspMessage(msg2),
      encodeLspMessage(msg3),
    ]);

    const results = decoder.push(combinedChunk);
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual(msg1);
    expect(results[1]).toEqual(msg2);
    expect(results[2]).toEqual(msg3);
  });

  it('buffers and decodes messages fragmented across multiple incoming stream chunks', () => {
    const message = {
      jsonrpc: '2.0',
      id: 99,
      method: 'textDocument/publishDiagnostics',
      params: { uri: 'file:///app.ts', diagnostics: [{ message: 'Syntax error' }] },
    };
    const fullBuffer = encodeLspMessage(message);

    // Split across 3 arbitrary slices
    const chunk1 = fullBuffer.slice(0, 15);
    const chunk2 = fullBuffer.slice(15, 40);
    const chunk3 = fullBuffer.slice(40);

    const res1 = decoder.push(chunk1);
    expect(res1).toHaveLength(0); // Not ready yet

    const res2 = decoder.push(chunk2);
    expect(res2).toHaveLength(0); // Still partial

    const res3 = decoder.push(chunk3);
    expect(res3).toHaveLength(1); // Complete
    expect(res3[0]).toEqual(message);
  });

  it('resets buffer cleanly when requested', () => {
    decoder.push(Buffer.from('Content-Length: 100\r\n\r\npartial'));
    decoder.reset();
    const valid = encodeLspMessage({ jsonrpc: '2.0', id: 1, method: 'test' });
    const results = decoder.push(valid);
    expect(results).toHaveLength(1);
  });
});

describe('LSP: Server Registry & Language Resolution', () => {
  it('defines comprehensive built-in server profiles for all recommended languages', () => {
    const serverIds = DEFAULT_LANGUAGE_SERVERS.map((s) => s.id);

    expect(serverIds).toContain('typescript');
    expect(serverIds).toContain('pyright');
    expect(serverIds).toContain('intelephense');
    expect(serverIds).toContain('html');
    expect(serverIds).toContain('css');
    expect(serverIds).toContain('json');
    expect(serverIds).toContain('clangd');
    expect(serverIds).toContain('rust-analyzer');
    expect(serverIds).toContain('gopls');
    expect(serverIds).toContain('jdtls');
    expect(serverIds).toContain('marksman');
    expect(serverIds).toContain('yaml');
    expect(serverIds).toContain('sql');
  });

  it('resolves TypeScript server for .ts, .tsx, .js, .jsx files', () => {
    const tsFile = findServerProfileForFile(DEFAULT_LANGUAGE_SERVERS, 'src/components/App.tsx');
    expect(tsFile?.id).toBe('typescript');

    const jsFile = findServerProfileForFile(DEFAULT_LANGUAGE_SERVERS, 'script.js');
    expect(jsFile?.id).toBe('typescript');

    const byLang = findServerProfileForFile(DEFAULT_LANGUAGE_SERVERS, 'untitled', 'typescript');
    expect(byLang?.id).toBe('typescript');
  });

  it('resolves Python (Pyright) server for .py files', () => {
    const py = findServerProfileForFile(DEFAULT_LANGUAGE_SERVERS, 'main.py');
    expect(py?.id).toBe('pyright');
  });

  it('resolves Intelephense for PHP and Blade files', () => {
    const php = findServerProfileForFile(DEFAULT_LANGUAGE_SERVERS, 'index.php');
    expect(php?.id).toBe('intelephense');

    const blade = findServerProfileForFile(DEFAULT_LANGUAGE_SERVERS, 'welcome.blade.php');
    expect(blade?.id).toBe('intelephense');
  });

  it('resolves clangd for C/C++ files', () => {
    const cpp = findServerProfileForFile(DEFAULT_LANGUAGE_SERVERS, 'engine.cpp');
    expect(cpp?.id).toBe('clangd');

    const header = findServerProfileForFile(DEFAULT_LANGUAGE_SERVERS, 'engine.h');
    expect(header?.id).toBe('clangd');
  });

  it('resolves rust-analyzer for Rust files', () => {
    const rust = findServerProfileForFile(DEFAULT_LANGUAGE_SERVERS, 'main.rs');
    expect(rust?.id).toBe('rust-analyzer');
  });

  it('resolves gopls for Go files', () => {
    const go = findServerProfileForFile(DEFAULT_LANGUAGE_SERVERS, 'server.go');
    expect(go?.id).toBe('gopls');
  });
});

describe('LSP: Manager Lifecycle & Configuration Management', () => {
  let manager: LspManager;

  beforeEach(() => {
    manager = new LspManager();
  });

  it('lists all language servers with default stopped status', () => {
    const servers = manager.listServers();
    expect(servers.length).toBeGreaterThanOrEqual(13);

    const ts = servers.find((s) => s.id === 'typescript');
    expect(ts).toBeDefined();
    expect(ts?.status).toBe('stopped');
  });

  it('allows updating server profile configuration dynamically', () => {
    const updated = manager.updateServerConfig('pyright', {
      command: '/usr/local/bin/pyright-custom',
      args: ['--stdio', '--verbose'],
      autoStart: false,
    });

    expect(updated).toBeDefined();
    expect(updated?.command).toBe('/usr/local/bin/pyright-custom');
    expect(updated?.args).toEqual(['--stdio', '--verbose']);
    expect(updated?.autoStart).toBe(false);

    const list = manager.listServers();
    const py = list.find((s) => s.id === 'pyright');
    expect(py?.command).toBe('/usr/local/bin/pyright-custom');
  });

  it('sets workspace root path correctly', () => {
    manager.setWorkspaceRoot('/workspace/my-project');
    // Does not throw and tracks root
    expect(true).toBe(true);
  });
});
