import React, {
  useMemo,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from 'react';
import {
  X,
  Copy,
  Check,
  BookOpen,
  ArrowUpDown,
  Download,
  Printer,
  Table,
  ListTree,
  AlertCircle,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import {
  renderAndSanitizeMarkdown,
  extractTableOfContents,
  lintMarkdown,
} from '../../utils/markdownSanitizer';
import {
  exportMarkdownToHtml,
  downloadHtmlFile,
  printMarkdownDocument,
} from '../../utils/markdownExporter';
import { MarkdownTableEditorModal } from '../modals/MarkdownTableEditorModal';
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
  const [isTableEditorOpen, setIsTableEditorOpen] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [showLintIssues, setShowLintIssues] = useState(false);

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

  const tocItems = useMemo(() => extractTableOfContents(markdownContent), [markdownContent]);
  const lintIssues = useMemo(() => lintMarkdown(markdownContent), [markdownContent]);

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

  const handleExportHtml = () => {
    downloadHtmlFile(activeDoc?.name || 'document', htmlContent);
  };

  const handlePrintPdf = () => {
    printMarkdownDocument(activeDoc?.name || 'document', htmlContent);
  };

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // 1. Copy button in code fences
    if (target.classList.contains('markdown-copy-btn')) {
      const code = decodeURIComponent(target.getAttribute('data-code') || '');
      if (code) {
        navigator.clipboard.writeText(code);
        target.textContent = 'Copied!';
        setTimeout(() => {
          target.textContent = 'Copy';
        }, 1500);
      }
      return;
    }

    // 2. Interactive task checkbox toggle
    if (target.classList.contains('task-checkbox-input')) {
      const taskLine = parseInt(target.getAttribute('data-task-line') || '', 10);
      if (!isNaN(taskLine) && activeDoc) {
        const view = getTargetView();
        const lines = activeDoc.content.split('\n');
        if (taskLine >= 1 && taskLine <= lines.length) {
          const currentLineText = lines[taskLine - 1];
          let updatedLineText = currentLineText;
          if (/\[ \]/i.test(currentLineText)) {
            updatedLineText = currentLineText.replace(/\[ \]/, '[x]');
          } else if (/\[x\]/i.test(currentLineText)) {
            updatedLineText = currentLineText.replace(/\[x\]/i, '[ ]');
          }
          if (updatedLineText !== currentLineText) {
            lines[taskLine - 1] = updatedLineText;
            const newDocText = lines.join('\n');
            useEditorStore.getState().updateDocumentContent(activeDoc.id, newDocText);
            if (view) {
              const lineInfo = view.state.doc.line(taskLine);
              view.dispatch({
                changes: { from: lineInfo.from, to: lineInfo.to, insert: updatedLineText },
              });
            }
          }
        }
      }
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
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
        backgroundColor: '#1e1e1e',
        borderLeft: '1px solid #2e2e2e',
        userSelect: 'text',
        color: '#d4d4d4',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          backgroundColor: '#252526',
          borderBottom: '1px solid #2e2e2e',
          fontSize: '12px',
          userSelect: 'none',
          gap: '8px',
          flexShrink: 0,
          height: '35px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#cccccc',
            fontWeight: 500,
            minWidth: 0,
          }}
        >
          <BookOpen size={14} style={{ color: '#569cd6', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Markdown Live Preview
          </span>
          <span style={{ fontSize: '11px', color: '#888888', whiteSpace: 'nowrap' }}>
            ({stats.words} words · {stats.readTime} read)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Outline / TOC Dropdown */}
          {tocItems.length > 0 && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowToc(!showToc)}
                title="Table of Contents (Headings)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  border: showToc ? '1px solid rgba(108, 140, 255, 0.4)' : '1px solid #3c3c3c',
                  backgroundColor: showToc ? 'rgba(108, 140, 255, 0.15)' : '#2d2d2d',
                  color: showToc ? '#6c8cff' : '#cccccc',
                }}
              >
                <ListTree size={12} />
                <span>TOC ({tocItems.length})</span>
              </button>
              {showToc && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    width: '240px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    backgroundColor: '#1e222b',
                    border: '1px solid #2d3748',
                    borderRadius: '6px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    padding: '6px',
                    zIndex: 100,
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', padding: '4px 6px', textTransform: 'uppercase' }}>
                    Document Headings
                  </div>
                  {tocItems.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setShowToc(false);
                        const el = document.getElementById(item.slug);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      style={{
                        padding: '4px 6px',
                        paddingLeft: `${(item.level - 1) * 10 + 6}px`,
                        fontSize: '11px',
                        color: item.level === 1 ? '#fff' : item.level === 2 ? '#4ec9b0' : '#d4d4d4',
                        cursor: 'pointer',
                        borderRadius: '3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {item.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Table Generator Modal Trigger */}
          <button
            onClick={() => setIsTableEditorOpen(true)}
            title="Insert Markdown Table"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'pointer',
              border: '1px solid #3c3c3c',
              backgroundColor: '#2d2d2d',
              color: '#cccccc',
            }}
          >
            <Table size={12} />
            <span>Table</span>
          </button>

          {/* Export HTML Button */}
          <button
            onClick={handleExportHtml}
            title="Export to HTML File"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'pointer',
              border: '1px solid #3c3c3c',
              backgroundColor: '#2d2d2d',
              color: '#cccccc',
            }}
          >
            <Download size={12} />
            <span>HTML</span>
          </button>

          {/* Print to PDF Button */}
          <button
            onClick={handlePrintPdf}
            title="Print or Export to PDF"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'pointer',
              border: '1px solid #3c3c3c',
              backgroundColor: '#2d2d2d',
              color: '#cccccc',
            }}
          >
            <Printer size={12} />
            <span>Print</span>
          </button>

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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'pointer',
              border: syncScroll ? '1px solid rgba(86, 156, 214, 0.4)' : '1px solid transparent',
              backgroundColor: syncScroll ? 'rgba(38, 79, 120, 0.4)' : 'transparent',
              color: syncScroll ? '#569cd6' : '#999999',
            }}
          >
            <ArrowUpDown size={12} style={{ color: syncScroll ? '#569cd6' : '#999999' }} />
            <span>{syncScroll ? 'Sync On' : 'Sync Off'}</span>
          </button>

          {/* Copy HTML Button */}
          <button
            onClick={handleCopyHtml}
            title="Copy Rendered HTML"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'pointer',
              border: '1px solid #3c3c3c',
              backgroundColor: '#2d2d2d',
              color: '#cccccc',
            }}
          >
            {copied ? <Check size={12} style={{ color: '#4ade80' }} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Close Preview Button */}
          <button
            onClick={closePreview}
            title="Close Preview"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#888888',
              cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Rendered Markdown Body with exact positioning, constrained image sizing and custom visible scrollbar */}
      <div
        ref={previewContainerRef}
        className="markdown-preview"
        style={{
          flex: '1 1 0%',
          height: 'calc(100% - 35px)',
          minHeight: 0,
          maxHeight: 'calc(100% - 35px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px 24px',
          position: 'relative',
          boxSizing: 'border-box',
          scrollbarGutter: 'stable',
        }}
      >
        <style>{`
          .markdown-preview {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #cccccc;
            line-height: 1.6;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.28) rgba(0, 0, 0, 0.2);
          }
          .markdown-preview::-webkit-scrollbar {
            width: 10px;
            height: 10px;
            display: block !important;
          }
          .markdown-preview::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2) !important;
          }
          .markdown-preview::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.28) !important;
            border-radius: 5px;
            border: 2px solid #1e1e1e;
            background-clip: padding-box;
          }
          .markdown-preview::-webkit-scrollbar-thumb:hover {
            background-color: rgba(255, 255, 255, 0.45) !important;
          }
          .markdown-preview::-webkit-scrollbar-thumb:active {
            background-color: rgba(255, 255, 255, 0.6) !important;
          }
          .markdown-preview::-webkit-scrollbar-corner {
            background: transparent;
          }
          .markdown-preview h1 {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            margin-top: 24px;
            margin-bottom: 16px;
            border-bottom: 1px solid #333333;
            padding-bottom: 8px;
          }
          .markdown-preview h2 {
            font-size: 20px;
            font-weight: 700;
            color: #4ec9b0;
            margin-top: 22px;
            margin-bottom: 12px;
            border-bottom: 1px solid #2e2e2e;
            padding-bottom: 6px;
          }
          .markdown-preview h3 {
            font-size: 16px;
            font-weight: 600;
            color: #569cd6;
            margin-top: 18px;
            margin-bottom: 10px;
            border-bottom: 1px solid #282828;
            padding-bottom: 4px;
          }
          .markdown-preview h4 {
            font-size: 14px;
            font-weight: 600;
            color: #d4d4d4;
            margin-top: 14px;
            margin-bottom: 8px;
          }
          .markdown-preview p {
            margin-top: 8px;
            margin-bottom: 12px;
            line-height: 1.6;
            color: #cccccc;
            font-size: 14px;
          }
          .markdown-preview pre {
            background-color: #1a1a1a;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            padding: 12px;
            overflow-x: auto;
            font-family: Consolas, "Courier New", monospace;
            font-size: 12px;
            color: #d4d4d4;
            line-height: 1.5;
            margin: 14px 0;
          }
          .markdown-preview code {
            font-family: Consolas, "Courier New", monospace;
            font-size: 12px;
          }
          .markdown-preview p code, .markdown-preview li code {
            background-color: #2d2d2d;
            color: #ce9178;
            padding: 2px 5px;
            border-radius: 3px;
            border: 1px solid #3c3c3c;
          }
          .markdown-preview table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            font-size: 13px;
          }
          .markdown-preview th {
            background-color: #252526;
            border: 1px solid #3e3e42;
            padding: 8px 12px;
            font-weight: 600;
            color: #ffffff;
            text-align: left;
          }
          .markdown-preview td {
            border: 1px solid #3e3e42;
            padding: 8px 12px;
            color: #cccccc;
          }
          .markdown-preview tr:nth-child(even) {
            background-color: #1e1e1e;
          }
          .markdown-preview tr:nth-child(odd) {
            background-color: #181818;
          }
          .markdown-preview tr:hover {
            background-color: #282828;
          }
          .markdown-preview blockquote {
            border-left: 4px solid #007acc;
            padding: 6px 12px;
            margin: 12px 0;
            background-color: #20252b;
            border-radius: 0 4px 4px 0;
            color: #9cdcfe;
            font-style: italic;
          }
          .markdown-preview a {
            color: #3794ff;
            text-decoration: none;
          }
          .markdown-preview a:hover {
            text-decoration: underline;
          }
          .markdown-preview hr {
            border: none;
            border-top: 1px solid #3e3e42;
            margin: 20px 0;
          }
          .markdown-preview ul, .markdown-preview ol {
            padding-left: 24px;
            margin: 8px 0;
          }
          .markdown-preview li {
            margin: 4px 0;
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
          onClick={handlePreviewClick}
          style={{ maxWidth: '850px', margin: '0 auto' }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      <MarkdownTableEditorModal
        isOpen={isTableEditorOpen}
        onClose={() => setIsTableEditorOpen(false)}
      />
    </div>
  );
};
