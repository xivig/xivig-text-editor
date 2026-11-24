import { EditorView } from '@codemirror/view';
import { useFormatStore } from './formatStore';
import { formatDocumentWithLsp } from '../lsp/lspFormatting';
import { organizeImports } from '../lsp/lspCodeActions';
import { beautifyCode } from '../utils/beautify';

/**
 * Formats an entire CodeMirror document using the configured pipeline:
 * 1. External CLI formatter via Electron IPC (Prettier, Pint, Ruff, Black, etc.)
 * 2. LSP formatting fallback
 * 3. js-beautify fallback
 */
export async function formatDocument(
  view: EditorView,
  filePath?: string,
  language?: string
): Promise<boolean> {
  const currentText = view.state.doc.toString();
  if (!currentText.trim()) return false;

  const targetLang = (language || 'javascript').toLowerCase();
  const store = useFormatStore.getState();
  const preferredFormatter = store.defaultFormatterByLanguage[targetLang];

  // 1. Try external formatter via IPC
  if (window.xivig?.formatter?.formatSourceCode) {
    try {
      const res = await window.xivig.formatter.formatSourceCode(currentText, {
        filePath,
        language: targetLang,
        formatterId: preferredFormatter,
      });

      if (res?.success && res.formattedText && res.formattedText !== currentText) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: res.formattedText },
        });
        return true;
      }
    } catch (err) {
      console.warn('[FormatService] IPC format failed, trying LSP:', err);
    }
  }

  // 2. Try LSP formatting
  if (filePath) {
    try {
      const lspSuccess = await formatDocumentWithLsp(view, filePath, 2, true, targetLang);
      if (lspSuccess) return true;
    } catch {
      // fallback
    }
  }

  // 3. Fallback to js-beautify
  try {
    const beautified = beautifyCode(currentText, targetLang);
    if (beautified && beautified !== currentText) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: beautified },
      });
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

/**
 * Formats the selected text range in CodeMirror.
 */
export async function formatSelection(
  view: EditorView,
  filePath?: string,
  language?: string
): Promise<boolean> {
  const selection = view.state.selection.main;
  if (selection.empty) {
    return formatDocument(view, filePath, language);
  }

  const selectedText = view.state.sliceDoc(selection.from, selection.to);
  if (!selectedText.trim()) return false;

  const targetLang = (language || 'javascript').toLowerCase();

  // Try formatting the selected snippet with beautifier
  try {
    const formatted = beautifyCode(selectedText, targetLang);
    if (formatted && formatted !== selectedText) {
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: formatted },
      });
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

/**
 * Organizes and sorts imports in the active document.
 */
export async function runOrganizeImports(
  view: EditorView,
  filePath?: string,
  language?: string
): Promise<boolean> {
  if (!filePath) return false;
  return organizeImports(view, filePath, language);
}

/**
 * Runs linter auto-fix (e.g. ESLint --fix, Ruff check --fix).
 */
export async function runFixAllProblems(
  view: EditorView,
  filePath?: string,
  language?: string
): Promise<boolean> {
  const currentText = view.state.doc.toString();
  if (!currentText.trim()) return false;

  const targetLang = (language || '').toLowerCase();
  const linterId = targetLang === 'python' ? 'ruff' : 'eslint';

  if (window.xivig?.formatter?.lintAndFix) {
    try {
      const res = await window.xivig.formatter.lintAndFix(currentText, linterId, filePath);
      if (res?.success && res.fixedText && res.fixedText !== currentText) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: res.fixedText },
        });
        return true;
      }
    } catch (err) {
      console.warn('[FormatService] lintAndFix error:', err);
    }
  }

  return false;
}
