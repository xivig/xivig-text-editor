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
