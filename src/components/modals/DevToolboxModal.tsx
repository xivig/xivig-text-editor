import React, { useState, useMemo } from 'react';
import {
  X,
  Wrench,
  Copy,
  Check,
  Code,
  Search,
  Hash,
  Clock,
  Palette,
  FileText,
  Clipboard,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useDevToolboxStore } from '../../stores/devToolboxStore';
import { getActiveEditorView } from '../editor/editorViewRegistry';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'json' | 'regex' | 'encoding' | 'converters' | 'scratch' | 'clipboard';
}

export const DevToolboxModal: React.FC<Props> = ({ isOpen, onClose, initialTab = 'json' }) => {
  const [activeTab, setActiveTab] = useState<'json' | 'regex' | 'encoding' | 'converters' | 'scratch' | 'clipboard'>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 1. JSON Tool state
  const [jsonInput, setJsonInput] = useState('{"name":"Xivig Text Editor","version":"1.5.0","features":["LSP","DAP","Formatters","WebToolkit"]}');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // 2. Regex Tool state
  const [regexPattern, setRegexPattern] = useState('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexTestText, setRegexTestText] = useState('Contact support@xivig.com or dev.team@company.org for assistance.');
  const [regexReplaceText, setRegexReplaceText] = useState('[email protected]');

  // 3. Encoding & Hashes state
  const [codecInput, setCodecInput] = useState('Hello, World! 🚀');
  const [generatedUuid, setGeneratedUuid] = useState(crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000');
  const [computedSha256, setComputedSha256] = useState('');

  // 4. Converters state
  const [colorInput, setColorInput] = useState('#6c8cff');
  const [timestampInput, setTimestampInput] = useState(String(Date.now()));
  const [wordCountText, setWordCountText] = useState('The quick brown fox jumps over the lazy dog.');

  // Store bindings
  const scratchText = useDevToolboxStore((state) => state.scratchText);
  const setScratchText = useDevToolboxStore((state) => state.setScratchText);
  const clipboardHistory = useDevToolboxStore((state) => state.clipboardHistory);
  const removeClipboardHistoryItem = useDevToolboxStore((state) => state.removeClipboardHistoryItem);
  const clearClipboardHistory = useDevToolboxStore((state) => state.clearClipboardHistory);

  // Compute SHA-256 async
  React.useEffect(() => {
    async function computeHash() {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(codecInput);
        const hashBuf = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuf));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        setComputedSha256(hashHex);
      } catch {
        setComputedSha256('Unavailable in this environment');
      }
    }
    computeHash();
  }, [codecInput]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const insertIntoEditor = (text: string) => {
    const view = getActiveEditorView();
    if (view) {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: text },
      });
      onClose();
    } else {
      copyToClipboard(text, 'inserted');
    }
  };

  // --- Regex Calculations ---
  const regexResult = useMemo(() => {
    try {
      const re = new RegExp(regexPattern, regexFlags);
      const matches: Array<{ match: string; index: number; groups: string[] }> = [];
      let m: RegExpExecArray | null;

      if (regexFlags.includes('g')) {
        while ((m = re.exec(regexTestText)) !== null) {
          matches.push({ match: m[0], index: m.index, groups: Array.from(m).slice(1) });
          if (!m[0]) break;
        }
      } else {
        m = re.exec(regexTestText);
        if (m) {
          matches.push({ match: m[0], index: m.index, groups: Array.from(m).slice(1) });
        }
      }

      const replaced = regexTestText.replace(re, regexReplaceText);
      return { valid: true, matches, replaced };
    } catch (e: any) {
      return { valid: false, error: e.message, matches: [], replaced: '' };
    }
  }, [regexPattern, regexFlags, regexTestText, regexReplaceText]);

  // --- Color Conversions ---
  const colorConversions = useMemo(() => {
    let hex = colorInput.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;

    // Check valid hex
    const valid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex);
    if (!valid) {
      return { valid: false };
    }

    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }

    const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
        case gNorm: h = (bNorm - rNorm) / d + 2; break;
        case bNorm: h = (rNorm - gNorm) / d + 4; break;
      }
      h /= 6;
    }

    return {
      valid: true,
      hex: hex.toLowerCase(),
      rgb: `rgb(${r}, ${g}, ${b})`,
      rgba: `rgba(${r}, ${g}, ${b}, 1)`,
      hsl: `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
    };
  }, [colorInput]);

  // --- Timestamp Conversions ---
  const timestampConversions = useMemo(() => {
    const raw = Number(timestampInput.trim());
    if (isNaN(raw)) return null;

    const ms = raw < 1e11 ? raw * 1000 : raw;
    const date = new Date(ms);
    if (isNaN(date.getTime())) return null;

    return {
      unixSeconds: Math.floor(ms / 1000),
      unixMs: ms,
      iso: date.toISOString(),
      utc: date.toUTCString(),
      local: date.toLocaleString(),
    };
  }, [timestampInput]);

  // --- Word Counter ---
  const wordStats = useMemo(() => {
    const text = wordCountText;
    const charsWithSpaces = text.length;
    const charsWithoutSpaces = text.replace(/\s+/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split('\n').length : 0;
    const bytes = new TextEncoder().encode(text).length;
    return { charsWithSpaces, charsWithoutSpaces, words, lines, bytes };
  }, [wordCountText]);

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
          width: '800px',
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
            <Wrench size={18} style={{ color: 'var(--xivig-accent, #6c8cff)' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Developer Productivity Toolbox</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--xivig-border)', backgroundColor: 'var(--xivig-surface)' }}>
          <TabButton active={activeTab === 'json'} onClick={() => setActiveTab('json')} icon={<Code size={13} />} label="JSON Formatter" />
          <TabButton active={activeTab === 'regex'} onClick={() => setActiveTab('regex')} icon={<Search size={13} />} label="Regex Tester" />
          <TabButton active={activeTab === 'encoding'} onClick={() => setActiveTab('encoding')} icon={<Hash size={13} />} label="Base64 & Hash" />
          <TabButton active={activeTab === 'converters'} onClick={() => setActiveTab('converters')} icon={<Clock size={13} />} label="Time & Units" />
          <TabButton active={activeTab === 'scratch'} onClick={() => setActiveTab('scratch')} icon={<FileText size={13} />} label="Scratchpad" />
          <TabButton active={activeTab === 'clipboard'} onClick={() => setActiveTab('clipboard')} icon={<Clipboard size={13} />} label={`Clipboard (${clipboardHistory.length})`} />
        </div>

        {/* Tab Body */}
        <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
          {/* TAB 1: JSON FORMATTER */}
          {activeTab === 'json' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    try {
                      const obj = JSON.parse(jsonInput);
                      setJsonInput(JSON.stringify(obj, null, 2));
                      setJsonError(null);
                    } catch (e: any) {
                      setJsonError(e.message);
                    }
                  }}
                  style={toolActionBtnStyle}
                >
                  Beautify (2 spaces)
                </button>
                <button
                  onClick={() => {
                    try {
                      const obj = JSON.parse(jsonInput);
                      setJsonInput(JSON.stringify(obj, null, 4));
                      setJsonError(null);
                    } catch (e: any) {
                      setJsonError(e.message);
                    }
                  }}
                  style={toolActionBtnStyle}
                >
                  Beautify (4 spaces)
                </button>
                <button
                  onClick={() => {
                    try {
                      const obj = JSON.parse(jsonInput);
                      setJsonInput(JSON.stringify(obj));
                      setJsonError(null);
                    } catch (e: any) {
                      setJsonError(e.message);
                    }
                  }}
                  style={toolActionBtnStyle}
                >
                  Minify
                </button>
                <button
                  onClick={() => copyToClipboard(jsonInput, 'json')}
                  style={toolActionBtnStyle}
                >
                  {copiedKey === 'json' ? <Check size={12} style={{ color: '#35b779' }} /> : <Copy size={12} />}
                  <span>{copiedKey === 'json' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {jsonError && (
                <div style={{ padding: '6px 10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', borderRadius: '4px', fontSize: '11px' }}>
                  Syntax Error: {jsonError}
                </div>
              )}

              <textarea
                rows={14}
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setJsonError(null);
                }}
                placeholder="Paste JSON here to format, validate, or minify..."
                style={{
                  width: '100%',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  padding: '10px',
                  backgroundColor: '#0c0e14',
                  border: '1px solid var(--xivig-border)',
                  borderRadius: '4px',
                  color: '#e5e7eb',
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {/* TAB 2: REGEX TESTER */}
          {activeTab === 'regex' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--xivig-text-dim)', marginBottom: '3px' }}>Pattern</label>
                  <input
                    type="text"
                    value={regexPattern}
                    onChange={(e) => setRegexPattern(e.target.value)}
                    style={toolboxInputStyle}
                  />
                </div>
                <div style={{ width: '80px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--xivig-text-dim)', marginBottom: '3px' }}>Flags</label>
                  <input
                    type="text"
                    value={regexFlags}
                    onChange={(e) => setRegexFlags(e.target.value)}
                    style={toolboxInputStyle}
                  />
                </div>
              </div>

              {!regexResult.valid && (
                <div style={{ padding: '6px 10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', borderRadius: '4px', fontSize: '11px' }}>
                  Invalid Regex: {regexResult.error}
                </div>
              )}

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--xivig-text-dim)', marginBottom: '3px' }}>
                  <span>Test String</span>
                  <span style={{ color: 'var(--xivig-accent)' }}>Matches: {regexResult.matches.length}</span>
                </label>
                <textarea
                  rows={4}
                  value={regexTestText}
                  onChange={(e) => setRegexTestText(e.target.value)}
                  style={{ ...toolboxInputStyle, resize: 'vertical' }}
                />
              </div>

              {regexResult.matches.length > 0 && (
                <div style={{ maxHeight: '120px', overflowY: 'auto', backgroundColor: '#0d0f14', padding: '8px', borderRadius: '4px', border: '1px solid var(--xivig-border)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--xivig-text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Match Details
                  </div>
                  {regexResult.matches.map((m, idx) => (
                    <div key={idx} style={{ fontSize: '11px', padding: '2px 0', borderBottom: '1px solid #1a1e28' }}>
                      <span style={{ color: 'var(--xivig-accent)', fontWeight: 600 }}>#{idx + 1}</span>{' '}
                      <span style={{ color: '#35b779' }}>"{m.match}"</span>{' '}
                      <span style={{ color: '#888' }}>(index: {m.index})</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--xivig-text-dim)', marginBottom: '3px' }}>Replace With</label>
                <input
                  type="text"
                  value={regexReplaceText}
                  onChange={(e) => setRegexReplaceText(e.target.value)}
                  style={toolboxInputStyle}
                />
                {regexResult.valid && (
                  <div style={{ marginTop: '6px', padding: '8px', backgroundColor: '#0d0f14', borderRadius: '4px', border: '1px solid var(--xivig-border)', fontSize: '11px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--xivig-text-dim)', textTransform: 'uppercase', marginBottom: '2px' }}>
                      Replacement Result
                    </div>
                    <div>{regexResult.replaced}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ENCODING & HASHES */}
          {activeTab === 'encoding' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--xivig-text-dim)', marginBottom: '3px' }}>Input Text</label>
                <textarea
                  rows={2}
                  value={codecInput}
                  onChange={(e) => setCodecInput(e.target.value)}
                  style={{ ...toolboxInputStyle, resize: 'none' }}
                />
              </div>

              {/* Conversion Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                <ResultRow
                  label="Base64 Encoded"
                  value={btoa(unescape(encodeURIComponent(codecInput)))}
                  onCopy={() => copyToClipboard(btoa(unescape(encodeURIComponent(codecInput))), 'b64')}
                  copied={copiedKey === 'b64'}
                />
                <ResultRow
                  label="URL Encoded"
                  value={encodeURIComponent(codecInput)}
                  onCopy={() => copyToClipboard(encodeURIComponent(codecInput), 'url')}
                  copied={copiedKey === 'url'}
                />
                <ResultRow
                  label="SHA-256 Hash"
                  value={computedSha256}
                  onCopy={() => copyToClipboard(computedSha256, 'sha256')}
                  copied={copiedKey === 'sha256'}
                />
              </div>

              {/* UUID Generator */}
              <div style={{ padding: '10px', backgroundColor: 'var(--xivig-surface)', borderRadius: '4px', border: '1px solid var(--xivig-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--xivig-text-dim)' }}>UUID v4 Generator</span>
                  <button
                    onClick={() => setGeneratedUuid(crypto.randomUUID())}
                    style={{ padding: '3px 8px', backgroundColor: 'var(--xivig-accent)', border: 'none', borderRadius: '3px', color: '#fff', fontSize: '10px', cursor: 'pointer' }}
                  >
                    Generate New
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#4ec9b0' }}>{generatedUuid}</span>
                  <button
                    onClick={() => copyToClipboard(generatedUuid, 'uuid')}
                    style={miniCopyBtnStyle}
                  >
                    {copiedKey === 'uuid' ? <Check size={12} style={{ color: '#35b779' }} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TIME, COLOR & WORD STATS */}
          {activeTab === 'converters' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Color Converter */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--xivig-text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Color Formats Converter
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <input
                    type="color"
                    value={colorConversions.valid ? colorConversions.hex : '#000000'}
                    onChange={(e) => setColorInput(e.target.value)}
                    style={{ width: '32px', height: '32px', border: 'none', cursor: 'pointer', background: 'none' }}
                  />
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    placeholder="#6c8cff"
                    style={{ ...toolboxInputStyle, flex: 1 }}
                  />
                </div>
                {colorConversions.valid && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    <div style={statBoxStyle}>
                      <span style={{ color: 'var(--xivig-text-dim)', fontSize: '10px' }}>HEX</span>
                      <span style={{ fontWeight: 600 }}>{colorConversions.hex}</span>
                    </div>
                    <div style={statBoxStyle}>
                      <span style={{ color: 'var(--xivig-text-dim)', fontSize: '10px' }}>RGB</span>
                      <span style={{ fontWeight: 600 }}>{colorConversions.rgb}</span>
                    </div>
                    <div style={statBoxStyle}>
                      <span style={{ color: 'var(--xivig-text-dim)', fontSize: '10px' }}>HSL</span>
                      <span style={{ fontWeight: 600 }}>{colorConversions.hsl}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp Converter */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--xivig-text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Unix Timestamp Converter
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <input
                    type="text"
                    value={timestampInput}
                    onChange={(e) => setTimestampInput(e.target.value)}
                    style={{ ...toolboxInputStyle, flex: 1 }}
                  />
                  <button
                    onClick={() => setTimestampInput(String(Date.now()))}
                    style={toolActionBtnStyle}
                  >
                    Now
                  </button>
                </div>
                {timestampConversions && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div style={statBoxStyle}>
                      <span style={{ color: 'var(--xivig-text-dim)', fontSize: '10px' }}>ISO 8601</span>
                      <span style={{ fontWeight: 600, fontSize: '11px' }}>{timestampConversions.iso}</span>
                    </div>
                    <div style={statBoxStyle}>
                      <span style={{ color: 'var(--xivig-text-dim)', fontSize: '10px' }}>Local Date Time</span>
                      <span style={{ fontWeight: 600, fontSize: '11px' }}>{timestampConversions.local}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Word & Character Counter */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--xivig-text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Text & Word Counter
                </div>
                <textarea
                  rows={3}
                  value={wordCountText}
                  onChange={(e) => setWordCountText(e.target.value)}
                  placeholder="Type or paste text to count characters and words..."
                  style={{ ...toolboxInputStyle, resize: 'none', marginBottom: '6px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  <div style={statBoxStyle}><span style={{ color: '#888', fontSize: '9px' }}>Words</span><span style={{ fontWeight: 700 }}>{wordStats.words}</span></div>
                  <div style={statBoxStyle}><span style={{ color: '#888', fontSize: '9px' }}>Chars</span><span style={{ fontWeight: 700 }}>{wordStats.charsWithSpaces}</span></div>
                  <div style={statBoxStyle}><span style={{ color: '#888', fontSize: '9px' }}>No Spaces</span><span style={{ fontWeight: 700 }}>{wordStats.charsWithoutSpaces}</span></div>
                  <div style={statBoxStyle}><span style={{ color: '#888', fontSize: '9px' }}>Lines</span><span style={{ fontWeight: 700 }}>{wordStats.lines}</span></div>
                  <div style={statBoxStyle}><span style={{ color: '#888', fontSize: '9px' }}>Bytes</span><span style={{ fontWeight: 700 }}>{wordStats.bytes}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SCRATCHPAD */}
          {activeTab === 'scratch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--xivig-text-dim)' }}>
                  Scratch buffer is persisted automatically across editor sessions.
                </span>
                <button
                  onClick={() => insertIntoEditor(scratchText)}
                  style={toolActionBtnStyle}
                >
                  Insert into Editor
                </button>
              </div>
              <textarea
                rows={14}
                value={scratchText}
                onChange={(e) => setScratchText(e.target.value)}
                style={{
                  width: '100%',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  padding: '10px',
                  backgroundColor: '#0c0e14',
                  border: '1px solid var(--xivig-border)',
                  borderRadius: '4px',
                  color: '#e5e7eb',
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {/* TAB 6: CLIPBOARD HISTORY */}
          {activeTab === 'clipboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--xivig-text-dim)' }}>
                  Recent copied snippets ({clipboardHistory.length})
                </span>
                {clipboardHistory.length > 0 && (
                  <button
                    onClick={clearClipboardHistory}
                    style={{ ...toolActionBtnStyle, color: '#ef6464' }}
                  >
                    <Trash2 size={11} /> Clear History
                  </button>
                )}
              </div>
              {clipboardHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--xivig-text-dim)', fontSize: '12px' }}>
                  No clippings in history yet. Copying text in Xivig will record items here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '350px', overflowY: 'auto' }}>
                  {clipboardHistory.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '8px 10px',
                        backgroundColor: 'var(--xivig-surface)',
                        border: '1px solid var(--xivig-border)',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: 'var(--xivig-text-dim)' }}>{item.timestamp}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => insertIntoEditor(item.text)}
                            style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: 'var(--xivig-accent)', border: 'none', borderRadius: '3px', color: '#fff', cursor: 'pointer' }}
                          >
                            Paste
                          </button>
                          <button
                            onClick={() => removeClipboardHistoryItem(item.id)}
                            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '2px' }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'pre-wrap', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({
  active,
  onClick,
  icon,
  label,
}) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: '10px 8px',
      border: 'none',
      background: 'none',
      color: active ? 'var(--xivig-accent, #6c8cff)' : 'var(--xivig-text-dim, #888)',
      borderBottom: active ? '2px solid var(--xivig-accent, #6c8cff)' : '2px solid transparent',
      cursor: 'pointer',
      fontSize: '11px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '5px',
      whiteSpace: 'nowrap',
    }}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const ResultRow: React.FC<{ label: string; value: string; onCopy: () => void; copied: boolean }> = ({
  label,
  value,
  onCopy,
  copied,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#0d0f14', borderRadius: '4px', border: '1px solid var(--xivig-border)' }}>
    <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
      <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--xivig-text-dim)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</div>
    </div>
    <button onClick={onCopy} style={miniCopyBtnStyle}>
      {copied ? <Check size={12} style={{ color: '#35b779' }} /> : <Copy size={12} />}
    </button>
  </div>
);

const toolboxInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  backgroundColor: 'var(--xivig-surface, #1d2028)',
  border: '1px solid var(--xivig-border, #2c313d)',
  borderRadius: '4px',
  color: 'var(--xivig-text, #e5e7eb)',
  fontSize: '11px',
  outline: 'none',
  boxSizing: 'border-box',
};

const toolActionBtnStyle: React.CSSProperties = {
  padding: '5px 10px',
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '4px',
  color: 'var(--xivig-text)',
  fontSize: '11px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontWeight: 500,
};

const miniCopyBtnStyle: React.CSSProperties = {
  padding: '4px',
  background: 'none',
  border: 'none',
  color: '#888',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const statBoxStyle: React.CSSProperties = {
  padding: '6px 8px',
  backgroundColor: 'var(--xivig-surface)',
  borderRadius: '4px',
  border: '1px solid var(--xivig-border)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
};
