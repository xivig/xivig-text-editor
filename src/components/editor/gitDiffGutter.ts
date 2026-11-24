import { gutter, GutterMarker } from '@codemirror/view';
import { Extension, RangeSet, RangeSetBuilder } from '@codemirror/state';

export interface DiffLineChange {
  type: 'added' | 'modified' | 'deleted';
  originalText?: string;
}

class GitDiffMarker extends GutterMarker {
  constructor(public changeType: 'added' | 'modified' | 'deleted') {
    super();
  }

  toDOM(): HTMLElement {
    const bar = document.createElement('div');
    bar.className = `cm-git-diff-marker cm-git-${this.changeType}`;
    bar.style.width = '3px';
    bar.style.height = '100%';
    bar.style.margin = '0 auto';
    bar.style.borderRadius = '1px';

    if (this.changeType === 'added') {
      bar.style.backgroundColor = 'var(--xivig-git-added, #22c55e)';
    } else if (this.changeType === 'modified') {
      bar.style.backgroundColor = 'var(--xivig-git-modified, #3b82f6)';
    } else if (this.changeType === 'deleted') {
      bar.style.width = '0';
      bar.style.height = '0';
      bar.style.borderTop = '3px solid transparent';
      bar.style.borderBottom = '3px solid transparent';
      bar.style.borderLeft = '4px solid var(--xivig-git-deleted, #ef4444)';
      bar.style.marginTop = '4px';
    }

    return bar;
  }
}

const addedMarker = new GitDiffMarker('added');
const modifiedMarker = new GitDiffMarker('modified');
const deletedMarker = new GitDiffMarker('deleted');

/**
 * Parses unified diff text into a map of 1-based lineNumber -> changeType.
 */
export function parseDiffHunks(diffText: string): Map<number, 'added' | 'modified' | 'deleted'> {
  const lineMap = new Map<number, 'added' | 'modified' | 'deleted'>();
  if (!diffText) return lineMap;

  const lines = diffText.split('\n');
  let currentNewLine = 0;

  for (const line of lines) {
    if (line.startsWith('@@')) {
      const match = line.match(/@@\s*-\d+(?:,\d+)?\s*\+(\d+)(?:,\d+)?\s*@@/);
      if (match) {
        currentNewLine = parseInt(match[1], 10);
      }
      continue;
    }

    if (currentNewLine === 0) continue;

    if (line.startsWith('+') && !line.startsWith('+++')) {
      lineMap.set(currentNewLine, 'added');
      currentNewLine++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      // Mark deletion at current line position
      if (!lineMap.has(currentNewLine)) {
        lineMap.set(currentNewLine, 'deleted');
      }
    } else if (line.startsWith(' ')) {
      currentNewLine++;
    }
  }

  return lineMap;
}

/**
 * CodeMirror 6 extension rendering git diff status indicators in the editor gutter.
 */
export function createGitDiffGutterExtension(diffText?: string | null): Extension {
  const lineMap = parseDiffHunks(diffText || '');

  return gutter({
    class: 'cm-git-diff-gutter',
    markers(view) {
      if (lineMap.size === 0) return RangeSet.empty;
      const builder = new RangeSetBuilder<GutterMarker>();
      const sortedLines = Array.from(lineMap.entries())
        .filter(([lineNo]) => lineNo <= view.state.doc.lines)
        .sort(([a], [b]) => a - b);

      for (const [lineNo, type] of sortedLines) {
        const line = view.state.doc.line(lineNo);
        const marker = type === 'added' ? addedMarker : type === 'modified' ? modifiedMarker : deletedMarker;
        builder.add(line.from, line.from, marker);
      }
      return builder.finish();
    },
    initialSpacer: () => new GitDiffMarker('modified'),
  });
}
