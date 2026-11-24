import { useEditorStore } from '../stores/editorStore';
import { getActiveEditorView } from '../components/editor/editorViewRegistry';
import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export interface NavLocation {
  docId: string;
  path?: string;
  line: number;
  col: number;
}

class NavigationHistoryManager {
  private backStack: NavLocation[] = [];
  private forwardStack: NavLocation[] = [];
  private isNavigating = false;
  private maxDepth = 50;

  /**
   * Pushes a new location to history.
   * Debounced or filtered so tiny consecutive cursor moves on the same line don't flood stack.
   */
  public pushLocation(loc: NavLocation): void {
    if (this.isNavigating) return;

    const current = this.backStack[this.backStack.length - 1];
    if (current && current.docId === loc.docId && Math.abs(current.line - loc.line) <= 1) {
      // Update top location column/line rather than creating a duplicate jump point
      this.backStack[this.backStack.length - 1] = loc;
      return;
    }

    this.backStack.push(loc);
    if (this.backStack.length > this.maxDepth) {
      this.backStack.shift();
    }
    this.forwardStack = [];
  }

  public canGoBack(): boolean {
    return this.backStack.length > 1;
  }

  public canGoForward(): boolean {
    return this.forwardStack.length > 0;
  }

  public goBack(): boolean {
    if (this.backStack.length <= 1) return false;

    this.isNavigating = true;
    try {
      const current = this.backStack.pop();
      if (current) {
        this.forwardStack.push(current);
      }

      const target = this.backStack[this.backStack.length - 1];
      if (target) {
        this.jumpTo(target);
        return true;
      }
    } finally {
      setTimeout(() => {
        this.isNavigating = false;
      }, 100);
    }

    return false;
  }

  public goForward(): boolean {
    if (this.forwardStack.length === 0) return false;

    this.isNavigating = true;
    try {
      const target = this.forwardStack.pop();
      if (target) {
        this.backStack.push(target);
        this.jumpTo(target);
        return true;
      }
    } finally {
      setTimeout(() => {
        this.isNavigating = false;
      }, 100);
    }

    return false;
  }

  private jumpTo(loc: NavLocation): void {
    const editorStore = useEditorStore.getState();
    const doc = editorStore.documents.find((d) => d.id === loc.docId || (loc.path && d.path === loc.path));

    if (doc && doc.id !== editorStore.activeDocumentId) {
      editorStore.setActiveDocument(doc.id);
    }

    setTimeout(() => {
      const view = getActiveEditorView();
      if (view) {
        try {
          const line = view.state.doc.line(Math.min(view.state.doc.lines, Math.max(1, loc.line)));
          const colPos = Math.min(line.length, Math.max(0, loc.col - 1));
          const pos = line.from + colPos;

          view.dispatch({
            selection: EditorSelection.cursor(pos),
            effects: EditorView.scrollIntoView(pos, { y: 'center' }),
          });
          view.focus();
        } catch {
          // Ignore invalid cursor ranges
        }
      }
    }, 60);
  }

  public clear(): void {
    this.backStack = [];
    this.forwardStack = [];
  }
}

export const navigationHistory = new NavigationHistoryManager();
