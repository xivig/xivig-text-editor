import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
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
  const isProgrammaticEditorScrollRef = useRef(false);
  const isProgrammaticPreviewScrollRef = useRef(false);
  const syncScrollRef = useRef(syncScroll);
  syncScrollRef.current = syncScroll;

  const markdownContent = activeDoc?.content || '';
  const basePath = activeDoc?.path ? activeDoc.path.replace(/[/\\][^/\\]+$/, '') : currentFolderPath || undefined;
  const workspaceRoot = currentFolderPath || undefined;

  // Calculate statistics
  const stats = useMemo(() => {
    const text = markdownContent.trim();
    if (!text) return { words: 0, lines: 0, readTime: '0 min' };
    const words = text.split(/\s+/).filter(Boolean).length;
    const lines = text.split('\n').length;
    const readTime = Math.ceil(words / 200);
    return { words, lines, readTime: `${readTime} min` };
  }, [markdownContent]);

  // Robust Markdown parser with DOMPurify sanitization & exact data-line tagging
  const htmlContent = useMemo(() => {
    return renderAndSanitizeMarkdown(markdownContent, basePath, workspaceRoot);
  }, [markdownContent, basePath, workspaceRoot]);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to reliably find the active EditorView
  const getTargetView = useCallback((): EditorView | null => {
    return activeViewRef.current || getActiveEditorView() || getEditorViewByPane('primary');
  }, []);

  // Helper to get element's top position relative to preview scroll container
  const getElementScrollTop = (el: HTMLElement, container: HTMLElement): number => {
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return elRect.top - containerRect.top + container.scrollTop;
  };

  // Synchronize Preview scroll from Editor position
  const syncPreviewFromEditor = useCallback(() => {
    if (!syncScrollRef.current) return;

    const targetView = getTargetView();
    const editorScroller = targetView?.scrollDOM;
    const previewEl = previewContainerRef.current;
    if (!editorScroller || !previewEl) return;

    const editorMax = editorScroller.scrollHeight - editorScroller.clientHeight;
    const previewMax = previewEl.scrollHeight - previewEl.clientHeight;
    if (editorMax <= 0 || previewMax <= 0) return;

    let targetScrollTop = 0;

    // Boundary checks: very top or very bottom
    if (editorScroller.scrollTop <= 2) {
      targetScrollTop = 0;
    } else if (editorScroller.scrollTop >= editorMax - 4) {
      targetScrollTop = previewMax;
    } else {
      // Determine the line number currently at the top of CodeMirror's viewport
      let currentLine = 1;
      const ratio = editorMax > 0 ? editorScroller.scrollTop / editorMax : 0;

      // 1. Direct CodeMirror 6 viewport check
      try {
        const viewportFrom = (targetView as any).viewport?.from;
        if (typeof viewportFrom === 'number') {
          currentLine = targetView.state.doc.lineAt(viewportFrom).number;
        }
      } catch {}

      // 2. Query visible coordinate from scrollerDOM
      try {
        const scrollerRect = editorScroller.getBoundingClientRect();
        const pos = targetView.posAtCoords({ x: scrollerRect.left + 50, y: scrollerRect.top + 20 });
        if (pos !== null) {
          const detectedLine = targetView.state.doc.lineAt(pos).number;
          if (detectedLine >= 1) {
            currentLine = detectedLine;
          }
        }
      } catch {}

      // 3. If line detection returned near top but editor is significantly scrolled, use proportional fallback
      if (currentLine <= 1 && ratio > 0.03) {
        currentLine = Math.max(1, Math.round(1 + ratio * (targetView.state.doc.lines - 1)));
      }

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
          const prevLine = parseInt(prevEl.getAttribute('data-line') || '1', 10);
          const nextLine = parseInt(nextEl.getAttribute('data-line') || '1', 10);
          const prevTop = getElementScrollTop(prevEl, previewEl);
          const nextTop = getElementScrollTop(nextEl, previewEl);
          const progress = Math.max(0, Math.min(1, (currentLine - prevLine) / Math.max(1, nextLine - prevLine)));
          targetScrollTop = prevTop + progress * (nextTop - prevTop);
        } else if (prevEl) {
          const prevLine = parseInt(prevEl.getAttribute('data-line') || '1', 10);
          const prevTop = getElementScrollTop(prevEl, previewEl);
          const remainingProgress = (currentLine - prevLine) / Math.max(1, targetView.state.doc.lines - prevLine);
          targetScrollTop = prevTop + remainingProgress * (previewMax - prevTop);
        } else if (nextEl) {
          const nextLine = parseInt(nextEl.getAttribute('data-line') || '1', 10);
          const nextTop = getElementScrollTop(nextEl, previewEl);
          const firstProgress = Math.max(0, currentLine / Math.max(1, nextLine));
          targetScrollTop = firstProgress * nextTop;
        } else {
          targetScrollTop = ratio * previewMax;
        }
      } else {
        targetScrollTop = ratio * previewMax;
      }
    }

    targetScrollTop = Math.max(0, Math.min(previewMax, Math.round(targetScrollTop)));

    if (Math.abs(previewEl.scrollTop - targetScrollTop) > 1) {
      isProgrammaticPreviewScrollRef.current = true;
      previewEl.scrollTop = targetScrollTop;
      requestAnimationFrame(() => {
        isProgrammaticPreviewScrollRef.current = false;
      });
    }
  }, [getTargetView]);

  // Synchronize Editor scroll from Preview position
  const syncEditorFromPreview = useCallback(() => {
    if (!syncScrollRef.current) return;

    const targetView = getTargetView();
    const editorScroller = targetView?.scrollDOM;
    const previewEl = previewContainerRef.current;
    if (!editorScroller || !previewEl) return;

    const editorMax = editorScroller.scrollHeight - editorScroller.clientHeight;
    const previewMax = previewEl.scrollHeight - previewEl.clientHeight;
    if (editorMax <= 0 || previewMax <= 0) return;

    let targetScrollTop = 0;

    if (previewEl.scrollTop <= 2) {
      targetScrollTop = 0;
    } else if (previewEl.scrollTop >= previewMax - 4) {
      targetScrollTop = editorMax;
    } else {
      const lineElements = Array.from(previewEl.querySelectorAll<HTMLElement>('[data-line]'));
      if (lineElements.length > 0) {
        const currentPreviewScroll = previewEl.scrollTop;
        let prevEl: HTMLElement | null = null;
        let nextEl: HTMLElement | null = null;

        for (const el of lineElements) {
          const elTop = getElementScrollTop(el, previewEl);
          if (elTop <= currentPreviewScroll + 5) {
            prevEl = el;
          } else if (!nextEl) {
            nextEl = el;
            break;
          }
        }

        if (prevEl && nextEl) {
          const prevLine = parseInt(prevEl.getAttribute('data-line') || '1', 10);
          const nextLine = parseInt(nextEl.getAttribute('data-line') || '1', 10);
          const prevTop = getElementScrollTop(prevEl, previewEl);
          const nextTop = getElementScrollTop(nextEl, previewEl);
          const progress = Math.max(0, Math.min(1, (currentPreviewScroll - prevTop) / Math.max(1, nextTop - prevTop)));
          const targetLine = Math.round(prevLine + progress * (nextLine - prevLine));
          const safeLine = Math.max(1, Math.min(targetView.state.doc.lines, targetLine));
          targetScrollTop = ((safeLine - 1) / Math.max(1, targetView.state.doc.lines - 1)) * editorMax;
        } else if (prevEl) {
          const prevLine = parseInt(prevEl.getAttribute('data-line') || '1', 10);
          const safeLine = Math.max(1, Math.min(targetView.state.doc.lines, prevLine));
          targetScrollTop = ((safeLine - 1) / Math.max(1, targetView.state.doc.lines - 1)) * editorMax;
        } else if (nextEl) {
          const nextLine = parseInt(nextEl.getAttribute('data-line') || '1', 10);
          const safeLine = Math.max(1, Math.min(targetView.state.doc.lines, nextLine));
          targetScrollTop = ((safeLine - 1) / Math.max(1, targetView.state.doc.lines - 1)) * editorMax;
        } else {
          targetScrollTop = (previewEl.scrollTop / previewMax) * editorMax;
        }
      } else {
        targetScrollTop = (previewEl.scrollTop / previewMax) * editorMax;
      }
    }

    targetScrollTop = Math.max(0, Math.min(editorMax, Math.round(targetScrollTop)));

    if (Math.abs(editorScroller.scrollTop - targetScrollTop) > 1) {
      isProgrammaticEditorScrollRef.current = true;
      editorScroller.scrollTop = targetScrollTop;
      requestAnimationFrame(() => {
        isProgrammaticEditorScrollRef.current = false;
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
          if (isProgrammaticEditorScrollRef.current) {
            isProgrammaticEditorScrollRef.current = false;
            return;
          }
          syncPreviewFromEditor();
        };

        scroller.addEventListener('scroll', onEditorScroll, { passive: true });

        cleanUpEditorScroll = () => {
          scroller.removeEventListener('scroll', onEditorScroll);
        };

        // Initial sync
        requestAnimationFrame(() => {
          syncPreviewFromEditor();
        });
      }
    };

    const unsubscribe = subscribeActiveEditorView((view) => {
      attachToView(view);
    });

    const directView = getTargetView();
    if (directView && directView !== activeViewRef.current) {
      attachToView(directView);
    }

    const previewEl = previewContainerRef.current;
    const onPreviewScroll = () => {
      if (isProgrammaticPreviewScrollRef.current) {
        isProgrammaticPreviewScrollRef.current = false;
        return;
      }
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
  }, [getTargetView, syncPreviewFromEditor, syncEditorFromPreview, activeDoc?.id]);

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
      syncPreviewFromEditor();
    });
    ro.observe(previewContentRef.current);
    return () => ro.disconnect();
  }, [syncPreviewFromEditor]);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-l border-[#2e2e2e] select-text text-gray-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#2e2e2e] text-xs select-none gap-2">
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

      {/* Rendered Markdown Body with exact positioning and constrained image sizing */}
      <div
        ref={previewContainerRef}
        style={{ position: 'relative' }}
        className="flex-1 overflow-y-auto px-6 py-4 markdown-preview font-sans selection:bg-[#264f78] selection:text-white"
      >
        <style>{`
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
