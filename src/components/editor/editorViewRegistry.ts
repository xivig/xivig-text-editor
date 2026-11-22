import { EditorView } from '@codemirror/view';

let currentEditorView: EditorView | null = null;

export function setActiveEditorView(view: EditorView | null): void {
  currentEditorView = view;
}

export function getActiveEditorView(): EditorView | null {
  return currentEditorView;
}
