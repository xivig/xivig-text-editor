import React, { useState, useMemo, useCallback } from 'react';
import {
  Sliders,
  SlidersHorizontal,
  Search,
  X,
  Filter,
  FileCode,
  Code,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Check,
  Type,
  Layout,
  Monitor,
  Layers,
  Globe,
  Shield,
  Package,
  MoreHorizontal,
  SplitSquareHorizontal,
  Eye,
  CheckSquare,
  Sparkles,
  LucideIcon,
} from 'lucide-react';
import { useSettingsStore, UserSettings, defaultSettings } from '../../stores/settingsStore';
import { useEditorStore } from '../../stores/editorStore';
import { themes, ThemeId } from '../../styles/themes';

// -------------------------------------------------------------
// Setting Item Interface
// -------------------------------------------------------------
export interface SettingDefinition {
  id: string; // e.g. "editor.fontSize"
  title: string; // e.g. "Editor: Font Size"
  category: 'Commonly Used' | 'Text Editor' | 'Workbench' | 'Window' | 'Features' | 'Application' | 'Security' | 'Extensions';
  subCategory?: string; // e.g. "Font", "Formatting", etc.
  description: string;
  type: 'number' | 'string' | 'boolean' | 'select' | 'theme';
  options?: Array<{ label: string; value: any }>;
  isCommonlyUsed?: boolean;
  min?: number;
  max?: number;
  step?: number;
  resetKey: keyof UserSettings;
  getValue: (s: UserSettings) => any;
  setValue: (val: any, update: (p: Partial<UserSettings>) => void) => void;
}

// -------------------------------------------------------------
// Category Navigation Tree
// -------------------------------------------------------------
interface CategoryNav {
  id: string;
  label: SettingDefinition['category'];
  icon: LucideIcon;
  subCategories: string[];
}

const CATEGORY_TREE: CategoryNav[] = [
  { id: 'commonly-used', label: 'Commonly Used', icon: SlidersHorizontal, subCategories: [] },
  { id: 'text-editor', label: 'Text Editor', icon: Type, subCategories: ['Font', 'Formatting', 'Cursor', 'Minimap', 'Brackets'] },
  { id: 'workbench', label: 'Workbench', icon: Layout, subCategories: ['Appearance & Themes', 'Startup'] },
  { id: 'window', label: 'Window', icon: Monitor, subCategories: ['Zoom & Display'] },
  { id: 'features', label: 'Features', icon: Layers, subCategories: ['Files & Autosave', 'Terminal'] },
  { id: 'application', label: 'Application', icon: Globe, subCategories: ['Keyboard & Ligatures'] },
  { id: 'security', label: 'Security', icon: Shield, subCategories: ['Storage & Trust'] },
  { id: 'extensions', label: 'Extensions', icon: Package, subCategories: ['Rainbow Brackets', 'Code Beautifier'] },
];

const fontOptions = [
  { label: 'Fira Code (Ligatures)', value: "'Fira Code', 'Cascadia Code', Consolas, monospace" },
  { label: 'JetBrains Mono (Ligatures)', value: "'JetBrains Mono', 'Fira Code', monospace" },
  { label: 'Cascadia Code (Ligatures)', value: "'Cascadia Code', Consolas, Menlo, monospace" },
  { label: 'Consolas', value: "Consolas, 'Courier New', monospace" },
  { label: 'System Monospace', value: "monospace" },
];

// -------------------------------------------------------------
// Setting Definitions Registry
// -------------------------------------------------------------
export const SETTINGS_REGISTRY: SettingDefinition[] = [
  // --- Commonly Used & Text Editor ---
  {
    id: 'editor.fontSize',
    title: 'Editor: Font Size',
    category: 'Text Editor',
    subCategory: 'Font',
    description: 'Controls the font size in pixels across all open editor panes and code views.',
    type: 'number',
    isCommonlyUsed: true,
    min: 9,
    max: 36,
    step: 1,
    resetKey: 'fontSize',
    getValue: (s) => s.fontSize,
    setValue: (v, u) => u({ fontSize: Number(v) }),
  },
  {
    id: 'editor.formatOnSave',
    title: 'Editor: Format On Save',
    category: 'Text Editor',
    subCategory: 'Formatting',
    description: 'Format a file on save. A formatter must be available and the editor must not be shutting down. When Files: Auto Save is set to afterDelay, the file will only be formatted when saved explicitly.',
    type: 'boolean',
    isCommonlyUsed: true,
    resetKey: 'autoIndentOnSave',
    getValue: (s) => s.autoIndentOnSave !== false,
    setValue: (v, u) => u({ autoIndentOnSave: Boolean(v) }),
  },
  {
    id: 'files.autoSave',
    title: 'Files: Auto Save',
    category: 'Features',
    subCategory: 'Files & Autosave',
    description: 'Controls auto save of editors that have unsaved changes. afterDelay automatically persists unsaved changes after a configured delay.',
    type: 'select',
    options: [
      { label: 'afterDelay', value: 'afterDelay' },
      { label: 'off', value: 'off' },
      { label: 'onFocusChange', value: 'onFocusChange' },
      { label: 'onWindowChange', value: 'onWindowChange' },
    ],
    isCommonlyUsed: true,
    resetKey: 'autoSave',
    getValue: (s) => (s.autoSave ? 'afterDelay' : 'off'),
    setValue: (v, u) => u({ autoSave: v !== 'off' }),
  },
  {
    id: 'editor.defaultFormatter',
    title: 'Editor: Default Formatter',
    category: 'Text Editor',
    subCategory: 'Formatting',
    description: 'Defines a default formatter which takes precedence over all other formatter settings. Must be the identifier of an extension contributing a formatter.',
    type: 'select',
    options: [
      { label: 'js-beautify (Xivig Core)', value: 'js-beautify' },
      { label: 'Prettier Formatter', value: 'prettier' },
      { label: 'None', value: 'none' },
    ],
    isCommonlyUsed: true,
    resetKey: 'defaultFormatter',
    getValue: (s) => s.defaultFormatter || 'js-beautify',
    setValue: (v, u) => u({ defaultFormatter: v }),
  },
  {
    id: 'editor.fontFamily',
    title: 'Editor: Font Family',
    category: 'Text Editor',
    subCategory: 'Font',
    description: 'Controls the font family used for text editing and code rendering.',
    type: 'string',
    isCommonlyUsed: true,
    resetKey: 'fontFamily',
    getValue: (s) => s.fontFamily,
    setValue: (v, u) => u({ fontFamily: v }),
  },
  {
    id: 'editor.wordWrap',
    title: 'Editor: Word Wrap',
    category: 'Text Editor',
    subCategory: 'Formatting',
    description: 'Controls how lines should wrap. Lines will wrap at the viewport boundary when enabled.',
    type: 'select',
    options: [
      { label: 'off', value: 'off' },
      { label: 'on', value: 'on' },
      { label: 'wordWrapColumn', value: 'wordWrapColumn' },
      { label: 'bounded', value: 'bounded' },
    ],
    isCommonlyUsed: true,
    resetKey: 'wordWrap',
    getValue: (s) => (s.wordWrap ? 'on' : 'off'),
    setValue: (v, u) => u({ wordWrap: v === 'on' || v === 'wordWrapColumn' || v === 'bounded' }),
  },
  {
    id: 'editor.tabSize',
    title: 'Editor: Tab Size',
    category: 'Text Editor',
    subCategory: 'Formatting',
    description: 'The number of spaces equal to one tab indentation.',
    type: 'select',
    options: [
      { label: '2 spaces', value: 2 },
      { label: '4 spaces', value: 4 },
      { label: '8 spaces', value: 8 },
    ],
    isCommonlyUsed: true,
    resetKey: 'tabSize',
    getValue: (s) => s.tabSize,
    setValue: (v, u) => u({ tabSize: Number(v) }),
  },
  {
    id: 'editor.lineNumbers',
    title: 'Editor: Line Numbers',
    category: 'Text Editor',
    subCategory: 'Formatting',
    description: 'Controls the display of line numbers in the editor gutter.',
    type: 'select',
    options: [
      { label: 'on', value: 'on' },
      { label: 'off', value: 'off' },
    ],
    isCommonlyUsed: true,
    resetKey: 'lineNumbers',
    getValue: (s) => (s.lineNumbers ? 'on' : 'off'),
    setValue: (v, u) => u({ lineNumbers: v === 'on' }),
  },
  {
    id: 'editor.lineHeight',
    title: 'Editor: Line Height',
    category: 'Text Editor',
    subCategory: 'Font',
    description: 'Controls the line height multiplier for comfortable code reading.',
    type: 'number',
    min: 1.2,
    max: 2.4,
    step: 0.1,
    resetKey: 'lineHeight',
    getValue: (s) => s.lineHeight,
    setValue: (v, u) => u({ lineHeight: Number(v) }),
  },
  {
    id: 'editor.fontLigatures',
    title: 'Editor: Font Ligatures',
    category: 'Text Editor',
    subCategory: 'Font',
    description: 'Configures font ligatures or font features (e.g. =>, ===, !=, <=, <!--) for supported monospace fonts.',
    type: 'boolean',
    isCommonlyUsed: true,
    resetKey: 'fontLigatures',
    getValue: (s) => s.fontLigatures !== false,
    setValue: (v, u) => u({ fontLigatures: Boolean(v) }),
  },
  {
    id: 'editor.minimap.enabled',
    title: 'Editor > Minimap: Enabled',
    category: 'Text Editor',
    subCategory: 'Minimap',
    description: 'Controls whether the minimap is shown on the right gutter.',
    type: 'boolean',
    isCommonlyUsed: true,
    resetKey: 'minimap',
    getValue: (s) => s.minimap,
    setValue: (v, u) => u({ minimap: Boolean(v) }),
  },
  {
    id: 'editor.bracketMatching',
    title: 'Editor: Match Brackets',
    category: 'Text Editor',
    subCategory: 'Brackets',
    description: 'Controls whether the editor highlights matching opening and closing brackets when the cursor is positioned near them.',
    type: 'boolean',
    resetKey: 'bracketMatching',
    getValue: (s) => s.bracketMatching !== false,
    setValue: (v, u) => u({ bracketMatching: Boolean(v) }),
  },
  {
    id: 'editor.cursorBlinking',
    title: 'Editor: Cursor Blinking',
    category: 'Text Editor',
    subCategory: 'Cursor',
    description: 'Control the cursor animation style in active editor panes.',
    type: 'select',
    options: [
      { label: 'smooth', value: 'smooth' },
      { label: 'blink', value: 'blink' },
      { label: 'solid', value: 'solid' },
    ],
    resetKey: 'cursorBlinking',
    getValue: (s) => s.cursorBlinking || 'smooth',
    setValue: (v, u) => u({ cursorBlinking: v }),
  },

  // --- Workbench ---
  {
    id: 'workbench.colorTheme',
    title: 'Workbench: Color Theme',
    category: 'Workbench',
    subCategory: 'Appearance & Themes',
    description: 'Specifies the color theme used in the workbench, editor surfaces, syntax highlighting, and dialogs.',
    type: 'theme',
    isCommonlyUsed: true,
    resetKey: 'theme',
    getValue: (s) => s.theme,
    setValue: (v, u) => u({ theme: v }),
  },
  {
    id: 'workbench.startupEditor',
    title: 'Workbench: Startup Editor',
    category: 'Workbench',
    subCategory: 'Startup',
    description: 'Controls which editor is shown at startup. When enabled, displays the Welcome Page upon launching Xivig Editor.',
    type: 'boolean',
    resetKey: 'showWelcomeOnStartup',
    getValue: (s) => s.showWelcomeOnStartup !== false,
    setValue: (v, u) => u({ showWelcomeOnStartup: Boolean(v) }),
  },

  // --- Features ---
  {
    id: 'terminal.integrated.fontSize',
    title: 'Terminal > Integrated: Font Size',
    category: 'Features',
    subCategory: 'Terminal',
    description: 'Controls the font size in pixels of the integrated xterm terminal.',
    type: 'number',
    min: 9,
    max: 28,
    step: 1,
    resetKey: 'terminalFontSize',
    getValue: (s) => s.terminalFontSize || 13,
    setValue: (v, u) => u({ terminalFontSize: Number(v) }),
  },
  {
    id: 'files.autoSaveDelay',
    title: 'Files: Auto Save Delay',
    category: 'Features',
    subCategory: 'Files & Autosave',
    description: 'Controls the delay in milliseconds after which an editor with unsaved changes is saved automatically.',
    type: 'number',
    min: 200,
    max: 10000,
    step: 100,
    resetKey: 'autoSaveDelay',
    getValue: (s) => s.autoSaveDelay || 1000,
    setValue: (v, u) => u({ autoSaveDelay: Number(v) }),
  },
  {
    id: 'files.trimTrailingWhitespace',
    title: 'Files: Trim Trailing Whitespace',
    category: 'Features',
    subCategory: 'Files & Autosave',
    description: 'When enabled, will automatically trim trailing whitespace when saving a file.',
    type: 'boolean',
    resetKey: 'trimTrailingWhitespace',
    getValue: (s) => Boolean(s.trimTrailingWhitespace),
    setValue: (v, u) => u({ trimTrailingWhitespace: Boolean(v) }),
  },
  {
    id: 'files.insertFinalNewline',
    title: 'Files: Insert Final Newline',
    category: 'Features',
    subCategory: 'Files & Autosave',
    description: 'When enabled, insert a final newline at the end of the file when saving it.',
    type: 'boolean',
    resetKey: 'insertFinalNewline',
    getValue: (s) => s.insertFinalNewline !== false,
    setValue: (v, u) => u({ insertFinalNewline: Boolean(v) }),
  },

  // --- Extensions ---
  {
    id: 'rainbowBrackets.enabled',
    title: 'Rainbow Brackets: Enabled',
    category: 'Extensions',
    subCategory: 'Rainbow Brackets',
    description: 'Colorizes matching brackets (), {}, and [] with cyclic depth colors for enhanced readability.',
    type: 'boolean',
    isCommonlyUsed: true,
    resetKey: 'rainbowBrackets',
    getValue: (s) => s.rainbowBrackets !== false,
    setValue: (v, u) => u({ rainbowBrackets: Boolean(v) }),
  },
  {
    id: 'rainbowBrackets.indentGuides',
    title: 'Rainbow Brackets: Indent Guides',
    category: 'Extensions',
    subCategory: 'Rainbow Brackets',
    description: 'Colorizes vertical indentation guide lines with rainbow depth cycles.',
    type: 'boolean',
    resetKey: 'rainbowIndentGuides',
    getValue: (s) => Boolean(s.rainbowIndentGuides),
    setValue: (v, u) => u({ rainbowIndentGuides: Boolean(v) }),
  },
  {
    id: 'bootstrap5.enabled',
    title: 'Bootstrap 5: Snippets Enabled',
    category: 'Extensions',
    subCategory: 'Bootstrap 5 & Font Awesome',
    description: 'Enables responsive Bootstrap 5 and Font Awesome 6 snippet suggestions across HTML, PHP, Vue, React, TSX, JSX, and Blade files.',
    type: 'boolean',
    isCommonlyUsed: true,
    resetKey: 'bootstrap5Enabled',
    getValue: (s) => s.bootstrap5Enabled !== false,
    setValue: (v, u) => u({ bootstrap5Enabled: Boolean(v) }),
  },
  {
    id: 'bootstrap5.components',
    title: 'Bootstrap 5: Component & Grid Snippets',
    category: 'Extensions',
    subCategory: 'Bootstrap 5 & Font Awesome',
    description: 'Provides b5-* snippet autocompletions for layouts, grid, navbars, cards, modals, alerts, carousels, and forms.',
    type: 'boolean',
    resetKey: 'bootstrap5Components',
    getValue: (s) => s.bootstrap5Components !== false,
    setValue: (v, u) => u({ bootstrap5Components: Boolean(v) }),
  },
  {
    id: 'bootstrap5.fontAwesome',
    title: 'Bootstrap 5: Font Awesome Icon Snippets',
    category: 'Extensions',
    subCategory: 'Bootstrap 5 & Font Awesome',
    description: 'Provides fa-* snippet autocompletions for Font Awesome 6 icons, brand logos, buttons, CDN links, and spin animations.',
    type: 'boolean',
    resetKey: 'bootstrap5FontAwesome',
    getValue: (s) => s.bootstrap5FontAwesome !== false,
    setValue: (v, u) => u({ bootstrap5FontAwesome: Boolean(v) }),
  },
  {
    id: 'security.storageEngine',
    title: 'Security > Storage: Safe Workspace Engine',
    category: 'Security',
    subCategory: 'Storage & Trust',
    description: 'Active Database: xivig-store.json in Electron userData path. Restricts IPC permissions to approved paths.',
    type: 'string',
    resetKey: 'theme',
    getValue: () => 'Online (xivig-store.json)',
    setValue: () => {},
  },
];

// -------------------------------------------------------------
// Component
// -------------------------------------------------------------
export const SettingsView: React.FC = () => {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const resetToDefault = useSettingsStore((state) => state.resetToDefault);

  // View state
  const [activeScope, setActiveScope] = useState<'user' | 'workspace'>('user');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('commonly-used');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'text-editor': true,
    'workbench': true,
    'features': true,
    'extensions': true,
  });

  // JSON editor mode state
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync settings to JSON format
  const syncSettingsToJson = useCallback(() => {
    const formatted: Record<string, any> = {};
    for (const def of SETTINGS_REGISTRY) {
      formatted[def.id] = def.getValue(settings);
    }
    setJsonText(JSON.stringify(formatted, null, 2));
    setJsonError(null);
  }, [settings]);

  const toggleJsonMode = useCallback(() => {
    if (!isJsonMode) {
      syncSettingsToJson();
      setIsJsonMode(true);
    } else {
      setIsJsonMode(false);
    }
  }, [isJsonMode, syncSettingsToJson]);

  const handleApplyJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      const partial: Partial<UserSettings> = {};

      for (const def of SETTINGS_REGISTRY) {
        if (parsed[def.id] !== undefined) {
          def.setValue(parsed[def.id], (p) => Object.assign(partial, p));
        }
      }

      updateSettings(partial);
      setJsonError(null);
      setIsJsonMode(false);
    } catch (err: any) {
      setJsonError(err.message || 'Malformed JSON syntax');
    }
  }, [jsonText, updateSettings]);

  // Toggle category tree expansion
  const toggleCategoryExpand = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Filtered settings computation
  const filteredSettings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return SETTINGS_REGISTRY.filter((def) => {
      // 1. Text Search Filter
      if (query) {
        const matchesQuery =
          def.id.toLowerCase().includes(query) ||
          def.title.toLowerCase().includes(query) ||
          def.description.toLowerCase().includes(query) ||
          (def.subCategory && def.subCategory.toLowerCase().includes(query));
        if (!matchesQuery) return false;
        return true;
      }

      // 2. Category Filter
      if (selectedCategory === 'commonly-used') {
        return def.isCommonlyUsed;
      }

      const categoryDef = CATEGORY_TREE.find((c) => c.id === selectedCategory);
      if (!categoryDef) return true;

      const matchesCat = def.category === categoryDef.label;
      if (!matchesCat) return false;

      if (selectedSubCategory) {
        return def.subCategory === selectedSubCategory;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedSubCategory]);

  // Check if a setting value is modified from default
  const isSettingModified = useCallback(
    (def: SettingDefinition) => {
      const current = def.getValue(settings);
      const defaultVal = def.getValue(defaultSettings);
      return current !== defaultVal;
    },
    [settings]
  );

  return (
    <div style={containerStyle}>
      {/* ─── Top Header Bar ─── */}
      <div style={topHeaderStyle}>
        <div style={titleRowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="var(--xivig-accent)" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--xivig-text)' }}>Settings</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={toggleJsonMode}
              title={isJsonMode ? 'Open Settings (UI)' : 'Open Settings (JSON)'}
              style={{
                ...iconBtnStyle,
                color: isJsonMode ? 'var(--xivig-accent)' : 'var(--xivig-text-muted)',
                backgroundColor: isJsonMode ? 'var(--xivig-surface)' : 'transparent',
              }}
            >
              <FileCode size={16} />
            </button>
            <button
              title="Split Editor Right"
              style={iconBtnStyle}
              onClick={() => {
                const current = useEditorStore.getState().splitLayout;
                useEditorStore.getState().setSplitLayout(current === 'two-columns' ? 'single' : 'two-columns');
              }}
            >
              <SplitSquareHorizontal size={16} />
            </button>
            <button
              title="More Actions"
              style={iconBtnStyle}
              onClick={() => useSettingsStore.getState().resetToDefault()}
            >
              <MoreHorizontal size={16} />
            </button>
            <button
              title="Close Settings (Ctrl+W)"
              style={iconBtnStyle}
              onClick={() => useEditorStore.getState().closeDocument('settings')}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ─── Search Bar ─── */}
        <div style={searchContainerStyle}>
          <div style={searchBoxStyle}>
            <Search size={15} color="var(--xivig-text-muted)" style={{ marginLeft: '10px' }} />
            <input
              type="text"
              placeholder="Search settings"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={clearSearchBtnStyle} title="Clear search">
                <X size={14} />
              </button>
            )}
            <button style={filterBtnStyle} title="Filter settings">
              <Filter size={14} color="var(--xivig-text-muted)" />
            </button>
          </div>
        </div>

        {/* ─── Scope Tabs (User / Workspace) ─── */}
        <div style={scopeRowStyle}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setActiveScope('user')}
              style={{
                ...scopePillStyle,
                backgroundColor: activeScope === 'user' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: activeScope === 'user' ? 'var(--xivig-text)' : 'var(--xivig-text-muted)',
                fontWeight: activeScope === 'user' ? 600 : 400,
              }}
            >
              User
            </button>
            <button
              onClick={() => setActiveScope('workspace')}
              style={{
                ...scopePillStyle,
                backgroundColor: activeScope === 'workspace' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: activeScope === 'workspace' ? 'var(--xivig-text)' : 'var(--xivig-text-muted)',
                fontWeight: activeScope === 'workspace' ? 600 : 400,
              }}
            >
              Workspace
            </button>
          </div>

          <span style={syncStatusStyle}>Last synced: Just now</span>
        </div>
      </div>

      {/* ─── Main Content Split Area ─── */}
      <div style={mainSplitStyle}>
        {/* ─── Left Table of Contents Tree ─── */}
        {!isJsonMode && (
          <div style={treeNavStyle}>
            {CATEGORY_TREE.map((cat) => {
              const isSelected = selectedCategory === cat.id && !selectedSubCategory;
              const isExpanded = expandedCategories[cat.id] ?? false;
              const hasSubs = cat.subCategories.length > 0;
              const IconComp = cat.icon;

              return (
                <div key={cat.id} style={{ marginBottom: '2px' }}>
                  <div
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedSubCategory(null);
                    }}
                    style={{
                      ...treeItemStyle,
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                      color: isSelected ? 'var(--xivig-text)' : 'var(--xivig-text-muted)',
                      fontWeight: isSelected ? 600 : 400,
                      borderLeft: isSelected ? '2.5px solid var(--xivig-accent)' : '2.5px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                      {hasSubs ? (
                        <span
                          onClick={(e) => toggleCategoryExpand(cat.id, e)}
                          style={{ display: 'inline-flex', cursor: 'pointer', opacity: 0.7 }}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                      ) : (
                        <span style={{ width: '14px' }} />
                      )}
                      <IconComp size={15} style={{ opacity: 0.85 }} />
                      <span style={{ fontSize: '13px' }}>{cat.label}</span>
                    </div>
                  </div>

                  {/* Subcategories */}
                  {hasSubs && isExpanded && (
                    <div style={{ paddingLeft: '28px', marginTop: '1px' }}>
                      {cat.subCategories.map((sub) => {
                        const isSubSelected = selectedCategory === cat.id && selectedSubCategory === sub;
                        return (
                          <div
                            key={sub}
                            onClick={() => {
                              setSelectedCategory(cat.id);
                              setSelectedSubCategory(sub);
                            }}
                            style={{
                              ...subTreeItemStyle,
                              color: isSubSelected ? 'var(--xivig-accent)' : 'var(--xivig-text-dim)',
                              fontWeight: isSubSelected ? 600 : 400,
                            }}
                          >
                            <span>{sub}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Right Content / Settings List ─── */}
        <div style={settingsContentStyle}>
          {isJsonMode ? (
            /* ─── JSON Settings Mode ─── */
            <div style={jsonEditorContainerStyle}>
              <div style={jsonHeaderBannerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Code size={16} color="var(--xivig-accent)" />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>settings.json • User Settings</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={syncSettingsToJson} style={secondaryBtnStyle}>
                    Reset Buffer
                  </button>
                  <button onClick={handleApplyJson} style={primaryBtnStyle}>
                    Apply Changes
                  </button>
                </div>
              </div>

              {jsonError && <div style={jsonErrorBannerStyle}>Syntax Error: {jsonError}</div>}

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                spellCheck={false}
                style={jsonTextareaStyle}
              />
            </div>
          ) : (
            /* ─── Standard Settings List Mode ─── */
            <div style={{ maxWidth: '820px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={categoryHeadingStyle}>
                  {searchQuery ? (
                    <>Search results ({filteredSettings.length})</>
                  ) : selectedSubCategory ? (
                    <>
                      {CATEGORY_TREE.find((c) => c.id === selectedCategory)?.label} &gt; {selectedSubCategory}
                    </>
                  ) : (
                    <>{CATEGORY_TREE.find((c) => c.id === selectedCategory)?.label || 'Commonly Used'}</>
                  )}
                </h1>
                {searchQuery && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--xivig-text-muted)' }}>
                      Found {filteredSettings.length} setting{filteredSettings.length === 1 ? '' : 's'} matching "{searchQuery}"
                    </span>
                    <button onClick={() => setSearchQuery('')} style={textLinkBtnStyle}>
                      Clear search
                    </button>
                  </div>
                )}
              </div>

              {filteredSettings.length === 0 ? (
                <div style={noResultsStyle}>
                  <p style={{ fontSize: '14px', color: 'var(--xivig-text-muted)', marginBottom: '8px' }}>
                    No settings found matching your search.
                  </p>
                  <button onClick={() => setSearchQuery('')} style={secondaryBtnStyle}>
                    Clear Filter
                  </button>
                </div>
              ) : (
                filteredSettings.map((def) => {
                  const isModified = isSettingModified(def);
                  const val = def.getValue(settings);

                  return (
                    <div
                      key={def.id}
                      style={{
                        ...settingCardStyle,
                        borderLeft: isModified ? '3px solid var(--xivig-accent)' : '3px solid transparent',
                      }}
                    >
                      {/* Setting Title & Modified Indicator */}
                      <div style={settingHeaderRowStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={settingTitleStyle}>{def.title}</span>
                          {isModified && (
                            <span style={modifiedPillStyle} title="Modified from default value">
                              Modified
                            </span>
                          )}
                        </div>

                        {/* Reset button if modified */}
                        {isModified && (
                          <button
                            onClick={() => resetToDefault(def.resetKey)}
                            title="Reset Setting to Default"
                            style={resetBtnStyle}
                          >
                            <RotateCcw size={13} style={{ marginRight: '4px' }} />
                            <span>Reset</span>
                          </button>
                        )}
                      </div>

                      {/* Setting Description */}
                      <p style={settingDescStyle}>
                        {def.description.split(/(afterDelay|Files: Auto Save|Fira Code|js-beautify|Prettier)/g).map((chunk, idx) => {
                          if (['afterDelay', 'Files: Auto Save', 'Fira Code', 'js-beautify', 'Prettier'].includes(chunk)) {
                            return (
                              <code key={idx} style={codeBadgeStyle}>
                                {chunk}
                              </code>
                            );
                          }
                          return chunk;
                        })}
                      </p>

                      {/* Setting Control Widget */}
                      <div style={{ marginTop: '10px' }}>
                        {def.type === 'number' && (
                          <input
                            type="number"
                            min={def.min}
                            max={def.max}
                            step={def.step || 1}
                            value={val}
                            onChange={(e) => def.setValue(e.target.value, updateSettings)}
                            style={numberInputStyle}
                          />
                        )}

                        {def.type === 'string' && (
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => def.setValue(e.target.value, updateSettings)}
                            style={textInputStyle}
                          />
                        )}

                        {def.type === 'boolean' && (
                          <label style={checkboxLabelStyle}>
                            <input
                              type="checkbox"
                              checked={Boolean(val)}
                              onChange={(e) => def.setValue(e.target.checked, updateSettings)}
                              style={checkboxInputStyle}
                            />
                            <span style={{ fontSize: '13px', color: 'var(--xivig-text)' }}>
                              Enable {def.title.split(': ').pop()}
                            </span>
                          </label>
                        )}

                        {def.type === 'select' && (
                          <select
                            value={val}
                            onChange={(e) => def.setValue(e.target.value, updateSettings)}
                            style={selectControlStyle}
                          >
                            {def.options?.map((opt) => (
                              <option key={opt.label} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {def.type === 'theme' && (
                          <div>
                            <select
                              value={val}
                              onChange={(e) => def.setValue(e.target.value, updateSettings)}
                              style={{ ...selectControlStyle, marginBottom: '14px', width: '280px' }}
                            >
                              {Object.values(themes).map((th) => (
                                <option key={th.id} value={th.id}>
                                  {th.name}
                                </option>
                              ))}
                            </select>

                            {/* Theme Swatches Preview Grid */}
                            <div style={themePaletteGridStyle}>
                              {Object.values(themes).map((th) => {
                                const isCurrent = settings.theme === th.id;
                                return (
                                  <div
                                    key={th.id}
                                    onClick={() => updateSettings({ theme: th.id as ThemeId })}
                                    style={{
                                      ...themeCardItemStyle,
                                      borderColor: isCurrent ? 'var(--xivig-accent)' : 'var(--xivig-border)',
                                      backgroundColor: th.colors.surface,
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                      <span style={{ fontSize: '12px', fontWeight: 600, color: th.colors.text }}>
                                        {th.name}
                                      </span>
                                      {isCurrent && <Check size={14} color="var(--xivig-accent)" />}
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                      <span style={{ ...colorSwatchDot, backgroundColor: th.colors.bg }} title="Background" />
                                      <span style={{ ...colorSwatchDot, backgroundColor: th.colors.surface }} title="Surface" />
                                      <span style={{ ...colorSwatchDot, backgroundColor: th.colors.accent }} title="Accent" />
                                      <span style={{ ...colorSwatchDot, backgroundColor: th.colors.text }} title="Text" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Styles
// -------------------------------------------------------------
const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--xivig-editor)',
  color: 'var(--xivig-text)',
  userSelect: 'none',
  overflow: 'hidden',
};

const topHeaderStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--xivig-border-subtle)',
  backgroundColor: 'var(--xivig-sidebar)',
  padding: '10px 16px 8px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const iconBtnStyle: React.CSSProperties = {
  padding: '4px 6px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
};

const searchContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-start',
};

const searchBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '4px',
  width: '100%',
  maxWidth: '680px',
  height: '32px',
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'var(--xivig-text)',
  fontSize: '13px',
  padding: '0 8px',
};

const clearSearchBtnStyle: React.CSSProperties = {
  padding: '4px',
  color: 'var(--xivig-text-muted)',
  cursor: 'pointer',
};

const filterBtnStyle: React.CSSProperties = {
  padding: '6px 10px',
  cursor: 'pointer',
};

const scopeRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '2px',
};

const scopePillStyle: React.CSSProperties = {
  padding: '3px 12px',
  borderRadius: '3px',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease, color 0.1s ease',
};

const syncStatusStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--xivig-text-dim)',
  marginRight: '6px',
};

const mainSplitStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  overflow: 'hidden',
};

const treeNavStyle: React.CSSProperties = {
  width: '230px',
  borderRight: '1px solid var(--xivig-border-subtle)',
  backgroundColor: 'var(--xivig-sidebar)',
  padding: '12px 6px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
};

const treeItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '5px 8px',
  borderRadius: '3px',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
};

const subTreeItemStyle: React.CSSProperties = {
  fontSize: '12px',
  padding: '4px 6px',
  borderRadius: '3px',
  cursor: 'pointer',
  transition: 'color 0.1s ease',
};

const settingsContentStyle: React.CSSProperties = {
  flex: 1,
  padding: '24px 36px',
  overflowY: 'auto',
};

const categoryHeadingStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 600,
  letterSpacing: '-0.3px',
  color: 'var(--xivig-text)',
};

const textLinkBtnStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--xivig-accent)',
  textDecoration: 'underline',
  cursor: 'pointer',
};

const noResultsStyle: React.CSSProperties = {
  padding: '40px 0',
  textAlign: 'center',
};

const settingCardStyle: React.CSSProperties = {
  padding: '4px 0 20px 12px',
  marginBottom: '20px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  transition: 'border-left-color 0.1s ease',
};

const settingHeaderRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4px',
};

const settingTitleStyle: React.CSSProperties = {
  fontSize: '13.5px',
  fontWeight: 600,
  color: 'var(--xivig-text)',
};

const modifiedPillStyle: React.CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 500,
  color: 'var(--xivig-accent)',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  padding: '1px 6px',
  borderRadius: '3px',
};

const resetBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '11px',
  color: 'var(--xivig-text-muted)',
  padding: '2px 6px',
  borderRadius: '3px',
  cursor: 'pointer',
};

const settingDescStyle: React.CSSProperties = {
  fontSize: '12.5px',
  color: 'var(--xivig-text-muted)',
  lineHeight: 1.5,
  maxWidth: '720px',
};

const codeBadgeStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  color: 'var(--xivig-accent)',
  padding: '1px 5px',
  borderRadius: '3px',
  fontFamily: 'var(--xivig-font-mono)',
  fontSize: '11.5px',
};

const numberInputStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '4px',
  color: 'var(--xivig-text)',
  padding: '5px 10px',
  fontSize: '13px',
  width: '130px',
  outline: 'none',
};

const textInputStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '4px',
  color: 'var(--xivig-text)',
  padding: '6px 10px',
  fontSize: '13px',
  width: '100%',
  maxWidth: '520px',
  outline: 'none',
  fontFamily: 'var(--xivig-font-mono)',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
};

const checkboxInputStyle: React.CSSProperties = {
  width: '16px',
  height: '16px',
  cursor: 'pointer',
};

const selectControlStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-surface)',
  color: 'var(--xivig-text)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '4px',
  padding: '6px 12px',
  fontSize: '13px',
  outline: 'none',
  cursor: 'pointer',
  minWidth: '220px',
};

const themePaletteGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '12px',
  maxWidth: '720px',
};

const themeCardItemStyle: React.CSSProperties = {
  padding: '12px',
  borderRadius: '5px',
  border: '1px solid',
  cursor: 'pointer',
  transition: 'border-color 0.1s ease',
};

const colorSwatchDot: React.CSSProperties = {
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  border: '1px solid var(--xivig-border)',
  display: 'inline-block',
};

const jsonEditorContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

const jsonHeaderBannerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
};

const jsonErrorBannerStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 85, 85, 0.15)',
  border: '1px solid #ff5555',
  color: '#ff5555',
  padding: '8px 12px',
  borderRadius: '4px',
  fontSize: '12.5px',
  marginBottom: '12px',
};

const jsonTextareaStyle: React.CSSProperties = {
  flex: 1,
  width: '100%',
  minHeight: '450px',
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '4px',
  color: 'var(--xivig-text)',
  fontFamily: 'var(--xivig-font-mono)',
  fontSize: '13px',
  lineHeight: 1.6,
  padding: '16px',
  outline: 'none',
  resize: 'none',
};

const primaryBtnStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-accent)',
  color: '#ffffff',
  padding: '5px 14px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-surface)',
  color: 'var(--xivig-text)',
  border: '1px solid var(--xivig-border)',
  padding: '5px 14px',
  borderRadius: '4px',
  fontSize: '12px',
  cursor: 'pointer',
};
