import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Copy, Check, RefreshCw } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { getActiveEditorView } from '../editor/editorViewRegistry';
import {
  parseCssColor,
  rgbToHsv,
  hsvToRgb,
  rgbToHex,
  rgbaToString,
  rgbaToHslString,
  clamp,
  RGBA,
  HSVA,
} from '../../utils/colorUtils';

const PRESET_SWATCHES = [
  '#ffffff',
  '#000000',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#4ec9b0',
];

export const BracketsColorPickerModal: React.FC = () => {
  const isOpen = useUIStore((state) => state.isColorPickerOpen);
  const close = useUIStore((state) => state.closeColorPicker);
  const initialColor = useUIStore((state) => state.colorPickerInitialColor) || '#6c8cff';
  const colorRange = useUIStore((state) => state.colorPickerRange);

  const [hsv, setHsv] = useState<HSVA>({ h: 228, s: 57, v: 100, a: 1 });
  const [format, setFormat] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const [copied, setCopied] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const spectrumRef = useRef<HTMLDivElement>(null);
  const isDraggingSpectrum = useRef(false);

  // Initialize HSV from initialColor when opened
  useEffect(() => {
    if (isOpen) {
      const parsed = parseCssColor(initialColor);
      const convertedHsv = rgbToHsv(parsed.r, parsed.g, parsed.b, parsed.a);
      setHsv(convertedHsv);

      if (initialColor.trim().startsWith('rgb')) setFormat('rgb');
      else if (initialColor.trim().startsWith('hsl')) setFormat('hsl');
      else setFormat('hex');
    }
  }, [isOpen, initialColor]);

  // Compute current RGBA from HSV
  const currentRgba = React.useMemo(() => {
    return hsvToRgb(hsv.h, hsv.s, hsv.v, hsv.a);
  }, [hsv]);

  // Pure hue RGB for spectrum background
  const pureHueRgb = React.useMemo(() => {
    return hsvToRgb(hsv.h, 100, 100, 1);
  }, [hsv.h]);

  // Formatted string according to current format
  const formattedColor = React.useMemo(() => {
    switch (format) {
      case 'rgb':
        return rgbaToString(currentRgba.r, currentRgba.g, currentRgba.b, currentRgba.a);
      case 'hsl':
        return rgbaToHslString(currentRgba.r, currentRgba.g, currentRgba.b, currentRgba.a);
      case 'hex':
      default:
        return rgbToHex(currentRgba.r, currentRgba.g, currentRgba.b, currentRgba.a);
    }
  }, [format, currentRgba]);

  // Keep custom input in sync with formattedColor unless user is typing
  useEffect(() => {
    setCustomInput(formattedColor);
  }, [formattedColor]);

  // Update saturation and value from mouse coordinates on spectrum
  const handleSpectrumMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!spectrumRef.current) return;
    const rect = spectrumRef.current.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    const y = clamp(e.clientY - rect.top, 0, rect.height);

    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);

    setHsv((prev) => ({ ...prev, s, v }));
  }, []);

  const handleSpectrumMouseDown = (e: React.MouseEvent) => {
    isDraggingSpectrum.current = true;
    handleSpectrumMove(e);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isDraggingSpectrum.current) {
        handleSpectrumMove(moveEvent);
      }
    };

    const handleMouseUp = () => {
      isDraggingSpectrum.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Cycle format between hex -> rgb -> hsl
  const cycleFormat = () => {
    if (format === 'hex') setFormat('rgb');
    else if (format === 'rgb') setFormat('hsl');
    else setFormat('hex');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedColor);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Apply color to editor
  const handleApply = () => {
    const view = getActiveEditorView();
    if (view) {
      if (colorRange) {
        view.dispatch({
          changes: {
            from: colorRange.from,
            to: colorRange.to,
            insert: formattedColor,
          },
        });
      } else {
        const selection = view.state.selection.main;
        view.dispatch({
          changes: {
            from: selection.from,
            to: selection.to,
            insert: formattedColor,
          },
        });
      }
      view.focus();
    }
    close();
  };

  if (!isOpen) return null;

  return (
    <div
      style={backdropStyle}
      onClick={close}
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
        if (e.key === 'Enter') handleApply();
      }}
    >
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
              Color Picker
            </span>
            <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>
              (Quick Edit)
            </span>
          </div>
          <button onClick={close} style={closeBtnStyle}>
            <X size={14} />
          </button>
        </div>

        {/* 2D Spectrum Box */}
        <div
          ref={spectrumRef}
          onMouseDown={handleSpectrumMouseDown}
          style={{
            ...spectrumBoxStyle,
            backgroundColor: `rgb(${pureHueRgb.r}, ${pureHueRgb.g}, ${pureHueRgb.b})`,
          }}
        >
          {/* White horizontal gradient */}
          <div style={spectrumWhiteGradientStyle} />
          {/* Black vertical gradient */}
          <div style={spectrumBlackGradientStyle} />

          {/* Crosshair cursor */}
          <div
            style={{
              ...spectrumCursorStyle,
              left: `${hsv.s}%`,
              top: `${100 - hsv.v}%`,
              backgroundColor: formattedColor,
            }}
          />
        </div>

        {/* Hue and Alpha sliders */}
        <div style={slidersContainerStyle}>
          {/* Hue slider */}
          <div style={sliderRowStyle}>
            <span style={sliderLabelStyle}>Hue</span>
            <input
              type="range"
              min={0}
              max={360}
              value={hsv.h}
              onChange={(e) => setHsv({ ...hsv, h: parseInt(e.target.value, 10) })}
              style={hueSliderStyle}
            />
          </div>

          {/* Alpha slider */}
          <div style={sliderRowStyle}>
            <span style={sliderLabelStyle}>Alpha</span>
            <div style={alphaSliderWrapperStyle}>
              <div
                style={{
                  ...alphaGradientOverlayStyle,
                  background: `linear-gradient(to right, transparent, rgb(${currentRgba.r}, ${currentRgba.g}, ${currentRgba.b}))`,
                }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(hsv.a * 100)}
                onChange={(e) => setHsv({ ...hsv, a: parseInt(e.target.value, 10) / 100 })}
                style={alphaSliderInputStyle}
              />
            </div>
          </div>
        </div>

        {/* Swatch & Input Bar */}
        <div style={swatchBarContainerStyle}>
          {/* Dual preview: initial vs new */}
          <div style={dualSwatchBoxStyle}>
            <div
              style={{
                ...swatchHalfStyle,
                backgroundColor: initialColor,
              }}
              title={`Original: ${initialColor}`}
            />
            <div
              style={{
                ...swatchHalfStyle,
                backgroundColor: formattedColor,
              }}
              title={`New: ${formattedColor}`}
            />
          </div>

          {/* Format toggle button */}
          <button onClick={cycleFormat} style={formatBtnStyle} title="Click to cycle format (HEX / RGB / HSL)">
            <RefreshCw size={11} style={{ marginRight: '4px' }} />
            <span>{format.toUpperCase()}</span>
          </button>

          {/* Custom text input */}
          <input
            type="text"
            value={customInput}
            onChange={(e) => {
              setCustomInput(e.target.value);
              try {
                const parsed = parseCssColor(e.target.value);
                setHsv(rgbToHsv(parsed.r, parsed.g, parsed.b, parsed.a));
              } catch {}
            }}
            style={colorInputStyle}
          />

          {/* Copy button */}
          <button onClick={handleCopy} style={actionIconBtnStyle} title="Copy Color Value">
            {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
          </button>
        </div>

        {/* Preset Swatches */}
        <div style={swatchesGridStyle}>
          {PRESET_SWATCHES.map((hex) => (
            <div
              key={hex}
              onClick={() => {
                const parsed = parseCssColor(hex);
                setHsv(rgbToHsv(parsed.r, parsed.g, parsed.b, 1));
              }}
              style={{
                ...singleSwatchStyle,
                backgroundColor: hex,
                outline: formattedColor.toLowerCase() === hex ? '2px solid #6c8cff' : 'none',
              }}
              title={hex}
            />
          ))}
        </div>

        {/* Actions Footer */}
        <div style={footerStyle}>
          <button onClick={close} style={cancelBtnStyle}>
            Cancel
          </button>
          <button onClick={handleApply} style={applyBtnStyle}>
            Apply Color
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles
const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 99999,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#1f2229',
  border: '1px solid #363a45',
  borderRadius: '8px',
  width: '300px',
  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  borderBottom: '1px solid #2d313b',
  backgroundColor: '#252932',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#888',
  cursor: 'pointer',
  padding: '2px',
};

const spectrumBoxStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '150px',
  cursor: 'crosshair',
  overflow: 'hidden',
};

const spectrumWhiteGradientStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to right, #fff, transparent)',
};

const spectrumBlackGradientStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to top, #000, transparent)',
};

const spectrumCursorStyle: React.CSSProperties = {
  position: 'absolute',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  border: '2px solid #ffffff',
  boxShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
};

const slidersContainerStyle: React.CSSProperties = {
  padding: '12px 14px 6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const sliderRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const sliderLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
  width: '36px',
};

const hueSliderStyle: React.CSSProperties = {
  flex: 1,
  height: '10px',
  borderRadius: '5px',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
  cursor: 'pointer',
};

const alphaSliderWrapperStyle: React.CSSProperties = {
  position: 'relative',
  flex: 1,
  height: '10px',
  borderRadius: '5px',
  overflow: 'hidden',
  backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, #ffffff 0% 50%)',
  backgroundSize: '8px 8px',
};

const alphaGradientOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
};

const alphaSliderInputStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  cursor: 'pointer',
};

const swatchBarContainerStyle: React.CSSProperties = {
  padding: '6px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const dualSwatchBoxStyle: React.CSSProperties = {
  width: '34px',
  height: '26px',
  borderRadius: '4px',
  overflow: 'hidden',
  display: 'flex',
  border: '1px solid #444',
  flexShrink: 0,
};

const swatchHalfStyle: React.CSSProperties = {
  flex: 1,
  height: '100%',
};

const formatBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '4px 6px',
  borderRadius: '4px',
  backgroundColor: '#2b2f3a',
  border: '1px solid #3c4250',
  color: '#e5e7eb',
  fontSize: '10px',
  fontWeight: 600,
  cursor: 'pointer',
};

const colorInputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#17191f',
  border: '1px solid #363a45',
  borderRadius: '4px',
  padding: '4px 6px',
  fontSize: '11px',
  color: '#ffffff',
  fontFamily: 'monospace',
  outline: 'none',
};

const actionIconBtnStyle: React.CSSProperties = {
  background: '#2b2f3a',
  border: '1px solid #3c4250',
  borderRadius: '4px',
  color: '#aaa',
  cursor: 'pointer',
  padding: '5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const swatchesGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, 1fr)',
  gap: '6px',
  padding: '6px 14px 10px',
  borderBottom: '1px solid #2d313b',
};

const singleSwatchStyle: React.CSSProperties = {
  height: '18px',
  borderRadius: '3px',
  cursor: 'pointer',
  border: '1px solid rgba(0,0,0,0.3)',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '8px',
  padding: '10px 14px',
  backgroundColor: '#252932',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '5px 12px',
  backgroundColor: 'transparent',
  border: '1px solid #363a45',
  borderRadius: '4px',
  color: '#9ca3af',
  fontSize: '12px',
  cursor: 'pointer',
};

const applyBtnStyle: React.CSSProperties = {
  padding: '5px 14px',
  backgroundColor: 'var(--xivig-accent, #6c8cff)',
  border: 'none',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};
