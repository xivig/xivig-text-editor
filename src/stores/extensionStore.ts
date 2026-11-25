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
    version: '1.5.0',
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
    name: 'Prettier - Code Formatter',
    publisher: 'Prettier',
    version: '3.3.0',
    category: 'Formatters',
    description: 'Opinionated code formatter for JavaScript, TypeScript, CSS, HTML, Markdown, and JSON.',
    iconBg: '#ea5e5e',
    iconSymbol: '✨',
    downloads: '14.2M',
    rating: 5.0,
    tags: ['formatter', 'prettier', 'javascript', 'typescript', 'css', 'html', 'json'],
    readme: `# Prettier - Code Formatter for Xivig
Opinionated code formatter that enforces consistent style across all projects.
- Formats JavaScript, TypeScript, JSX, TSX, HTML, CSS, SCSS, LESS, JSON, and Markdown.
- Configurable print width, tabs vs spaces, semicolons, single quotes, and trailing commas.`,
  },
  {
    id: 'xivig-tool-eslint',
    name: 'ESLint',
    publisher: 'Dirk Baeumer',
    version: '2.4.4',
    category: 'Productivity',
    description: 'Integrates ESLint JavaScript/TypeScript static analysis with real-time diagnostic squiggles and quick fixes.',
    iconBg: '#4b32c3',
    iconSymbol: '🛡️',
    downloads: '12.8M',
    rating: 4.9,
    tags: ['linter', 'eslint', 'javascript', 'typescript', 'code-quality'],
    readme: `# ESLint for Xivig
Integrates ESLint rules into the CodeMirror editor. Flags unused variables, debugger statements, non-strict equalities, and extra semicolons with instant auto-fix actions.`,
  },
  {
    id: 'xivig-tool-editorconfig',
    name: 'EditorConfig',
    publisher: 'EditorConfig',
    version: '1.2.0',
    category: 'Productivity',
    description: 'Maintains consistent coding styles across teams and editors by parsing .editorconfig files.',
    iconBg: '#c97800',
    iconSymbol: '⚙️',
    downloads: '5.6M',
    rating: 4.8,
    tags: ['editorconfig', 'indent', 'whitespace', 'formatting'],
    readme: `# EditorConfig for Xivig
Automatically detects and enforces \`.editorconfig\` properties:
- \`indent_style\`: space / tab
- \`indent_size\`: 2 / 4 / 8
- \`end_of_line\`: lf / crlf
- \`trim_trailing_whitespace\`: true / false
- \`insert_final_newline\`: true / false`,
  },
  {
    id: 'xivig-tool-error-lens',
    name: 'Error Lens',
    publisher: 'Alexander',
    version: '3.6.0',
    category: 'Productivity',
    description: 'Supercharge language diagnostics with inline error callout badges rendered right at the end of faulty lines.',
    iconBg: '#ea5455',
    iconSymbol: '🔍',
    downloads: '4.2M',
    rating: 5.0,
    tags: ['diagnostics', 'error-lens', 'inline-errors', 'linter'],
    readme: `# Error Lens for Xivig
Displays diagnostic messages inline directly beside the line of code. Color-coded error red, warning amber, and info cyan callouts make debugging instantaneous.`,
  },
  {
    id: 'xivig-tool-spellchecker',
    name: 'Code Spell Checker',
    publisher: 'Street Side Software',
    version: '4.0.0',
    category: 'Productivity',
    description: 'A basic spelling checker that catches typos in camelCase, snake_case, strings, and comments.',
    iconBg: '#15803d',
    iconSymbol: '🔤',
    downloads: '8.9M',
    rating: 4.9,
    tags: ['spell-check', 'typos', 'dictionary', 'comments'],
    readme: `# Code Spell Checker for Xivig
Detects spelling errors in source code across variables, functions, strings, and comments without getting in your way. Includes instant "Add to dictionary" actions.`,
  },
  {
    id: 'xivig-tool-path-intellisense',
    name: 'Path Intellisense',
    publisher: 'Christian Kohler',
    version: '2.9.0',
    category: 'Productivity',
    description: 'Visual Studio Code autocompletion plugin that auto-completes filenames and directories.',
    iconBg: '#0284c7',
    iconSymbol: '📁',
    downloads: '7.1M',
    rating: 4.8,
    tags: ['path', 'autocomplete', 'imports', 'intellisense'],
    readme: `# Path Intellisense for Xivig
Auto-completes filenames and directory paths in import statements, require calls, and HTML src/href attributes.`,
  },
  {
    id: 'xivig-tool-auto-rename-tag',
    name: 'Auto Rename Tag',
    publisher: 'Jun Han',
    version: '1.4.0',
    category: 'Productivity',
    description: 'Auto rename paired HTML/XML tag simultaneously when changing opening or closing tag.',
    iconBg: '#f97316',
    iconSymbol: '🏷️',
    downloads: '9.3M',
    rating: 4.8,
    tags: ['html', 'xml', 'tags', 'auto-rename'],
    readme: `# Auto Rename Tag for Xivig
When you rename an opening HTML/XML tag, the matching closing tag automatically and synchronously renames itself!`,
  },
  {
    id: 'xivig-tool-auto-close-tag',
    name: 'Auto Close Tag',
    publisher: 'Jun Han',
    version: '0.5.15',
    category: 'Productivity',
    description: 'Automatically add HTML/XML close tag, same as Visual Studio IDE or Sublime Text does.',
    iconBg: '#10b981',
    iconSymbol: '🔒',
    downloads: '9.8M',
    rating: 4.9,
    tags: ['html', 'xml', 'tags', 'auto-close'],
    readme: `# Auto Close Tag for Xivig
Automatically inserts matching closing tags when you type \`>\` after opening tags in HTML, XML, and JSX files.`,
  },
  {
    id: 'xivig-tool-better-comments',
    name: 'Better Comments',
    publisher: 'Aaron Bond',
    version: '3.0.2',
    category: 'Productivity',
    description: 'Create more human-friendly comments in your code by categorizing annotations into alerts, queries, todos, and highlights.',
    iconBg: '#8b5cf6',
    iconSymbol: '💬',
    downloads: '5.4M',
    rating: 4.9,
    tags: ['comments', 'better-comments', 'highlights', 'todo'],
    readme: `# Better Comments for Xivig
Categorize your comments with syntax-colored annotations:
- \`// ! Alert message\` (Red alert)
- \`// ? Query or question\` (Cyan query)
- \`// * Highlighted point\` (Green highlight)
- \`// TODO Pending item\` (Orange todo)
- \`// // Deprecated / strikethrough\` (Muted strikethrough)`,
  },
  {
    id: 'xivig-tool-todo-tree',
    name: 'Todo Tree',
    publisher: 'Gruntfuggly',
    version: '0.22.0',
    category: 'Productivity',
    description: 'Quickly search your workspace for comment tags like TODO and FIXME, and see them in a tree view.',
    iconBg: '#f59e0b',
    iconSymbol: '🌲',
    downloads: '4.8M',
    rating: 4.9,
    tags: ['todo', 'todo-tree', 'fixme', 'bug', 'tasks'],
    readme: `# Todo Tree for Xivig
Scans your document and workspace for \`TODO\`, \`FIXME\`, \`BUG\`, \`HACK\`, and \`NOTE\` tags with one-click line jumps.`,
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

  // --- GIT & VERSION CONTROL ---
  {
    id: 'xivig-tool-gitlens',
    name: 'GitLens — Git supercharged',
    publisher: 'GitKraken',
    version: '15.0.0',
    category: 'Productivity',
    description: 'Supercharge Git in Xivig: current-line blame, authorship annotations, commit details, and seamless revision navigation.',
    iconBg: '#0f766e',
    iconSymbol: '🔭',
    downloads: '28.4M',
    rating: 5.0,
    tags: ['git', 'gitlens', 'blame', 'version-control', 'authorship'],
    readme: `# GitLens for Xivig
Unpack the story behind every line of code:
- **Current Line Blame**: Faint authorship and commit message annotation at the end of the line you are currently editing.
- **Commit Details**: Quick jump to commit hashes and author timestamps.
- **Heatmap & Gutter**: Visual age and change indicators.`,
  },
  {
    id: 'xivig-tool-git-graph',
    name: 'Git Graph',
    publisher: 'mhutchie',
    version: '1.30.0',
    category: 'Productivity',
    description: 'View a Git Graph of your repository and easily perform Git actions right from the visual graph.',
    iconBg: '#f97316',
    iconSymbol: '📊',
    downloads: '11.5M',
    rating: 4.9,
    tags: ['git', 'git-graph', 'branches', 'visual', 'history'],
    readme: `# Git Graph for Xivig
A visual topological graph of your repository:
- Multi-lane branch visualization with merge nodes and commit dots.
- Tag markers and active HEAD indicators.
- Instant checkout, merge, rebase, and branch creation actions.`,
  },
  {
    id: 'xivig-tool-git-history',
    name: 'Git History',
    publisher: 'Don Jayamanne',
    version: '0.6.20',
    category: 'Productivity',
    description: 'View git log, file history, and compare branches or commits side by side.',
    iconBg: '#e11d48',
    iconSymbol: '📜',
    downloads: '9.2M',
    rating: 4.8,
    tags: ['git', 'history', 'diff', 'log', 'timeline'],
    readme: `# Git History for Xivig
Inspect the evolution of individual files or the whole project:
- File-specific commit timeline with author, date, and commit message.
- Side-by-side or unified diff comparison between any two revisions.`,
  },
  {
    id: 'xivig-tool-github-prs',
    name: 'GitHub Pull Requests and Issues',
    publisher: 'GitHub',
    version: '0.84.0',
    category: 'Productivity',
    description: 'Enables reviewing and managing GitHub pull requests and issues directly from within Xivig.',
    iconBg: '#24292f',
    iconSymbol: '🐙',
    downloads: '16.7M',
    rating: 4.9,
    tags: ['github', 'pull-requests', 'issues', 'collaboration'],
    readme: `# GitHub Pull Requests and Issues for Xivig
Work with GitHub PRs and issues without leaving your editor:
- Auto-detects remote GitHub repository URL.
- Lists open PRs and issues with labels, author, and review status.
- Direct links to web reviews and branch checkout.`,
  },
  {
    id: 'xivig-tool-copilot',
    name: 'GitHub Copilot',
    publisher: 'GitHub',
    version: '1.180.0',
    category: 'Productivity',
    description: 'Your AI pair programmer: inline ghost-text code completions with Tab accept and intelligent multi-line suggestions.',
    iconBg: '#1f242c',
    iconSymbol: '🤖',
    downloads: '21.0M',
    rating: 4.9,
    tags: ['ai', 'copilot', 'ghost-text', 'code-completion', 'llm'],
    readme: `# GitHub Copilot for Xivig
AI-powered coding velocity right at your fingertips:
- **Ghost Text Suggestions**: Context-aware code completions appear ahead of your cursor in subtle italic gray.
- **Tab to Accept**: Press \`Tab\` to accept the suggested completion instantly.
- **Escape to Dismiss**: Press \`Escape\` to reject or dismiss.`,
  },

  // --- AI DEVELOPMENT ---
  {
    id: 'xivig-tool-copilot-chat',
    name: 'GitHub Copilot Chat',
    publisher: 'GitHub',
    version: '0.14.0',
    category: 'Productivity',
    description: 'AI chat companion: ask questions about your codebase, write unit tests, explain code, and run slash commands.',
    iconBg: '#1f242c',
    iconSymbol: '💬',
    downloads: '18.2M',
    rating: 4.9,
    tags: ['ai', 'copilot', 'chat', 'slash-commands', 'refactor'],
    readme: `# GitHub Copilot Chat for Xivig
Have conversations with your code:
- \`/explain\`: Understand how complex functions or classes work.
- \`/tests\`: Generate complete, runnable unit test suites.
- \`/fix\`: Propose bug fixes and resolve anti-patterns.
- \`/doc\`: Add comprehensive docstrings and comments.`,
  },
  {
    id: 'xivig-tool-codeium',
    name: 'Codeium: Free AI Code Completion & Chat',
    publisher: 'Codeium',
    version: '1.8.0',
    category: 'Productivity',
    description: 'Ultra-fast, free multi-language code completion, docstring generation, and in-editor chat assistance.',
    iconBg: '#09b6a2',
    iconSymbol: '⚡',
    downloads: '7.8M',
    rating: 4.9,
    tags: ['ai', 'codeium', 'completion', 'docstring', 'free'],
    readme: `# Codeium for Xivig
Modern free AI developer assistant:
- Lightning-fast inline completions with smart caching.
- JSDoc, Python docstring, and PHPDoc generator.
- Multi-language autocompletion support.`,
  },
  {
    id: 'xivig-tool-continue',
    name: 'Continue — Open-source Autopilot',
    publisher: 'Continue',
    version: '0.8.0',
    category: 'Productivity',
    description: 'Open-source autopilot extension connecting local models (Ollama, LM Studio) and cloud models with custom @context.',
    iconBg: '#ff6b4a',
    iconSymbol: '⏩',
    downloads: '3.4M',
    rating: 4.8,
    tags: ['ai', 'continue', 'ollama', 'local-ai', 'privacy'],
    readme: `# Continue for Xivig
Bring your own models (local Ollama or cloud LLMs):
- Custom context providers: \`@file:\`, \`@code:\`, \`@terminal:\`.
- Complete privacy mode: run air-gapped without external requests.
- Full code refactoring and diff review.`,
  },
  {
    id: 'xivig-tool-tabnine',
    name: 'Tabnine AI: Whole-line & Full-function Completions',
    publisher: 'Tabnine',
    version: '3.120.0',
    category: 'Productivity',
    description: 'AI code completion engine with local air-gapped prediction mode, zero code sharing, and whole-line completions.',
    iconBg: '#172b4d',
    iconSymbol: '🔮',
    downloads: '9.6M',
    rating: 4.8,
    tags: ['ai', 'tabnine', 'whole-line', 'prediction', 'local-mode'],
    readme: `# Tabnine for Xivig
Whole-line code completion tuned for developer productivity:
- Predicts lines of code before you finish typing.
- 100% private local execution mode.
- Context-driven identifier and method suggestions.`,
  },
  {
    id: 'xivig-tool-amazon-q',
    name: 'Amazon Q Developer',
    publisher: 'Amazon Web Services',
    version: '1.24.0',
    category: 'Productivity',
    description: 'Generative AI assistant for software development with built-in code security vulnerability scanning.',
    iconBg: '#232f3e',
    iconSymbol: '☁️',
    downloads: '5.1M',
    rating: 4.8,
    tags: ['ai', 'amazon-q', 'aws', 'security-scan', 'cdk'],
    readme: `# Amazon Q Developer for Xivig
Generative AI and security intelligence from AWS:
- Automated code vulnerability scanning (hardcoded secrets, SQL injection, eval).
- AWS CDK and Cloud SDK templates and completions.
- Code modernization recommendations.`,
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
  // --- Category 4: Web Development ---
  {
    id: 'xivig-tool-live-server',
    name: 'Live Server',
    publisher: 'Ritwick Dey',
    version: '5.7.9',
    category: 'Productivity',
    description: 'Launch a local development server with live reload feature for static & dynamic pages.',
    iconBg: '#9353d3',
    iconSymbol: '📡',
    downloads: '42.8M',
    rating: 4.8,
    tags: ['live-server', 'server', 'http', 'live-reload', 'web'],
    readme: `# Live Server for Xivig
Launch a fast, local development server with real-time automatic browser reload:
- Automatic detection of workspace root and active documents.
- Instant reload upon saving HTML, CSS, JS, and image assets.
- Live status bar indicator and port configurability.`,
  },
  {
    id: 'xivig-tool-live-preview',
    name: 'Live Preview',
    publisher: 'Microsoft',
    version: '0.4.14',
    category: 'Productivity',
    description: 'Split-pane in-editor live preview with device emulation presets (iPhone 14, Pixel 7, iPad Air, Desktop HD).',
    iconBg: '#0e70c0',
    iconSymbol: '📱',
    downloads: '6.4M',
    rating: 4.9,
    tags: ['live-preview', 'split-pane', 'responsive', 'device-emulation', 'inspector'],
    readme: `# Live Preview for Xivig
Integrated side-by-side browser preview embedded right in your editor:
- Device emulation presets: iPhone 14, Pixel 7, iPad Air, MacBook, Full HD Desktop.
- Orientation toggling and zoom scaling (25% to 200%).
- Real-time console log streaming and visual element boundary inspector.`,
  },
  {
    id: 'xivig-tool-html-css-support',
    name: 'HTML CSS Support',
    publisher: 'ecmel',
    version: '2.0.12',
    category: 'Languages',
    description: 'CSS class and id attribute completion scraped across workspace CSS and HTML files.',
    iconBg: '#e44d26',
    iconSymbol: '🌐',
    downloads: '16.9M',
    rating: 4.7,
    tags: ['html', 'css', 'class-completion', 'id-completion', 'scraper'],
    readme: `# HTML CSS Support for Xivig
Missing autocompletion for HTML classes and IDs resolved:
- Indexes CSS class and ID selectors across all workspace stylesheets.
- Autocompletes class and id attributes inside HTML, JSX, TSX, Vue, and Blade files.
- Displays origin stylesheet and rule body previews.`,
  },
  {
    id: 'xivig-tool-css-peek',
    name: 'CSS Peek',
    publisher: 'Pranay Prakash',
    version: '2.2.4',
    category: 'Productivity',
    description: 'Jump to CSS selector definition from HTML classes and ids (F12 / Ctrl+Click).',
    iconBg: '#264de4',
    iconSymbol: '👁️',
    downloads: '4.8M',
    rating: 4.8,
    tags: ['css-peek', 'jump-to-definition', 'f12', 'hover', 'css'],
    readme: `# CSS Peek for Xivig
Instant definition peek and navigation for CSS classes and IDs:
- Jump to matching CSS rule declarations using F12 or Ctrl+Click.
- Hover preview reveals full CSS rules directly from HTML markup.
- Multi-file stylesheet scanning and accurate line/column positioning.`,
  },
  {
    id: 'xivig-tool-css-class-intellisense',
    name: 'IntelliSense for CSS class names',
    publisher: 'Zignd',
    version: '1.20.0',
    category: 'Languages',
    description: 'CSS class completions with specificity scoring (a, b, c) and conflict resolution.',
    iconBg: '#42a5f5',
    iconSymbol: '🎯',
    downloads: '9.2M',
    rating: 4.8,
    tags: ['css', 'specificity', 'intellisense', 'class-names', 'conflict-resolution'],
    readme: `# IntelliSense for CSS class names in Xivig
Advanced class completions with real-time specificity metrics:
- Computes W3C specificity vectors (IDs, classes/attributes/pseudos, types/elements).
- Ranks conflicting selector precedence and badges completion suggestions.
- Clear specificity category badges: LOW, MEDIUM, HIGH, ULTRA.`,
  },
  {
    id: 'xivig-tool-tailwindcss-intellisense',
    name: 'Tailwind CSS IntelliSense',
    publisher: 'Tailwind Labs',
    version: '0.12.7',
    category: 'Languages',
    description: 'Intelligent Tailwind CSS utility completions with visual color preview and CSS rule hover expansion.',
    iconBg: '#06b6d4',
    iconSymbol: '🎨',
    downloads: '14.5M',
    rating: 4.9,
    tags: ['tailwind', 'tailwindcss', 'colors', 'hover-preview', 'css-utilities'],
    readme: `# Tailwind CSS IntelliSense for Xivig
Complete Tailwind CSS experience inside Xivig:
- Utility completions for layout, flexbox, grid, spacing, sizing, typography, and borders.
- Hex color swatches directly in completion popup (e.g. bg-blue-500, text-red-500).
- Hover tooltips reveal expanded raw CSS declarations and pixel calculations.`,
  },
  {
    id: 'xivig-tool-bootstrap-intellisense',
    name: 'Bootstrap IntelliSense',
    publisher: 'bootstrap5',
    version: '5.3.0',
    category: 'Languages',
    description: 'Bootstrap 5.3 components, grid utilities, and color modifiers.',
    iconBg: '#7952b3',
    iconSymbol: '🅱️',
    downloads: '3.6M',
    rating: 4.8,
    tags: ['bootstrap', 'bootstrap5', 'grid', 'components', 'utilities'],
    readme: `# Bootstrap IntelliSense for Xivig
Rich intelligence for Bootstrap 5.3:
- Complete grid scope autocompletion (col, row, container, g-3).
- Contextual color classes, badges, alerts, buttons, and card utilities.
- Quick starter snippets (bs5-template, bs5-navbar, bs5-card, bs5-grid-3col, bs5-modal).`,
  },
  {
    id: 'xivig-tool-svg-viewer',
    name: 'SVG Viewer & Sanitizer',
    publisher: 'cssho',
    version: '2.8.6',
    category: 'Productivity',
    description: 'Visual SVG preview, metadata inspector (viewBox, path count, color palette), and XSS sanitizer.',
    iconBg: '#ffb300',
    iconSymbol: '📐',
    downloads: '2.1M',
    rating: 4.9,
    tags: ['svg', 'viewer', 'preview', 'sanitizer', 'xss-protection', 'icons'],
    readme: `# SVG Viewer & Sanitizer for Xivig
View, inspect, and secure SVG assets with confidence:
- Deep sanitization eliminates embedded script tags, external links, and inline handlers.
- Metadata extractor surfaces dimensions, viewBox, path counts, and unique color palettes.
- Production-ready SVG minifier and data URI generator.`,
  },
  // --- Category 5: JavaScript / TypeScript ---
  {
    id: 'xivig-tool-js-snippets',
    name: 'JavaScript (ES6) code snippets',
    publisher: 'charalampos karypidis',
    version: '1.8.0',
    category: 'Languages',
    description: 'Code snippets for JavaScript in ES6 syntax (supporting JavaScript and TypeScript).',
    iconBg: '#f7df1e',
    iconSymbol: '⚡',
    downloads: '15.4M',
    rating: 4.8,
    tags: ['javascript', 'typescript', 'es6', 'snippets', 'productivity'],
    readme: `# JavaScript (ES6) Code Snippets for Xivig
High-velocity ES6+ snippet triggers:
- \`clg\`: \`console.log('val', val);\`
- \`clo\`: \`console.log('val', JSON.stringify(val, null, 2));\`
- \`fn\` / \`afn\` / \`asyncfn\`: Arrow functions and promises
- \`im\` / \`imd\`: Default and destructuring imports
- \`fe\` / \`map\` / \`filter\` / \`reduce\`: Array operations`,
  },
  {
    id: 'xivig-tool-typescript-hero',
    name: 'TypeScript Hero',
    publisher: 'buehler',
    version: '3.0.0',
    category: 'Languages',
    description: 'Automates import sorting, organizing, specifier deduplication, and TypeScript export outlines.',
    iconBg: '#3178c6',
    iconSymbol: '🦸',
    downloads: '2.8M',
    rating: 4.8,
    tags: ['typescript', 'imports', 'organize-imports', 'outline', 'sorting'],
    readme: `# TypeScript Hero for Xivig
Supercharge your TypeScript and JavaScript development:
- 4-Tier standard import grouping (Node built-in, external npm, alias @/, relative).
- Alphabetical import specifier sorting and duplicate removal.
- Symbol outline extractor for exported functions, interfaces, types, and classes.`,
  },
  {
    id: 'xivig-tool-npm-intellisense',
    name: 'npm Intellisense',
    publisher: 'Christian Kohler',
    version: '1.4.5',
    category: 'Languages',
    description: 'Autocompletes npm modules in import and require statements from package.json.',
    iconBg: '#cb3837',
    iconSymbol: '📦',
    downloads: '8.7M',
    rating: 4.8,
    tags: ['npm', 'import', 'modules', 'intellisense', 'package.json'],
    readme: `# npm Intellisense for Xivig
Instant autocompletion for npm modules in your code:
- Scans \`package.json\` dependencies and devDependencies automatically.
- Sub-path autocompletions (e.g. \`react-dom/client\`, \`lodash/debounce\`, \`@codemirror/state\`).
- Seamless support inside ES6 \`import\` and CommonJS \`require()\`.`,
  },
  {
    id: 'xivig-tool-import-cost',
    name: 'Import Cost',
    publisher: 'Wix',
    version: '3.3.0',
    category: 'Productivity',
    description: 'Displays the size of imported npm packages inline inside the editor with gzip breakdown.',
    iconBg: '#2b5c8f',
    iconSymbol: '⚖️',
    downloads: '3.9M',
    rating: 4.9,
    tags: ['import-cost', 'bundle-size', 'gzip', 'performance', 'webpack'],
    readme: `# Import Cost for Xivig
Live inline package bundle size indicators:
- Calculates uncompressed and gzip bundle sizes as you import libraries.
- Color-coded threshold badges: small (<15kB), medium (<50kB), large (>=50kB).
- Built-in benchmarks for React, CodeMirror, Lodash, Axios, and ecosystem packages.`,
  },
  {
    id: 'xivig-tool-turbo-console-log',
    name: 'Turbo Console Log',
    publisher: 'Chakroun Anas',
    version: '2.9.2',
    category: 'Productivity',
    description: 'Automates creating meaningful console.log messages with file name, line numbers, and cleanup actions.',
    iconBg: '#ff6f00',
    iconSymbol: '🚀',
    downloads: '2.4M',
    rating: 4.9,
    tags: ['turbo-console-log', 'console.log', 'debugging', 'productivity'],
    readme: `# Turbo Console Log for Xivig
Effortless, meaningful debug logging:
- Generates contextual log: \`console.log('🚀 ~ file: App.tsx:42 ~ count:', count);\`
- Batch comment and uncomment all turbo logs with a single command.
- Quick delete command to clean up debugging logs before committing.`,
  },
  {
    id: 'xivig-tool-jest',
    name: 'Jest',
    publisher: 'Orta',
    version: '6.4.0',
    category: 'Productivity',
    description: 'The optimal flow for Jest test suites with test case discovery, runner commands, and snapshots.',
    iconBg: '#c21325',
    iconSymbol: '🃏',
    downloads: '4.6M',
    rating: 4.7,
    tags: ['jest', 'testing', 'unit-tests', 'snapshots', 'coverage'],
    readme: `# Jest for Xivig
Seamless Jest integration for unit testing:
- Automatic test file and block discovery (\`describe\`, \`it\`, \`test\`).
- CLI runner command generator with snapshot update (\`-u\`) and coverage flags.
- Distinguishes skipped and isolated test executions.`,
  },
  {
    id: 'xivig-tool-vitest-explorer',
    name: 'Vitest Explorer',
    publisher: 'Zixuan Chen',
    version: '1.2.1',
    category: 'Productivity',
    description: 'First-class Vitest explorer with hierarchical test tree navigation, watch runner, and status reporting.',
    iconBg: '#729b1b',
    iconSymbol: '⚡',
    downloads: '1.8M',
    rating: 4.9,
    tags: ['vitest', 'explorer', 'test-tree', 'watch-mode', 'unit-tests'],
    readme: `# Vitest Explorer for Xivig
Native Vitest test tree explorer:
- Hierarchical tree representation of test files, describe suites, and individual test cases.
- Configurable test patterns and single-test execution commands.
- JSON test report parsing with pass/fail counts and execution duration metrics.`,
  },
  // --- Category 6: React Development ---
  {
    id: 'xivig-tool-es7-react-redux',
    name: 'ES7+ React/Redux/React-Native snippets',
    publisher: 'rodrigovallades',
    version: '4.4.3',
    category: 'Languages',
    description: 'Extensions for React, Redux and React Native in JS/TS with ES7+ syntax and hooks.',
    iconBg: '#00d8ff',
    iconSymbol: '⚛️',
    downloads: '18.9M',
    rating: 4.9,
    tags: ['react', 'redux', 'react-native', 'snippets', 'hooks'],
    readme: `# ES7+ React/Redux Snippets for Xivig
Rapid scaffolding for modern React components, hooks, and Redux slices:
- \`rafce\`: Arrow function component with named and default export
- \`rfc\` / \`rfce\`: Functional components with export
- \`useS\` / \`useE\` / \`useC\` / \`useM\` / \`useR\`: Core React hooks
- \`rxslice\`: Redux Toolkit createSlice template`,
  },
  {
    id: 'xivig-tool-simple-react-snippets',
    name: 'Simple React Snippets',
    publisher: 'Burke Holland',
    version: '1.2.8',
    category: 'Languages',
    description: 'Essential React code snippets including quick imports, prop types, and component scaffolds.',
    iconBg: '#61dafb',
    iconSymbol: '⚛️',
    downloads: '5.2M',
    rating: 4.8,
    tags: ['react', 'snippets', 'proptypes', 'imports'],
    readme: `# Simple React Snippets for Xivig
Minimal and fast React snippets by Burke Holland:
- Quick imports: \`imr\`, \`imrs\`, \`imrse\`, \`imrd\`
- PropTypes shortcuts: \`pts\`, \`ptn\`, \`ptb\`, \`ptf\`, \`pta\`, \`pto\`
- Component with children: \`fcc\``,
  },
  {
    id: 'xivig-tool-react-native-tools',
    name: 'React Native Tools',
    publisher: 'Microsoft',
    version: '1.14.0',
    category: 'Productivity',
    description: 'Mobile development tools, component snippets, and Metro packager workflows for React Native.',
    iconBg: '#20232a',
    iconSymbol: '📱',
    downloads: '3.1M',
    rating: 4.7,
    tags: ['react-native', 'mobile', 'ios', 'android', 'metro'],
    readme: `# React Native Tools for Xivig
Tools and snippets for mobile engineering:
- Quick component scaffolding: \`rn-screen\`, \`rn-stylesheet\`, \`rn-flatlist\`, \`rn-touchable\`
- CLI runner commands: run-android, run-ios, expo-start
- Safe area, layout and platform dimension helpers`,
  },
  {
    id: 'xivig-tool-styled-components',
    name: 'vscode-styled-components',
    publisher: 'styled-components',
    version: '1.7.8',
    category: 'Languages',
    description: 'Syntax highlighting, CSS validation, and template literal intelligence for styled-components.',
    iconBg: '#db7093',
    iconSymbol: '💅',
    downloads: '5.8M',
    rating: 4.9,
    tags: ['styled-components', 'css-in-js', 'css', 'styled', 'template-literals'],
    readme: `# styled-components for Xivig
First-class CSS-in-JS intelligence:
- Tagged template literals for div, button, section, input, etc.
- Props and theme interpolation helpers (\`\${(props) => ...}\`)
- CSS bracket and expression validation inside template strings`,
  },
  // --- Category 7: Laravel / PHP Development ---
  {
    id: 'xivig-tool-intelephense',
    name: 'PHP Intelephense',
    publisher: 'Ben Mewburn',
    version: '1.12.5',
    category: 'Languages',
    description: 'PHP code intelligence with detailed symbol indexing, diagnostics, and type inference.',
    iconBg: '#474a8a',
    iconSymbol: '🐘',
    downloads: '14.2M',
    rating: 4.9,
    tags: ['php', 'intelephense', 'intellisense', 'diagnostics', 'types'],
    readme: `# PHP Intelephense for Xivig
High performance PHP code intelligence:
- Detailed symbol indexing and fast jump to definition.
- Real-time syntax and type diagnostics.
- PHPDoc type inference and signature help.`,
  },
  {
    id: 'xivig-tool-laravel-extension-pack',
    name: 'Laravel Extension Pack',
    publisher: 'Winnie Lin',
    version: '1.4.0',
    category: 'Productivity',
    description: 'All essential Laravel developer tools bundled for rapid modern web engineering in Xivig.',
    iconBg: '#ff2d20',
    iconSymbol: '⚡',
    downloads: '3.4M',
    rating: 4.9,
    tags: ['laravel', 'extension-pack', 'bundle', 'artisan', 'blade'],
    readme: `# Laravel Extension Pack for Xivig
The definitive Laravel developer bundle:
- Integrates Intelephense, Blade Snippets, Artisan, Extra Intellisense, and Goto Controller.
- Everything needed for production Laravel 11/12 and Livewire engineering.`,
  },
  {
    id: 'xivig-tool-blade-snippets',
    name: 'Laravel Blade Snippets',
    publisher: 'Winnie Lin',
    version: '1.4.1',
    category: 'Languages',
    description: 'Blade layout tags, conditional directives, sections, components, and Livewire helpers.',
    iconBg: '#f05340',
    iconSymbol: '🔪',
    downloads: '6.7M',
    rating: 4.9,
    tags: ['blade', 'laravel', 'snippets', 'templates', 'livewire'],
    readme: `# Laravel Blade Snippets for Xivig
Full coverage for Blade templates:
- Directives: \`@extends\`, \`@section\`, \`@yield\`, \`@component\`, \`@slot\`, \`@push\`, \`@stack\`
- Auth & Gates: \`@auth\`, \`@guest\`, \`@can\`, \`@error\`
- Modern asset helpers: \`@vite\`, \`@livewire\`, \`@csrf\`, \`@method\``,
  },
  {
    id: 'xivig-tool-laravel-artisan',
    name: 'Laravel Artisan',
    publisher: 'Ryan Chandler',
    version: '0.0.30',
    category: 'Productivity',
    description: 'Interactive execution runner and code scaffold palette for Laravel Artisan commands.',
    iconBg: '#ff2d20',
    iconSymbol: '🛠️',
    downloads: '2.5M',
    rating: 4.8,
    tags: ['artisan', 'laravel', 'cli', 'make', 'migrate'],
    readme: `# Laravel Artisan for Xivig
Run Artisan commands directly without leaving your editor:
- Scaffold: \`make:controller\`, \`make:model -mcr\`, \`make:migration\`, \`make:resource\`
- Database: \`migrate\`, \`migrate:fresh --seed\`, \`db:seed\`
- Cache & Queue: \`route:list\`, \`cache:clear\`, \`config:clear\`, \`queue:work\``,
  },
  {
    id: 'xivig-tool-laravel-extra-intellisense',
    name: 'Laravel Extra Intellisense',
    publisher: 'amiralizadeh9480',
    version: '0.6.4',
    category: 'Languages',
    description: 'Autocompletion for routes, views, configs, translations, and env variables.',
    iconBg: '#e3342f',
    iconSymbol: '💡',
    downloads: '2.9M',
    rating: 4.8,
    tags: ['laravel', 'extra-intellisense', 'routes', 'views', 'config'],
    readme: `# Laravel Extra Intellisense for Xivig
Contextual completions for Laravel helpers:
- \`route('...')\`: autocompletes named routes
- \`view('...')\`: autocompletes Blade view templates
- \`config('...')\`: autocompletes application configuration keys
- \`env('...')\`: autocompletes environment variables`,
  },
  {
    id: 'xivig-tool-laravel-goto-controller',
    name: 'Laravel Goto Controller',
    publisher: 'codingyu',
    version: '0.0.12',
    category: 'Productivity',
    description: 'Navigate directly from route definitions to controller classes and methods.',
    iconBg: '#3490dc',
    iconSymbol: '🎯',
    downloads: '1.9M',
    rating: 4.8,
    tags: ['goto-controller', 'laravel', 'routes', 'navigation'],
    readme: `# Laravel Goto Controller for Xivig
Jump from route declarations directly to controller code:
- Supports both tuple array syntax \`[UserController::class, 'index']\` and string syntax \`'UserController@index'\`
- Opens target controller file and jumps to the exact action method.`,
  },
  {
    id: 'xivig-tool-php-namespace-resolver',
    name: 'PHP Namespace Resolver',
    publisher: 'Mehedi Hassan',
    version: '1.1.9',
    category: 'Productivity',
    description: 'Automates PSR-4 namespace calculation, class imports, and use-statement insertion.',
    iconBg: '#6c5ce7',
    iconSymbol: '🏷️',
    downloads: '2.1M',
    rating: 4.8,
    tags: ['php', 'namespace', 'psr-4', 'use-statements', 'import'],
    readme: `# PHP Namespace Resolver for Xivig
Effortless PSR-4 namespace and import resolution:
- Automatically calculates namespace from project directory structure
- Injects \`use ...;\` statements in alphabetical order, avoiding duplicates.`,
  },
  {
    id: 'xivig-tool-php-docblocker',
    name: 'PHP DocBlocker',
    publisher: 'Neil Brayfield',
    version: '3.0.0',
    category: 'Productivity',
    description: 'Generates structured PHPDoc comment blocks from method signatures with types.',
    iconBg: '#2d3436',
    iconSymbol: '📝',
    downloads: '3.6M',
    rating: 4.9,
    tags: ['php', 'docblocker', 'phpdoc', 'types', 'comments'],
    readme: `# PHP DocBlocker for Xivig
Generates accurate PHPDoc comments instantly:
- Automatically parses parameters, default values, and nullable types
- Generates \`@param\` and \`@return\` tags adhering to PSR-19 standards.`,
  },
  {
    id: 'xivig-tool-composer',
    name: 'Composer',
    publisher: 'Heiko Peters',
    version: '0.5.4',
    category: 'Productivity',
    description: 'Run Composer commands, manage dependencies, and dump autoloads directly from Xivig.',
    iconBg: '#885630',
    iconSymbol: '🎻',
    downloads: '1.7M',
    rating: 4.7,
    tags: ['composer', 'php', 'dependencies', 'packagist', 'autoload'],
    readme: `# Composer for Xivig
Complete Composer package manager integration:
- Commands: require, install, update, remove, dump-autoload
- Autocomplete for popular Packagist PHP libraries.`,
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
