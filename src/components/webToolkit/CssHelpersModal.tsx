import React, { useState } from 'react';
import { X, Copy, Check, Sliders, LayoutGrid, Palette, Play } from 'lucide-react';
import { getActiveEditorView } from '../editor/editorViewRegistry';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'flexbox' | 'grid' | 'gradient' | 'animation';
}

export const CssHelpersModal: React.FC<Props> = ({ isOpen, onClose, initialTab = 'flexbox' }) => {
  const [activeTab, setActiveTab] = useState<'flexbox' | 'grid' | 'gradient' | 'animation'>(initialTab);
  const [copied, setCopied] = useState(false);

  // -------------------------------------------------------------
  // Flexbox State
  // -------------------------------------------------------------
  const [flexDirection, setFlexDirection] = useState<'row' | 'row-reverse' | 'column' | 'column-reverse'>('row');
  const [justifyContent, setJustifyContent] = useState<'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'>('center');
  const [alignItems, setAlignItems] = useState<'stretch' | 'center' | 'flex-start' | 'flex-end' | 'baseline'>('center');
  const [flexWrap, setFlexWrap] = useState<'nowrap' | 'wrap' | 'wrap-reverse'>('nowrap');
  const [flexGap, setFlexGap] = useState(12);

  // -------------------------------------------------------------
  // Grid State
  // -------------------------------------------------------------
  const [gridCols, setGridCols] = useState(3);
  const [gridRows, setGridRows] = useState(2);
  const [gridGap, setGridGap] = useState(12);
  const [gridAutoFlow, setGridAutoFlow] = useState<'row' | 'column'>('row');

  // -------------------------------------------------------------
  // Gradient State
  // -------------------------------------------------------------
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [color1, setColor1] = useState('#6c8cff');
  const [pos1, setPos1] = useState(0);
  const [color2, setColor2] = useState('#8a2be2');
  const [pos2, setPos2] = useState(100);

  // -------------------------------------------------------------
  // Animation State
  // -------------------------------------------------------------
  const [animationPreset, setAnimationPreset] = useState<'pulse' | 'bounce' | 'slide-up' | 'spin' | 'shake'>('pulse');
  const [animDuration, setAnimDuration] = useState(1.5);
  const [animTiming, setAnimTiming] = useState('ease-in-out');
  const [animIteration, setAnimIteration] = useState('infinite');

  if (!isOpen) return null;

  // Generate CSS based on active tab
  const getGeneratedCss = (): string => {
    switch (activeTab) {
      case 'flexbox':
        return `display: flex;\nflex-direction: ${flexDirection};\njustify-content: ${justifyContent};\nalign-items: ${alignItems};\nflex-wrap: ${flexWrap};\ngap: ${flexGap}px;`;
      case 'grid':
        return `display: grid;\ngrid-template-columns: repeat(${gridCols}, 1fr);\ngrid-template-rows: repeat(${gridRows}, 1fr);\ngrid-auto-flow: ${gridAutoFlow};\ngap: ${gridGap}px;`;
      case 'gradient':
        return gradientType === 'linear'
          ? `background: linear-gradient(${gradientAngle}deg, ${color1} ${pos1}%, ${color2} ${pos2}%);`
          : `background: radial-gradient(circle, ${color1} ${pos1}%, ${color2} ${pos2}%);`;
      case 'animation':
        const keyframes: Record<string, string> = {
          pulse: `@keyframes pulse {\n  0%, 100% { transform: scale(1); opacity: 1; }\n  50% { transform: scale(1.08); opacity: 0.85; }\n}`,
          bounce: `@keyframes bounce {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-16px); }\n}`,
          'slide-up': `@keyframes slide-up {\n  0% { transform: translateY(20px); opacity: 0; }\n  100% { transform: translateY(0); opacity: 1; }\n}`,
          spin: `@keyframes spin {\n  0% { transform: rotate(0deg); }\n  100% { transform: rotate(360deg); }\n}`,
          shake: `@keyframes shake {\n  0%, 100% { transform: translateX(0); }\n  20%, 60% { transform: translateX(-8px); }\n  40%, 80% { transform: translateX(8px); }\n}`,
        };
        return `${keyframes[animationPreset] || ''}\n\nanimation: ${animationPreset} ${animDuration}s ${animTiming} ${animIteration};`;
    }
  };

  const currentCss = getGeneratedCss();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCss);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    const view = getActiveEditorView();
    if (view) {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: currentCss },
      });
      onClose();
    } else {
      handleCopy();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '720px',
          maxHeight: '85vh',
          backgroundColor: 'var(--xivig-bg, #12141a)',
          border: '1px solid var(--xivig-border, #2c313d)',
          borderRadius: '8px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--xivig-text, #e5e7eb)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--xivig-border, #2c313d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} style={{ color: 'var(--xivig-accent, #6c8cff)' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Visual CSS Design Tool</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--xivig-text-dim, #646b7a)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--xivig-border, #2c313d)', padding: '0 16px', background: 'var(--xivig-surface, #1d2028)' }}>
          <button
            onClick={() => setActiveTab('flexbox')}
            style={{
              padding: '10px 14px',
              border: 'none',
              background: 'none',
              color: activeTab === 'flexbox' ? 'var(--xivig-accent, #6c8cff)' : 'var(--xivig-text-dim, #888)',
              borderBottom: activeTab === 'flexbox' ? '2px solid var(--xivig-accent, #6c8cff)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sliders size={14} /> Flexbox
          </button>
          <button
            onClick={() => setActiveTab('grid')}
            style={{
              padding: '10px 14px',
              border: 'none',
              background: 'none',
              color: activeTab === 'grid' ? 'var(--xivig-accent, #6c8cff)' : 'var(--xivig-text-dim, #888)',
              borderBottom: activeTab === 'grid' ? '2px solid var(--xivig-accent, #6c8cff)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <LayoutGrid size={14} /> CSS Grid
          </button>
          <button
            onClick={() => setActiveTab('gradient')}
            style={{
              padding: '10px 14px',
              border: 'none',
              background: 'none',
              color: activeTab === 'gradient' ? 'var(--xivig-accent, #6c8cff)' : 'var(--xivig-text-dim, #888)',
              borderBottom: activeTab === 'gradient' ? '2px solid var(--xivig-accent, #6c8cff)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Palette size={14} /> Gradient
          </button>
          <button
            onClick={() => setActiveTab('animation')}
            style={{
              padding: '10px 14px',
              border: 'none',
              background: 'none',
              color: activeTab === 'animation' ? 'var(--xivig-accent, #6c8cff)' : 'var(--xivig-text-dim, #888)',
              borderBottom: activeTab === 'animation' ? '2px solid var(--xivig-accent, #6c8cff)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Play size={14} /> Keyframes
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Visual Interactive Preview Box */}
          <div
            style={{
              height: '160px',
              backgroundColor: '#0d0f14',
              borderRadius: '6px',
              border: '1px dashed var(--xivig-border, #2c313d)',
              padding: '12px',
              overflow: 'hidden',
              display: activeTab === 'flexbox' ? 'flex' : activeTab === 'grid' ? 'grid' : 'flex',
              flexDirection: activeTab === 'flexbox' ? flexDirection : undefined,
              justifyContent: activeTab === 'flexbox' ? justifyContent : undefined,
              alignItems: activeTab === 'flexbox' ? alignItems : undefined,
              flexWrap: activeTab === 'flexbox' ? flexWrap : undefined,
              gap: activeTab === 'flexbox' ? `${flexGap}px` : activeTab === 'grid' ? `${gridGap}px` : undefined,
              gridTemplateColumns: activeTab === 'grid' ? `repeat(${gridCols}, 1fr)` : undefined,
              gridTemplateRows: activeTab === 'grid' ? `repeat(${gridRows}, 1fr)` : undefined,
              background:
                activeTab === 'gradient'
                  ? gradientType === 'linear'
                    ? `linear-gradient(${gradientAngle}deg, ${color1} ${pos1}%, ${color2} ${pos2}%)`
                    : `radial-gradient(circle, ${color1} ${pos1}%, ${color2} ${pos2}%)`
                  : '#0d0f14',
            }}
          >
            {activeTab === 'flexbox' &&
              [1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  style={{
                    backgroundColor: 'rgba(108, 140, 255, 0.25)',
                    border: '1px solid var(--xivig-accent, #6c8cff)',
                    color: '#fff',
                    borderRadius: '4px',
                    padding: '10px 16px',
                    fontWeight: 600,
                    fontSize: '12px',
                  }}
                >
                  Item {num}
                </div>
              ))}

            {activeTab === 'grid' &&
              Array.from({ length: gridCols * gridRows }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(53, 183, 121, 0.2)',
                    border: '1px solid #35b779',
                    color: '#fff',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '11px',
                  }}
                >
                  Cell {idx + 1}
                </div>
              ))}

            {activeTab === 'animation' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <style>{`
                  @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.8; } }
                  @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
                  @keyframes slide-up { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
                  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                  @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-10px); } 40%, 80% { transform: translateX(10px); } }
                `}</style>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: 'var(--xivig-accent, #6c8cff)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    animation: `${animationPreset} ${animDuration}s ${animTiming} ${animIteration}`,
                  }}
                >
                  Xivig
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          {activeTab === 'flexbox' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--xivig-text-dim)' }}>flex-direction</label>
                <select
                  value={flexDirection}
                  onChange={(e: any) => setFlexDirection(e.target.value)}
                  style={controlSelectStyle}
                >
                  <option value="row">row</option>
                  <option value="row-reverse">row-reverse</option>
                  <option value="column">column</option>
                  <option value="column-reverse">column-reverse</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--xivig-text-dim)' }}>justify-content</label>
                <select
                  value={justifyContent}
                  onChange={(e: any) => setJustifyContent(e.target.value)}
                  style={controlSelectStyle}
                >
                  <option value="flex-start">flex-start</option>
                  <option value="center">center</option>
                  <option value="flex-end">flex-end</option>
                  <option value="space-between">space-between</option>
                  <option value="space-around">space-around</option>
                  <option value="space-evenly">space-evenly</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--xivig-text-dim)' }}>align-items</label>
                <select
                  value={alignItems}
                  onChange={(e: any) => setAlignItems(e.target.value)}
                  style={controlSelectStyle}
                >
                  <option value="stretch">stretch</option>
                  <option value="center">center</option>
                  <option value="flex-start">flex-start</option>
                  <option value="flex-end">flex-end</option>
                  <option value="baseline">baseline</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--xivig-text-dim)' }}>flex-wrap</label>
                <select
                  value={flexWrap}
                  onChange={(e: any) => setFlexWrap(e.target.value)}
                  style={controlSelectStyle}
                >
                  <option value="nowrap">nowrap</option>
                  <option value="wrap">wrap</option>
                  <option value="wrap-reverse">wrap-reverse</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--xivig-text-dim)' }}>
                  <span>gap: {flexGap}px</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="48"
                  value={flexGap}
                  onChange={(e) => setFlexGap(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--xivig-text-dim)' }}>Columns: {gridCols}</label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={gridCols}
                  onChange={(e) => setGridCols(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--xivig-text-dim)' }}>Rows: {gridRows}</label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={gridRows}
                  onChange={(e) => setGridRows(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--xivig-text-dim)' }}>gap: {gridGap}px</label>
                <input
                  type="range"
                  min="0"
                  max="48"
                  value={gridGap}
                  onChange={(e) => setGridGap(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'gradient' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--xivig-text-dim)' }}>Type</label>
                <select
                  value={gradientType}
                  onChange={(e: any) => setGradientType(e.target.value)}
                  style={controlSelectStyle}
                >
                  <option value="linear">Linear</option>
                  <option value="radial">Radial</option>
                </select>
              </div>

              {gradientType === 'linear' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--xivig-text-dim)' }}>Angle: {gradientAngle}°</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={gradientAngle}
                    onChange={(e) => setGradientAngle(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} style={colorPickerStyle} />
                <span>Color 1: {color1}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} style={colorPickerStyle} />
                <span>Color 2: {color2}</span>
              </div>
            </div>
          )}

          {activeTab === 'animation' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--xivig-text-dim)' }}>Preset</label>
                <select
                  value={animationPreset}
                  onChange={(e: any) => setAnimationPreset(e.target.value)}
                  style={controlSelectStyle}
                >
                  <option value="pulse">Pulse</option>
                  <option value="bounce">Bounce</option>
                  <option value="slide-up">Slide Up</option>
                  <option value="spin">Spin</option>
                  <option value="shake">Shake</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--xivig-text-dim)' }}>Duration: {animDuration}s</label>
                <input
                  type="range"
                  min="0.2"
                  max="4"
                  step="0.1"
                  value={animDuration}
                  onChange={(e) => setAnimDuration(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {/* Generated Code Preview */}
          <div style={{ backgroundColor: '#090a0f', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--xivig-border)' }}>
            <pre style={{ margin: 0, fontSize: '11px', fontFamily: 'monospace', color: '#a5b4fc', whiteSpace: 'pre-wrap' }}>
              {currentCss}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--xivig-border, #2c313d)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            background: 'var(--xivig-surface, #1d2028)',
          }}
        >
          <button
            onClick={handleCopy}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid var(--xivig-border)',
              borderRadius: '4px',
              color: 'var(--xivig-text)',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {copied ? <Check size={14} style={{ color: '#35b779' }} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy CSS'}
          </button>
          <button
            onClick={handleInsert}
            style={{
              padding: '6px 14px',
              backgroundColor: 'var(--xivig-accent, #6c8cff)',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Insert into Editor
          </button>
        </div>
      </div>
    </div>
  );
};

const controlSelectStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  backgroundColor: 'var(--xivig-surface, #1d2028)',
  border: '1px solid var(--xivig-border, #2c313d)',
  borderRadius: '4px',
  color: 'var(--xivig-text, #e5e7eb)',
  fontSize: '12px',
  outline: 'none',
};

const colorPickerStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  background: 'none',
};
