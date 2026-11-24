/**
 * JSON-RPC 2.0 Framing & Message Parser for Language Server Protocol
 * Handles RFC-compliant Content-Length header framing over stdio streams.
 */

export interface JsonRpcMessage {
  jsonrpc: '2.0';
  id?: number | string;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * Encodes a JSON-RPC message into an LSP-framed Buffer.
 * Header: `Content-Length: <len>\r\n\r\n<JSON>`
 */
export function encodeLspMessage(message: JsonRpcMessage | any): Buffer {
  const json = JSON.stringify(message);
  const byteLength = Buffer.byteLength(json, 'utf-8');
  const header = `Content-Length: ${byteLength}\r\n\r\n`;
  return Buffer.concat([Buffer.from(header, 'ascii'), Buffer.from(json, 'utf-8')]);
}

/**
 * Stream decoder that buffers incoming stdio bytes and yields complete JSON-RPC messages.
 */
export class JsonRpcDecoder {
  private buffer: Buffer = Buffer.alloc(0);

  /**
   * Appends newly received chunk and parses any complete LSP messages.
   * @param chunk Raw incoming data buffer
   * @returns Array of parsed JSON-RPC messages
   */
  public push(chunk: Buffer): JsonRpcMessage[] {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    const messages: JsonRpcMessage[] = [];

    while (this.buffer.length > 0) {
      // Find end of headers (\r\n\r\n or \n\n)
      let headerEndIndex = this.buffer.indexOf('\r\n\r\n');
      let headerDelimiterLength = 4;

      if (headerEndIndex === -1) {
        headerEndIndex = this.buffer.indexOf('\n\n');
        headerDelimiterLength = 2;
      }

      if (headerEndIndex === -1) {
        // Headers not fully received yet
        break;
      }

      const headerString = this.buffer.slice(0, headerEndIndex).toString('ascii');
      const contentLengthMatch = headerString.match(/Content-Length:\s*(\d+)/i);

      if (!contentLengthMatch) {
        // Corrupted stream or missing Content-Length header - discard up to delimiter to recover
        this.buffer = this.buffer.slice(headerEndIndex + headerDelimiterLength);
        continue;
      }

      const contentLength = parseInt(contentLengthMatch[1], 10);
      const totalMessageLength = headerEndIndex + headerDelimiterLength + contentLength;

      if (this.buffer.length < totalMessageLength) {
        // Full body not yet received, wait for next chunk
        break;
      }

      const bodyStart = headerEndIndex + headerDelimiterLength;
      const bodyBuffer = this.buffer.slice(bodyStart, bodyStart + contentLength);

      // Advance buffer past this message
      this.buffer = this.buffer.slice(totalMessageLength);

      try {
        const bodyString = bodyBuffer.toString('utf-8');
        const parsed = JSON.parse(bodyString);
        if (parsed && typeof parsed === 'object') {
          messages.push(parsed);
        }
      } catch (err) {
        console.error('[LSP JsonRpcDecoder] Failed to parse message body:', err);
      }
    }

    return messages;
  }

  /**
   * Clears any buffered unparsed content.
   */
  public reset(): void {
    this.buffer = Buffer.alloc(0);
  }
}
