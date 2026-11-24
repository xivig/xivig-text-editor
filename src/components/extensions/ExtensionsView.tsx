import React, { useState } from 'react';
import {
  Search,
  Package,
  Download,
  Star,
  Check,
  Trash2,
  Power,
  Palette,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';
import {
  useExtensionStore,
  ExtensionPackage,
  ExtensionCategory,
} from '../../stores/extensionStore';
import { useSettingsStore } from '../../stores/settingsStore';

export const ExtensionsView: React.FC = () => {
  const marketplace = useExtensionStore((state) => state.marketplace);
  const installedIds = useExtensionStore((state) => state.installedIds);
  const enabledIds = useExtensionStore((state) => state.enabledIds);
  const installExtension = useExtensionStore((state) => state.installExtension);
  const uninstallExtension = useExtensionStore((state) => state.uninstallExtension);
  const toggleEnableExtension = useExtensionStore((state) => state.toggleEnableExtension);
  const selectedExtension = useExtensionStore((state) => state.selectedExtension);
  const selectExtension = useExtensionStore((state) => state.selectExtension);
  const currentTheme = useSettingsStore((state) => state.settings.theme);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'marketplace' | 'installed'>('marketplace');
  const [selectedCategory, setSelectedCategory] = useState<ExtensionCategory>('All');

  const categories: ExtensionCategory[] = ['All', 'Themes', 'Languages', 'Productivity', 'Formatters'];

  const filteredExtensions = marketplace.filter((pkg) => {
    const isInstalled = installedIds.includes(pkg.id);
    if (activeTab === 'installed' && !isInstalled) return false;

    if (selectedCategory !== 'All' && pkg.category !== selectedCategory) return false;

    if (query.trim()) {
      const q = query.toLowerCase();
      const matchName = pkg.name.toLowerCase().includes(q);
      const matchDesc = pkg.description.toLowerCase().includes(q);
      const matchPub = pkg.publisher.toLowerCase().includes(q);
      const matchTags = pkg.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchPub && !matchTags) return false;
    }

    return true;
  });

  return (
    <div style={containerStyle}>
      {/* Search Header */}
      <div style={headerStyle}>
        <div style={searchWrapperStyle}>
          <Search size={13} color="var(--xivig-text-dim)" style={{ marginRight: '6px' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Xivig Packages..."
            style={inputStyle}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: 'var(--xivig-text-dim)' }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* View Switcher Tabs */}
        <div style={tabSwitcherStyle}>
          <button
            onClick={() => setActiveTab('marketplace')}
            style={{
              ...tabBtnStyle,
              borderBottom: activeTab === 'marketplace' ? '2px solid var(--xivig-accent)' : '2px solid transparent',
              color: activeTab === 'marketplace' ? 'var(--xivig-text)' : 'var(--xivig-text-dim)',
            }}
          >
            Curated Packages ({marketplace.length})
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            style={{
              ...tabBtnStyle,
              borderBottom: activeTab === 'installed' ? '2px solid var(--xivig-accent)' : '2px solid transparent',
              color: activeTab === 'installed' ? 'var(--xivig-text)' : 'var(--xivig-text-dim)',
            }}
          >
            Installed ({installedIds.length})
          </button>
        </div>

        {/* Prototype & Architecture Notice Banner */}
        <div
          style={{
            margin: '8px 12px 2px 12px',
            padding: '7px 10px',
            borderRadius: '4px',
            backgroundColor: 'rgba(38, 79, 120, 0.25)',
            border: '1px solid rgba(86, 156, 214, 0.35)',
            fontSize: '11px',
            color: 'var(--xivig-text-muted)',
            lineHeight: '1.4',
          }}
        >
          <span style={{ color: '#569cd6', fontWeight: 600 }}>Curated Built-in Showcase: </span>
          Packaged themes and extensions run natively in Xivig settings. Third-party sandboxed extension engine architecture is documented in <code style={{ color: '#ce9178', fontSize: '10.5px' }}>docs/EXTENSION_SYSTEM_DESIGN.md</code>.
        </div>

        {/* Category Filter Pills */}
        <div style={categoriesScrollStyle}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                ...categoryPillStyle,
                backgroundColor: selectedCategory === cat ? 'var(--xivig-accent)' : 'var(--xivig-surface)',
                color: selectedCategory === cat ? '#ffffff' : 'var(--xivig-text-dim)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Package List */}
      <div style={listStyle}>
        {filteredExtensions.length > 0 ? (
          filteredExtensions.map((pkg) => {
            const isInstalled = installedIds.includes(pkg.id);
            const isEnabled = enabledIds.includes(pkg.id);
            const isThemeActive = pkg.themeId && currentTheme === pkg.themeId;

            return (
              <div
                key={pkg.id}
                onClick={() => selectExtension(pkg)}
                style={{
                  ...cardStyle,
                  borderLeft: isInstalled ? '3px solid var(--xivig-accent)' : '3px solid transparent',
                  opacity: isInstalled && !isEnabled ? 0.6 : 1,
                }}
              >
                {/* Icon & Metadata Header */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      backgroundColor: pkg.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                  >
                    {pkg.iconSymbol}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--xivig-text)' }}>
                        {pkg.name}
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--xivig-text-dim)' }}>
                        v{pkg.version}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--xivig-text-dim)' }}>{pkg.publisher}</span>
                      <span style={{ fontSize: '10px', color: 'var(--xivig-text-dim)' }}>•</span>
                      <span style={{ fontSize: '10.5px', color: '#e6ad45', display: 'flex', alignItems: 'center' }}>
                        ★ {pkg.rating}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--xivig-text-dim)' }}>•</span>
                      <span style={{ fontSize: '10.5px', color: 'var(--xivig-text-dim)' }}>
                        {pkg.downloads}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p style={descStyle}>{pkg.description}</p>

                {/* Action Row */}
                <div style={actionRowStyle} onClick={(e) => e.stopPropagation()}>
                  {isInstalled ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                      <button
                        onClick={() => toggleEnableExtension(pkg.id)}
                        style={{
                          ...btnSecondaryStyle,
                          color: isEnabled ? '#35b779' : 'var(--xivig-text-dim)',
                        }}
                        title={isEnabled ? 'Disable Extension' : 'Enable Extension'}
                      >
                        <Power size={11} style={{ marginRight: '4px' }} />
                        {isEnabled ? 'Enabled' : 'Disabled'}
                      </button>

                      {pkg.themeId && (
                        <button
                          onClick={() => updateSettings({ theme: pkg.themeId! })}
                          style={{
                            ...btnSecondaryStyle,
                            backgroundColor: isThemeActive ? 'rgba(53, 183, 121, 0.15)' : 'var(--xivig-surface)',
                            color: isThemeActive ? '#35b779' : 'var(--xivig-text)',
                          }}
                        >
                          <Palette size={11} style={{ marginRight: '4px' }} />
                          {isThemeActive ? 'Active' : 'Apply'}
                        </button>
                      )}

                      <button
                        onClick={() => uninstallExtension(pkg.id)}
                        style={{
                          ...btnSecondaryStyle,
                          marginLeft: 'auto',
                          color: '#ef6464',
                        }}
                        title="Uninstall Extension"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => installExtension(pkg.id)}
                      style={btnInstallStyle}
                    >
                      <Download size={12} style={{ marginRight: '5px' }} />
                      Install
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--xivig-text-dim)', fontSize: '12px' }}>
            No packages match your search.
          </div>
        )}
      </div>

      {/* Extension Details Modal */}
      {selectedExtension && (
        <div style={detailBackdropStyle} onClick={() => selectExtension(null)}>
          <div style={detailModalStyle} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={detailHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    backgroundColor: selectedExtension.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}
                >
                  {selectedExtension.iconSymbol}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--xivig-text)' }}>
                    {selectedExtension.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--xivig-text-dim)' }}>
                    {selectedExtension.publisher} • v{selectedExtension.version} • {selectedExtension.category}
                  </div>
                </div>
              </div>

              <button onClick={() => selectExtension(null)} style={{ color: 'var(--xivig-text-dim)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(78, 201, 176, 0.15)',
                  border: '1px solid rgba(78, 201, 176, 0.35)',
                  color: '#4ec9b0',
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '12px',
                }}
              >
                <span>Curated Core Package (Built-in)</span>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--xivig-text-muted)', marginBottom: '14px' }}>
                {selectedExtension.description}
              </p>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {selectedExtension.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: '10px',
                      padding: '2px 7px',
                      backgroundColor: 'var(--xivig-activity-bar)',
                      borderRadius: '4px',
                      color: 'var(--xivig-text-dim)',
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <div
                style={{
                  backgroundColor: 'var(--xivig-activity-bar)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--xivig-border-subtle)',
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: 'var(--xivig-text)',
                    fontFamily: 'var(--xivig-font-mono)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedExtension.readme}
                </pre>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={detailFooterStyle}>
              {installedIds.includes(selectedExtension.id) ? (
                <>
                  <button
                    onClick={() => uninstallExtension(selectedExtension.id)}
                    style={{ ...btnSecondaryStyle, color: '#ef6464', padding: '6px 12px' }}
                  >
                    <Trash2 size={12} style={{ marginRight: '6px' }} />
                    Uninstall
                  </button>
                  {selectedExtension.themeId && (
                    <button
                      onClick={() => updateSettings({ theme: selectedExtension.themeId! })}
                      style={{ ...btnInstallStyle, padding: '6px 14px' }}
                    >
                      <Palette size={12} style={{ marginRight: '6px' }} />
                      Apply Theme
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => installExtension(selectedExtension.id)}
                  style={{ ...btnInstallStyle, width: '100%', justifyContent: 'center', padding: '8px 14px' }}
                >
                  <Download size={13} style={{ marginRight: '6px' }} />
                  Install Package
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: 'var(--xivig-sidebar)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  backgroundColor: 'var(--xivig-activity-bar)',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const searchWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'var(--xivig-surface)',
  borderRadius: '4px',
  padding: '4px 8px',
  border: '1px solid var(--xivig-border-subtle)',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '12px',
  color: 'var(--xivig-text)',
};

const tabSwitcherStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
};

const tabBtnStyle: React.CSSProperties = {
  padding: '4px 2px',
  fontSize: '11.5px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'color 0.1s',
};

const categoriesScrollStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  overflowX: 'auto',
  paddingBottom: '2px',
};

const categoryPillStyle: React.CSSProperties = {
  padding: '3px 8px',
  borderRadius: '12px',
  fontSize: '10.5px',
  fontWeight: 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  border: '1px solid var(--xivig-border-subtle)',
};

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border-subtle)',
  borderRadius: '6px',
  padding: '10px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  display: 'flex',
  flexDirection: 'column',
};

const descStyle: React.CSSProperties = {
  fontSize: '11.5px',
  color: 'var(--xivig-text-muted)',
  margin: '8px 0 10px 0',
  lineHeight: 1.4,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const btnInstallStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'var(--xivig-accent)',
  color: '#ffffff',
  padding: '4px 10px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
};

const btnSecondaryStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'var(--xivig-activity-bar)',
  border: '1px solid var(--xivig-border-subtle)',
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '11px',
  cursor: 'pointer',
};

const detailBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  backdropFilter: 'blur(2px)',
};

const detailModalStyle: React.CSSProperties = {
  width: '520px',
  maxHeight: '80vh',
  backgroundColor: 'var(--xivig-surface)',
  borderRadius: '8px',
  border: '1px solid var(--xivig-border)',
  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const detailHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
};

const detailFooterStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '10px',
  padding: '10px 16px',
  borderTop: '1px solid var(--xivig-border-subtle)',
  backgroundColor: 'var(--xivig-activity-bar)',
};
