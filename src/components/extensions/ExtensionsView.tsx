import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  CheckCircle2,
  Zap,
  Code2,
  SlidersHorizontal,
  Layers,
  Info,
  ChevronRight,
  BookOpen,
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
  const [showBanner, setShowBanner] = useState(true);
  const [showArchDetails, setShowArchDetails] = useState(false);
  const [modalTab, setModalTab] = useState<'overview' | 'details' | 'sandbox'>('overview');

  const categories: ExtensionCategory[] = ['All', 'Themes', 'Languages', 'Productivity', 'Formatters'];

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedExtension) {
        selectExtension(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedExtension, selectExtension]);

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

  const getCategoryIcon = (cat: ExtensionCategory) => {
    switch (cat) {
      case 'Themes':
        return <Palette size={11} />;
      case 'Languages':
        return <Code2 size={11} />;
      case 'Productivity':
        return <Zap size={11} />;
      case 'Formatters':
        return <CheckCircle2 size={11} />;
      case 'All':
      default:
        return <Sparkles size={11} />;
    }
  };

  const getCategoryBadgeStyle = (cat: ExtensionCategory): { color: string; bg: string; border: string } => {
    switch (cat) {
      case 'Themes':
        return { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)', border: 'rgba(192, 132, 252, 0.25)' };
      case 'Languages':
        return { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.25)' };
      case 'Productivity':
        return { color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.25)' };
      case 'Formatters':
        return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.25)' };
      default:
        return { color: '#9ca3af', bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.1)' };
    }
  };

  return (
    <div style={containerStyle}>
      {/* Scoped CSS for Scrollbar Elimination & Elite Micro-Interactions */}
      <style>{`
        .xivig-ext-hide-scroll {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .xivig-ext-hide-scroll::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .xivig-ext-card {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .xivig-ext-card:hover {
          background: linear-gradient(180deg, rgba(34, 38, 48, 0.85) 0%, rgba(24, 27, 34, 0.85) 100%) !important;
          border-color: rgba(108, 140, 255, 0.35) !important;
          transform: translateY(-1.5px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(108, 140, 255, 0.15) !important;
        }
        .xivig-ext-pill-btn {
          transition: all 0.15s ease;
        }
        .xivig-ext-pill-btn:hover {
          filter: brightness(1.15);
        }
        .xivig-ext-btn-install {
          transition: all 0.16s ease;
        }
        .xivig-ext-btn-install:hover {
          filter: brightness(1.12);
          transform: translateY(-0.5px);
          box-shadow: 0 4px 14px rgba(108, 140, 255, 0.45);
        }
        .xivig-ext-btn-install:active {
          transform: translateY(0);
        }
      `}</style>

      {/* Header Container */}
      <div style={headerStyle}>
        {/* Glassmorphic Search Bar */}
        <div style={searchWrapperStyle}>
          <Search size={14} color="#818cf8" style={{ marginRight: '8px', flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search packages, themes, tags..."
            style={inputStyle}
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              style={iconBtnStyle}
              title="Clear search"
            >
              <X size={13} color="var(--xivig-text-muted)" />
            </button>
          ) : (
            <kbd style={shortcutBadgeStyle}>/</kbd>
          )}
        </div>

        {/* Linear/Raycast Style Segmented Tab Control */}
        <div style={segmentedControlStyle}>
          <button
            onClick={() => setActiveTab('marketplace')}
            style={{
              ...segmentedBtnStyle,
              backgroundColor: activeTab === 'marketplace' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: activeTab === 'marketplace' ? '#ffffff' : 'var(--xivig-text-muted)',
              boxShadow: activeTab === 'marketplace' ? '0 2px 8px rgba(0, 0, 0, 0.35)' : 'none',
              border: activeTab === 'marketplace' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
            }}
          >
            <span>Marketplace</span>
            <span
              style={{
                ...counterBadgeStyle,
                backgroundColor: activeTab === 'marketplace' ? 'rgba(108, 140, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === 'marketplace' ? '#a5b4fc' : 'var(--xivig-text-dim)',
              }}
            >
              {marketplace.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('installed')}
            style={{
              ...segmentedBtnStyle,
              backgroundColor: activeTab === 'installed' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: activeTab === 'installed' ? '#ffffff' : 'var(--xivig-text-muted)',
              boxShadow: activeTab === 'installed' ? '0 2px 8px rgba(0, 0, 0, 0.35)' : 'none',
              border: activeTab === 'installed' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
            }}
          >
            <span>Installed</span>
            <span
              style={{
                ...counterBadgeStyle,
                backgroundColor: activeTab === 'installed' ? 'rgba(53, 183, 121, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === 'installed' ? '#35b779' : 'var(--xivig-text-dim)',
              }}
            >
              {installedIds.length}
            </span>
          </button>
        </div>

        {/* Elite Compact Security & Architecture Banner */}
        {showBanner && (
          <div style={securityBannerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}>
              <div style={shieldIconContainerStyle}>
                <ShieldCheck size={13} color="#818cf8" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#e0e7ff' }}>
                    Sandboxed Runtime
                  </span>
                  <span style={{ fontSize: '9.5px', color: '#35b779', fontWeight: 600, backgroundColor: 'rgba(53, 183, 121, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                    Active
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--xivig-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Isolated host execution & verified theme registry
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setShowArchDetails(!showArchDetails)}
                style={archDetailsBtnStyle}
                title="View Sandbox Architecture Info"
              >
                <Info size={12} color="#a5b4fc" style={{ marginRight: '3px' }} />
                <span>Info</span>
              </button>
              <button
                onClick={() => setShowBanner(false)}
                style={bannerCloseBtnStyle}
                title="Dismiss Banner"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Architecture Details Accordion */}
        {showBanner && showArchDetails && (
          <div style={archDetailsContainerStyle}>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--xivig-text-muted)', lineHeight: '1.45' }}>
              Packaged extensions operate in a permission-controlled, sandboxed extension host with zero direct main-process execution. Built-in themes apply instantly through the Xivig theme engine. Architecture design documented in <code style={{ color: '#818cf8', fontSize: '10.5px', background: 'rgba(129, 140, 248, 0.1)', padding: '2px 5px', borderRadius: '3px' }}>docs/EXTENSION_SYSTEM_DESIGN.md</code>.
            </p>
          </div>
        )}

        {/* Category Filter Pills - Pure Native Scrollbar-Free Experience */}
        <div className="xivig-ext-hide-scroll" style={categoriesScrollStyle}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="xivig-ext-pill-btn"
                style={{
                  ...categoryPillStyle,
                  backgroundColor: isSelected ? 'rgba(108, 140, 255, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: isSelected ? 'rgba(108, 140, 255, 0.55)' : 'rgba(255, 255, 255, 0.07)',
                  color: isSelected ? '#ffffff' : 'var(--xivig-text-muted)',
                  boxShadow: isSelected ? '0 0 12px rgba(108, 140, 255, 0.25)' : 'none',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', color: isSelected ? '#a5b4fc' : 'var(--xivig-text-dim)' }}>
                  {getCategoryIcon(cat)}
                </span>
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Package List Container */}
      <div style={listStyle}>
        {filteredExtensions.length > 0 ? (
          filteredExtensions.map((pkg) => {
            const isInstalled = installedIds.includes(pkg.id);
            const isEnabled = enabledIds.includes(pkg.id);
            const isThemeActive = pkg.themeId && currentTheme === pkg.themeId;
            const badgeStyle = getCategoryBadgeStyle(pkg.category);

            return (
              <div
                key={pkg.id}
                onClick={() => {
                  setModalTab('overview');
                  selectExtension(pkg);
                }}
                className="xivig-ext-card"
                style={{
                  ...cardStyle,
                  borderColor: isInstalled
                    ? 'rgba(108, 140, 255, 0.3)'
                    : 'rgba(255, 255, 255, 0.065)',
                  opacity: isInstalled && !isEnabled ? 0.65 : 1,
                }}
              >
                {/* Header: Icon, Name, Verified, Version */}
                <div style={{ display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
                  {/* Distinct Icon Container with Ambient Glow */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: pkg.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0,
                      boxShadow: `0 4px 14px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {pkg.iconSymbol}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pkg.name}
                        </span>
                        <span title="Verified Curated Package" style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <CheckCircle2
                            size={12}
                            color="#6c8cff"
                            style={{ flexShrink: 0 }}
                          />
                        </span>
                      </div>
                      <span style={versionBadgeStyle}>
                        v{pkg.version}
                      </span>
                    </div>

                    {/* Metadata Subtitle: Publisher, Category, Star Rating, Downloads */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>
                        {pkg.publisher}
                      </span>
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          color: badgeStyle.color,
                          backgroundColor: badgeStyle.bg,
                          border: `1px solid ${badgeStyle.border}`,
                        }}
                      >
                        {pkg.category}
                      </span>
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                      <span style={{ fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                        <Star size={10} fill="#f59e0b" color="#f59e0b" />
                        {pkg.rating}
                      </span>
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                      <span style={{ fontSize: '10.5px', color: 'var(--xivig-text-dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Download size={9} color="var(--xivig-text-dim)" />
                        {pkg.downloads}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p style={descStyle}>{pkg.description}</p>

                {/* Tags Row */}
                {pkg.tags && pkg.tags.length > 0 && (
                  <div style={tagsContainerStyle}>
                    {pkg.tags.slice(0, 3).map((tag) => (
                      <span key={tag} style={tagStyle}>
                        #{tag}
                      </span>
                    ))}
                    {pkg.tags.length > 3 && (
                      <span style={moreTagStyle}>
                        +{pkg.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons Row */}
                <div style={actionRowStyle} onClick={(e) => e.stopPropagation()}>
                  {isInstalled ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => toggleEnableExtension(pkg.id)}
                        style={{
                          ...btnSecondaryStyle,
                          backgroundColor: isEnabled ? 'rgba(53, 183, 121, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                          borderColor: isEnabled ? 'rgba(53, 183, 121, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                          color: isEnabled ? '#35b779' : 'var(--xivig-text-dim)',
                        }}
                        title={isEnabled ? 'Disable Extension' : 'Enable Extension'}
                      >
                        <Power size={11} style={{ marginRight: '4px' }} />
                        {isEnabled ? 'Enabled' : 'Disabled'}
                      </button>

                      {/* Theme Apply Button */}
                      {pkg.themeId && (
                        <button
                          onClick={() => updateSettings({ theme: pkg.themeId! })}
                          style={{
                            ...btnSecondaryStyle,
                            backgroundColor: isThemeActive ? 'rgba(108, 140, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            borderColor: isThemeActive ? 'rgba(108, 140, 255, 0.45)' : 'rgba(255, 255, 255, 0.08)',
                            color: isThemeActive ? '#a5b4fc' : 'var(--xivig-text)',
                            fontWeight: isThemeActive ? 600 : 500,
                          }}
                        >
                          <Palette size={11} style={{ marginRight: '4px' }} />
                          {isThemeActive ? 'Active' : 'Apply Theme'}
                        </button>
                      )}

                      {/* Uninstall Button */}
                      <button
                        onClick={() => uninstallExtension(pkg.id)}
                        style={{
                          ...btnSecondaryStyle,
                          marginLeft: 'auto',
                          color: 'var(--xivig-text-dim)',
                          padding: '5px 8px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ef6464';
                          e.currentTarget.style.backgroundColor = 'rgba(239, 100, 100, 0.12)';
                          e.currentTarget.style.borderColor = 'rgba(239, 100, 100, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--xivig-text-dim)';
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        }}
                        title="Uninstall Extension"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => installExtension(pkg.id)}
                      className="xivig-ext-btn-install"
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
          <div style={emptyStateStyle}>
            <Package size={28} color="var(--xivig-text-dim)" style={{ marginBottom: '8px', opacity: 0.7 }} />
            <span style={{ fontWeight: 600, color: 'var(--xivig-text-muted)', fontSize: '13px' }}>
              No packages found
            </span>
            <span style={{ fontSize: '11px', color: 'var(--xivig-text-dim)', marginTop: '2px' }}>
              Try adjusting your query or category filters.
            </span>
          </div>
        )}
      </div>

      {/* Elite Floating Extension Details Modal */}
      {selectedExtension && (
        <div style={detailBackdropStyle} onClick={() => selectExtension(null)}>
          <div style={detailModalStyle} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={detailHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: selectedExtension.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    boxShadow: `0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)`,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {selectedExtension.iconSymbol}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                      {selectedExtension.name}
                    </span>
                    <span title="Verified Curated Package" style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <CheckCircle2 size={13} color="#6c8cff" />
                    </span>
                    <span style={versionBadgeStyle}>v{selectedExtension.version}</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--xivig-text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{selectedExtension.publisher}</span>
                    <span>•</span>
                    <span style={{ color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                      <Star size={10} fill="#f59e0b" color="#f59e0b" />
                      {selectedExtension.rating}
                    </span>
                    <span>•</span>
                    <span>{selectedExtension.downloads} downloads</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => selectExtension(null)}
                style={modalCloseBtnStyle}
                title="Close (Esc)"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={modalTabBarStyle}>
              <button
                onClick={() => setModalTab('overview')}
                style={{
                  ...modalTabBtnStyle,
                  color: modalTab === 'overview' ? '#ffffff' : 'var(--xivig-text-muted)',
                  borderBottom: modalTab === 'overview' ? '2px solid var(--xivig-accent)' : '2px solid transparent',
                  fontWeight: modalTab === 'overview' ? 600 : 500,
                }}
              >
                <BookOpen size={12} style={{ marginRight: '5px' }} />
                Overview
              </button>
              <button
                onClick={() => setModalTab('details')}
                style={{
                  ...modalTabBtnStyle,
                  color: modalTab === 'details' ? '#ffffff' : 'var(--xivig-text-muted)',
                  borderBottom: modalTab === 'details' ? '2px solid var(--xivig-accent)' : '2px solid transparent',
                  fontWeight: modalTab === 'details' ? 600 : 500,
                }}
              >
                <Layers size={12} style={{ marginRight: '5px' }} />
                Specifications
              </button>
              <button
                onClick={() => setModalTab('sandbox')}
                style={{
                  ...modalTabBtnStyle,
                  color: modalTab === 'sandbox' ? '#ffffff' : 'var(--xivig-text-muted)',
                  borderBottom: modalTab === 'sandbox' ? '2px solid var(--xivig-accent)' : '2px solid transparent',
                  fontWeight: modalTab === 'sandbox' ? 600 : 500,
                }}
              >
                <ShieldCheck size={12} style={{ marginRight: '5px' }} />
                Sandbox & Security
              </button>
            </div>

            {/* Modal Body */}
            <div style={modalBodyStyle}>
              {modalTab === 'overview' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={curatedTagStyle}>
                      <ShieldCheck size={11} style={{ marginRight: '4px' }} />
                      Verified Curated Extension
                    </span>
                    <span
                      style={{
                        ...curatedTagStyle,
                        backgroundColor: 'rgba(108, 140, 255, 0.1)',
                        borderColor: 'rgba(108, 140, 255, 0.3)',
                        color: '#a5b4fc',
                      }}
                    >
                      {selectedExtension.category}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--xivig-text)', marginBottom: '16px', lineHeight: '1.55' }}>
                    {selectedExtension.description}
                  </p>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {selectedExtension.tags.map((t) => (
                      <span key={t} style={modalTagStyle}>
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div style={readmeBoxStyle}>
                    <pre style={readmePreStyle}>
                      {selectedExtension.readme}
                    </pre>
                  </div>
                </div>
              )}

              {modalTab === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={specRowStyle}>
                    <span style={specLabelStyle}>Identifier</span>
                    <code style={specCodeStyle}>{selectedExtension.id}</code>
                  </div>
                  <div style={specRowStyle}>
                    <span style={specLabelStyle}>Version</span>
                    <span style={specValueStyle}>v{selectedExtension.version}</span>
                  </div>
                  <div style={specRowStyle}>
                    <span style={specLabelStyle}>Publisher</span>
                    <span style={specValueStyle}>{selectedExtension.publisher}</span>
                  </div>
                  <div style={specRowStyle}>
                    <span style={specLabelStyle}>Category</span>
                    <span style={specValueStyle}>{selectedExtension.category}</span>
                  </div>
                  {selectedExtension.themeId && (
                    <div style={specRowStyle}>
                      <span style={specLabelStyle}>Theme Mapping</span>
                      <code style={specCodeStyle}>{selectedExtension.themeId}</code>
                    </div>
                  )}
                  <div style={specRowStyle}>
                    <span style={specLabelStyle}>Total Installs</span>
                    <span style={specValueStyle}>{selectedExtension.downloads}</span>
                  </div>
                  <div style={specRowStyle}>
                    <span style={specLabelStyle}>Rating</span>
                    <span style={{ ...specValueStyle, color: '#f59e0b', fontWeight: 600 }}>
                      ★ {selectedExtension.rating} / 5.0
                    </span>
                  </div>
                </div>
              )}

              {modalTab === 'sandbox' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={sandboxCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <ShieldCheck size={16} color="#35b779" />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                        Sandboxed Isolation Tier
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--xivig-text-muted)', lineHeight: '1.5' }}>
                      This package adheres to Xivig's safe execution boundary. Scripts and hooks run in an isolated worker host with strictly mediated IPC commands.
                    </p>
                  </div>

                  <div style={sandboxCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <CheckCircle2 size={16} color="#818cf8" />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                        Granted Permissions
                      </span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: 'var(--xivig-text-muted)', lineHeight: '1.6' }}>
                      <li>Read active workspace files upon explicit user triggers.</li>
                      <li>Register editor commands and custom keyboard shortcuts.</li>
                      <li>Apply syntax styles and editor themes.</li>
                      <li>Zero privileged main-process shell execution access.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div style={detailFooterStyle}>
              {installedIds.includes(selectedExtension.id) ? (
                <>
                  <button
                    onClick={() => toggleEnableExtension(selectedExtension.id)}
                    style={{
                      ...btnSecondaryStyle,
                      padding: '7px 14px',
                      color: enabledIds.includes(selectedExtension.id) ? '#35b779' : 'var(--xivig-text-dim)',
                    }}
                  >
                    <Power size={12} style={{ marginRight: '6px' }} />
                    {enabledIds.includes(selectedExtension.id) ? 'Disable' : 'Enable'}
                  </button>

                  {selectedExtension.themeId && (
                    <button
                      onClick={() => updateSettings({ theme: selectedExtension.themeId! })}
                      style={{ ...btnInstallStyle, padding: '7px 16px' }}
                    >
                      <Palette size={12} style={{ marginRight: '6px' }} />
                      {currentTheme === selectedExtension.themeId ? 'Active Theme' : 'Apply Theme'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      uninstallExtension(selectedExtension.id);
                      selectExtension(null);
                    }}
                    style={{
                      ...btnSecondaryStyle,
                      color: '#ef6464',
                      padding: '7px 12px',
                      marginLeft: 'auto',
                    }}
                  >
                    <Trash2 size={12} style={{ marginRight: '6px' }} />
                    Uninstall
                  </button>
                </>
              ) : (
                <button
                  onClick={() => installExtension(selectedExtension.id)}
                  className="xivig-ext-btn-install"
                  style={{
                    ...btnInstallStyle,
                    width: '100%',
                    justifyContent: 'center',
                    padding: '8px 16px',
                    fontSize: '12px',
                  }}
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

// -------------------------------------------------------------
// STYLES
// -------------------------------------------------------------

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: 'var(--xivig-sidebar)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '10px 12px 8px 12px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  backgroundColor: 'var(--xivig-activity-bar)',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const searchWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  borderRadius: '7px',
  padding: '5px 9px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.25)',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '12px',
  color: '#f3f4f6',
  padding: 0,
};

const shortcutBadgeStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  padding: '1px 5px',
  borderRadius: '4px',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'var(--xivig-text-dim)',
  fontFamily: 'inherit',
};

const iconBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2px',
  borderRadius: '3px',
  cursor: 'pointer',
};

const segmentedControlStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  backgroundColor: 'rgba(0, 0, 0, 0.28)',
  borderRadius: '7px',
  padding: '2px',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  gap: '3px',
};

const segmentedBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '4px 6px',
  fontSize: '11px',
  fontWeight: 600,
  borderRadius: '5px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const counterBadgeStyle: React.CSSProperties = {
  fontSize: '9.5px',
  fontWeight: 700,
  padding: '1px 5px',
  borderRadius: '10px',
};

const securityBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  padding: '5px 8px',
  borderRadius: '6px',
  backgroundColor: 'rgba(99, 102, 241, 0.08)',
  border: '1px solid rgba(129, 140, 248, 0.22)',
};

const shieldIconContainerStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  borderRadius: '4px',
  backgroundColor: 'rgba(129, 140, 248, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const archDetailsBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '10px',
  fontWeight: 600,
  color: '#c7d2fe',
  backgroundColor: 'rgba(129, 140, 248, 0.15)',
  border: '1px solid rgba(129, 140, 248, 0.3)',
  borderRadius: '4px',
  padding: '2px 6px',
  cursor: 'pointer',
};

const bannerCloseBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--xivig-text-dim)',
  padding: '2px',
  cursor: 'pointer',
};

const archDetailsContainerStyle: React.CSSProperties = {
  padding: '6px 9px',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '5px',
  border: '1px solid rgba(129, 140, 248, 0.15)',
};

const categoriesScrollStyle: React.CSSProperties = {
  display: 'flex',
  gap: '5px',
  overflowX: 'auto',
  paddingBottom: '2px',
};

const categoryPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '3px 8px',
  borderRadius: '14px',
  fontSize: '10.5px',
  fontWeight: 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  border: '1px solid rgba(255, 255, 255, 0.08)',
};

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.025)',
  border: '1px solid rgba(255, 255, 255, 0.065)',
  borderRadius: '9px',
  padding: '11px',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
};

const versionBadgeStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 500,
  color: 'var(--xivig-text-dim)',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  padding: '1px 5px',
  borderRadius: '4px',
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const descStyle: React.CSSProperties = {
  fontSize: '11.5px',
  color: '#9ca3af',
  margin: '8px 0 8px 0',
  lineHeight: 1.45,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const tagsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  marginBottom: '9px',
  flexWrap: 'wrap',
};

const tagStyle: React.CSSProperties = {
  fontSize: '9.5px',
  padding: '1px 5px',
  borderRadius: '3px',
  backgroundColor: 'rgba(255, 255, 255, 0.035)',
  color: 'var(--xivig-text-dim)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
};

const moreTagStyle: React.CSSProperties = {
  fontSize: '9.5px',
  padding: '1px 4px',
  borderRadius: '3px',
  color: 'var(--xivig-text-dim)',
};

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginTop: '2px',
};

const btnInstallStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: 'var(--xivig-accent)',
  backgroundImage: 'linear-gradient(135deg, #6c8cff 0%, #4f6de8 100%)',
  color: '#ffffff',
  padding: '4px 12px',
  borderRadius: '5px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  boxShadow: '0 2px 8px rgba(108, 140, 255, 0.35)',
};

const btnSecondaryStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '5px',
  padding: '4px 9px',
  fontSize: '11px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const emptyStateStyle: React.CSSProperties = {
  padding: '40px 16px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const detailBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.72)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  backdropFilter: 'blur(10px)',
};

const detailModalStyle: React.CSSProperties = {
  width: '540px',
  maxHeight: '82vh',
  backgroundColor: '#191b24',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  boxShadow: '0 25px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const detailHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
};

const modalCloseBtnStyle: React.CSSProperties = {
  color: 'var(--xivig-text-dim)',
  padding: '4px',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalTabBarStyle: React.CSSProperties = {
  display: 'flex',
  padding: '0 20px',
  gap: '16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
  backgroundColor: 'rgba(0, 0, 0, 0.15)',
};

const modalTabBtnStyle: React.CSSProperties = {
  padding: '8px 2px',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const modalBodyStyle: React.CSSProperties = {
  padding: '18px 20px',
  overflowY: 'auto',
  flex: 1,
};

const curatedTagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(78, 201, 176, 0.12)',
  border: '1px solid rgba(78, 201, 176, 0.3)',
  color: '#4ec9b0',
  fontSize: '10.5px',
  fontWeight: 600,
};

const modalTagStyle: React.CSSProperties = {
  fontSize: '10.5px',
  padding: '2px 8px',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  borderRadius: '4px',
  color: 'var(--xivig-text-muted)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const readmeBoxStyle: React.CSSProperties = {
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  padding: '14px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const readmePreStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '11.5px',
  color: 'var(--xivig-text)',
  fontFamily: 'var(--xivig-font-mono)',
  whiteSpace: 'pre-wrap',
  lineHeight: 1.5,
};

const detailFooterStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '10px',
  padding: '12px 20px',
  borderTop: '1px solid rgba(255, 255, 255, 0.07)',
  backgroundColor: 'rgba(0, 0, 0, 0.25)',
};

const specRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
};

const specLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--xivig-text-dim)',
};

const specValueStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#ffffff',
  fontWeight: 500,
};

const specCodeStyle: React.CSSProperties = {
  fontSize: '11px',
  fontFamily: 'var(--xivig-font-mono)',
  color: '#a5b4fc',
  backgroundColor: 'rgba(129, 140, 248, 0.1)',
  padding: '2px 6px',
  borderRadius: '4px',
};

const sandboxCardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '8px',
  padding: '12px 14px',
};
