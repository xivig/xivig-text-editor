import { CompletionContext, CompletionResult, Completion, snippet } from '@codemirror/autocomplete';
import { LspClient } from './lspClient';
import { offsetToPosition } from './lspUtils';
import { CompletionItem, CompletionItemKind, InsertTextFormat } from './types';

export function createLspCompletionSource(filePath: string, languageId: string) {
  return async (context: CompletionContext): Promise<CompletionResult | null> => {
    if (!filePath || filePath.startsWith('untitled')) return null;

    const word = context.matchBefore(/[\w$]+/);
    if (!word && !context.explicit) return null;

    const position = offsetToPosition(context.state.doc, context.pos);
    const result = await LspClient.getCompletions(filePath, position, languageId);

    if (!result) return null;

    const rawItems = Array.isArray(result) ? result : result.items || [];
    if (rawItems.length === 0) return null;

    const options: Completion[] = rawItems.map((item: CompletionItem) => {
      const type = mapCompletionKind(item.kind);
      const detail = item.detail;
      const info = typeof item.documentation === 'string'
        ? item.documentation
        : item.documentation?.value;

      if (item.insertTextFormat === InsertTextFormat.Snippet && (item.insertText || item.label)) {
        const template = item.insertText || item.label;
        return {
          label: item.label,
          detail,
          type,
          info,
          apply: snippet(template),
          boost: item.preselect ? 2 : 0,
        };
      }

      return {
        label: item.label,
        detail,
        type,
        info,
        apply: item.insertText || item.label,
        boost: item.preselect ? 2 : 0,
      };
    });

    return {
      from: word ? word.from : context.pos,
      options,
    };
  };
}

function mapCompletionKind(kind?: CompletionItemKind): string {
  switch (kind) {
    case CompletionItemKind.Method:
    case CompletionItemKind.Function:
    case CompletionItemKind.Constructor:
      return 'function';
    case CompletionItemKind.Class:
    case CompletionItemKind.Interface:
    case CompletionItemKind.Struct:
      return 'class';
    case CompletionItemKind.Variable:
    case CompletionItemKind.Field:
      return 'variable';
    case CompletionItemKind.Property:
      return 'property';
    case CompletionItemKind.Keyword:
      return 'keyword';
    case CompletionItemKind.Snippet:
      return 'snippet';
    case CompletionItemKind.Constant:
    case CompletionItemKind.Value:
      return 'constant';
    case CompletionItemKind.TypeParameter:
      return 'type';
    default:
      return 'text';
  }
}
