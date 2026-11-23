import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { X, Copy, Check, BookOpen, ArrowUpDown } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { renderAndSanitizeMarkdown } from '../../utils/markdownSanitizer';
import {
  subscribeActiveEditorView,
  getActiveEditorView,
  getEditorViewByPane,
} from './editorViewRegistry';
import { EditorView } from '@codemirror/view';

export const MarkdownPreviewPane: React.FC = () => {
  const activeDoc = useEditorStore((state) =>
    state.documents.find((d) => d.id === state.activeDocumentId)
  );
  const closePreview = useEditorStore((state) => state.closePreview);
  const [copied, setCopied] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewContentRef = useRef<HTMLDivElement>(null);
  const activeViewRef = useRef<EditorView | null>(null);
  const isSyncingRef = useRef(false);
  const syncScrollRef = useRef(syncScroll);
  syncScrollRef.current = syncScroll;

  const markdownContent = activeDoc?.content || '';

  // Calculate statistics
  const stats = useMemo(() => {
    const text = markdownContent.trim();
    if (!text) return { words: 0, lines: 0, readTime: '0 min' };
    const words = text.split(/\s+/).filter(Boolean).length;
    const lines = text.split('\n').length;
    const readTime = Math.ceil(words / 200);
    return { words, lines, readTime: `${readTime} min` };
  }, [markdownContent]);

  // Robust Markdown parser with DOMPurify sanitization & data-line tagging
  const htmlContent = useMemo(() => {
    return renderAndSanitizeMarkdown(markdownContent);
  }, [markdownContent]);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to reliably find the active EditorView
  const getTargetView = useCallback((): EditorView | null => {
    return activeViewRef.current || getActiveEditorView() || getEditorViewByPane('primary');
  }, []);

  // Synchronize Preview scroll from Editor position
  const syncPreviewFromEditor = useCallback(() => {
    if (!syncScrollRef.current || isSyncingRef.current) return;

    const targetView = getTargetView();
    const editorScroller = targetView?.scrollDOM;
    const previewEl = previewContainerRef.current;
    if (!editorScroller || !previewEl) return;

    const editorMax = editorScroller.scrollHeight - editorScroller.clientHeight;
    const previewMax = previewEl.scrollHeight - previewEl.clientHeight;
    if (editorMax <= 0 || previewMax <= 0) return;

    let targetScrollTop = 0;

    try {
      // Determine the line currently at top of CodeMirror viewport
      const topBlock = targetView.lineBlockAtHeight(editorScroller.scrollTop);
      const currentLine = targetView.state.doc.lineAt(topBlock.from).number;

      if (currentLine <= 1 || editorScroller.scrollTop <= 2) {
        targetScrollTop = 0;
      } else if (editorScroller.scrollTop >= editorMax - 4) {
        targetScrollTop = previewMax;
      } else {
        // Query elements tagged with data-line in the preview DOM
        const lineElements = Array.from(previewEl.querySelectorAll<HTMLElement>('[data-line]'));

        if (lineElements.length > 0) {
          let prevEl: HTMLElement | null = null;
          let nextEl: HTMLElement | null = null;

          for (const el of lineElements) {
            const line = parseInt(el.getAttribute('data-line') || '0', 10);
            if (line <= currentLine) {
              prevEl = el;
            } else if (!nextEl) {
              nextEl = el;
              break;
            }
          }

          if (prevEl && nextEl) {
            const prevLine = parseInt(prevEl.getAttribute('data-line') || '0', 10);
            const nextLine = parseInt(nextEl.getAttribute('data-line') || '0', 10);
            const progress = (currentLine - prevLine) / Math.max(1, nextLine - prevLine);
            const prevTop = prevEl.offsetTop - previewEl.offsetTop;
            const nextTop = nextEl.offsetTop - previewEl.offsetTop;
            targetScrollTop = prevTop + progress * (nextTop - prevTop);
          } else if (prevEl) {
            targetScrollTop = prevEl.offsetTop - previewEl.offsetTop;
          } else {
            targetScrollTop = (editorScroller.scrollTop / editorMax) * previewMax;
          }
        } else {
          targetScrollTop = (editorScroller.scrollTop / editorMax) * previewMax;
        }
      }
    } catch {
      targetScrollTop = (editorScroller.scrollTop / editorMax) * previewMax;
    }

    targetScrollTop = Math.max(0, Math.min(previewMax, Math.round(targetScrollTop)));

    if (Math.abs(previewEl.scrollTop - targetScrollTop) > 1) {
      isSyncingRef.current = true;
      previewEl.scrollTop = targetScrollTop;
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    }
  }, [getTargetView]);

  // Synchronize Editor scroll from Preview position
  const syncEditorFromPreview = useCallback(() => {
    if (!syncScrollRef.current || isSyncingRef.current) return;

    const targetView = getTargetView();
    const editorScroller = targetView?.scrollDOM;
    const previewEl = previewContainerRef.current;
    if (!editorScroller || !previewEl) return;

    const editorMax = editorScroller.scrollHeight - editorScroller.clientHeight;
    const previewMax = previewEl.scrollHeight - previewEl.clientHeight;
    if (editorMax <= 0 || previewMax <= 0) return;

    let targetScrollTop = 0;

    try {
      if (previewEl.scrollTop <= 2) {
        targetScrollTop = 0;
      } else if (previewEl.scrollTop >= previewMax - 4) {
        targetScrollTop = editorMax;
      } else {
        const lineElements = Array.from(previewEl.querySelectorAll<HTMLElement>('[data-line]'));
        if (lineElements.length > 0) {
          const containerOffset = previewEl.offsetTop;
          const currentPreviewTop = previewEl.scrollTop;
          let prevEl: HTMLElement | null = null;
          let nextEl: HTMLElement | null = null;

          for (const el of lineElements) {
            const elTop = el.offsetTop - containerOffset;
            if (elTop <= currentPreviewTop) {
              prevEl = el;
            } else if (!nextEl) {
              nextEl = el;
              break;
            }
          }

          if (prevEl && nextEl) {
            const prevLine = parseInt(prevEl.getAttribute('data-line') || '1', 10);
            const nextLine = parseInt(nextEl.getAttribute('data-line') || '1', 10);
            const prevTop = prevEl.offsetTop - containerOffset;
            const nextTop = nextEl.offsetTop - containerOffset;
            const progress = (currentPreviewTop - prevTop) / Math.max(1, nextTop - prevTop);
            const targetLine = prevLine + progress * (nextLine - prevLine);

            const safeLine = Math.max(1, Math.min(targetView.state.doc.lines, Math.round(targetLine)));
            const lineBlock = targetView.lineBlockAt(targetView.state.doc.line(safeLine).from);
            targetScrollTop = lineBlock.top;
          } else if (prevEl) {
            const prevLine = parseInt(prevEl.getAttribute('data-line') || '1', 10);
            const safeLine = Math.max(1, Math.min(targetView.state.doc.lines, prevLine));
            const lineBlock = targetView.lineBlockAt(targetView.state.doc.line(safeLine).from);
            targetScrollTop = lineBlock.top;
          } else {
            targetScrollTop = (previewEl.scrollTop / previewMax) * editorMax;
          }
        } else {
          targetScrollTop = (previewEl.scrollTop / previewMax) * editorMax;
        }
      }
    } catch {
      targetScrollTop = (previewEl.scrollTop / previewMax) * editorMax;
    }

    targetScrollTop = Math.max(0, Math.min(editorMax, Math.round(targetScrollTop)));

    if (Math.abs(editorScroller.scrollTop - targetScrollTop) > 1) {
      isSyncingRef.current = true;
      editorScroller.scrollTop = targetScrollTop;
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    }
  }, [getTargetView]);

  // Bind scroll listeners to active editor view and preview container
  useEffect(() => {
    let cleanUpEditorScroll: (() => void) | null = null;

    const attachToView = (view: EditorView | null) => {
      if (cleanUpEditorScroll) {
        cleanUpEditorScroll();
        cleanUpEditorScroll = null;
      }

      activeViewRef.current = view;

      if (view?.scrollDOM) {
        const scroller = view.scrollDOM;
        const onEditorScroll = () => {
          syncPreviewFromEditor();
        };
        scroller.addEventListener('scroll', onEditorScroll, { passive: true });
        cleanUpEditorScroll = () => {
          scroller.removeEventListener('scroll', onEditorScroll);
        };

        // Perform initial synchronization immediately
        requestAnimationFrame(() => {
          syncPreviewFromEditor();
        });
      }
    };

    const unsubscribe = subscribeActiveEditorView((view) => {
      attachToView(view);
    });

    // Check if view is already available directly
    const directView = getTargetView();
    if (directView && directView !== activeViewRef.current) {
      attachToView(directView);
    }

    const previewEl = previewContainerRef.current;
    const onPreviewScroll = () => {
      syncEditorFromPreview();
    };

    if (previewEl) {
      previewEl.addEventListener('scroll', onPreviewScroll, { passive: true });
    }

    return () => {
      unsubscribe();
      if (cleanUpEditorScroll) cleanUpEditorScroll();
      if (previewEl) {
        previewEl.removeEventListener('scroll', onPreviewScroll);
      }
    };
  }, [getTargetView, syncPreviewFromEditor, syncEditorFromPreview]);

  // Re-sync when html content changes (e.g. typing or initial load)
  useEffect(() => {
    const timer = setTimeout(() => {
      syncPreviewFromEditor();
    }, 60);
    return () => clearTimeout(timer);
  }, [htmlContent, syncPreviewFromEditor]);

  // Adjust scroll when images or dynamically sized elements resize the container
  useEffect(() => {
    if (!previewContentRef.current) return;
    const ro = new ResizeObserver(() => {
      if (!isSyncingRef.current) {
        syncPreviewFromEditor();
      }
    });
    ro.observe(previewContentRef.current);
    return () => ro.disconnect();
  }, [syncPreviewFromEditor]);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-l border-[#2e2e2e] select-text text-gray-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#2e2e2e] text-xs select-none">
        <div className="flex items-center space-x-2 text-gray-300 font-medium">
          <BookOpen size={14} className="text-[#569cd6]" />
          <span>Markdown Live Preview</span>
          <span className="text-[11px] text-gray-500">
            ({stats.words} words · {stats.readTime} read)
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
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

      {/* Rendered Markdown Body (Instant programmatic scroll with no CSS transition lag) */}
      <div
        ref={previewContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 markdown-preview font-sans selection:bg-[#264f78] selection:text-white"
      >
        <div
          ref={previewContentRef}
          className="max-w-3xl mx-auto"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
};
