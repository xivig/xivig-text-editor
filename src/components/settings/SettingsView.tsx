import React, { useState } from 'react';
import {
  Sliders,
  Palette,
  FileCode,
  RotateCcw,
  Check,
  Type,
  Layout,
  Eye,
} from 'lucide-react';
import { useSettingsStore, UserSettings } from '../../stores/settingsStore';
import { themes, ThemeId } from '../../styles/themes';

const fontOptions = [
  { label: 'Fira Code (Ligatures)', value: "'Fira Code', 'Cascadia Code', Consolas, monospace" },
  { label: 'JetBrains Mono (Ligatures)', value: "'JetBrains Mono', 'Fira Code', monospace" },
  { label: 'Cascadia Code (Ligatures)', value: "'Cascadia Code', Consolas, Menlo, monospace" },
  { label: 'Consolas', value: "Consolas, 'Courier New', monospace" },
  { label: 'System Monospace', value: "monospace" },
];

export const SettingsView: React.FC = () => {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const [activeTab, setActiveTab] = useState<'editor' | 'appearance' | 'files'>('editor');

  return (
    <div style={containerStyle}>
      {/* Settings Navigation */}
      <div style={navStyle}>
        <h2 style={navTitleStyle}>Settings</h2>
        <div style={navGroupStyle}>
          <button
            onClick={() => setActiveTab('editor')}
            style={{
              ...navBtnStyle,
              backgroundColor: activeTab === 'editor' ? 'var(--xivig-surface)' : 'transparent',
              color: activeTab === 'editor' ? 'var(--xivig-accent)' : 'var(--xivig-text-muted)',
            }}
          >
            <Sliders size={15} style={{ marginRight: '8px' }} />
            <span>Editor</span>
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            style={{
              ...navBtnStyle,
              backgroundColor: activeTab === 'appearance' ? 'var(--xivig-surface)' : 'transparent',
              color: activeTab === 'appearance' ? 'var(--xivig-accent)' : 'var(--xivig-text-muted)',
            }}
          >
            <Palette size={15} style={{ marginRight: '8px' }} />
            <span>Appearance & Themes</span>
          </button>
          <button
            onClick={() => setActiveTab('files')}
            style={{
              ...navBtnStyle,
              backgroundColor: activeTab === 'files' ? 'var(--xivig-surface)' : 'transparent',
              color: activeTab === 'files' ? 'var(--xivig-accent)' : 'var(--xivig-text-muted)',
            }}
          >
            <FileCode size={15} style={{ marginRight: '8px' }} />
            <span>Files & Autosave</span>
          </button>
        </div>
      </div>

      {/* Settings Content Area */}
      <div style={contentStyle}>
        {activeTab === 'editor' && (
          <div style={sectionStyle}>
            <h3 style={sectionHeaderStyle}>Text Editor Configuration</h3>

            {/* Font Size */}
            <div style={settingRowStyle}>
              <div>
                <label style={settingLabelStyle}>Font Size</label>
                <p style={settingDescStyle}>Controls the font size in pixels for all open editor panes.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min="9"
                  max="36"
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                  style={{ width: '120px' }}
                />
                <span style={valBadgeStyle}>{settings.fontSize}px</span>
              </div>
            </div>

            {/* Font Family */}
            <div style={settingRowStyle}>
              <div>
                <label style={settingLabelStyle}>Font Family</label>
                <p style={settingDescStyle}>Controls the font family used for code rendering.</p>
              </div>
              <select
                value={settings.fontFamily}
                onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                style={selectStyle}
              >
                {fontOptions.map((f) => (
                  <option key={f.label} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Line Height */}
            <div style={settingRowStyle}>
              <div>
                <label style={settingLabelStyle}>Line Height</label>
                <p style={settingDescStyle}>Line spacing multiplier for comfortable reading.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min="1.2"
                  max="2.2"
                  step="0.1"
                  value={settings.lineHeight}
                  onChange={(e) => updateSettings({ lineHeight: Number(e.target.value) })}
                  style={{ width: '120px' }}
                />
                <span style={valBadgeStyle}>{settings.lineHeight}</span>
              </div>
            </div>

            {/* Tab Size */}
            <div style={settingRowStyle}>
              <div>
                <label style={settingLabelStyle}>Tab Size</label>
                <p style={settingDescStyle}>The number of spaces equal to one tab indentation.</p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[2, 4].map((size) => (
                  <button
                    key={size}
                    onClick={() => updateSettings({ tabSize: size })}
                    style={{
                      ...pillBtnStyle,
                      backgroundColor: settings.tabSize === size ? 'var(--xivig-accent)' : 'var(--xivig-surface)',
                      color: settings.tabSize === size ? '#ffffff' : 'var(--xivig-text)',
                    }}
                  >
                    {size} Spaces
                  </button>
                ))}
              </div>
            </div>

            {/* Word Wrap */}
            <div style={settingRowStyle}>
              <div>
                <label style={settingLabelStyle}>Word Wrap</label>
                <p style={settingDescStyle}>Controls whether long lines should wrap to the next line.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.wordWrap}
                onChange={(e) => updateSettings({ wordWrap: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {/* Font Ligatures Toggle */}
            <div style={settingRowStyle}>
              <div>
                <label style={settingLabelStyle}>Font Ligatures</label>
                <p style={settingDescStyle}>Enables or disables font programming ligatures (e.g. =&gt;, ===, !=, &lt;=, &lt;!--).</p>
              </div>
              <input
                type="checkbox"
                checked={settings.fontLigatures !== false}
                onChange={(e) => updateSettings({ fontLigatures: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {/* Minimap Toggle */}
            <div style={settingRowStyle}>
              <div>
                <label style={settingLabelStyle}>Show Minimap</label>
                <p style={settingDescStyle}>Displays the document overview canvas on the right gutter.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.minimap}
                onChange={(e) => updateSettings({ minimap: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div style={sectionStyle}>
            <h3 style={sectionHeaderStyle}>Color Themes</h3>
            <p style={{ ...settingDescStyle, marginBottom: '16px' }}>
              Select a color palette. Changes take effect instantly across all windows, editors, and dialogs.
            </p>

            <div style={themeGridStyle}>
              {Object.values(themes).map((th) => {
                const isSelected = settings.theme === th.id;
                return (
                  <div
                    key={th.id}
                    onClick={() => updateSettings({ theme: th.id as ThemeId })}
                    style={{
                      ...themeCardStyle,
                      borderColor: isSelected ? 'var(--xivig-accent)' : 'var(--xivig-border)',
                      backgroundColor: th.colors.surface,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: th.colors.text }}>
                        {th.name}
                      </span>
                      {isSelected && <Check size={16} color="var(--xivig-accent)" />}
                    </div>

                    {/* Color Swatches */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ ...swatchStyle, backgroundColor: th.colors.bg }} title="Background" />
                      <span style={{ ...swatchStyle, backgroundColor: th.colors.surface }} title="Surface" />
                      <span style={{ ...swatchStyle, backgroundColor: th.colors.accent }} title="Accent" />
                      <span style={{ ...swatchStyle, backgroundColor: th.colors.text }} title="Text" />
                      <span style={{ ...swatchStyle, backgroundColor: th.colors.border }} title="Border" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div style={sectionStyle}>
            <h3 style={sectionHeaderStyle}>Files & Autosave</h3>

            {/* Autosave */}
            <div style={settingRowStyle}>
              <div>
                <label style={settingLabelStyle}>Auto Save Session</label>
                <p style={settingDescStyle}>
                  Automatically persist open documents, draft changes, and cursor positions to SQLite.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => updateSettings({ autoSave: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {/* Storage Info */}
            <div style={{ ...settingRowStyle, borderBottom: 'none' }}>
              <div>
                <label style={settingLabelStyle}>Storage Engine</label>
                <p style={settingDescStyle}>
                  Active Database: <code>xivig-store.json</code> in Electron userData path.
                </p>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--xivig-success)', fontWeight: 600 }}>
                ● Online
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  backgroundColor: 'var(--xivig-editor)',
  color: 'var(--xivig-text)',
  userSelect: 'none',
  overflow: 'hidden',
};

const navStyle: React.CSSProperties = {
  width: '220px',
  borderRight: '1px solid var(--xivig-border-subtle)',
  backgroundColor: 'var(--xivig-sidebar)',
  padding: '24px 12px',
  display: 'flex',
  flexDirection: 'column',
};

const navTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  letterSpacing: '0.4px',
  marginBottom: '16px',
  paddingLeft: '8px',
};

const navGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const navBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: 500,
  textAlign: 'left',
  transition: 'background-color 0.1s ease',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: '32px 48px',
  overflowY: 'auto',
};

const sectionStyle: React.CSSProperties = {
  maxWidth: '720px',
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  marginBottom: '20px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  paddingBottom: '8px',
};

const settingRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 0',
  borderBottom: '1px solid var(--xivig-border-subtle)',
};

const settingLabelStyle: React.CSSProperties = {
  fontSize: '13.5px',
  fontWeight: 600,
  display: 'block',
  marginBottom: '4px',
};

const settingDescStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--xivig-text-muted)',
};

const selectStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-surface)',
  color: 'var(--xivig-text)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '4px',
  padding: '6px 10px',
  fontSize: '12.5px',
  outline: 'none',
  cursor: 'pointer',
};

const valBadgeStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--xivig-accent)',
  minWidth: '36px',
};

const pillBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid var(--xivig-border)',
  cursor: 'pointer',
};

const themeGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '16px',
};

const themeCardStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '6px',
  border: '1px solid',
  cursor: 'pointer',
  transition: 'transform 0.1s ease, border-color 0.1s ease',
};

const swatchStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  border: '1px solid var(--xivig-border)',
  display: 'inline-block',
};
