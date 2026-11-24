import { EditorView } from '@codemirror/view';
import { autoIndentAndFormatEditor } from './beautify';
import { trimTrailingWhitespace, ensureFinalNewline } from './textTransformations';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Prepares and formats document content for saving according to user settings:
 * - autoIndentOnSave (code beautification / auto-indentation)
 * - trimTrailingWhitespace (strips trailing spaces/tabs from all lines)
 * - insertFinalNewline (ensures file ends with a trailing newline)
 *
 * If an active EditorView is provided and transformations modify the text,
 * the EditorView document is cleanly updated in place.
 */
export function prepareContentForSave(
  rawContent: string,
  docName: string,
  docLanguage: string,
  view?: EditorView | null
): string {
  const settings = useSettingsStore.getState().settings;
  let content = rawContent;

  if (settings.autoIndentOnSave !== false && view) {
    try {
      content = autoIndentAndFormatEditor(view, docName, docLanguage);
    } catch {
      content = view.state.doc.toString();
    }
  } else if (view) {
    content = view.state.doc.toString();
  }

  if (settings.trimTrailingWhitespace) {
    content = trimTrailingWhitespace(content);
  }

  if (settings.insertFinalNewline !== false) {
    content = ensureFinalNewline(content);
  }

  // If content changed and view is alive, sync view
  if (view && view.state.doc.toString() !== content) {
    try {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      });
    } catch {}
  }

  return content;
}
