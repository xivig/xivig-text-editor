import { EditorView } from '@codemirror/view';

let currentEditorView: EditorView | null = null;
const listeners = new Set<(view: EditorView | null) => void>();

export function setActiveEditorView(view: EditorView | null): void {
  currentEditorView = view;
  listeners.forEach((listener) => {
    try {
      listener(view);
    } catch (e) {
      console.error('[editorViewRegistry] Listener error:', e);
    }
  });
}

export function getActiveEditorView(): EditorView | null {
  return currentEditorView;
}

export function subscribeActiveEditorView(listener: (view: EditorView | null) => void): () => void {
  listeners.add(listener);
  try {
    listener(currentEditorView);
  } catch (e) {
    console.error('[editorViewRegistry] Initial listener error:', e);
  }
  return () => {
    listeners.delete(listener);
  };
}
