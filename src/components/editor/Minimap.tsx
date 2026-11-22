import React, { useEffect, useRef, useState } from 'react';
import { EditorView } from '@codemirror/view';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { themes } from '../../styles/themes';

interface MinimapProps {
  view: EditorView | null;
  content: string;
}

export const Minimap: React.FC<MinimapProps> = ({ view, content }) => {
  const isMinimapOpen = useUIStore((state) => state.isMinimapOpen);
  const themeId = useSettingsStore((state) => state.settings.theme);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderTop, setSliderTop] = useState(0);
  const [sliderHeight, setSliderHeight] = useState(40);
  const isDraggingRef = useRef(false);

  // Render document lines on canvas
  useEffect(() => {
    if (!isMinimapOpen || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = themes[themeId]?.isDark ?? true;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 80;
    const height = rect.height || 400;

    // Retina display scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const lines = content.split('\n');
    const totalLines = lines.length;
    if (totalLines === 0) return;

    const lineHeight = 3;
    const maxLinesCanDraw = Math.floor(height / lineHeight);
    const step = totalLines > maxLinesCanDraw ? totalLines / maxLinesCanDraw : 1;

    for (let i = 0; i < Math.min(totalLines, maxLinesCanDraw); i++) {
      const lineIndex = Math.floor(i * step);
      const line = lines[lineIndex] || '';
      if (!line.trim()) continue;

      const indent = line.search(/\S|$/);
      const trimmedLen = line.trim().length;

      const startX = 6 + Math.min(indent * 2.5, 30);
      const lineWidth = Math.min(trimmedLen * 1.8, width - startX - 8);
      const y = i * lineHeight + 2;

      // Syntax hue tinting based on keywords/symbols and dark/light theme
      if (isDark) {
        if (line.includes('function') || line.includes('const') || line.includes('let') || line.includes('import')) {
          ctx.fillStyle = 'rgba(97, 175, 239, 0.45)'; // blue
        } else if (line.includes('{') || line.includes('}') || line.includes('class')) {
          ctx.fillStyle = 'rgba(224, 108, 117, 0.45)'; // reddish
        } else if (line.includes('//') || line.includes('/*')) {
          ctx.fillStyle = 'rgba(127, 132, 142, 0.35)'; // gray
        } else {
          ctx.fillStyle = 'rgba(229, 231, 235, 0.28)'; // text
        }
      } else {
        if (line.includes('function') || line.includes('const') || line.includes('let') || line.includes('import')) {
          ctx.fillStyle = 'rgba(38, 139, 210, 0.55)'; // solarized blue
        } else if (line.includes('{') || line.includes('}') || line.includes('class')) {
          ctx.fillStyle = 'rgba(211, 54, 130, 0.55)'; // solarized magenta
        } else if (line.includes('//') || line.includes('/*')) {
          ctx.fillStyle = 'rgba(147, 161, 161, 0.5)'; // solarized gray
        } else {
          ctx.fillStyle = 'rgba(7, 54, 66, 0.4)'; // solarized base02 text
        }
      }

      ctx.fillRect(startX, y, Math.max(lineWidth, 4), 1.6);
    }
  }, [isMinimapOpen, content, themeId]);

  // Track editor scroll position and update viewport slider
  useEffect(() => {
    if (!isMinimapOpen || !view || !containerRef.current) return;

    const scroller = view.scrollDOM;

    const updateSlider = () => {
      const containerH = containerRef.current?.clientHeight || 400;
      const scrollH = scroller.scrollHeight;
      const clientH = scroller.clientHeight;
      const scrollTop = scroller.scrollTop;

      const visibleRatio = Math.min(1, clientH / Math.max(1, scrollH));
      const sHeight = Math.max(24, containerH * visibleRatio);
      const maxScroll = Math.max(1, scrollH - clientH);
      const maxSliderTravel = containerH - sHeight;

      const sTop = (scrollTop / maxScroll) * maxSliderTravel;

      setSliderHeight(sHeight);
      setSliderTop(sTop);
    };

    updateSlider();
    scroller.addEventListener('scroll', updateSlider, { passive: true });
    window.addEventListener('resize', updateSlider);

    return () => {
      scroller.removeEventListener('scroll', updateSlider);
      window.removeEventListener('resize', updateSlider);
    };
  }, [isMinimapOpen, view]);

  // Handle clicking / dragging on minimap to scroll editor
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!view || !containerRef.current) return;
    isDraggingRef.current = true;

    const scrollToMouse = (clientY: number) => {
      const rect = containerRef.current!.getBoundingClientRect();
      const clickY = clientY - rect.top;
      const containerH = rect.height;

      const scroller = view.scrollDOM;
      const maxScroll = scroller.scrollHeight - scroller.clientHeight;
      const ratio = Math.max(0, Math.min(1, (clickY - sliderHeight / 2) / (containerH - sliderHeight)));

      scroller.scrollTop = ratio * maxScroll;
    };

    scrollToMouse(e.clientY);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      scrollToMouse(moveEvent.clientY);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!isMinimapOpen) return null;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={minimapContainerStyle}
      title="Minimap (Drag to scroll)"
    >
      <canvas ref={canvasRef} style={canvasStyle} />

      {/* Visible Viewport Slider */}
      <div
        style={{
          ...sliderStyle,
          top: `${sliderTop}px`,
          height: `${sliderHeight}px`,
        }}
      />
    </div>
  );
};

const minimapContainerStyle: React.CSSProperties = {
  width: '80px',
  height: '100%',
  backgroundColor: 'var(--xivig-editor)',
  borderLeft: '1px solid var(--xivig-border-subtle)',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  flexShrink: 0,
};

const canvasStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
};

const sliderStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  backgroundColor: 'rgba(108, 140, 255, 0.14)',
  borderTop: '1px solid rgba(108, 140, 255, 0.4)',
  borderBottom: '1px solid rgba(108, 140, 255, 0.4)',
  pointerEvents: 'none',
  transition: 'top 0.04s ease-out',
};
