import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Code,
  Eye,
  Grid,
  Sun,
  Moon,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { EditorDocument } from '../../types/editor';
import { useEditorStore } from '../../stores/editorStore';
import {
  isSvgFile,
  getImageMimeType,
  formatFileSize,
  estimateBase64SizeBytes,
  sanitizeSvg,
} from '../../utils/imageUtils';

interface ImageViewerProps {
  document: EditorDocument;
  onSwitchToCode?: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ document: doc, onSwitchToCode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number }>({
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [bgMode, setBgMode] = useState<'checkerboard' | 'dark' | 'light'>('checkerboard');
  const [loadError, setLoadError] = useState<string | null>(null);

  const isSvg = isSvgFile(doc.name || doc.path);

  // Check if content is a valid data/blob/http URL or SVG markup
  const hasValidImageContent = Boolean(
    doc.content &&
    (isSvg ||
      doc.content.startsWith('data:image/') ||
      doc.content.startsWith('blob:') ||
      doc.content.startsWith('http') ||
      /^[A-Za-z0-9+/=]+$/.test(doc.content.replace(/[\r\n\s]/g, '').slice(0, 100)))
  );

  const fetchImageFromDisk = useCallback(() => {
    if (doc.path && window.xivig?.readFile) {
      window.xivig.readFile(doc.path).then((res) => {
        if (res.success && res.content) {
          useEditorStore.setState((state) => ({
            documents: state.documents.map((d) =>
              d.id === doc.id ? { ...d, content: res.content!, isDirty: false } : d
            ),
          }));
          setLoadError(null);
        } else if (!res.success && res.error) {
          setLoadError(res.error);
        }
      });
    }
  }, [doc.id, doc.path]);

  // Auto-fetch file content from disk if doc.content is not valid
  useEffect(() => {
    if (!hasValidImageContent && doc.path && window.xivig?.readFile) {
      fetchImageFromDisk();
    }
  }, [hasValidImageContent, doc.path, fetchImageFromDisk]);

  // Compute SVG sanitized markup & dimensions
  const svgMeta = React.useMemo(() => {
    if (!isSvg || !doc.content) return null;
    try {
      const { cleanSvg } = sanitizeSvg(doc.content);
      const widthMatch = cleanSvg.match(/<svg\b[^>]*\bwidth\s*=\s*["']?([\d.]+)(?:px)?["']?/i);
      const heightMatch = cleanSvg.match(/<svg\b[^>]*\bheight\s*=\s*["']?([\d.]+)(?:px)?["']?/i);
      const viewBoxMatch = cleanSvg.match(/viewBox\s*=\s*["']?[\d.-]+[,\s]+[\d.-]+[,\s]+([\d.]+)[,\s]+([\d.]+)["']?/i);

      let w = widthMatch ? parseFloat(widthMatch[1]) : viewBoxMatch ? parseFloat(viewBoxMatch[1]) : 400;
      let h = heightMatch ? parseFloat(heightMatch[1]) : viewBoxMatch ? parseFloat(viewBoxMatch[2]) : 400;
      return { cleanSvg, width: Math.round(w), height: Math.round(h) };
    } catch {
      return null;
    }
  }, [isSvg, doc.content]);

  useEffect(() => {
    if (isSvg && svgMeta && !dimensions) {
      setDimensions({ width: svgMeta.width, height: svgMeta.height });
      setLoadError(null);
    }
  }, [isSvg, svgMeta, dimensions]);

  // Compute image source
  const imageSrc = React.useMemo(() => {
    if (!doc.content) return '';
    if (doc.content.startsWith('data:image/') || doc.content.startsWith('blob:') || doc.content.startsWith('http')) {
      return doc.content;
    }
    if (isSvg) {
      const { cleanSvg } = sanitizeSvg(doc.content);
      let preparedSvg = cleanSvg;
      if (!preparedSvg.includes('xmlns=')) {
        preparedSvg = preparedSvg.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(preparedSvg)}`;
    }
    // Clean whitespace and test if raw base64
    const cleanContent = doc.content.replace(/[\r\n\s]/g, '');
    if (/^[A-Za-z0-9+/=]+$/.test(cleanContent.slice(0, 100))) {
      const mime = getImageMimeType(doc.name || doc.path);
      return `data:${mime};base64,${cleanContent}`;
    }
    return doc.content;
  }, [doc.content, doc.name, doc.path, isSvg]);

  // Estimate file size
  const fileSizeDisplay = React.useMemo(() => {
    if (!doc.content) return '0 B';
    if (doc.content.startsWith('data:')) {
      const bytes = estimateBase64SizeBytes(doc.content);
      return formatFileSize(bytes);
    }
    return formatFileSize(new Blob([doc.content]).size);
  }, [doc.content]);

  // Handle image load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    setDimensions({ width: naturalW, height: naturalH });
    setLoadError(null);

    // Auto-fit if image exceeds container
    if (containerRef.current && naturalW > 0 && naturalH > 0) {
      const containerWidth = containerRef.current.clientWidth - 64;
      const containerHeight = containerRef.current.clientHeight - 64;
      if (containerWidth > 0 && containerHeight > 0) {
        const scaleX = containerWidth / naturalW;
        const scaleY = containerHeight / naturalH;
        const fitScale = Math.min(scaleX, scaleY, 1);
        if (fitScale < 1) {
          setZoom(Math.max(0.05, Number(fitScale.toFixed(2))));
          setPan({ x: 0, y: 0 });
        }
      }
    }
  };

  const handleImageError = () => {
    // Only flag error if there was actually an imageSrc attempted
    if (imageSrc) {
      setLoadError('Failed to decode or display image binary data.');
    }
  };

  // Zoom helpers
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.25, 20));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.25, 0.05));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleFitToWindow = useCallback(() => {
    if (!containerRef.current || !dimensions || dimensions.width === 0 || dimensions.height === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const containerWidth = containerRef.current.clientWidth - 64;
    const containerHeight = containerRef.current.clientHeight - 64;
    if (containerWidth <= 0 || containerHeight <= 0) return;

    const scaleX = containerWidth / dimensions.width;
    const scaleY = containerHeight / dimensions.height;
    const fitScale = Math.min(scaleX, scaleY, 1);
    setZoom(Math.max(0.1, Number(fitScale.toFixed(2))));
    setPan({ x: 0, y: 0 });
  }, [dimensions]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    } else {
      // Pan with normal wheel
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Mouse drag pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left-click
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: pan.x,
      initialPanY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setPan({
      x: dragStartRef.current.initialPanX + dx,
      y: dragStartRef.current.initialPanY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Keyboard zoom controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        handleZoomIn();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);

  const extName = (doc.name || doc.path || 'IMG').split('.').pop()?.toUpperCase() || 'IMAGE';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--xivig-editor, #17191f)',
        color: 'var(--xivig-text, #e2e8f0)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Top Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          backgroundColor: 'var(--xivig-titlebar, #1a1c23)',
          borderBottom: '1px solid var(--xivig-border, #2d3139)',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '8px',
          zIndex: 10,
        }}
      >
        {/* Left: File Info & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'var(--xivig-accent, #3b82f6)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            {extName}
          </div>
          <span style={{ fontWeight: 600, color: 'var(--xivig-text, #f1f5f9)' }}>
            {doc.name}
          </span>
          {dimensions && (
            <span style={{ color: 'var(--xivig-text-muted, #94a3b8)', fontSize: '11px' }}>
              • {dimensions.width} × {dimensions.height} px
            </span>
          )}
          <span style={{ color: 'var(--xivig-text-muted, #94a3b8)', fontSize: '11px' }}>
            • {fileSizeDisplay}
          </span>
        </div>

        {/* Center/Right: Zoom & Display Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            title="Zoom Out (Ctrl + -)"
            style={toolbarBtnStyle}
          >
            <ZoomOut size={14} />
          </button>

          {/* Zoom percentage display */}
          <button
            onClick={handleResetZoom}
            title="Reset Zoom (Ctrl + 0)"
            style={{
              ...toolbarBtnStyle,
              minWidth: '50px',
              fontWeight: 600,
              fontSize: '11px',
            }}
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            title="Zoom In (Ctrl + +)"
            style={toolbarBtnStyle}
          >
            <ZoomIn size={14} />
          </button>

          {/* Reset Zoom */}
          <button
            onClick={handleResetZoom}
            title="100% Size"
            style={toolbarBtnStyle}
          >
            <RotateCcw size={13} />
          </button>

          {/* Fit to Window */}
          <button
            onClick={handleFitToWindow}
            title="Fit to Window"
            style={toolbarBtnStyle}
          >
            <Maximize2 size={13} />
          </button>

          <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--xivig-border, #333)', margin: '0 4px' }} />

          {/* Background switcher */}
          <button
            onClick={() => setBgMode((prev) => (prev === 'checkerboard' ? 'dark' : prev === 'dark' ? 'light' : 'checkerboard'))}
            title={`Background: ${bgMode} (Click to toggle)`}
            style={{
              ...toolbarBtnStyle,
              backgroundColor: bgMode === 'checkerboard' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              borderColor: bgMode === 'checkerboard' ? 'var(--xivig-accent, #3b82f6)' : 'var(--xivig-border, #333)',
            }}
          >
            {bgMode === 'checkerboard' ? <Grid size={14} color="#60a5fa" /> : bgMode === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          {/* SVG Code / Preview Switcher */}
          {isSvg && onSwitchToCode && (
            <div style={{ display: 'inline-flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--xivig-border, #333)' }}>
              <button
                style={{
                  ...svgToggleBtnStyle,
                  backgroundColor: 'var(--xivig-accent, #3b82f6)',
                  color: '#ffffff',
                }}
                title="Visual Preview Mode"
              >
                <Eye size={12} style={{ marginRight: '4px' }} />
                Preview
              </button>
              <button
                onClick={onSwitchToCode}
                style={{
                  ...svgToggleBtnStyle,
                  backgroundColor: 'transparent',
                  color: 'var(--xivig-text-muted, #94a3b8)',
                }}
                title="Edit SVG XML Code"
              >
                <Code size={12} style={{ marginRight: '4px' }} />
                Code
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onDoubleClick={handleFitToWindow}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
          ...getBackgroundStyle(bgMode),
        }}
      >
        {loadError ? (
          <div style={{ textAlign: 'center', padding: '32px', maxWidth: '400px' }}>
            <ImageIcon size={48} color="#ef4444" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Image Preview Failed</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>{loadError}</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {doc.path && (
                <button
                  onClick={fetchImageFromDisk}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--xivig-accent, #3b82f6)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RefreshCw size={13} />
                  Reload from Disk
                </button>
              )}
              {isSvg && onSwitchToCode && (
                <button
                  onClick={onSwitchToCode}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--xivig-border, #444)',
                    color: 'var(--xivig-text, #ffffff)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Open SVG Markup in Code Editor
                </button>
              )}
            </div>
          </div>
        ) : !imageSrc && !isSvg ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--xivig-text-muted, #94a3b8)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '12px' }}>Loading image...</span>
          </div>
        ) : (
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.08s ease-out',
              display: 'inline-block',
              boxShadow: bgMode === 'light' ? '0 8px 30px rgba(0,0,0,0.3)' : '0 8px 30px rgba(0,0,0,0.5)',
              borderRadius: '2px',
              lineHeight: 0,
            }}
          >
            {isSvg && svgMeta ? (
              <div
                style={{
                  width: `${dimensions?.width || svgMeta.width}px`,
                  height: `${dimensions?.height || svgMeta.height}px`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
                dangerouslySetInnerHTML={{ __html: svgMeta.cleanSvg }}
              />
            ) : (
              <img
                ref={imageRef}
                src={imageSrc}
                alt={doc.name}
                onLoad={handleImageLoad}
                onError={handleImageError}
                draggable={false}
                style={{
                  maxWidth: 'none',
                  maxHeight: 'none',
                  display: 'block',
                  imageRendering: zoom > 2 ? 'pixelated' : 'auto',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        )}

        {/* Floating Reset Pill if Zoomed/Panned */}
        {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
          <button
            onClick={handleResetZoom}
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(23, 25, 31, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--xivig-border, #333)',
              color: 'var(--xivig-text, #f1f5f9)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 5,
            }}
          >
            <RotateCcw size={12} />
            Reset Zoom ({Math.round(zoom * 100)}%)
          </button>
        )}
      </div>
    </div>
  );
};

const toolbarBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 8px',
  borderRadius: '4px',
  backgroundColor: 'transparent',
  border: '1px solid var(--xivig-border, #2d3139)',
  color: 'var(--xivig-text, #e2e8f0)',
  cursor: 'pointer',
  fontSize: '12px',
  height: '26px',
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
};

const svgToggleBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 8px',
  fontSize: '11px',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  height: '24px',
};

function getBackgroundStyle(mode: 'checkerboard' | 'dark' | 'light'): React.CSSProperties {
  if (mode === 'dark') {
    return { backgroundColor: '#18191f' };
  }
  if (mode === 'light') {
    return { backgroundColor: '#f8fafc' };
  }
  // Checkerboard pattern for transparency
  return {
    backgroundColor: '#1f232b',
    backgroundImage: `
      linear-gradient(45deg, #272c37 25%, transparent 25%),
      linear-gradient(-45deg, #272c37 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #272c37 75%),
      linear-gradient(-45deg, transparent 75%, #272c37 75%)
    `,
    backgroundSize: '24px 24px',
    backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
  };
}
