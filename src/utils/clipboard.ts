import { EditorView } from '@codemirror/view';
import { useEditorStore } from '../stores/editorStore';

/**
 * Universal clipboard reader that utilizes Electron's native clipboard API
 * when available, falling back gracefully to standard navigator.clipboard.
 */
export async function readClipboardText(): Promise<string> {
  if (typeof window !== 'undefined' && window.xivig?.clipboardReadText) {
    try {
      const res = await window.xivig.clipboardReadText();
      if (typeof res === 'string') return res;
    } catch {
      // Fallback
    }
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      return await navigator.clipboard.readText();
    }
  } catch {
    // Clipboard permission denied or not focused
  }

  return '';
}

/**
 * Universal clipboard writer that utilizes Electron's native clipboard API
 * when available, falling back to navigator.clipboard.writeText.
 */
export async function writeClipboardText(text: string): Promise<boolean> {
  if (typeof window !== 'undefined' && window.xivig?.clipboardWriteText) {
    try {
      await window.xivig.clipboardWriteText(text);
      return true;
    } catch {
      // Fallback
    }
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Clipboard write blocked
  }

  return false;
}

/**
 * Copies the active selection in CodeMirror to clipboard.
 * If no text is selected, copies the entire current line.
 */
export async function copyEditorSelection(view: EditorView): Promise<boolean> {
  if (!view) return false;
  const selection = view.state.selection.main;
  let textToCopy = '';

  if (!selection.empty) {
    textToCopy = view.state.sliceDoc(selection.from, selection.to);
  } else {
    // Copy the entire line if nothing is actively selected
    const line = view.state.doc.lineAt(selection.head);
    textToCopy = line.text + '\n';
  }

  return await writeClipboardText(textToCopy);
}

/**
 * Cuts the active selection in CodeMirror to clipboard and removes it from document.
 * If no text is selected, cuts the entire current line.
 */
export async function cutEditorSelection(view: EditorView): Promise<boolean> {
  if (!view) return false;
  const selection = view.state.selection.main;

  if (!selection.empty) {
    const textToCut = view.state.sliceDoc(selection.from, selection.to);
    const ok = await writeClipboardText(textToCut);
    if (ok) {
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: '' },
        selection: { anchor: selection.from },
        userEvent: 'delete.cut',
      });
      syncStoreContent(view);
      view.focus();
      return true;
    }
  } else {
    // Cut entire line
    const line = view.state.doc.lineAt(selection.head);
    const textToCut = line.text + '\n';
    const ok = await writeClipboardText(textToCut);
    if (ok) {
      const from = line.from;
      const to = line.number < view.state.doc.lines ? line.to + 1 : line.to;
      view.dispatch({
        changes: { from, to, insert: '' },
        selection: { anchor: from },
        userEvent: 'delete.cut',
      });
      syncStoreContent(view);
      view.focus();
      return true;
    }
  }

  return false;
}

/**
 * Pastes clipboard text at current cursor location or replaces selection in CodeMirror.
 */
export async function pasteToEditor(view: EditorView): Promise<boolean> {
  if (!view) return false;
  const text = await readClipboardText();
  if (!text) return false;

  const selection = view.state.selection.main;
  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert: text },
    selection: { anchor: selection.from + text.length },
    userEvent: 'input.paste',
  });
  syncStoreContent(view);
  view.focus();
  return true;
}

/**
 * Selects all content in the editor document.
 */
export function selectAllEditor(view: EditorView): boolean {
  if (!view) return false;
  view.dispatch({
    selection: { anchor: 0, head: view.state.doc.length },
  });
  view.focus();
  return true;
}

function syncStoreContent(view: EditorView) {
  const activeDoc = useEditorStore.getState().getActiveDocument();
  if (activeDoc) {
    const content = view.state.doc.toString();
    useEditorStore.getState().updateDocumentContent(activeDoc.id, content);
  }
}
