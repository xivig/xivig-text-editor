import { EditorState, Transaction } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { AutoTagSettings } from './types';

export const DEFAULT_AUTOTAG_SETTINGS: AutoTagSettings = {
  autoClose: true,
  autoRename: true,
  selfClosingTags: [
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ],
};

const SELF_CLOSING_SET = new Set(DEFAULT_AUTOTAG_SETTINGS.selfClosingTags);

/**
 * Auto Close Tag Extension:
 * Automatically closes HTML/XML tags when '>' is typed after a tag name.
 */
export function createAutoCloseTagExtension(settings: AutoTagSettings = DEFAULT_AUTOTAG_SETTINGS) {
  return EditorState.transactionFilter.of((tr: Transaction) => {
    if (!settings.autoClose || !tr.docChanged) return tr;

    let autoCloseChange: { from: number; insert: string } | null = null;

    tr.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
      if (inserted.toString() === '>') {
        // Look backwards from fromA to see what tag opened
        const doc = tr.startState.doc;
        const line = doc.lineAt(fromA);
        const textBefore = line.text.slice(0, fromA - line.from);

        // Match <tagname or <tagname attr="val"
        const tagMatch = /<([a-zA-Z0-9_\-]+)(?:\s+[^>]*)?$/.exec(textBefore);
        if (tagMatch) {
          const tagName = tagMatch[1].toLowerCase();
          // Don't auto-close if self-closing or already a closing tag
          if (!SELF_CLOSING_SET.has(tagName) && !textBefore.endsWith('/')) {
            autoCloseChange = {
              from: toB,
              insert: `</${tagMatch[1]}>`,
            };
          }
        }
      }
    });

    if (autoCloseChange) {
      const change = autoCloseChange as { from: number; insert: string };
      return [
        tr,
        {
          changes: { from: change.from, insert: change.insert },
          selection: { anchor: change.from },
        },
      ];
    }

    return tr;
  });
}

/**
 * Auto Rename Tag Helper:
 * Detects opening and closing tags and matches corresponding tag names.
 */
export function findMatchingTag(
  docText: string,
  pos: number,
  isOpening: boolean,
  tagName: string
): { from: number; to: number } | null {
  if (isOpening) {
    // Look ahead for </tagName>
    const closeRegex = new RegExp(`</${tagName}>`, 'gi');
    closeRegex.lastIndex = pos;
    const match = closeRegex.exec(docText);
    if (match) {
      const tagStart = match.index + 2; // skip </
      return { from: tagStart, to: tagStart + tagName.length };
    }
  } else {
    // Look backwards for <tagName ...>
    const textBefore = docText.slice(0, pos);
    const openRegex = new RegExp(`<${tagName}(?:\\s+[^>]*)?>`, 'gi');
    let lastMatch: RegExpExecArray | null = null;
    let match: RegExpExecArray | null;
    while ((match = openRegex.exec(textBefore)) !== null) {
      lastMatch = match;
    }
    if (lastMatch) {
      const tagStart = lastMatch.index + 1; // skip <
      return { from: tagStart, to: tagStart + tagName.length };
    }
  }
  return null;
}
