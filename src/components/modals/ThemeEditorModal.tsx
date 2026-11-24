import React, { useState } from 'react';
import { X, Palette, Check, Download, Upload, RotateCcw, Trash2 } from 'lucide-react';
import { useThemeCustomizerStore, CustomThemeColors } from '../../stores/themeCustomizerStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeEditorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const customTheme = useThemeCustomizerStore((state) => state.customTheme);
  const savedThemes = useThemeCustomizerStore((state) => state.savedThemes);
  const setThemeColor = useThemeCustomizerStore((state) => state.setThemeColor);
  const saveCurrentTheme = useThemeCustomizerStore((state) => state.saveCurrentTheme);
  const loadTheme = useThemeCustomizerStore((state) => state.loadTheme);
  const deleteSavedTheme = useThemeCustomizerStore((state) => state.deleteSavedTheme);
  const exportThemeJson = useThemeCustomizerStore((state) => state.exportThemeJson);
  const importThemeJson = useThemeCustomizerStore((state) => state.importThemeJson);
  const applyTheme = useThemeCustomizerStore((state) => state.applyTheme);
  const resetToDefault = useThemeCustomizerStore((state) => state.resetToDefault);

  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    applyTheme();
    saveCurrentTheme();
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2000);
  };

  const handleExport = () => {
    const json = exportThemeJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customTheme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    if (importThemeJson(importText)) {
      setShowImport(false);
      setImportText('');
    } else {
      alert('Invalid Theme JSON format.');
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
          width: '780px',
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
            <Palette size={18} style={{ color: 'var(--xivig-accent, #6c8cff)' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Custom Theme Studio & Personalizer</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto', display: 'flex', gap: '20px' }}>
          {/* Left Column: Color Controls */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--xivig-text-dim)', marginBottom: '4px' }}>
                Theme Name
              </label>
              <input
                type="text"
                value={customTheme.name}
                onChange={(e) => setThemeColor('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  backgroundColor: 'var(--xivig-surface, #1d2028)',
                  border: '1px solid var(--xivig-border, #2c313d)',
                  borderRadius: '4px',
                  color: 'var(--xivig-text, #e5e7eb)',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            {/* UI Color Pickers */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--xivig-text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Application UI Colors
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <ColorPickerRow label="Background" value={customTheme.background} onChange={(val) => setThemeColor('background', val)} />
                <ColorPickerRow label="Foreground" value={customTheme.foreground} onChange={(val) => setThemeColor('foreground', val)} />
                <ColorPickerRow label="Surface" value={customTheme.surface} onChange={(val) => setThemeColor('surface', val)} />
                <ColorPickerRow label="Border" value={customTheme.border} onChange={(val) => setThemeColor('border', val)} />
                <ColorPickerRow label="Accent" value={customTheme.accent} onChange={(val) => setThemeColor('accent', val)} />
              </div>
            </div>

            {/* Syntax Colors */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--xivig-text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Syntax Token Colors
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <ColorPickerRow label="Keywords" value={customTheme.syntaxKeyword} onChange={(val) => setThemeColor('syntaxKeyword', val)} />
                <ColorPickerRow label="Functions" value={customTheme.syntaxFunction} onChange={(val) => setThemeColor('syntaxFunction', val)} />
                <ColorPickerRow label="Strings" value={customTheme.syntaxString} onChange={(val) => setThemeColor('syntaxString', val)} />
                <ColorPickerRow label="Numbers" value={customTheme.syntaxNumber} onChange={(val) => setThemeColor('syntaxNumber', val)} />
                <ColorPickerRow label="Comments" value={customTheme.syntaxComment} onChange={(val) => setThemeColor('syntaxComment', val)} />
                <ColorPickerRow label="Types" value={customTheme.syntaxType} onChange={(val) => setThemeColor('syntaxType', val)} />
              </div>
            </div>
          </div>

          {/* Right Column: Live Code Sandbox & Presets */}
          <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Live Syntax Preview Card */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--xivig-text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Live Code Sandbox Preview
              </div>
              <div
                style={{
                  backgroundColor: customTheme.background,
                  border: `1px solid ${customTheme.border}`,
                  borderRadius: '6px',
                  padding: '12px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  lineHeight: '1.6',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                }}
              >
                <div>
                  <span style={{ color: customTheme.syntaxComment }}>// Xivig Live Syntax Preview</span>
                </div>
                <div>
                  <span style={{ color: customTheme.syntaxKeyword }}>import</span> {'{'} <span style={{ color: customTheme.syntaxType }}>EditorState</span> {'}'}{' '}
                  <span style={{ color: customTheme.syntaxKeyword }}>from</span> <span style={{ color: customTheme.syntaxString }}>'@codemirror/state'</span>;
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ color: customTheme.syntaxKeyword }}>interface</span> <span style={{ color: customTheme.syntaxType }}>ProjectConfig</span> {'{'}
                </div>
                <div style={{ paddingLeft: '12px' }}>
                  <span>port:</span> <span style={{ color: customTheme.syntaxType }}>number</span>;
                </div>
                <div>{'}'}</div>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ color: customTheme.syntaxKeyword }}>export function</span> <span style={{ color: customTheme.syntaxFunction }}>launchServer</span>(
                  <span style={{ color: customTheme.syntaxVariable }}>options</span>: <span style={{ color: customTheme.syntaxType }}>ProjectConfig</span>
                  ): <span style={{ color: customTheme.syntaxType }}>boolean</span> {'{'}
                </div>
                <div style={{ paddingLeft: '12px' }}>
                  <span style={{ color: customTheme.syntaxKeyword }}>const</span> <span style={{ color: customTheme.syntaxVariable }}>activePort</span> ={' '}
                  <span style={{ color: customTheme.syntaxNumber }}>3000</span>;
                </div>
                <div style={{ paddingLeft: '12px' }}>
                  <span style={{ color: customTheme.syntaxKeyword }}>return</span> options.port === activePort;
                </div>
                <div>{'}'}</div>
              </div>
            </div>

            {/* Saved Themes & Presets */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--xivig-text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Saved Theme Presets
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                {savedThemes.map((st) => (
                  <div
                    key={st.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      backgroundColor: 'var(--xivig-surface, #1d2028)',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flex: 1 }} onClick={() => loadTheme(st)}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: st.accent, display: 'inline-block' }} />
                      <span style={{ fontWeight: 600 }}>{st.name}</span>
                    </div>
                    {savedThemes.length > 1 && (
                      <button
                        onClick={() => deleteSavedTheme(st.name)}
                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '2px' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Import JSON Dialog */}
            {showImport && (
              <div style={{ padding: '8px', backgroundColor: 'var(--xivig-surface)', borderRadius: '4px', border: '1px solid var(--xivig-border)' }}>
                <textarea
                  rows={4}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste exported Theme JSON here..."
                  style={{ width: '100%', fontSize: '10px', fontFamily: 'monospace', resize: 'none', marginBottom: '6px' }}
                />
                <button
                  onClick={handleImportSubmit}
                  style={{ padding: '4px 8px', backgroundColor: 'var(--xivig-accent)', border: 'none', borderRadius: '3px', color: '#fff', fontSize: '10px', cursor: 'pointer' }}
                >
                  Import & Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--xivig-border, #2c313d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--xivig-surface, #1d2028)',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setShowImport(!showImport)}
              style={footerBtnStyle}
              title="Import theme from JSON"
            >
              <Upload size={12} /> Import
            </button>
            <button
              onClick={handleExport}
              style={footerBtnStyle}
              title="Export custom theme as JSON"
            >
              <Download size={12} /> Export
            </button>
            <button
              onClick={resetToDefault}
              style={footerBtnStyle}
              title="Reset to default theme"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {appliedNotice && (
              <span style={{ fontSize: '11px', color: '#35b779', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> Applied!
              </span>
            )}
            <button
              onClick={handleApply}
              style={{
                padding: '6px 16px',
                backgroundColor: 'var(--xivig-accent, #6c8cff)',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Apply to Editor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ColorPickerRow: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({
  label,
  value,
  onChange,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 6px',
        backgroundColor: 'var(--xivig-surface, #1d2028)',
        borderRadius: '4px',
        border: '1px solid var(--xivig-border, #2c313d)',
      }}
    >
      <span style={{ fontSize: '11px', color: 'var(--xivig-text, #e5e7eb)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '22px', height: '22px', border: 'none', borderRadius: '3px', cursor: 'pointer', background: 'none' }}
        />
        <span style={{ fontSize: '10px', color: 'var(--xivig-text-dim, #888)', fontFamily: 'monospace' }}>
          {value}
        </span>
      </div>
    </div>
  );
};

const footerBtnStyle: React.CSSProperties = {
  padding: '5px 10px',
  backgroundColor: 'transparent',
  border: '1px solid var(--xivig-border)',
  borderRadius: '4px',
  color: 'var(--xivig-text)',
  fontSize: '11px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};
