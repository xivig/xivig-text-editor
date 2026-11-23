import { EditorView } from '@codemirror/view';

let currentEditorView: EditorView | null = null;
const viewsByPane = new Map<string, EditorView>();
const listeners = new Set<(view: EditorView | null) => void>();

export function setActiveEditorView(view: EditorView | null, pane: string = 'primary'): void {
  if (view) {
    viewsByPane.set(pane, view);
    currentEditorView = view;
  } else {
    viewsByPane.delete(pane);
    // If the clearing view was active, fallback to primary or another available pane
    if (currentEditorView === view || !currentEditorView) {
      currentEditorView = viewsByPane.get('primary') || viewsByPane.values().next().value || null;
    }
  }

  listeners.forEach((listener) => {
    try {
      listener(currentEditorView);
    } catch (e) {
      console.error('[editorViewRegistry] Listener error:', e);
    }
  });
}

export function getActiveEditorView(): EditorView | null {
  return currentEditorView || viewsByPane.get('primary') || viewsByPane.values().next().value || null;
}

export function getEditorViewByPane(pane: string): EditorView | null {
  return viewsByPane.get(pane) || null;
}

export function subscribeActiveEditorView(listener: (view: EditorView | null) => void): () => void {
  listeners.add(listener);
  const active = currentEditorView || viewsByPane.get('primary') || viewsByPane.values().next().value || null;
  try {
    listener(active);
  } catch (e) {
    console.error('[editorViewRegistry] Initial listener error:', e);
  }
  return () => {
    listeners.delete(listener);
  };
}
