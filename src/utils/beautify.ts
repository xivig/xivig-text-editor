import beautify from 'js-beautify';
import { EditorView } from '@codemirror/view';
import { indentRange } from '@codemirror/language';
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

export type FormatterLanguage = 'html' | 'css' | 'js' | 'php' | null;

/**
 * Normalizes and repairs PHP syntax that was corrupted by JS formatters or user edits,
 * such as "< ? php", "$this - >", split "public \n function", and broken concatenation.
 */
export function repairPhpCode(code: string): string {
  if (!code) return '';
  let repaired = code
    // Fix broken opening PHP tag "< ? php", "<? php", "< ?php" -> "<?php"
    .replace(/<\s*\?\s*php\b/gi, '<?php')
    // Fix broken closing PHP tag "? >" -> "?>"
    .replace(/\?\s*>/g, '?>')
    // Fix broken object operator "$this - > property", "$var - > prop", ") - > method" -> "$this->property"
    .replace(/([$a-zA-Z0-9_\x7f-\xff\)\]\}])\s*-\s*>\s*([a-zA-Z_\x7f-\xff$])/g, '$1->$2')
    // Fix broken static operator "::" -> "::"
    .replace(/([a-zA-Z0-9_\x7f-\xff\)\]\}])\s*:\s*:\s*([a-zA-Z_\x7f-\xff$])/g, '$1::$2')
    // Fix broken arrow array operator "=>" -> "=>"
    .replace(/=\s*>\s*/g, '=> ')
    // Fix broken string concatenation across newlines: "$class .\n"<br>";" or "$class.\n"<br>";" -> "$class . "<br>";"
    .replace(/([$a-zA-Z0-9_\x7f-\xff"'`\)\]\}])\s*\.\s*[\r\n]+\s*(['"`$a-zA-Z0-9_\(])/g, '$1 . $2');

  // Fix broken method/class modifier line breaks: "public \n function", "public \n\n function", "public \n static \n function"
  for (let pass = 0; pass < 3; pass++) {
    repaired = repaired.replace(
      /\b(public|private|protected|static|abstract|final|readonly|var)\s*[\r\n]+\s*(public|private|protected|static|abstract|final|readonly|var|function|class|\$)/gi,
      '$1 $2'
    );
  }

  return repaired;
}

/**
 * Normalizes and repairs CSS properties, vendor prefixes, units, hex colors, and pseudo-selectors corrupted by JS formatters,
 * such as "- webkit-transition", "padding - top", "3 px", "0.5 s", "table - cell", "# F45B69", "# 000000", and ": hover".
 */
export function repairCss(css: string): string {
  if (!css) return '';
  let repaired = css
    // Fix hex colors with space after # or between hex parts: "# F45B69" -> "#F45B69", "# 000000" -> "#000000", "# 94 a0b4" -> "#94a0b4"
    .replace(/#\s*([0-9a-fA-F]{1,4})\s+([0-9a-fA-F]{1,4})\b/g, '#$1$2')
    .replace(/#\s+([0-9a-fA-F]{3,8})\b/g, '#$1')
    // Fix vendor prefix leading dash: "- webkit" -> "-webkit", "- moz" -> "-moz", "- ms" -> "-ms", "- o" -> "-o"
    .replace(/(^|[\{\;\n\r])\s*-\s+([a-zA-Z])/g, '$1\n  -$2');

  // Fix hyphenated CSS words/properties/values: "table - cell" -> "table-cell", "list - style - type" -> "list-style-type"
  for (let pass = 0; pass < 5; pass++) {
    if (!/([a-zA-Z0-9_]+)(?:\s+-\s*|\s*-\s+)([a-zA-Z0-9_]+)/.test(repaired)) break;
    repaired = repaired.replace(/([a-zA-Z0-9_]+)(?:\s+-\s*|\s*-\s+)([a-zA-Z0-9_]+)/g, '$1-$2');
  }

  return repaired
    // Fix percentage values with spaces: "50 %" -> "50%", "100 %" -> "100%"
    .replace(/(\b\d+(?:\.\d+)?)\s*%(?!\w)/g, '$1%')
    // Fix CSS numbers and units: "3 px" -> "3px", "0.5 s" -> "0.5s", "20 px" -> "20px"
    .replace(/(\b\d+(?:\.\d+)?)\s+(px|em|rem|s|ms|pt|vh|vw|vmin|vmax|deg|rad|grad|turn|fr|ch|ex|cm|mm|in|dpi|dpcm|dppx|cqw|cqh|cqi|cqb|cqmin|cqmax|dvh|dvw|lvh|lvw|svh|svw)\b/gi, '$1$2')
    // Fix pseudo-elements and pseudo-classes: ":: before" -> "::before", ": hover" -> ":hover"
    .replace(/::\s+([a-zA-Z\-]+)/g, '::$1')
    .replace(/:\s+(hover|focus|active|visited|disabled|checked|first-child|last-child|nth-child|not|root)\b/gi, ':$1')
    // Fix function calls with spaces: "url (" -> "url(", "calc (" -> "calc("
    .replace(/\b(url|rgb|rgba|hsl|hsla|calc|var|min|max|clamp)\s+\(/gi, '$1(')
    // Fix ! important -> !important
    .replace(/!\s+important\b/gi, '!important');
}

/**
 * Normalizes and repairs HTML and Blade markup corrupted by JS formatters,
 * such as "<\n div class = ...", "} <\n/style>", "< /p>", and "border - color".
 */
export function repairBrokenMarkup(code: string): string {
  if (!code) return '';
  let repaired = code
    // Fix broken opening tags across newlines or with excessive spaces: "<\ndiv class = "..." >" -> "<div class = "..." >"
    .replace(/<\s*[\r\n]+\s*([a-zA-Z0-9_\-]+)/g, '<$1')
    .replace(/<\s+([a-zA-Z0-9_\-]+)(\s|>)/g, '<$1$2')
    // Fix broken closing tag after closing brace: "} <\n/style>" or "} </style>" -> "}\n</style>"
    .replace(/\}\s*<\s*[\r\n]*\s*\/\s*([a-zA-Z0-9_\-]+)\s*>/gi, '}\n</$1>')
    // Fix broken closing tags across newlines or spaces: "< /\ndiv >", "< / \ndiv >", "< /p>" -> "</div >" or "</p>"
    .replace(/<\s*[\r\n]*\s*\/\s*[\r\n]*\s*([a-zA-Z0-9_\-]+)\s*>/g, '</$1>')
    // Fix joined broken tags with newline: "div > <\n/div>" or "/div> <\ndiv" -> "div >\n</div >"
    .replace(/>\s*<\s*[\r\n]+\s*/g, '>\n<')
    // Fix broken attributes: class = "..." -> class="..."
    .replace(/([a-zA-Z0-9_\-]+)\s*=\s*(".*?"|'.*?'|`.*?`)/g, '$1=$2')
    // Fix spaces before > in tags: <div ... > -> <div ...>
    .replace(/(<[a-zA-Z0-9_\-]+[^>]*?)\s+>/g, '$1>');

  // Also apply CSS repair inside <style> blocks
  repaired = repaired.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (_match, openTag, styleContent, closeTag) => {
    return openTag + repairCss(styleContent) + closeTag;
  });

  // Also apply CSS repair inside @push('css'/'styles') or @section('css'/'styles')
  repaired = repaired.replace(/(@(?:push|section)\s*\(\s*['"](?:css|styles|style)['"]\s*\))([\s\S]*?)(@end(?:push|section))/gi, (_match, openTag, styleContent, closeTag) => {
    return openTag + repairCss(styleContent) + closeTag;
  });

  // And apply general CSS repairs in case styles are inline or in partials
  return repairCss(repaired);
}

/**
 * Safe line-by-line indenter for pure PHP files that preserves PHP tokens, tags, and comments.
 */
export function indentPhpCode(code: string, tabSize = 2): string {
  const repaired = repairPhpCode(code);
  const lines = repaired.split('\n');
  let depth = 0;
  const unit = ' '.repeat(tabSize);
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      result.push('');
      continue;
    }

    // Preserve comment lines starting with * inside docblocks
    if (trimmed.startsWith('*')) {
      result.push(unit.repeat(depth) + ' ' + trimmed);
      continue;
    }

    // Dedent if line starts with closing brace/bracket/paren
    if (/^[}\])]/.test(trimmed)) {
      depth = Math.max(0, depth - 1);
    }

    result.push(unit.repeat(depth) + trimmed);

    // Count open/close braces
    const openBraces = (trimmed.match(/[{]/g) || []).length;
    const closeBraces = (trimmed.match(/[}]/g) || []).length;

    const net = /^[}\])]/.test(trimmed)
      ? openBraces - (closeBraces - 1)
      : openBraces - closeBraces;

    depth = Math.max(0, depth + net);
  }
  return result.join('\n');
}

/**
 * Detects the proper formatter engine for a document without inappropriately falling back to JS.
 */
export function detectFormatterLanguage(docName: string, lang = ''): FormatterLanguage {
  const lowerName = (docName || '').toLowerCase().trim();
  const lowerLang = (lang || '').toLowerCase().trim();
  const ext = lowerName.split('.').pop() || '';

  // 1. Blade templates: must be checked before .php extension!
  if (
    lowerName.endsWith('.blade.php') ||
    lowerName.endsWith('.blade') ||
    lowerLang === 'blade' ||
    lowerLang.includes('blade')
  ) {
    return 'html';
  }

  // 2. HTML & Template languages
  if (
    ['html', 'htm', 'xhtml', 'vue', 'svelte', 'xml', 'svg', 'phtml'].includes(ext) ||
    ['html', 'htm', 'xhtml', 'vue', 'svelte', 'xml', 'svg'].includes(lowerLang)
  ) {
    return 'html';
  }

  // 3. CSS & Style languages
  if (
    ['css', 'scss', 'sass', 'less'].includes(ext) ||
    ['css', 'scss', 'sass', 'less'].includes(lowerLang)
  ) {
    return 'css';
  }

  // 4. PHP files (pure or mixed)
  if (ext === 'php' || lowerLang === 'php') {
    return 'php';
  }

  // 5. JavaScript / TypeScript / JSON & C-like syntax languages
  if (
    ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'json', 'java', 'c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'cs'].includes(ext) ||
    ['javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx', 'json', 'java', 'c', 'cpp', 'csharp'].includes(lowerLang)
  ) {
    return 'js';
  }

  // 6. Non-supported or strictly preserved formats (Python, YAML, Markdown, Bash, SQL, etc.)
  return null;
}

export function beautifyCode(
  code: string,
  languageOrFilename: string,
  customOptions?: BeautifyOptions,
  languageFallback = ''
): string {
  const tabSize = useSettingsStore.getState().settings.tabSize || 2;
  const lang = detectFormatterLanguage(languageOrFilename, languageFallback);

  if (lang === null) {
    return code;
  }

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
      case 'html': {
        const repaired = repairBrokenMarkup(code);
        return beautify.html(repaired, options as any);
      }
      case 'css': {
        const repaired = repairCss(code);
        return beautify.css(repaired, options as any);
      }
      case 'php': {
        const repaired = repairPhpCode(code);
        const hasHtmlTags = /<\s*(?:!DOCTYPE|html|body|div|p|span|header|footer|table|section|article|aside|nav|main|h[1-6]|ul|ol|li)\b/i.test(repaired);
        if (hasHtmlTags) {
          return beautify.html(repairBrokenMarkup(repaired), options as any);
        }
        return indentPhpCode(repaired, options.indent_size || 2);
      }
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
  const docLang = activeDoc.language || '';

  if (!selection.empty) {
    // Format only the selected range
    const selectedText = view.state.sliceDoc(selection.from, selection.to);
    const formatted = beautifyCode(selectedText, docName, undefined, docLang);

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
    const formatted = beautifyCode(fullText, docName, undefined, docLang);

    if (formatted !== fullText) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: formatted,
        },
      });
    }

    // Apply CodeMirror's indentRange for precise language-aware block alignment
    try {
      const indentChanges = indentRange(view.state, 0, view.state.doc.length);
      if (indentChanges && indentChanges.length > 0) {
        view.dispatch({ changes: indentChanges });
      }
    } catch {
      // Language may not have registered an indent context; ignore safely
    }

    const finalContent = view.state.doc.toString();
    if (activeDoc && activeDoc.content !== finalContent) {
      useEditorStore.getState().updateDocumentContent(activeDoc.id, finalContent);
    }
    return true;
  }

  return true;
}

/**
 * Auto-indents and formats code on save according to file extension and language selection.
 * Handles Python without breaking indentation blocks, C-style languages, HTML/Blade, and PHP,
 * while safely preserving language-specific tokens and preventing syntax mangling.
 */
export function autoIndentAndFormatEditor(
  view?: EditorView | null,
  docName?: string,
  language?: string
): string {
  const activeDoc = useEditorStore.getState().getActiveDocument();
  const targetDocName = docName || activeDoc?.name || '';
  const targetLang = (language || activeDoc?.language || '').toLowerCase();
  const ext = (targetDocName.split('.').pop() || '').toLowerCase();

  const isPython = ext === 'py' || targetLang === 'python';
  const isBatch = ext === 'bat' || ext === 'cmd' || targetLang === 'bat' || targetLang === 'cmd' || targetLang === 'batch';
  const isPlainText = ext === 'txt' || targetLang === 'text' || targetLang === 'plain text';
  const isMarkdown = ext === 'md' || ext === 'markdown' || targetLang === 'markdown';
  const isYaml = ext === 'yaml' || ext === 'yml' || targetLang === 'yaml';

  // For plain text, markdown, or yaml, avoid disruptive reformatting on save
  if (isPlainText || isMarkdown || isYaml) {
    if (view) {
      return view.state.doc.toString();
    }
    return activeDoc?.content || '';
  }

  const effectiveLangOrFile = targetDocName || targetLang || 'code.js';

  if (view) {
    // 1. If not python or batch script, format structure with beautifyCode
    if (!isPython && !isBatch) {
      const currentDoc = view.state.doc.toString();
      const formatted = beautifyCode(currentDoc, effectiveLangOrFile, undefined, targetLang);
      if (formatted !== currentDoc) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: formatted },
        });
      }
    }

    // 2. Apply CodeMirror's indentRange for precise language-aware block alignment
    try {
      const indentChanges = indentRange(view.state, 0, view.state.doc.length);
      if (indentChanges && indentChanges.length > 0) {
        view.dispatch({ changes: indentChanges });
      }
    } catch {
      // Language may not have registered an indent context; ignore safely
    }

    const finalContent = view.state.doc.toString();
    if (activeDoc && activeDoc.content !== finalContent) {
      useEditorStore.getState().updateDocumentContent(activeDoc.id, finalContent);
    }
    return finalContent;
  }

  // Fallback when view is not actively mounted
  if (!isPython && !isBatch && activeDoc) {
    const formatted = beautifyCode(activeDoc.content, effectiveLangOrFile, undefined, targetLang);
    if (formatted !== activeDoc.content) {
      useEditorStore.getState().updateDocumentContent(activeDoc.id, formatted);
    }
    return formatted;
  }

  return activeDoc?.content || '';
}
