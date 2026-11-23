import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { X, Copy, Check, BookOpen, ArrowUpDown } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { renderAndSanitizeMarkdown } from '../../utils/markdownSanitizer';
import { subscribeActiveEditorView } from './editorViewRegistry';
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
  const isScrollingRef = useRef<'none' | 'editor' | 'preview'>('none');
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);
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

  // Robust Markdown parser with DOMPurify sanitization
  const htmlContent = useMemo(() => {
    return renderAndSanitizeMarkdown(markdownContent);
  }, [markdownContent]);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetScrollLock = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = 'none';
    }, 120);
  }, []);

  // Synchronize Preview from Editor scroll position
  const syncFromEditor = useCallback(() => {
    if (!syncScrollRef.current) return;
    if (isScrollingRef.current === 'preview') return;

    const editorScroller = activeViewRef.current?.scrollDOM;
    const previewEl = previewContainerRef.current;
    if (!editorScroller || !previewEl) return;

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      const editorMax = editorScroller.scrollHeight - editorScroller.clientHeight;
      const previewMax = previewEl.scrollHeight - previewEl.clientHeight;

      if (editorMax > 0 && previewMax > 0) {
        isScrollingRef.current = 'editor';
        const ratio = Math.max(0, Math.min(1, editorScroller.scrollTop / editorMax));
        previewEl.scrollTop = Math.round(ratio * previewMax);
        resetScrollLock();
      }
    });
  }, [resetScrollLock]);

  // Synchronize Editor from Preview scroll position
  const syncFromPreview = useCallback(() => {
    if (!syncScrollRef.current) return;
    if (isScrollingRef.current === 'editor') return;

    const editorScroller = activeViewRef.current?.scrollDOM;
    const previewEl = previewContainerRef.current;
    if (!editorScroller || !previewEl) return;

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      const editorMax = editorScroller.scrollHeight - editorScroller.clientHeight;
      const previewMax = previewEl.scrollHeight - previewEl.clientHeight;

      if (editorMax > 0 && previewMax > 0) {
        isScrollingRef.current = 'preview';
        const ratio = Math.max(0, Math.min(1, previewEl.scrollTop / previewMax));
        editorScroller.scrollTop = Math.round(ratio * editorMax);
        resetScrollLock();
      }
    });
  }, [resetScrollLock]);

  // Bind scroll listeners to active editor view and preview container
  useEffect(() => {
    let cleanUpEditorScroll: (() => void) | null = null;

    const unsubscribe = subscribeActiveEditorView((view) => {
      if (cleanUpEditorScroll) {
        cleanUpEditorScroll();
        cleanUpEditorScroll = null;
      }

      activeViewRef.current = view;

      if (view?.scrollDOM) {
        const scroller = view.scrollDOM;
        const onEditorScroll = () => syncFromEditor();
        scroller.addEventListener('scroll', onEditorScroll, { passive: true });
        cleanUpEditorScroll = () => {
          scroller.removeEventListener('scroll', onEditorScroll);
        };

        // Perform initial synchronization
        setTimeout(() => syncFromEditor(), 50);
      }
    });

    const previewEl = previewContainerRef.current;
    const onPreviewScroll = () => syncFromPreview();
    if (previewEl) {
      previewEl.addEventListener('scroll', onPreviewScroll, { passive: true });
    }

    return () => {
      unsubscribe();
      if (cleanUpEditorScroll) cleanUpEditorScroll();
      if (previewEl) {
        previewEl.removeEventListener('scroll', onPreviewScroll);
      }
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [syncFromEditor, syncFromPreview]);

  // Re-sync when html content changes (e.g. typing or initial load)
  useEffect(() => {
    const timer = setTimeout(() => {
      syncFromEditor();
    }, 60);
    return () => clearTimeout(timer);
  }, [htmlContent, syncFromEditor]);

  // Adjust scroll if images or dynamically sized elements resize the preview container
  useEffect(() => {
    if (!previewContentRef.current) return;
    const ro = new ResizeObserver(() => {
      if (isScrollingRef.current === 'none') {
        syncFromEditor();
      }
    });
    ro.observe(previewContentRef.current);
    return () => ro.disconnect();
  }, [syncFromEditor]);

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
          {/* Synchronized Scrolling Toggle */}
          <button
            onClick={() => setSyncScroll((prev) => !prev)}
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

      {/* Rendered Markdown Body */}
      <div
        ref={previewContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 markdown-preview font-sans selection:bg-[#264f78] selection:text-white scroll-smooth"
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
