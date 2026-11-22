import beautify from 'js-beautify';
import { EditorView } from '@codemirror/view';
import { useEditorStore } from '../stores/editorStore';
import { useSettingsStore } from '../stores/settingsStore';

export interface BeautifyOptions {
  indent_size?: number;
  indent_char?: string;
  max_preserve_newlines?: number;
  preserve_newlines?: boolean;
  indent_inner_html?: boolean;
  end_with_newline?: boolean;
  wrap_line_length?: number;
  brace_style?: 'collapse' | 'expand' | 'end-expand' | 'none';
  space_before_conditional?: boolean;
  unescape_strings?: boolean;
}

export function detectFormatterLanguage(docName: string, lang = ''): 'html' | 'css' | 'js' {
  const ext = (docName || lang).split('.').pop()?.toLowerCase() || '';

  if (['html', 'htm', 'xhtml', 'vue', 'svelte', 'xml', 'svg', 'php'].includes(ext)) {
    return 'html';
  }
  if (['css', 'scss', 'sass', 'less'].includes(ext)) {
    return 'css';
  }
  return 'js';
}

export function beautifyCode(code: string, languageOrFilename: string, customOptions?: BeautifyOptions): string {
  const tabSize = useSettingsStore.getState().settings.tabSize || 2;
  const lang = detectFormatterLanguage(languageOrFilename);

  const options: BeautifyOptions = {
    indent_size: tabSize,
    indent_char: ' ',
    max_preserve_newlines: 2,
    preserve_newlines: true,
    indent_inner_html: true,
    end_with_newline: false,
    wrap_line_length: 120,
    brace_style: 'collapse',
    space_before_conditional: true,
    unescape_strings: false,
    ...customOptions,
  };

  try {
    switch (lang) {
      case 'html':
        return beautify.html(code, options as any);
      case 'css':
        return beautify.css(code, options as any);
      case 'js':
      default:
        return beautify.js(code, options as any);
    }
  } catch (error) {
    console.warn('[Xivig Beautify] Format failed, returning raw code:', error);
    return code;
  }
}

export function beautifyActiveEditor(view: EditorView): boolean {
  const activeDoc = useEditorStore.getState().getActiveDocument();
  if (!activeDoc) return false;

  const selection = view.state.selection.main;
  const docName = activeDoc.name || activeDoc.language || 'code.js';

  if (!selection.empty) {
    // Format only the selected range
    const selectedText = view.state.sliceDoc(selection.from, selection.to);
    const formatted = beautifyCode(selectedText, docName);

    if (formatted !== selectedText) {
      view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: formatted,
        },
      });
      return true;
    }
  } else {
    // Format the entire document
    const fullText = view.state.doc.toString();
    const formatted = beautifyCode(fullText, docName);

    if (formatted !== fullText) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: formatted,
        },
      });
      return true;
    }
  }

  return true;
}
