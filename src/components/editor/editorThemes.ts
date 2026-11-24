import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { ThemeId } from '../../styles/themes';

// -------------------------------------------------------------
// 1. Xivig Dark (Default)
// -------------------------------------------------------------
const xivigDarkView = EditorView.theme(
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
      color: '#e5e7eb',
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
      border: '1px solid #2c313d',
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

const xivigDarkHighlight = HighlightStyle.define([
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

// -------------------------------------------------------------
// 2. Monokai Pro (Sublime Text Classic)
// -------------------------------------------------------------
const monokaiView = EditorView.theme(
  {
    '&': {
      color: '#f8f8f2',
      backgroundColor: '#272822',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#f8f8f0',
      fontFamily: 'var(--xivig-font-mono)',
      padding: '12px 0',
      color: '#f8f8f2',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#f8f8f0',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(73, 72, 62, 0.75) !important',
    },
    '.cm-gutters': {
      backgroundColor: '#272822',
      color: '#75715e',
      borderRight: '1px solid #3e3d32',
      paddingRight: '6px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      color: '#f8f8f2',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#3e3d32',
      border: 'none',
      color: '#75715e',
    },
    '.cm-tooltip': {
      border: '1px solid #49483e',
      backgroundColor: '#1e1f1c',
      color: '#f8f8f2',
      borderRadius: '4px',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: '#a6e22e',
        color: '#272822',
        fontWeight: 'bold',
      },
    },
  },
  { dark: true }
);

const monokaiHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.operator, t.operatorKeyword], color: '#f92672', fontWeight: 'bold' },
  { tag: [t.function(t.variableName), t.labelName], color: '#a6e22e' },
  { tag: [t.string, t.processingInstruction, t.inserted], color: '#e6db74' },
  { tag: [t.number, t.atom, t.bool, t.constant(t.name), t.color], color: '#ae81ff' },
  { tag: [t.typeName, t.className, t.namespace, t.changed], color: '#66d9ef' },
  { tag: [t.name, t.propertyName, t.definition(t.name)], color: '#f8f8f2' },
  { tag: [t.meta, t.comment], color: '#75715e', fontStyle: 'italic' },
  { tag: [t.escape, t.regexp, t.special(t.string)], color: '#fd971f' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#66d9ef', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#a6e22e' },
  { tag: t.invalid, color: '#f92672' },
]);

// -------------------------------------------------------------
// 3. Dracula
// -------------------------------------------------------------
const draculaView = EditorView.theme(
  {
    '&': {
      color: '#f8f8f2',
      backgroundColor: '#282a36',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#f8f8f2',
      fontFamily: 'var(--xivig-font-mono)',
      padding: '12px 0',
      color: '#f8f8f2',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#ff79c6',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(68, 71, 90, 0.75) !important',
    },
    '.cm-gutters': {
      backgroundColor: '#282a36',
      color: '#6272a4',
      borderRight: '1px solid #44475a',
      paddingRight: '6px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(68, 71, 90, 0.25)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(68, 71, 90, 0.35)',
      color: '#f8f8f2',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#44475a',
      border: 'none',
      color: '#6272a4',
    },
    '.cm-tooltip': {
      border: '1px solid #44475a',
      backgroundColor: '#21222c',
      color: '#f8f8f2',
      borderRadius: '4px',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: '#44475a',
        color: '#50fa7b',
        fontWeight: 'bold',
      },
    },
  },
  { dark: true }
);

const draculaHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword, t.modifier, t.definitionKeyword, t.controlKeyword], color: '#ff79c6', fontWeight: 'bold' },
  { tag: [t.operator, t.punctuation], color: '#ff79c6' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: '#50fa7b' },
  { tag: [t.string, t.special(t.string), t.character, t.inserted, t.processingInstruction], color: '#f1fa8c' },
  { tag: [t.number, t.atom, t.bool, t.constant(t.name), t.color, t.unit], color: '#bd93f9' },
  { tag: [t.typeName, t.className, t.namespace, t.standard(t.typeName)], color: '#8be9fd', fontStyle: 'italic' },
  { tag: [t.variableName, t.name, t.definition(t.name)], color: '#f8f8f2' },
  { tag: [t.propertyName, t.attributeName], color: '#50fa7b' },
  { tag: [t.meta, t.comment, t.lineComment, t.blockComment, t.docComment], color: '#6272a4', fontStyle: 'italic' },
  { tag: [t.escape, t.regexp], color: '#ffb86c' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#8be9fd', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#bd93f9' },
  { tag: t.invalid, color: '#ff5555' },
]);

// -------------------------------------------------------------
// 4. One Dark Pro
// -------------------------------------------------------------
const oneDarkView = EditorView.theme(
  {
    '&': {
      color: '#abb2bf',
      backgroundColor: '#282c34',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#528bff',
      fontFamily: 'var(--xivig-font-mono)',
      padding: '12px 0',
      color: '#abb2bf',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#528bff',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(62, 68, 81, 0.75) !important',
    },
    '.cm-gutters': {
      backgroundColor: '#282c34',
      color: '#4b5263',
      borderRight: '1px solid #181a1f',
      paddingRight: '6px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.035)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: '#abb2bf',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#2c313a',
      border: 'none',
      color: '#5c6370',
    },
    '.cm-tooltip': {
      border: '1px solid #181a1f',
      backgroundColor: '#21252b',
      color: '#abb2bf',
      borderRadius: '4px',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: '#61afef',
        color: '#282c34',
        fontWeight: 'bold',
      },
    },
  },
  { dark: true }
);

const oneDarkHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword], color: '#c678dd', fontWeight: 'bold' },
  { tag: t.operator, color: '#56b6c2' },
  { tag: [t.function(t.variableName), t.labelName], color: '#61afef' },
  { tag: [t.string, t.processingInstruction, t.inserted], color: '#98c379' },
  { tag: [t.number, t.atom, t.bool, t.constant(t.name), t.color], color: '#d19a66' },
  { tag: [t.typeName, t.className, t.namespace], color: '#e5c07b' },
  { tag: [t.name, t.propertyName, t.definition(t.name)], color: '#abb2bf' },
  { tag: [t.meta, t.comment], color: '#5c6370', fontStyle: 'italic' },
  { tag: [t.escape, t.regexp, t.special(t.string)], color: '#56b6c2' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#61afef', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#61afef' },
  { tag: t.invalid, color: '#e06c75' },
]);

// -------------------------------------------------------------
// 5. Solarized Light
// -------------------------------------------------------------
const solarizedLightView = EditorView.theme(
  {
    '&': {
      color: '#073642',
      backgroundColor: '#fdf6e3',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#268bd2',
      fontFamily: 'var(--xivig-font-mono)',
      padding: '12px 0',
      color: '#073642',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#268bd2',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(38, 139, 210, 0.22) !important',
    },
    '.cm-gutters': {
      backgroundColor: '#fdf6e3',
      color: '#93a1a1',
      borderRight: '1px solid #d9d2c2',
      paddingRight: '6px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(7, 54, 66, 0.04)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(7, 54, 66, 0.07)',
      color: '#073642',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#eee8d5',
      border: 'none',
      color: '#93a1a1',
    },
    '.cm-tooltip': {
      border: '1px solid #d9d2c2',
      backgroundColor: '#eee8d5',
      color: '#073642',
      borderRadius: '4px',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li': {
        color: '#073642',
      },
      '& > ul > li[aria-selected]': {
        backgroundColor: '#268bd2',
        color: '#ffffff',
      },
    },
  },
  { dark: false }
);

const solarizedLightHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword], color: '#859900', fontWeight: 'bold' },
  { tag: t.operator, color: '#657b83' },
  { tag: [t.function(t.variableName), t.labelName], color: '#268bd2' },
  { tag: [t.string, t.processingInstruction, t.inserted], color: '#2aa198' },
  { tag: [t.number, t.atom, t.bool, t.constant(t.name), t.color], color: '#d33682' },
  { tag: [t.typeName, t.className, t.namespace], color: '#b58900' },
  { tag: [t.name, t.propertyName, t.definition(t.name)], color: '#073642' },
  { tag: [t.meta, t.comment], color: '#93a1a1', fontStyle: 'italic' },
  { tag: [t.escape, t.regexp, t.special(t.string)], color: '#cb4b16' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#268bd2', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#268bd2' },
  { tag: t.invalid, color: '#dc322f' },
]);

// -------------------------------------------------------------
// Theme Mapper
// -------------------------------------------------------------
export function getEditorTheme(themeId: ThemeId): Extension {
  switch (themeId) {
    case 'monokai':
      return [monokaiView, syntaxHighlighting(monokaiHighlight)];
    case 'dracula':
      return [draculaView, syntaxHighlighting(draculaHighlight)];
    case 'one-dark':
      return [oneDarkView, syntaxHighlighting(oneDarkHighlight)];
    case 'solarized-light':
      return [solarizedLightView, syntaxHighlighting(solarizedLightHighlight)];
    case 'xivig-dark':
    default:
      return [xivigDarkView, syntaxHighlighting(xivigDarkHighlight)];
  }
}
