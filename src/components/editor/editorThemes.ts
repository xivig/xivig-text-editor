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
  { tag: t.tagName, color: '#e06c75', fontStyle: 'normal' },
  { tag: t.angleBracket, color: '#abb2bf' },
  { tag: t.attributeName, color: '#d19a66' },
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
  { tag: t.tagName, color: '#f92672', fontStyle: 'normal' },
  { tag: t.angleBracket, color: '#f8f8f2' },
  { tag: t.attributeName, color: '#a6e22e', fontStyle: 'italic' },
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
  { tag: t.tagName, color: '#ff79c6', fontStyle: 'normal' },
  { tag: t.angleBracket, color: '#f8f8f2' },
  { tag: [t.attributeName, t.propertyName], color: '#50fa7b', fontStyle: 'italic' },
  { tag: [t.attributeValue, t.string, t.special(t.string), t.character, t.inserted, t.processingInstruction], color: '#f1fa8c' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: '#50fa7b' },
  { tag: [t.number, t.atom, t.bool, t.constant(t.name), t.color, t.unit], color: '#bd93f9' },
  { tag: [t.typeName, t.className, t.namespace, t.standard(t.typeName)], color: '#8be9fd', fontStyle: 'italic' },
  { tag: [t.variableName, t.name, t.definition(t.name)], color: '#f8f8f2' },
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
  { tag: t.tagName, color: '#e06c75', fontStyle: 'normal' },
  { tag: t.angleBracket, color: '#abb2bf' },
  { tag: t.attributeName, color: '#d19a66' },
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
  { tag: t.tagName, color: '#268bd2', fontStyle: 'normal' },
  { tag: t.angleBracket, color: '#657b83' },
  { tag: t.attributeName, color: '#93a1a1' },
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
// 6. Nord Theme
// -------------------------------------------------------------
const nordView = EditorView.theme(
  {
    '&': {
      color: '#eceff4',
      backgroundColor: '#2e3440',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#88c0d0',
      fontFamily: 'var(--xivig-font-mono)',
      padding: '12px 0',
      color: '#eceff4',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#88c0d0',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(67, 76, 94, 0.75) !important',
    },
    '.cm-gutters': {
      backgroundColor: '#2e3440',
      color: '#4c566a',
      borderRight: '1px solid #3b4252',
      paddingRight: '6px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(67, 76, 94, 0.3)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(67, 76, 94, 0.4)',
      color: '#d8dee9',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#3b4252',
      border: 'none',
      color: '#4c566a',
    },
    '.cm-tooltip': {
      border: '1px solid #3b4252',
      backgroundColor: '#242933',
      color: '#eceff4',
      borderRadius: '4px',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: '#434c5e',
        color: '#88c0d0',
        fontWeight: 'bold',
      },
    },
  },
  { dark: true }
);

const nordHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: '#81a1c1', fontWeight: 'bold' },
  { tag: t.tagName, color: '#81a1c1', fontStyle: 'normal' },
  { tag: t.angleBracket, color: '#eceff4' },
  { tag: [t.operator, t.punctuation], color: '#81a1c1' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: '#88c0d0' },
  { tag: [t.string, t.special(t.string), t.character, t.inserted], color: '#a3be8c' },
  { tag: [t.number, t.atom, t.bool, t.constant(t.name), t.color], color: '#b48ead' },
  { tag: [t.typeName, t.className, t.namespace, t.standard(t.typeName)], color: '#8fbcbb', fontStyle: 'italic' },
  { tag: [t.variableName, t.name, t.definition(t.name)], color: '#d8dee9' },
  { tag: [t.propertyName, t.attributeName], color: '#88c0d0' },
  { tag: [t.meta, t.comment, t.lineComment, t.blockComment, t.docComment], color: '#616e88', fontStyle: 'italic' },
  { tag: [t.escape, t.regexp], color: '#ebcb8b' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#88c0d0', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#81a1c1' },
  { tag: t.invalid, color: '#bf616a' },
]);

// -------------------------------------------------------------
// 7. Tokyo Night
// -------------------------------------------------------------
const tokyoNightView = EditorView.theme(
  {
    '&': {
      color: '#c0caf5',
      backgroundColor: '#1a1b26',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#c0caf5',
      fontFamily: 'var(--xivig-font-mono)',
      padding: '12px 0',
      color: '#c0caf5',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#7aa2f7',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(40, 52, 87, 0.75) !important',
    },
    '.cm-gutters': {
      backgroundColor: '#1a1b26',
      color: '#565f89',
      borderRight: '1px solid #292e42',
      paddingRight: '6px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(41, 46, 66, 0.35)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(41, 46, 66, 0.45)',
      color: '#c0caf5',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#292e42',
      border: 'none',
      color: '#565f89',
    },
    '.cm-tooltip': {
      border: '1px solid #292e42',
      backgroundColor: '#16161e',
      color: '#c0caf5',
      borderRadius: '4px',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: '#283457',
        color: '#7aa2f7',
        fontWeight: 'bold',
      },
    },
  },
  { dark: true }
);

const tokyoNightHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: '#bb9af7', fontWeight: 'bold' },
  { tag: t.tagName, color: '#f7768e', fontStyle: 'normal' },
  { tag: t.angleBracket, color: '#89ddff' },
  { tag: [t.operator, t.punctuation], color: '#89ddff' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: '#7aa2f7' },
  { tag: [t.string, t.special(t.string), t.character, t.inserted], color: '#9ece6a' },
  { tag: [t.number, t.atom, t.bool, t.constant(t.name), t.color], color: '#ff9e64' },
  { tag: [t.typeName, t.className, t.namespace, t.standard(t.typeName)], color: '#2ac3de', fontStyle: 'italic' },
  { tag: [t.variableName, t.name, t.definition(t.name)], color: '#c0caf5' },
  { tag: [t.propertyName, t.attributeName], color: '#7aa2f7' },
  { tag: [t.meta, t.comment, t.lineComment, t.blockComment, t.docComment], color: '#565f89', fontStyle: 'italic' },
  { tag: [t.escape, t.regexp], color: '#b4f9f8' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#7aa2f7', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#bb9af7' },
  { tag: t.invalid, color: '#f7768e' },
]);

// -------------------------------------------------------------
// 8. Cyberpunk 2077
// -------------------------------------------------------------
const cyberpunkView = EditorView.theme(
  {
    '&': {
      color: '#e5e7eb',
      backgroundColor: '#0d0f18',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#fee801',
      fontFamily: 'var(--xivig-font-mono)',
      padding: '12px 0',
      color: '#e5e7eb',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#fee801',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(254, 232, 1, 0.28) !important',
    },
    '.cm-gutters': {
      backgroundColor: '#0a0c14',
      color: '#ff003c',
      borderRight: '1px solid #2a3356',
      paddingRight: '6px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(28, 34, 60, 0.35)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(28, 34, 60, 0.5)',
      color: '#fee801',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#1c223c',
      border: 'none',
      color: '#00f0ff',
    },
    '.cm-tooltip': {
      border: '1px solid #fee801',
      backgroundColor: '#121526',
      color: '#e5e7eb',
      borderRadius: '4px',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: '#fee801',
        color: '#0d0f18',
        fontWeight: 'bold',
      },
    },
  },
  { dark: true }
);

const cyberpunkHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: '#00f0ff', fontWeight: 'bold' },
  { tag: t.tagName, color: '#01cdfe', fontStyle: 'normal' },
  { tag: t.angleBracket, color: '#ff003c' },
  { tag: [t.operator, t.punctuation], color: '#ff003c' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: '#fee801' },
  { tag: [t.string, t.special(t.string), t.character, t.inserted], color: '#05d9e8' },
  { tag: [t.number, t.atom, t.bool, t.constant(t.name), t.color], color: '#ff0055' },
  { tag: [t.typeName, t.className, t.namespace, t.standard(t.typeName)], color: '#ff71ce', fontStyle: 'italic' },
  { tag: [t.variableName, t.name, t.definition(t.name)], color: '#e5e7eb' },
  { tag: [t.propertyName, t.attributeName], color: '#fee801' },
  { tag: [t.meta, t.comment, t.lineComment, t.blockComment, t.docComment], color: '#6b7280', fontStyle: 'italic' },
  { tag: [t.escape, t.regexp], color: '#00ff9f' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#00f0ff', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#fee801' },
  { tag: t.invalid, color: '#ff003c' },
]);

// -------------------------------------------------------------
// 9. GitHub Dark
// -------------------------------------------------------------
const githubDarkView = EditorView.theme(
  {
    '&': {
      color: '#c9d1d9',
      backgroundColor: '#0d1117',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#58a6ff',
      fontFamily: 'var(--xivig-font-mono)',
      padding: '12px 0',
      color: '#c9d1d9',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#58a6ff',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(56, 139, 253, 0.28) !important',
    },
    '.cm-gutters': {
      backgroundColor: '#0d1117',
      color: '#6e7681',
      borderRight: '1px solid #21262d',
      paddingRight: '6px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(110, 118, 129, 0.12)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(110, 118, 129, 0.18)',
      color: '#c9d1d9',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#21262d',
      border: 'none',
      color: '#8b949e',
    },
    '.cm-tooltip': {
      border: '1px solid #30363d',
      backgroundColor: '#161b22',
      color: '#c9d1d9',
      borderRadius: '4px',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: '#1f6feb',
        color: '#ffffff',
        fontWeight: 'bold',
      },
    },
  },
  { dark: true }
);

const githubDarkHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: '#ff7b72', fontWeight: 'bold' },
  { tag: t.tagName, color: '#7ee787', fontStyle: 'normal' },
  { tag: t.angleBracket, color: '#c9d1d9' },
  { tag: [t.operator, t.punctuation], color: '#ff7b72' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: '#d2a8ff' },
  { tag: [t.string, t.special(t.string), t.character, t.inserted], color: '#a5d6ff' },
  { tag: [t.number, t.atom, t.bool, t.constant(t.name), t.color], color: '#79c0ff' },
  { tag: [t.typeName, t.className, t.namespace, t.standard(t.typeName)], color: '#ffa657', fontStyle: 'italic' },
  { tag: [t.variableName, t.name, t.definition(t.name)], color: '#c9d1d9' },
  { tag: [t.propertyName, t.attributeName], color: '#7ee787' },
  { tag: [t.meta, t.comment, t.lineComment, t.blockComment, t.docComment], color: '#8b949e', fontStyle: 'italic' },
  { tag: [t.escape, t.regexp], color: '#7ee787' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#58a6ff', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#58a6ff' },
  { tag: t.invalid, color: '#f85149' },
]);

// -------------------------------------------------------------
// 10. SynthWave '84
// -------------------------------------------------------------
const synthwaveView = EditorView.theme(
  {
    '&': {
      color: '#f8f8f2',
      backgroundColor: '#262335',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#fede5d',
      fontFamily: 'var(--xivig-font-mono)',
      padding: '12px 0',
      color: '#f8f8f2',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#fede5d',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(255, 126, 219, 0.28) !important',
    },
    '.cm-gutters': {
      backgroundColor: '#262335',
      color: '#847b9b',
      borderRight: '1px solid #463f63',
      paddingRight: '6px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(52, 47, 73, 0.35)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(52, 47, 73, 0.5)',
      color: '#fede5d',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#342f49',
      border: 'none',
      color: '#ff7edb',
    },
    '.cm-tooltip': {
      border: '1px solid #ff7edb',
      backgroundColor: '#201d2d',
      color: '#f8f8f2',
      borderRadius: '4px',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: '#f92aad',
        color: '#ffffff',
        fontWeight: 'bold',
      },
    },
  },
  { dark: true }
);

const synthwaveHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: '#f92aad', fontWeight: 'bold' },
  { tag: t.tagName, color: '#fe4450', fontStyle: 'normal' },
  { tag: t.angleBracket, color: '#36f9f6' },
  { tag: [t.operator, t.punctuation], color: '#fede5d' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: '#36f9f6' },
  { tag: [t.string, t.special(t.string), t.character, t.inserted], color: '#ff8b39' },
  { tag: [t.number, t.atom, t.bool, t.constant(t.name), t.color], color: '#f92aad' },
  { tag: [t.typeName, t.className, t.namespace, t.standard(t.typeName)], color: '#fe4450', fontStyle: 'italic' },
  { tag: [t.variableName, t.name, t.definition(t.name)], color: '#f8f8f2' },
  { tag: [t.propertyName, t.attributeName], color: '#ff7edb' },
  { tag: [t.meta, t.comment, t.lineComment, t.blockComment, t.docComment], color: '#847b9b', fontStyle: 'italic' },
  { tag: [t.escape, t.regexp], color: '#36f9f6' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#36f9f6', textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold', color: '#fede5d' },
  { tag: t.invalid, color: '#fe4450' },
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
    case 'nord':
      return [nordView, syntaxHighlighting(nordHighlight)];
    case 'tokyo-night':
      return [tokyoNightView, syntaxHighlighting(tokyoNightHighlight)];
    case 'cyberpunk':
      return [cyberpunkView, syntaxHighlighting(cyberpunkHighlight)];
    case 'github-dark':
      return [githubDarkView, syntaxHighlighting(githubDarkHighlight)];
    case 'synthwave':
      return [synthwaveView, syntaxHighlighting(synthwaveHighlight)];
    case 'xivig-dark':
    default:
      return [xivigDarkView, syntaxHighlighting(xivigDarkHighlight)];
  }
}
