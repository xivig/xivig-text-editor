import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

export const xivigTheme = EditorView.theme(
  {
    '&': {
      color: '#e5e7eb',
      backgroundColor: '#17191f',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#6c8cff',
      fontFamily: 'var(--xivig-font-mono)',
      padding: '12px 0',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#6c8cff',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(108, 140, 255, 0.25) !important',
    },
    '.cm-gutters': {
      backgroundColor: '#17191f',
      color: '#646b7a',
      borderRight: '1px solid #21252f',
      paddingRight: '6px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      color: '#e5e7eb',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#262a35',
      border: 'none',
      color: '#9299a8',
    },
    '.cm-tooltip': {
      border: '1px solid #303542',
      backgroundColor: '#1d2028',
      color: '#e5e7eb',
      borderRadius: '4px',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: '#6c8cff',
        color: '#ffffff',
      },
    },
  },
  { dark: true }
);

export const xivigHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#e06c75', fontWeight: 'bold' },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: '#e5e7eb' },
  { tag: [t.function(t.variableName), t.labelName], color: '#61afef' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#d19a66' },
  { tag: [t.definition(t.name), t.separator], color: '#abb2bf' },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#e5c07b' },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: '#56b6c2' },
  { tag: [t.meta, t.comment], color: '#7f848e', fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#6c8cff', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#61afef' },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#d19a66' },
  { tag: [t.processingInstruction, t.string, t.inserted], color: '#98c379' },
  { tag: t.invalid, color: '#ef6464' },
]);

export const xivigSyntaxTheme: Extension = [
  xivigTheme,
  syntaxHighlighting(xivigHighlightStyle),
];
