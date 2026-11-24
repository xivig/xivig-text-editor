import React, {
  useMemo,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from 'react';
import { X, Copy, Check, BookOpen, ArrowUpDown } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { renderAndSanitizeMarkdown } from '../../utils/markdownSanitizer';
import {
  subscribeActiveEditorView,
  getActiveEditorView,
  getEditorViewByPane,
} from './editorViewRegistry';
import { EditorView } from '@codemirror/view';
import { interpolateMarkdownAnchors } from '../../utils/markdownScrollSync';

type ScrollSource = 'editor' | 'preview';

interface ScrollAnchor {
  line: number;
  element: HTMLElement;
}

interface PendingProgrammaticScroll {
  element: HTMLElement;
}

const TOP_EPSILON = 2;

export const MarkdownPreviewPane: React.FC = () => {
  const currentFolderPath = useFileStore((state) => state.currentFolderPath);
  const activeDoc = useEditorStore((state) => {
    const currentId =
      state.activePane === 'secondary'
        ? state.secondaryDocumentId || state.activeDocumentId
        : state.activeDocumentId;
    return state.documents.find((d) => d.id === currentId);
  });
  const closePreview = useEditorStore((state) => state.closePreview);
  const [copied, setCopied] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewContentRef = useRef<HTMLDivElement>(null);
  const activeViewRef = useRef<EditorView | null>(null);
  const syncScrollRef = useRef(syncScroll);
  const anchorsRef = useRef<ScrollAnchor[]>([]);
  const pendingProgrammaticScrollRef =
    useRef<PendingProgrammaticScroll | null>(null);
  const lastScrollSourceRef = useRef<ScrollSource>('editor');
  const scheduledSourceRef = useRef<ScrollSource | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  syncScrollRef.current = syncScroll;

  const markdownContent = activeDoc?.content || '';
  const basePath = activeDoc?.path
    ? activeDoc.path.replace(/[/\\][^/\\]+$/, '')
    : currentFolderPath || undefined;
  const workspaceRoot = currentFolderPath || undefined;

  const stats = useMemo(() => {
    const text = markdownContent.trim();
    if (!text) return { words: 0, lines: 0, readTime: '0 min' };
    const words = text.split(/\s+/).filter(Boolean).length;
    const lines = text.split('\n').length;
    const readTime = Math.ceil(words / 200);
    return { words, lines, readTime: `${readTime} min` };
  }, [markdownContent]);

  const htmlContent = useMemo(
    () => renderAndSanitizeMarkdown(markdownContent, basePath, workspaceRoot),
    [markdownContent, basePath, workspaceRoot],
  );

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[MarkdownPreview] Unable to copy rendered HTML:', error);
    }
  };

  const getTargetView = useCallback((): EditorView | null => {
    return activeViewRef.current ||
      getActiveEditorView() ||
      getEditorViewByPane('primary');
  }, []);

  const getPreviewPaddingTop = (element: HTMLElement): number => {
    const value = Number.parseFloat(window.getComputedStyle(element).paddingTop);
    return Number.isFinite(value) ? value : 0;
  };

  const getAnchorTop = (
    element: HTMLElement,
    container: HTMLElement,
  ): number => {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return elementRect.top - containerRect.top + container.scrollTop;
  };

  const getMeasuredAnchors = useCallback(() => {
    const preview = previewContainerRef.current;
    if (!preview) return [];

    return anchorsRef.current
      .filter(({ element }) => element.isConnected)
      .map(({ line, element }) => ({
        line,
        top: getAnchorTop(element, preview),
      }))
      .filter((anchor) => Number.isFinite(anchor.top));
  }, []);

  const markProgrammaticScroll = (element: HTMLElement) => {
    const marker = { element };
    pendingProgrammaticScrollRef.current = marker;

    // Scroll events are normally dispatched before the next paint. The
    // fallback prevents a stale marker if the browser coalesces the event.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (pendingProgrammaticScrollRef.current === marker) {
          pendingProgrammaticScrollRef.current = null;
        }
      });
    });
  };

  const isProgrammaticScroll = (element: HTMLElement): boolean => {
    const pending = pendingProgrammaticScrollRef.current;
    if (pending?.element !== element) return false;

    pendingProgrammaticScrollRef.current = null;
    return true;
  };

  const syncPreviewFromEditor = useCallback(() => {
    if (!syncScrollRef.current) return;

    const view = getTargetView();
    const editorScroller = view?.scrollDOM;
    const preview = previewContainerRef.current;
    if (!view || !editorScroller || !preview) return;

    const editorMax = Math.max(
      0,
      editorScroller.scrollHeight - editorScroller.clientHeight,
    );
    const previewMax = Math.max(
      0,
      preview.scrollHeight - preview.clientHeight,
    );

    if (editorScroller.scrollTop <= TOP_EPSILON) {
      if (preview.scrollTop > TOP_EPSILON) {
        markProgrammaticScroll(preview);
        preview.scrollTop = 0;
      }
      return;
    }

    if (editorMax > 0 && editorScroller.scrollTop >= editorMax - TOP_EPSILON) {
      if (Math.abs(preview.scrollTop - previewMax) > TOP_EPSILON) {
        markProgrammaticScroll(preview);
        preview.scrollTop = previewMax;
      }
      return;
    }

    const editorRect = editorScroller.getBoundingClientRect();
    const sourcePosition = view.posAtCoords({
      x: editorRect.left + Math.min(100, Math.max(24, editorRect.width * 0.35)),
      y: editorRect.top + 2,
    });
    const line = sourcePosition === null
      ? view.state.doc.lineAt(view.viewport.from).number
      : view.state.doc.lineAt(sourcePosition).number;

    const anchors = getMeasuredAnchors();
    let targetTop = interpolateMarkdownAnchors(anchors, line, 'line');

    if (targetTop === null) {
      const ratio = editorMax > 0 ? editorScroller.scrollTop / editorMax : 0;
      targetTop = ratio * previewMax + getPreviewPaddingTop(preview);
    }

    const nextScrollTop = Math.max(
      0,
      Math.min(
        preview.scrollHeight - preview.clientHeight,
        targetTop - getPreviewPaddingTop(preview),
      ),
    );

    if (Math.abs(preview.scrollTop - nextScrollTop) > TOP_EPSILON) {
      markProgrammaticScroll(preview);
      preview.scrollTop = nextScrollTop;
    }
  }, [getTargetView, getMeasuredAnchors]);

  const syncEditorFromPreview = useCallback(() => {
    if (!syncScrollRef.current) return;

    const view = getTargetView();
    const editorScroller = view?.scrollDOM;
    const preview = previewContainerRef.current;
    if (!view || !editorScroller || !preview) return;

    const previewMax = Math.max(
      0,
      preview.scrollHeight - preview.clientHeight,
    );

    if (preview.scrollTop <= TOP_EPSILON) {
      markProgrammaticScroll(editorScroller);
      view.dispatch({
        effects: EditorView.scrollIntoView(0, { y: 'start', yMargin: 0 }),
      });
      return;
    }

    if (previewMax > 0 && preview.scrollTop >= previewMax - TOP_EPSILON) {
      markProgrammaticScroll(editorScroller);
      view.dispatch({
        effects: EditorView.scrollIntoView(view.state.doc.length, {
          y: 'end',
          yMargin: 0,
        }),
      });
      return;
    }

    const anchors = getMeasuredAnchors();
    if (anchors.length === 0) return;

    const previewLinePosition =
      preview.scrollTop + getPreviewPaddingTop(preview);
    const lineValue = interpolateMarkdownAnchors(
      anchors,
      previewLinePosition,
      'top',
    );
    if (lineValue === null) return;

    const safeLine = Math.max(
      1,
      Math.min(view.state.doc.lines, Math.round(lineValue)),
    );
    const targetPosition = view.state.doc.line(safeLine).from;

    // CodeMirror's scrollIntoView effect accounts for its own content padding,
    // gutters, line wrapping and viewport geometry.
    markProgrammaticScroll(editorScroller);
    view.dispatch({
      effects: EditorView.scrollIntoView(targetPosition, {
        y: 'start',
        yMargin: 0,
      }),
    });
  }, [getTargetView, getMeasuredAnchors]);

  const scheduleSync = useCallback(
    (source: ScrollSource) => {
      if (!syncScrollRef.current) return;

      scheduledSourceRef.current = source;
      if (animationFrameRef.current !== null) return;

      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = null;
        const pendingSource = scheduledSourceRef.current;
        scheduledSourceRef.current = null;

        if (pendingSource === 'editor') {
          syncPreviewFromEditor();
        } else if (pendingSource === 'preview') {
          syncEditorFromPreview();
        }
      });
    },
    [syncPreviewFromEditor, syncEditorFromPreview],
  );

  // Rebuild line anchors after React replaces the rendered Markdown DOM.
  useLayoutEffect(() => {
    const content = previewContentRef.current;
    if (!content) {
      anchorsRef.current = [];
      return;
    }

    const seenLines = new Set<number>();
    const anchors: ScrollAnchor[] = [];

    content.querySelectorAll<HTMLElement>('[data-line]').forEach((element) => {
      const line = Number.parseInt(element.dataset.line || '', 10);
      if (!Number.isInteger(line) || line < 1 || seenLines.has(line)) return;

      seenLines.add(line);
      anchors.push({ line, element });
    });

    anchors.sort((a, b) => a.line - b.line);
    anchorsRef.current = anchors;

    // Preserve the side the user last interacted with when live Markdown
    // updates replace the preview DOM.
    scheduleSync(lastScrollSourceRef.current);
  }, [htmlContent, scheduleSync]);

  // Bind to the active CodeMirror instance and the preview scroller.
  useEffect(() => {
    let detachEditorScroll: (() => void) | null = null;

    const attachToView = (view: EditorView | null) => {
      detachEditorScroll?.();
      detachEditorScroll = null;
      activeViewRef.current = view;

      if (!view || !view.scrollDOM) return;

      const scroller = view.scrollDOM;
      const onEditorScroll = () => {
        if (isProgrammaticScroll(scroller)) return;
        lastScrollSourceRef.current = 'editor';
        scheduleSync('editor');
      };

      scroller.addEventListener('scroll', onEditorScroll, { passive: true });
      detachEditorScroll = () => {
        scroller.removeEventListener('scroll', onEditorScroll);
      };

      scheduleSync('editor');
    };

    const unsubscribe = subscribeActiveEditorView(attachToView);
    const directView = getTargetView();
    if (directView && directView !== activeViewRef.current) {
      attachToView(directView);
    }

    const preview = previewContainerRef.current;
    const onPreviewScroll = () => {
      if (!preview || isProgrammaticScroll(preview)) return;
      lastScrollSourceRef.current = 'preview';
      scheduleSync('preview');
    };

    preview?.addEventListener('scroll', onPreviewScroll, { passive: true });

    return () => {
      unsubscribe();
      detachEditorScroll?.();
      preview?.removeEventListener('scroll', onPreviewScroll);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [activeDoc?.id, getTargetView, scheduleSync]);

  // Image loads, font changes and content reflow can alter anchor positions.
  // Re-align from the last user-controlled side instead of always pulling the
  // preview back to the editor.
  useEffect(() => {
    const content = previewContentRef.current;
    if (!content || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      scheduleSync(lastScrollSourceRef.current);
    });
    observer.observe(content);

    return () => observer.disconnect();
  }, [scheduleSync]);

  useEffect(() => {
    if (syncScroll) scheduleSync(lastScrollSourceRef.current);
  }, [syncScroll, scheduleSync]);

  return (
    <div
      className="flex flex-col h-full min-h-0 bg-[#1e1e1e] border-l border-[#2e2e2e] select-text text-gray-200 overflow-hidden"
      style={{ height: '100%', minHeight: 0 }}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#2e2e2e] text-xs select-none gap-2 flex-shrink-0">
        <div className="flex items-center space-x-1.5 text-gray-300 font-medium min-w-0">
          <BookOpen size={14} className="text-[#569cd6] flex-shrink-0" />
          <span className="truncate">Markdown Live Preview</span>
          <span className="text-[11px] text-gray-500 whitespace-nowrap">
            &nbsp;({stats.words} words · {stats.readTime} read)
          </span>
        </div>

        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {/* Synchronized Live Scrolling Toggle */}
          <button
            onClick={() => {
              setSyncScroll((prev) => {
                const next = !prev;
                if (next) {
                  setTimeout(() => syncPreviewFromEditor(), 50);
                }
                return next;
              });
            }}
            title={syncScroll ? 'Disable Synchronized Live Scrolling' : 'Enable Synchronized Live Scrolling'}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
              syncScroll
                ? 'text-[#569cd6] bg-[#264f78]/30 border border-[#569cd6]/40 hover:bg-[#264f78]/50'
                : 'text-gray-400 hover:text-white hover:bg-[#333]'
            }`}
          >
            <ArrowUpDown size={12} className={syncScroll ? 'text-[#569cd6]' : 'text-gray-400'} />
            <span>{syncScroll ? 'Sync On' : 'Sync Off'}</span>
          </button>

          {/* Copy HTML Button */}
          <button
            onClick={handleCopyHtml}
            title="Copy Rendered HTML"
            className="flex items-center space-x-1 px-2 py-0.5 rounded text-gray-300 hover:text-white hover:bg-[#333] transition-colors text-[11px]"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied HTML' : 'Copy HTML'}</span>
          </button>

          {/* Close Preview Button */}
          <button
            onClick={closePreview}
            title="Close Preview"
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#333] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Rendered Markdown Body with exact positioning, constrained image sizing and custom visible scrollbar */}
      <div
        ref={previewContainerRef}
        style={{ position: 'relative', minHeight: 0, overflowY: 'auto' }}
        className="flex-1 min-h-0 overflow-y-auto px-6 py-4 markdown-preview font-sans selection:bg-[#264f78] selection:text-white"
      >
        <style>{`
          .markdown-preview {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.28) rgba(0, 0, 0, 0.2);
          }
          .markdown-preview::-webkit-scrollbar {
            width: 10px;
            height: 10px;
            display: block;
          }
          .markdown-preview::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
          }
          .markdown-preview::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.28);
            border-radius: 5px;
            border: 2px solid #1e1e1e;
            background-clip: padding-box;
          }
          .markdown-preview::-webkit-scrollbar-thumb:hover {
            background-color: rgba(255, 255, 255, 0.45);
          }
          .markdown-preview::-webkit-scrollbar-thumb:active {
            background-color: rgba(255, 255, 255, 0.6);
          }
          .markdown-preview::-webkit-scrollbar-corner {
            background: transparent;
          }
          .markdown-preview img {
            max-width: 100%;
            height: auto;
            object-fit: contain;
            display: inline-block;
            vertical-align: middle;
            border-radius: 4px;
          }
          .markdown-preview img:not([width]):not([style*="width"]) {
            max-height: 380px;
          }
          .markdown-preview img[src*="shields.io"],
          .markdown-preview img[src*="badge"] {
            height: 20px;
            max-height: 20px;
            vertical-align: middle;
            display: inline-block;
            margin: 2px 3px;
            border: none;
          }
          .markdown-preview p[align="center"],
          .markdown-preview div[align="center"] {
            text-align: center;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
          .markdown-preview p[align="center"] img,
          .markdown-preview div[align="center"] img {
            display: inline-block;
            margin: 4px auto;
          }
        `}</style>
        <div
          ref={previewContentRef}
          className="max-w-3xl mx-auto"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
};
