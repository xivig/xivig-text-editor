import { create } from 'zustand';
import { ThemeId } from '../styles/themes';
import { useSettingsStore } from './settingsStore';
import { extensionManager } from '../extensions/runtime/extensionManager';

export type ExtensionCategory = 'All' | 'Themes' | 'Languages' | 'Productivity' | 'Formatters';

export interface ExtensionPackage {
  id: string;
  name: string;
  publisher: string;
  version: string;
  category: 'Themes' | 'Languages' | 'Productivity' | 'Formatters';
  description: string;
  iconBg: string;
  iconSymbol: string;
  downloads: string;
  rating: number;
  tags: string[];
  themeId?: ThemeId;
  readme: string;
}

const MARKETPLACE_EXTENSIONS: ExtensionPackage[] = [
  // --- THEMES ---
  {
    id: 'xivig-theme-dracula',
    name: 'Dracula Official',
    publisher: 'Dracula Theme',
    version: '2.2.0',
    category: 'Themes',
    description: 'The official Dracula theme for Xivig. A dark theme for programmers, by a programmer.',
    iconBg: '#282a36',
    iconSymbol: '🧛',
    downloads: '1.8M',
    rating: 5.0,
    tags: ['theme', 'dracula', 'official', 'dark', 'purple'],
    themeId: 'dracula',
    readme: `# Dracula Official for Xivig Editor
The official Dracula Theme — a dark theme created for high contrast, readability, and all-night coding comfort.

## Official Palette
- **Background**: \`#282a36\`
- **Current Line / Selection**: \`#44475a\`
- **Foreground**: \`#f8f8f2\`
- **Comment**: \`#6272a4\`
- **Cyan**: \`#8be9fd\`
- **Green**: \`#50fa7b\`
- **Orange**: \`#ffb86c\`
- **Pink**: \`#ff79c6\`
- **Purple**: \`#bd93f9\`
- **Red**: \`#ff5555\`
- **Yellow**: \`#f1fa8c\`

Designed with ❤️ by [Dracula Theme](https://draculatheme.com).`,
  },
  {
    id: 'xivig-theme-nord',
    name: 'Nord Theme',
    publisher: 'Arctic Ice Studio',
    version: '1.4.0',
    category: 'Themes',
    description: 'An arctic, north-bluish clean and elegant dark color palette.',
    iconBg: '#2e3440',
    iconSymbol: '❄️',
    downloads: '215k',
    rating: 4.9,
    tags: ['theme', 'nord', 'dark', 'minimal'],
    themeId: 'nord',
    readme: `# Nord Theme for Xivig Editor
An arctic, north-bluish palette created for clean, distraction-free coding and reading.
- Focused on eye comfort and high readability.
- Consistent syntax highlighting across JavaScript, TypeScript, Python, Rust, and CSS.`,
  },
  {
    id: 'xivig-theme-tokyo-night',
    name: 'Tokyo Night',
    publisher: 'enkia',
    version: '2.1.2',
    category: 'Themes',
    description: 'A clean Visual Studio Code inspired dark theme that celebrates the lights of Downtown Tokyo at night.',
    iconBg: '#1a1b26',
    iconSymbol: '🗼',
    downloads: '380k',
    rating: 5.0,
    tags: ['theme', 'tokyo-night', 'indigo', 'modern'],
    themeId: 'tokyo-night',
    readme: `# Tokyo Night Theme
A dark theme with deep indigo tones, neon blue/purple accents, and crisp contrast.
- Signature neon accents
- Beautiful statusbar and editor styling`,
  },
  {
    id: 'xivig-theme-cyberpunk',
    name: 'Cyberpunk 2077',
    publisher: 'NightCity',
    version: '1.2.0',
    category: 'Themes',
    description: 'High-contrast neon yellow and midnight blue aesthetic inspired by Night City.',
    iconBg: '#0d0f18',
    iconSymbol: '⚡',
    downloads: '142k',
    rating: 4.8,
    tags: ['theme', 'cyberpunk', 'neon', 'high-contrast'],
    themeId: 'cyberpunk',
    readme: `# Cyberpunk 2077 Theme
Vibrant neon yellow, cyan, and deep obsidian black for futuristic aesthetics.`,
  },
  {
    id: 'xivig-theme-github-dark',
    name: 'GitHub Dark',
    publisher: 'GitHub',
    version: '3.0.1',
    category: 'Themes',
    description: 'The official GitHub Dark High Contrast theme tuned for desktop editors.',
    iconBg: '#0d1117',
    iconSymbol: '🐙',
    downloads: '520k',
    rating: 4.9,
    tags: ['theme', 'github', 'official', 'dark'],
    themeId: 'github-dark',
    readme: `# GitHub Dark
The official dark theme from GitHub. Crisp lines, balanced muted slates, and electric blue accents.`,
  },
  {
    id: 'xivig-theme-synthwave',
    name: "SynthWave '84",
    publisher: 'RobbOwen',
    version: '2.0.4',
    category: 'Themes',
    description: 'Retro 80s neon synthwave aesthetic featuring hot pink and warm neon yellow.',
    iconBg: '#262335',
    iconSymbol: '🌆',
    downloads: '188k',
    rating: 4.9,
    tags: ['theme', 'synthwave', 'retro', '80s'],
    themeId: 'synthwave',
    readme: `# SynthWave '84
A neon-soaked retro 80s theme that transports your code editor straight into a synth soundtrack.`,
  },

  // --- LANGUAGES ---
  {
    id: 'xivig-lang-python',
    name: 'Python Pro Toolpack',
    publisher: 'Xivig Community',
    version: '1.3.0',
    category: 'Languages',
    description: 'Advanced Python intelligence, docstring generators, PEP 8 templates, and virtualenv runner.',
    iconBg: '#3776ab',
    iconSymbol: '🐍',
    downloads: '310k',
    rating: 4.9,
    tags: ['python', 'snippets', 'pep8', 'tools'],
    readme: `# Python Pro Toolpack
Supercharge Python development with fast execution, built-in docstring snippets, and virtualenv support.`,
  },
  {
    id: 'xivig-lang-rust',
    name: 'Rust Cargo Suite',
    publisher: 'Rustaceans',
    version: '1.1.5',
    category: 'Languages',
    description: 'Rich snippets for Rust structs, traits, matches, and 1-click Cargo check/run shortcuts.',
    iconBg: '#e43717',
    iconSymbol: '🦀',
    downloads: '165k',
    rating: 4.9,
    tags: ['rust', 'cargo', 'systems', 'snippets'],
    readme: `# Rust Cargo Suite
Includes cargo shortcuts, snippet completions for idioms, match exhaustiveness templates, and fast builds.`,
  },
  {
    id: 'xivig-lang-sql',
    name: 'SQL & Database Studio',
    publisher: 'DataCraft',
    version: '1.0.8',
    category: 'Languages',
    description: 'SQL syntax highlighter, table template snippets, and query execution helper.',
    iconBg: '#336791',
    iconSymbol: '🗄️',
    downloads: '95k',
    rating: 4.7,
    tags: ['sql', 'database', 'postgres', 'mysql'],
    readme: `# SQL & Database Studio
Full dialect support (PostgreSQL, MySQL, SQLite), join shortcuts, and formatting.`,
  },
  {
    id: 'xivig-lang-go',
    name: 'Go Lang Tools',
    publisher: 'Golang Team',
    version: '1.2.0',
    category: 'Languages',
    description: 'Go language snippets, struct tag generators, goroutine templates, and error handling idioms.',
    iconBg: '#00add8',
    iconSymbol: '🐹',
    downloads: '120k',
    rating: 4.8,
    tags: ['go', 'golang', 'tools', 'snippets'],
    readme: `# Go Lang Tools
Productivity booster for Go developers with quick snippet expansions and test generators.`,
  },

  // --- PRODUCTIVITY & FORMATTERS ---
  {
    id: 'xivig-tool-prettier',
    name: 'Prettier Formatter',
    publisher: 'Prettier',
    version: '3.2.0',
    category: 'Formatters',
    description: 'Opinionated code formatter for JavaScript, TypeScript, CSS, HTML, Markdown, and JSON.',
    iconBg: '#ea5e5e',
    iconSymbol: '✨',
    downloads: '640k',
    rating: 5.0,
    tags: ['formatter', 'prettier', 'javascript', 'css'],
    readme: `# Prettier Formatter
Formats code cleanly and consistently according to standard community style rules.`,
  },
  {
    id: 'xivig-tool-todo',
    name: 'TODO Highlight',
    publisher: 'Wayou',
    version: '1.0.4',
    category: 'Productivity',
    description: 'Highlights TODO:, FIXME:, NOTE:, and BUG: annotations with bright colorful badges.',
    iconBg: '#ff9800',
    iconSymbol: '📝',
    downloads: '275k',
    rating: 4.8,
    tags: ['todo', 'fixme', 'comments', 'productivity'],
    readme: `# TODO Highlight
Never forget a TODO comment again! Highlights annotations in source code with vibrant warning badges.`,
  },
  {
    id: 'xivig-tool-rainbow',
    name: 'Rainbow Brackets & Indent',
    publisher: '2gua',
    version: '2.1.0',
    category: 'Productivity',
    description: 'Colorizes matching brackets and indentation depths with rainbow cycles for readability.',
    iconBg: '#9c27b0',
    iconSymbol: '🌈',
    downloads: '410k',
    rating: 4.9,
    tags: ['rainbow', 'brackets', 'indent', 'visual'],
    readme: `# Rainbow Brackets & Indent
Makes complex nested code blocks instantly readable by coloring pairs in cyclical rainbow tints.`,
  },
  {
    id: 'xivig-tool-bootstrap5',
    name: 'Bootstrap 5 & Font Awesome Snippets',
    publisher: 'Anbuselvan Rocky',
    version: '5.1.0',
    category: 'Productivity',
    description: 'Over 60+ responsive Bootstrap 5 components, layouts, grid scopes, and Font Awesome 6 icons for HTML, PHP, Vue, and React.',
    iconBg: '#7952b3',
    iconSymbol: '🅱️',
    downloads: '1.4M',
    rating: 4.9,
    tags: ['bootstrap', 'bootstrap5', 'fontawesome', 'snippets', 'html', 'css', 'icons'],
    readme: `# Bootstrap 5 & Font Awesome Snippets for Xivig

Rapidly scaffold modern, responsive web layouts and components using authentic Bootstrap 5.3 and Font Awesome 6.5 snippet triggers.

## 🚀 Quick Triggers Cheat Sheet

### Bootstrap 5 Starters & Layout
- \`b5-$\`: Complete responsive HTML5 starter boilerplate with Bootstrap 5.3 CDN CSS & JS.
- \`b5-cdn-css\`: Bootstrap 5.3 CDN stylesheet link.
- \`b5-cdn-js\`: Bootstrap 5.3 CDN JavaScript bundle tag.
- \`b5-grid\`: Container > Row > Column layout scaffold.
- \`b5-container\`: Responsive layout container (\`.container\` / \`.container-fluid\`).
- \`b5-row\`: Grid row wrapper.
- \`b5-col\`: Grid column (\`.col-md-6\`, \`.col-12\`).
- \`b5-row-cols\`: Grid with auto-wrapping columns and gutters.

### Bootstrap 5 Components
- \`b5-navbar\`: Full responsive navbar with brand, hamburger toggler, dropdown, and search.
- \`b5-card\`: Image, title, text, and button card component.
- \`b5-card-header-footer\`: Featured card with header, body, and footer.
- \`b5-alert\`: Dismissible contextual alert with close button.
- \`b5-modal\`: Accessible modal dialog with backdrop and trigger button.
- \`b5-accordion\`: Multi-item collapsible accordion.
- \`b5-carousel\`: Image slider with indicators, captions, and controls.
- \`b5-dropdown\`: Action dropdown menu.
- \`b5-offcanvas\`: Responsive drawer sidebar.
- \`b5-table\`: Responsive striped and hoverable table.
- \`b5-pagination\`: Pagination links with active states.
- \`b5-btn\`: Standard styled button.
- \`b5-btn-outline\`: Outline styled button.
- \`b5-badge\`: Contextual badge.
- \`b5-progress\`: Progress bar with percentage width.
- \`b5-spinner\`: CSS loading spinner.

### Bootstrap 5 Forms
- \`b5-form-input\`: Label + input control with placeholder and helper text.
- \`b5-form-floating\`: Floating label input container.
- \`b5-form-select\`: Custom dropdown select.
- \`b5-form-check\`: Consistent checkbox.
- \`b5-form-switch\`: Toggle switch.
- \`b5-input-group\`: Input with prepend/append text addons.

### Font Awesome 6 Icons
- \`fa-$\`: Font Awesome 6.5.1 CDN link tag.
- \`fa-icon\`: Standard solid icon (\`<i class="fa-solid fa-star"></i>\`).
- \`fa-icon-regular\`: Outline icon (\`<i class="fa-regular fa-heart"></i>\`).
- \`fa-icon-brands\`: Brand logo (\`<i class="fa-brands fa-github"></i>\`).
- \`fa-btn\`: Button with leading icon and spacing.
- \`fa-spin\`: Spinning loader icon.
- \`fa-stack\`: Composite stacked icons.
- Popular icons: \`fa-house\`, \`fa-user\`, \`fa-search\`, \`fa-gear\`, \`fa-envelope\`, \`fa-bell\`, \`fa-check\`, \`fa-xmark\`, \`fa-trash\`, \`fa-bars\`, \`fa-heart\`, \`fa-star\`, \`fa-github\`, \`fa-twitter\`, etc.
`,
  },
  {
    id: 'xivig-tool-laravel',
    name: 'Laravel All in One',
    publisher: 'Amir Alizadeh',
    version: '1.5.0',
    category: 'Productivity',
    description: 'Complete Laravel and Blade suite: directives, routing, Eloquent relations, migrations, form requests, and artisan helpers.',
    iconBg: '#f55247',
    iconSymbol: '🔴',
    downloads: '1.1M',
    rating: 4.9,
    tags: ['laravel', 'blade', 'php', 'eloquent', 'mvc', 'snippets'],
    readme: `# Laravel All in One for Xivig Editor

Supercharge your modern Laravel 11/10 workflow with rapid Blade directives, Eloquent relations, routing, and migration blueprints.

## 🚀 Key Snippet Triggers

### Blade Directives
- \`@extends\`: \`@extends('layouts.app')\`
- \`@section\`: Named section block with \`@endsection\`
- \`@yield\`: Yield placeholder in master layouts
- \`@include\`: Include partial views with variables
- \`@if\` / \`@ifelse\` / \`@elseif\`: Conditionals
- \`@foreach\` / \`@forelse\`: Loops with empty state
- \`@csrf\` & \`@method\`: Form security and method spoofing (PUT, DELETE)
- \`@error\`: Field validation error alert
- \`@vite\` & \`@livewire\`: Asset bundler and component tags
- \`@props\`: Component property declaration

### Laravel Backend
- \`route-get\` / \`route-post\` / \`route-resource\`: Route definitions
- \`eloquent-has-many\` / \`eloquent-belongs-to\`: Model relationships
- \`migration-create\` / \`migration-table\`: Database schema blueprints
- \`col-foreign-id\` / \`col-string\`: Schema column definitions
- \`response-json\`: JSON responses
- \`dd\` / \`dump\`: Instant debugging helpers
`,
  },
  {
    id: 'xivig-tool-php',
    name: 'PHP Intelligence & PhpStorm Snippets',
    publisher: 'JetBrains / Intelephense',
    version: '2.0.0',
    category: 'Languages',
    description: 'Authentic PhpStorm live templates (pubf, prof, fore, eco), PHP 8.x core function completions, signatures, and hover documentation.',
    iconBg: '#777bb4',
    iconSymbol: '🐘',
    downloads: '2.4M',
    rating: 5.0,
    tags: ['php', 'phpstorm', 'intelephense', 'templates', 'intelligence', 'hover'],
    readme: `# PHP Intelligence & PhpStorm Snippets for Xivig

Brings the beloved muscle-memory of PhpStorm live templates and comprehensive PHP 8.x language intelligence into Xivig.

## ⚡ PhpStorm Live Templates
- \`pubf\`: \`public function name(): void\`
- \`prof\`: \`protected function name(): void\`
- \`prif\`: \`private function name(): void\`
- \`pubsf\`: \`public static function name(): void\`
- \`con\`: \`public function __construct()\`
- \`cl\`: \`class ClassName\`
- \`intf\`: \`interface InterfaceName\`
- \`trait\`: \`trait TraitName\`
- \`enum\`: \`enum EnumName: string\`
- \`fore\`: \`foreach ($iterable as $item)\`
- \`forek\`: \`foreach ($iterable as $key => $value)\`
- \`eco\` / \`ech\`: \`echo\` variable or string literal
- \`try\`: \`try { ... } catch (\\Throwable $e) { ... }\`
- \`thr\`: \`throw new Exception('message');\`
- \`getter\` & \`setter\`: Fluent getters and setters
- \`match\`: PHP 8 match expression
- \`strict\`: \`declare(strict_types=1);\`

## 🧠 PHP Intelligence & Hover Docs
- Built-in signatures and return type hints for 40+ standard array, string, JSON, and regex functions.
- Autocompletion for PHP superglobals (\`$_GET\`, \`$_POST\`, \`$_SERVER\`, \`$_SESSION\`).
- Instant hover documentation and parameter hints when typing function arguments.
`,
  },
];

interface ExtensionState {
  marketplace: ExtensionPackage[];
  installedIds: string[];
  enabledIds: string[];
  selectedExtension: ExtensionPackage | null;

  installExtension: (id: string) => Promise<void>;
  uninstallExtension: (id: string) => Promise<void>;
  toggleEnableExtension: (id: string) => Promise<void>;
  selectExtension: (pkg: ExtensionPackage | null) => void;
  loadInstalledExtensions: () => Promise<void>;
}

export const useExtensionStore = create<ExtensionState>((set, get) => ({
  marketplace: MARKETPLACE_EXTENSIONS,
  installedIds: ['xivig-theme-dracula', 'xivig-theme-nord', 'xivig-tool-todo', 'xivig-tool-rainbow', 'xivig-tool-bootstrap5', 'xivig-tool-laravel', 'xivig-tool-php'],
  enabledIds: ['xivig-theme-dracula', 'xivig-theme-nord', 'xivig-tool-todo', 'xivig-tool-rainbow', 'xivig-tool-bootstrap5', 'xivig-tool-laravel', 'xivig-tool-php'],
  selectedExtension: null,

  selectExtension: (pkg) => set({ selectedExtension: pkg }),

  installExtension: async (id) => {
    const pkg = get().marketplace.find((m) => m.id === id);
    if (!pkg) return;

    const newInstalled = Array.from(new Set([...get().installedIds, id]));
    const newEnabled = Array.from(new Set([...get().enabledIds, id]));
    set({ installedIds: newInstalled, enabledIds: newEnabled });

    // Activate extension in extensionManager
    await extensionManager.activateExtension(id);

    // If it's a theme, automatically prompt or activate it!
    if (pkg.themeId) {
      useSettingsStore.getState().updateSettings({ theme: pkg.themeId });
    }

    // Persist to database
    if (window.xivig?.setSetting) {
      window.xivig.setSetting('installed_extensions', JSON.stringify(newInstalled));
      window.xivig.setSetting('enabled_extensions', JSON.stringify(newEnabled));
    }
  },

  uninstallExtension: async (id) => {
    const pkg = get().marketplace.find((m) => m.id === id);
    const newInstalled = get().installedIds.filter((item) => item !== id);
    const newEnabled = get().enabledIds.filter((item) => item !== id);
    set({ installedIds: newInstalled, enabledIds: newEnabled });

    // Deactivate extension in extensionManager
    await extensionManager.deactivateExtension(id);

    // If active theme was this uninstalled theme, switch back to xivig-dark
    if (pkg?.themeId && useSettingsStore.getState().settings.theme === pkg.themeId) {
      useSettingsStore.getState().updateSettings({ theme: 'xivig-dark' });
    }

    if (window.xivig?.setSetting) {
      window.xivig.setSetting('installed_extensions', JSON.stringify(newInstalled));
      window.xivig.setSetting('enabled_extensions', JSON.stringify(newEnabled));
    }
  },

  toggleEnableExtension: async (id) => {
    const isEnabled = get().enabledIds.includes(id);
    const newEnabled = isEnabled
      ? get().enabledIds.filter((item) => item !== id)
      : [...get().enabledIds, id];

    set({ enabledIds: newEnabled });

    // Activate or deactivate in extension runtime
    if (isEnabled) {
      await extensionManager.deactivateExtension(id);
    } else {
      await extensionManager.activateExtension(id);
    }

    const pkg = get().marketplace.find((m) => m.id === id);
    if (pkg?.themeId) {
      if (!isEnabled) {
        useSettingsStore.getState().updateSettings({ theme: pkg.themeId });
      } else if (useSettingsStore.getState().settings.theme === pkg.themeId) {
        useSettingsStore.getState().updateSettings({ theme: 'xivig-dark' });
      }
    }

    if (window.xivig?.setSetting) {
      window.xivig.setSetting('enabled_extensions', JSON.stringify(newEnabled));
    }
  },

  loadInstalledExtensions: async () => {
    let installed = get().installedIds;
    let enabled = get().enabledIds;

    if (window.xivig?.getSetting) {
      const savedInstalled = await window.xivig.getSetting('installed_extensions');
      const savedEnabled = await window.xivig.getSetting('enabled_extensions');
      if (savedInstalled) {
        try {
          const parsed = JSON.parse(savedInstalled);
          if (Array.isArray(parsed)) {
            installed = parsed;
            set({ installedIds: parsed });
          }
        } catch {}
      }
      if (savedEnabled) {
        try {
          const parsed = JSON.parse(savedEnabled);
          if (Array.isArray(parsed)) {
            enabled = parsed;
            set({ enabledIds: parsed });
          }
        } catch {}
      }
    }

    await extensionManager.init(installed, enabled);
  },
}));

// Bootstrap extension manager with initial store state
extensionManager.init(
  useExtensionStore.getState().installedIds,
  useExtensionStore.getState().enabledIds
);
