import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { Range } from '@codemirror/state';
import { GitLensSettings } from './types';

export const DEFAULT_GITLENS_SETTINGS: GitLensSettings = {
  enabled: true,
  currentLineBlame: true,
  blameDateFormat: 'relative',
  showAuthorAvatar: true,
  showCommitMessage: true,
  annotationPrefix: 'git • ',
};

export interface BlameAnnotation {
  author: string;
  date: string;
  message: string;
  commitHash: string;
}

class GitLensBlameWidget extends WidgetType {
  constructor(readonly annotation: BlameAnnotation) {
    super();
  }

  eq(other: GitLensBlameWidget) {
    return (
      this.annotation.commitHash === other.annotation.commitHash &&
      this.annotation.author === other.annotation.author &&
      this.annotation.message === other.annotation.message
    );
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-gitlens-blame-annotation';
    span.style.marginLeft = '28px';
    span.style.fontSize = '0.85em';
    span.style.fontFamily = 'var(--xivig-font-code, monospace)';
    span.style.color = 'rgba(156, 163, 175, 0.55)';
    span.style.pointerEvents = 'none';
    span.style.userSelect = 'none';
    span.style.display = 'inline-block';
    span.style.verticalAlign = 'middle';

    const shortHash = this.annotation.commitHash.slice(0, 7);
    span.textContent = `${this.annotation.author}, ${this.annotation.date} • ${this.annotation.message} (${shortHash})`;

    return span;
  }

  ignoreEvent() {
    return true;
  }
}

// In-memory blame cache for active documents
const blameCache = new Map<string, Map<number, BlameAnnotation>>();

export function setDocumentBlame(filePath: string, lineAnnotations: Map<number, BlameAnnotation>) {
  blameCache.set(filePath, lineAnnotations);
}

export function clearDocumentBlame(filePath?: string) {
  if (filePath) {
    blameCache.delete(filePath);
  } else {
    blameCache.clear();
  }
}

export function getBlameForLine(
  filePath: string,
  lineNumber: number
): BlameAnnotation | null {
  const map = blameCache.get(filePath);
  if (map && map.has(lineNumber)) {
    return map.get(lineNumber)!;
  }
  return null;
}

function buildGitLensDecorations(
  view: EditorView,
  settings: GitLensSettings,
  filePath = ''
): DecorationSet {
  if (!settings.enabled || !settings.currentLineBlame) return Decoration.none;

  const cursorHead = view.state.selection.main.head;
  const currentLine = view.state.doc.lineAt(cursorHead);
  const annotation = getBlameForLine(filePath, currentLine.number);

  if (!annotation) return Decoration.none;

  const widget = Decoration.widget({
    side: 1,
    widget: new GitLensBlameWidget(annotation),
  });

  return Decoration.set([widget.range(currentLine.to)]);
}

export function createGitLensPlugin(
  settings: GitLensSettings = DEFAULT_GITLENS_SETTINGS,
  getFilePath?: () => string
) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        const path = getFilePath ? getFilePath() : '';
        this.decorations = buildGitLensDecorations(view, settings, path);
      }

      update(update: ViewUpdate) {
        if (update.selectionSet || update.docChanged || update.viewportChanged) {
          const path = getFilePath ? getFilePath() : '';
          this.decorations = buildGitLensDecorations(update.view, settings, path);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}
