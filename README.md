# Xivig Text Editor ⚡

<p align="center">
  <img src="public/logo.png" alt="Xivig Text Editor" width="96" height="96" style="width: 96px; height: 96px; object-fit: contain;" />
</p>

<p align="center">
  <strong>⚡ Ultra-fast, keyboard-first desktop code editor built for pure velocity — Sublime-grade multi-cursor editing, live web feedback, and pixel-perfect developer tooling.</strong>
</p>

<p align="center">
  <a href="#-key-features"><img src="https://img.shields.io/badge/Release-1.5-6c8cff.svg" alt="Release 1.5" /></a>
  <a href="#-automated-testing--quality-assurance"><img src="https://img.shields.io/badge/Tests-349%20Passed-success.svg" alt="Tests Passed" /></a>
  <a href="#-security-architecture--hardening"><img src="https://img.shields.io/badge/Vulnerabilities-0-brightgreen.svg" alt="0 Vulnerabilities" /></a>
  <a href="#-tech-stack--architecture"><img src="https://img.shields.io/badge/Electron-34-47848f.svg" alt="Electron 34" /></a>
  <a href="#-tech-stack--architecture"><img src="https://img.shields.io/badge/CodeMirror-6-black.svg" alt="CodeMirror 6" /></a>
  <a href="#-tech-stack--architecture"><img src="https://img.shields.io/badge/React-18-61dafb.svg" alt="React 18" /></a>
  <a href="#-tech-stack--architecture"><img src="https://img.shields.io/badge/TypeScript-5.7-blue.svg" alt="TypeScript" /></a>
  <a href="#-legal--attributions"><img src="https://img.shields.io/badge/License-MIT-success.svg" alt="License" /></a>
</p>

---

## 📖 Overview

**Xivig Text Editor** is an ultra-responsive, modern desktop code editor designed for developers who demand speed, elegant typography, powerful multi-cursor editing, and seamless web development tools. Built from the ground up with **CodeMirror 6**, **Electron 45**, **React 18**, and **Vite 6**, Xivig blends the lightning speed of Sublime Text with the intuitive live tooling of modern web IDEs.

For a full step-by-step user manual, check out the [Comprehensive How-To Guide](docs/HOW_TO.md) or read more [About Xivig Text Editor](ABOUT.md).

---

## 📥 Downloads & Releases

Download the official release binaries for your operating system:

| Platform | Format | Direct Download Link | Description |
|---|---|---|---|
| **Windows** | `.exe` (Installer) | [**Download Setup (v1.5.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.5.0/Xivig.Text.Editor.Setup.1.5.0.exe) | NSIS Installer with desktop and start menu shortcuts |
| **Windows** | `.exe` (Portable) | [**Download Portable (v1.5.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.5.0/Xivig.Text.Editor.1.5.0.exe) | Zero-install standalone executable |
| **macOS** | `.dmg` (Universal) | [**Download DMG (v1.5.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.5.0/Xivig-Text-Editor-1.5.0.dmg) | macOS Disk Image (Universal: Apple Silicon & Intel) |
| **macOS** | `.zip` (Universal) | [**Download macOS Bundle (v1.5.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.5.0/Xivig-Text-Editor-1.5.0-mac.zip) | Native macOS `.app` bundle (Universal binary) |
| **Linux** | `.AppImage` (x64) | [**Download AppImage (v1.5.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.5.0/Xivig-Text-Editor-1.5.0.AppImage) | Standalone Linux x64 AppImage |
| **Linux** | `.deb` (x64) | [**Download DEB (v1.5.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.5.0/xivig-text-editor_1.5.0_amd64.deb) | Debian / Ubuntu amd64 package |
| **Linux** | `.tar.gz` (x64) | [**Download tar.gz (v1.5.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.5.0/Xivig-Text-Editor-1.5.0-linux-x64.tar.gz) | Standalone Linux x64 binary archive |
| **Linux** | `.zip` (x64) | [**Download zip (v1.5.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.5.0/Xivig-Text-Editor-1.5.0-linux-x64.zip) | Standalone Linux x64 zip bundle |

> All releases, release notes, and SHA-256 checksums are hosted on the [GitHub Releases Page](https://github.com/xivig/xivig-text-editor/releases).

---

## ✨ Key Features

### 🧠 Language Server Protocol (LSP) Intelligence (New in v1.5.0)
- **Full JSON-RPC 2.0 LSP Client**: Standards-compliant Language Server Protocol client communicating over stdio or IPC with language servers (TypeScript, Rust, Python, Go, C++, PHP, and HTML/CSS).
- **Real-Time Code Diagnostics**: Inline squiggly underlines for errors, warnings, information, and hints, synchronized live with the bottom Problems drawer.
- **Rich Hover Documentation**: Rich Markdown hover tooltips displaying symbol definitions, documentation, and type signatures.
- **Parameter Signature Help**: Active parameter guidance and overload documentation as you type function arguments.
- **Code Actions & Quick Fixes (`Ctrl+.`)**: Server-driven automated fixes, refactorings, and missing import insertions.
- **Inlay Hints & CodeLens**: Inline parameter name hints, inferred return types, and actionable reference counts above symbols.
- **Semantic Tokens Highlighting**: Granular semantic token classification enabling rich syntax highlighting beyond regex grammar limitations.
- **Symbol Navigation**: Jump to Definition (`F12`), Declaration (`Ctrl+F12`), Type Definition, Implementation, and Find References (`Shift+F12`).

### 🐞 Interactive Debugger (DAP) (New in v1.5.0)
- **Debug Adapter Protocol Support**: Full DAP client architecture for debugging Node.js, Python, Rust, and C/C++ applications.
- **Gutter Breakpoints**: Click-to-toggle gutter breakpoints with support for conditional expressions, hit counts, and logpoints.
- **Execution Stepping & Controls**:
  - **Continue / Pause (`F5`)**
  - **Step Over (`F10`)**
  - **Step Into (`F11`)**
  - **Step Out (`Shift+F11`)**
  - **Restart (`Ctrl+Shift+F5`)** & **Stop (`Shift+F5`)**
- **Call Stack & Thread Inspector**: Multi-thread call stack navigation with active frame highlighting and source file jumps.
- **Scoped Variables Tree**: Collapsible variables inspection across Local, Closure, and Global scopes with real-time value evaluation.
- **Watch Expressions & Debug REPL**: Custom watch expression monitor and integrated interactive Debug Console.

### ⌨️ Vim Mode & Productivity Suite (Phase 7)
- **Vim Modal Editing**: Full-featured modal editing supporting **Normal**, **Insert**, **Visual**, and **Visual Line** modes:
  - Classic motions: `h`, `j`, `k`, `l`, `w`, `b`, `e`, `0`, `$`, `gg`, `G`, `f`, `t`.
  - Rich text objects: `iw`, `i"`, `i'`, `i(`, `i[`, `i{`.
  - Vim registers: Named registers (`"a`), clipboard register (`"+`), and unnamed register.
  - Ex command line: `:w`, `:q`, `:wq`, `:x`, and substitute `:s/find/replace/g`.
- **Keystroke Macros**: Record custom keystroke sequences with `Ctrl+Shift+R` and execute macro playback instantly.
- **Custom Keymaps & Shortcuts**: Fully configurable keybindings system with user overrides and conflict prevention.
- **Sticky Scroll Scope**: Pins the enclosing class, method, function, or block header at the top of the viewport during scrolling.
- **AI Coding Companion Panel**: Embedded AI assistant supporting OpenAI and local Ollama models for code explanation, refactoring, unit test generation, and diff preview with one-click insertion.
- **Universal Dev Toolbox (`Ctrl+Alt+T`)**: Integrated utility drawer featuring JSON Studio, Regex Workbench, Base64/URL Codecs, SHA-256 Hasher, UUID v4 Generator, Format Converters, Persistent Scratchpad, and Clipboard History.

### 🌐 Web Development Toolkit (New in v1.5.0)
- **Static HTML Validator & Linter**: In-editor analysis for HTML structure, unclosed tags, void closing elements, and deprecated markup.
- **Accessibility (a11y) & SEO Audit**:
  - Validates `<img>` alt tags, empty buttons/links without accessible names (`aria-label`), and duplicate ID collisions.
  - Checks `<title>`, meta description, viewport `<meta name="viewport">`, and OpenGraph social preview tags.
- **Hierarchical DOM Outline**: Instant tree view of HTML tags, element IDs, and CSS classes with one-click line jumps.
- **CSS Specificity Inspector**: Real-time `(a, b, c)` specificity scoring across IDs, classes, attributes, pseudo-classes, and type selectors.
- **CSS Variable & Class Navigator**: Discover and inspect custom properties (`--var`) and class selectors with source line numbers.
- **CSS Selector Validator**: Immediate syntax checking preventing malformed selectors or unclosed brackets.
- **Visual CSS Studio Modal**:
  - **Flexbox Helper**: Visual direction, justify, align, wrap, and gap controls with live preview and "Insert into Editor".
  - **CSS Grid Helper**: Visual column/row template builder with gap settings and CSS generation.
  - **Gradient Studio**: Interactive linear and radial gradient builder with color stops and angle manipulation.
  - **Animation Previewer**: Keyframe animation previewer for pulse, bounce, slide, spin, and shake.
- **Advanced Live Web Preview**:
  - **Responsive Device Presets**: Switch between *Responsive*, *iPhone 14*, *Pixel 7*, *iPad Air*, and *Desktop HD*.
  - **Viewport Controls**: One-click Portrait/Landscape rotation and Zoom scaling (50% to 200%).
  - **Inspect Element Mode**: Visual bounding boxes, element tags, classes, dimensions, and computed styles on hover.
  - **Live Browser Console**: Integrated console logger with error/warning filtering.

### 📝 Markdown & Documentation Studio (New in v1.5.0)
- **GitHub Flavored Markdown (GFM)**: Tables, strikethrough, autolinks, syntax-highlighted code blocks, and YAML frontmatter metadata cards.
- **Interactive Two-Way Task Lists**: Interactive checkboxes `[ ]` / `[x]` in preview write back directly to the source markdown document!
- **Math Equations**: Seamless KaTeX-compatible inline math (`$E=mc^2$`) and block equations (`$$...$$`).
- **Mermaid Diagram Engine**: SVG flowchart and sequence diagram renderer with node cards, connecting arrows, and labels.
- **Live Synchronized Proportional Scrolling**: Bidirectional scroll tracking with line-anchored mapping between editor and preview.
- **Table of Contents & Anchors**: Automatic TOC generation with heading anchors (`#slug`) and jump links.
- **Markdown Table Generator Modal**: Visual table editor to add/remove rows, columns, and configure alignments.
- **Document Exporter**: One-click export to standalone styled HTML documents and native Print to PDF.

### 🛡️ Isolated Extension Host & Marketplace (New in v1.5.0)
- **Capability-Based Permission Sandbox**: Third-party extensions run within isolated execution boundaries with granular permissions (`workspace.read`, `workspace.write`, `ui.notifications`, `ui.statusbar`, `commands.register`, `network.fetch`).
- **Secure Sandboxed Commands**: Extensions register commands and status bar items safely without access to privileged Electron main process APIs.

### 🎨 Theme Studio & Appearance Personalization (New in v1.5.0)
- **Theme Customizer Studio**: Custom palette editor with UI color pickers and CodeMirror syntax color controls.
- **Live Syntax Sandbox**: Test color theme adjustments in real time on code snippets.
- **Theme Portability**: Export and import custom theme JSON files and apply instantly to CSS variables.

### 🧰 Developer Productivity Toolbox (New in v1.5.0)
- **Universal Dev Toolbox (`Ctrl+Alt+T`)**:
  - **JSON Studio**: Beautifier, minifier, and error validator with JSON path inspection.
  - **Regex Workbench**: Interactive regex tester with flags, match groups, and replacement preview.
  - **Codecs & Hashes**: Base64 encode/decode, URL encode/decode, SHA-256 hash calculator, and UUID v4 generator.
  - **Format Converters**: HEX/RGB/HSL color converter, Unix/ISO timestamp converter, and character/word/byte counter.
  - **Persistent Scratchpad**: Multi-tab temporary buffer that persists across editor restarts.
  - **Clipboard History**: Snippet bank and clipboard history tracker.
- **AI Coding Assistant Panel**: Sidebar panel supporting OpenAI and Ollama/local models for code explanation, refactoring, unit test generation, and diff preview with one-click apply.
- **Sticky Scroll Scope Header**: Pins the current enclosing function, class, or tag at the top of the editor during scroll.
- **Column Ruler Guidelines**: Configurable vertical column guides at 80 and 120 columns.


### 🔍 Complete Search & Navigation Engine
- **Breadcrumb Bar with Active Symbol**: Folder breadcrumbs plus active function/class/method symbol tracker under the cursor.
- **Code Intelligence**:
  - **Go to Definition (`F12`)** & **Go to Declaration (`Ctrl+F12`)**.
  - **Find References (`Shift+F12`)** & **Go to Implementations / Type Definition**.
  - **Peek Definition (`Alt+F12`)**: Inline definition preview with source file jump and syntax highlighting.
  - **Rename Symbol (`F2`)**: Workspace-wide symbol renaming modal with preview and scope validation.
- **Go to Line & Column (`Ctrl+G` / `:line:col`)**: Direct coordinate jump in active document.
- **Document & Workspace Symbols**: Document Outline (`@` in Quick Open) and Workspace Symbol Search (`#` in Quick Open).
- **Edit Navigation History**: Back (`Alt+Left`) and Forward (`Alt+Right`) through cursor and edit locations.
- **Full Workspace Search & Replace (`Ctrl+Shift+F`)**:
  - Regex, Case-Sensitive, and Whole-Word matching.
  - Include and exclude glob pattern filters.
  - Search hidden files and ignored files with explicit opt-in.
  - File-grouped match results with line preview and match replacement confirmation.

### 📑 Tab Management & Core Editor Experience
- **Tab Drag-and-Drop**: Interactive tab rearrangement across the tab bar.
- **Tab Pinning Protection**: Pin critical tabs to prevent accidental closure; pinned tabs cannot be closed via bulk close actions.
- **Dirty File Close Confirmation**: Prompt to save or discard unsaved changes when closing modified tabs.
- **Comprehensive Tab Actions**: Close Active Tab, Close Tabs to the Right, Close Tabs to the Left, Close Other Tabs, Close Saved Tabs, and Close All Tabs.
- **Read-Only Mode Toggle (`Ctrl+Alt+R`)**: Lock document against edits with visual indicator in the status bar.
- **File Diff Comparison (`Ctrl+Alt+D`)**: Side-by-side visual diff comparison between any two open files.
- **Whitespace & Encoding Intelligence**: Trailing whitespace visualization, automatic trim-on-save option, and automatic LF/CRLF and UTF-8 detection.

### 🧩 Extensions & Developer Tooling
- **Bootstrap 5 & Font Awesome Snippets**: Extensive snippet library for modern responsive web development.
- **Laravel & PHP Intelligence**: Laravel Blade comment syntax (`{{-- ... --}}`), Blade code preservation on save, and rich PHP completions.
- **Unified Autocomplete Engine**: Comprehensive HTML, CSS, JavaScript, PHP, and Laravel completions with intelligent word blending.
- **Sublime Text-Grade Editing Transformations**: Case conversions (UPPERCASE, lowercase, Title Case, camelCase, snake_case, kebab-case), line sorting, line deduplication, line reversal, number increment/decrement, and transposition (`Ctrl+T` / `Alt+T`).
- **ANSI Color Terminal Output**: Streamlined execution logs with parsed ANSI color codes in the Output panel.

### 🌈 Rainbow Brackets & Vertical Indent Guides
- **Syntax-Tree-Driven Matching**: Leverages CodeMirror 6 language ASTs to pair matching opening and closing brackets (`()`, `{}`, `[]`) using the exact same depth color.
- **6-Level Color Progression**: Cycles through Red, Orange, Yellow, Green, Cyan, and Purple across increasing nesting depths.
- **Rainbow Indentation Guides**: Vertical guide lines mirror code nesting depth for instant visual scanning of complex block scopes.
- **Dynamic Toggle & Zero-Restart**: Enable/disable brackets and guides instantly from Settings (`Ctrl+,`) or Extension Manager with zero editor restart.

### 🎨 Official Color Theme Suite (10 Themes)
- **Dracula (Official)**: Full-fidelity Dracula theme palette with signature purple, cyan, pink, and yellow token highlights and optical ligature tuning.
- **10 Curated Themes**: Switch instantly between *Xivig Dark*, *Dracula (Official)*, *Monokai Pro*, *One Dark Pro*, *Solarized Light*, *Nord Theme*, *Tokyo Night*, *Cyberpunk 2077*, *GitHub Dark*, and *SynthWave '84*.
- **Integrated Theme Switcher**: Visual palette selector in Settings (`Ctrl+,`) and Command Palette (`Ctrl+K Ctrl+T`) with instant application across all editors and panes.

### ⚙️ VS Code-Style Settings Panel (`Ctrl+,`)
- **Visual Categorized Preferences**: Tree-driven navigation across *Text Editor*, *Workbench*, *Window*, *Features*, *Application*, and *Extensions*.
- **Instant Search & Highlighting**: Filter through dozens of settings in real time.
- **Deep Configuration**: Control font family, font size, word wrap, tab size, auto-save delay, format-on-save, rainbow brackets, and more.

### 🔄 Seamless In-Place Auto-Updater
- **VS Code-Style Updates**: Background checking, silent downloading, and seamless application on IDE restart without opening manual installer wizards.
- **Multi-Surface Notification**: Notification banner, Activity Bar Settings gear badge dot (`#35b779`), Status Bar `[⟳ Restart to Update]` action, and Command Palette integration.

### ⚡ Sublime-Grade Multi-Cursor & Editing
- **Multi-Cursor Selection**: Press `Ctrl+D` to select next occurrence, `Alt+F3` or `Ctrl+Alt+G` to select all occurrences, and `Ctrl+Shift+L` to split selection into lines.
- **Rectangular / Marquee Selection**: `Shift+Alt+Drag` creates columnar box selections with real-time multi-line cursor editing.
- **Line Manipulations**: Duplicate line down (`Shift+Alt+Down` or `Ctrl+Shift+D`), move lines up/down (`Alt+Up` / `Alt+Down`), delete line (`Ctrl+Shift+K`), and join lines (`Ctrl+J`).
- **Visual Gutter Bookmarks**: Toggle bookmarks with `Ctrl+F2`, cycle with `F2` / `Shift+F2`, and clear all with `Ctrl+Shift+F2`.
- **Code Folding**: Fold/unfold blocks with `Ctrl+Shift+[` / `Ctrl+Shift+]` or fold/unfold all with `Ctrl+Alt+[` / `Ctrl+Alt+]`.

### 🔤 Programming Font Ligatures
- **Contextual Coding Ligatures**: Built-in support for programming ligatures like `=>`, `===`, `!=`, `<=`, `>=`, and `<!--`.
- **Top Monospace Fonts**: Bundled with `Fira Code`, `JetBrains Mono`, `Cascadia Code`, and `Consolas`.
- **Dynamic Toggle**: Toggle ligatures on/off on the fly via Settings (`Ctrl+,`), `View -> Toggle Font Ligatures`, or the Command Palette (`Ctrl+Shift+P`).

### 💬 Multi-Language Block & Line Comments
- **Smart Block Comment (`Ctrl+Shift+/` or `Alt+Shift+A`)**:
  - Automatically wraps selected text or inserts empty block comments with centered cursor:
    - **HTML / XML / SVG / Vue**: `<!-- ... -->`
    - **JavaScript / TypeScript / CSS / C / C++ / Rust / Go / SQL**: `/* ... */`
    - **Python**: `""" ... """`
  - Seamlessly unwraps already-commented blocks when toggled again.
- **Smart Line Comment (`Ctrl+/`)**: Toggles single-line comments across all selected lines using syntax-specific comment markers.

### 🎨 Formatting & Context Menu
- **Code Beautifier (`Ctrl+Alt+B`)**: Format full documents or active selections in HTML, CSS, SCSS, JavaScript, TypeScript, and JSON using `js-beautify`.
- **Right Context Menu**: Full-featured context menu in both the File Explorer and Editor view offering:
  - *Format Document (`Ctrl+Alt+B`)*
  - *Toggle Line Comment (`Ctrl+/`)*
  - *Toggle Block Comment (`Ctrl+Shift+/`)*
  - *Edit to Right, Open / Run, Open in New Window*
  - *Copy Name, Copy Path, Copy Relative Path, Duplicate, Rename, Delete, Reveal in File Explorer*

### 🚀 Emmet 2.0 & Lorem Ipsum Generator
- **Emmet 2.0 Engine**: Full HTML/CSS abbreviations with `Tab` expansion (`div.card>h2+p*2`, `ul>li*5>a`, `c#fff`, `m0-auto`).
- **Wrap with Abbreviation (`Ctrl+Alt+W`)**: Wrap any selection inside custom abbreviation structures.
- **Lorem Ipsum Modal & Snippets (`Ctrl+Alt+L`)**: Configurable placeholder text dialog (paragraphs, sentences, words, lists) plus direct inline expansions (`lorem`, `lorem10`, `p>lorem25`, `ul>li*3>lorem5`).

### 🎨 CSS Color Picker & Inline Swatches
- **Inline Color Swatches**: Real-time color boxes beside HEX, RGB, RGBA, and HSL values in CSS and HTML with smooth hover magnification.
- **Quick Edit Color Picker (`Ctrl+Alt+C`)**: Interactive 2D color picker modal supporting HEX, RGBA, and HSLA formats.

### 🌐 Live Server & Real-Time Previews
- **Built-in Live Server**: One-click zero-config development server on `http://localhost:5500` with instant live-reload on save.
- **Dual Live Previews**:
  - **Live Web Preview (`Ctrl+K V`)**: Side-by-side interactive web preview for HTML/CSS/JS.
  - **Markdown Live Preview (`Ctrl+Shift+V`)**: GitHub Flavored Markdown with synchronized scrolling and syntax highlighting.

### 💻 Integrated Terminal & Build Systems
- **xterm.js Integrated Terminal (`Ctrl+\``)**: Fast, native terminal running PowerShell/cmd on Windows, or bash/zsh on Linux/macOS.
- **Build Systems (`Ctrl+Shift+B` / `F7`)**: Execute project builds with streamed logs in the Output panel. Press `Ctrl+B` to toggle the primary sidebar. Press `Ctrl+J` or `Ctrl+\`` to toggle the bottom drawer panel.
- **Problems & Diagnostics Panel**: Syntax error and warning detection with jump-to-line navigation.

### 🔍 Quick Open & Command Palette
- **Command Palette (`Ctrl+Shift+P` / `F1`)**: Search and execute every command in Xivig.
- **Quick Open (`Ctrl+P`)**: Fuzzy-find files across your workspace instantly.
- **Symbol Navigator (`Ctrl+R`)**: Jump to functions, classes, and IDs in the active document.

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Command | Scope |
|---|---|---|
| `Ctrl+N` | New Document | Global |
| `Ctrl+O` | Open File... | Global |
| `Ctrl+K Ctrl+O` | Open Folder... | Global |
| `Ctrl+S` | Save File | Editor |
| `Ctrl+Shift+S` | Save File As... | Editor |
| `Ctrl+W` | Close Active Tab | Editor |
| `Ctrl+B` | **Toggle Primary Sidebar** | Global |
| `Ctrl+Shift+B` / `F7` | **Run Build Task / Active Target** | Global |
| `Ctrl+J` / `Ctrl+\`` | **Toggle Bottom Drawer Panel** | Global |
| `Ctrl+\`` | Toggle Integrated Terminal | Global |
| `Ctrl+Shift+P` / `F1` | Command Palette | Global |
| `Ctrl+P` | Quick Open File | Global |
| `Ctrl+R` | Go to Symbol in Document | Editor |
| `Ctrl+F` | Find in Document | Editor |
| `Ctrl+H` | Replace in Document | Editor |
| `Ctrl+.` | **Quick Fix / Code Actions (LSP)** | Editor / LSP |
| `F12` | **Go to Definition (LSP)** | Editor / LSP |
| `Shift+F12` | **Find References (LSP)** | Editor / LSP |
| `F5` | **Debug: Start / Continue (DAP)** | Debugger |
| `F10` | **Debug: Step Over (DAP)** | Debugger |
| `F11` | **Debug: Step Into (DAP)** | Debugger |
| `Shift+F11` | **Debug: Step Out (DAP)** | Debugger |
| `Ctrl+Alt+T` | **Developer Productivity Toolbox** | Global |
| `Ctrl+Shift+R` | **Record / Stop Macro** | Editor |
| `Ctrl+Alt+B` | **Format Document / Selection** | Editor / Menu |
| `Ctrl+/` | **Toggle Line Comment** | Editor / Menu |
| `Ctrl+Shift+/` / `Alt+Shift+A` | **Toggle Block Comment** | Editor / Menu |
| `Ctrl+Alt+C` | **Quick Edit Color Picker** | Editor / CSS |
| `Ctrl+Alt+L` | **Insert Lorem Ipsum...** | Editor / Modal |
| `Ctrl+Alt+W` | **Emmet: Wrap with Abbreviation...** | Editor / HTML |
| `Ctrl+K V` | Toggle Live Web Preview | HTML / Web |
| `Ctrl+Shift+V` | Toggle Markdown Live Preview | Markdown |
| `Ctrl+D` | Select Next Occurrence | Multi-cursor |
| `Alt+F3` / `Ctrl+Alt+G` | Select All Occurrences | Multi-cursor |
| `Ctrl+Shift+L` | Split Selection into Lines | Multi-cursor |
| `Shift+Alt+Down` / `Ctrl+Shift+D` | Duplicate Line Down | Line editing |
| `Alt+Up` / `Alt+Down` | Move Line Up / Down | Line editing |
| `Ctrl+Shift+K` | Delete Line | Line editing |
| `Ctrl+F2` | Toggle Bookmark | Gutter / Nav |
| `F2` / `Shift+F2` | Next / Previous Bookmark | Gutter / Nav |
| `Ctrl+0` | Reset Zoom to 100% | View |
| `Ctrl+=` / `Ctrl+-` | Zoom In / Out | View |

---

## 🛠️ Tech Stack & Architecture

```
Xivig Text Editor
├── Desktop Shell: Electron 34 (Context Isolation, Sandboxed Preload, Dynamic CSP)
├── Security Layer: Canonical realpath validation, IPC frame authentication, atomic writes
├── Language Engine: JSON-RPC 2.0 LSP Client (Diagnostics, Inlay Hints, Code Actions, Hover)
├── Debugging Engine: Debug Adapter Protocol (DAP) client (Breakpoints, Stack, Scopes, REPL)
├── Frontend Application: React 18 + TypeScript 5.7 + Zustand State Stores
│   ├── Editor Engine: CodeMirror 6 (Transactions, Compartments, AST Trees, Vim Mode)
│   ├── Emmet Engine: Custom AST expander supporting nesting, multipliers, and lorem
│   ├── Color Engine: CSS swatch decoration extension + 2D HSL/HEX color picker
│   ├── Terminal: xterm.js + WebGL addon + node-pty/child_process shell bridge
│   ├── Live Server: Native Node.js HTTP server + WebSocket live-reload + containment
│   └── Formatter: js-beautify (HTML, CSS, JavaScript, JSON)
└── Build & Testing: Vite 6 + Vitest (40 Suites, 349 Tests) + electron-builder
```

---

## 🛡️ Security Architecture & Hardening

Xivig implements defense-in-depth security across the Electron main process, IPC boundaries, and renderer runtime:

1. **Filesystem IPC Authorization & Validation**:
   - Every filesystem IPC handler (`file:read`, `file:save`, `file:create`, `file:delete`, `file:rename`, `file:duplicate`) validates caller frames and verifies window permissions against approved workspace roots.
   - Enforces canonical containment checks via `fs.realpathSync` and `path.relative` to eliminate directory traversal attacks and symlink escapes.
2. **Atomic Writes with Crash Protection**:
   - File saving writes data to a secure sibling temporary file (`.xivig-tmp-*`) before performing an atomic replace, preventing file corruption if system power is lost mid-write.
3. **Child Process & Command Injection Protection**:
   - Replaced shell-string concatenation with `child_process.execFile` argument arrays for Git operations (`git add`, `git commit -m`, `git status`).
   - Project build execution verifies working directories and terminates process trees using `taskkill /T /F` on Windows and process-group `SIGKILL` on POSIX.
4. **Live Server Hardening**:
   - Path traversal prevention using resolved realpaths and relative containment checks.
   - Binds CORS strictly to local loopback origins (`http://127.0.0.1:<port>`), preventing remote origin snooping.
5. **Strict Content Security Policy (CSP)**:
   - Enforces dynamic production CSP headers on all window navigation and asset loading:
     `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; object-src 'none'`.
6. **Isolated Extension Host**:
   - Capability-based security model restricting extension capabilities (`workspace.read`, `workspace.write`, `ui.notifications`, `commands.register`, `network.fetch`) within an isolated execution boundary.

---

## 🧪 Automated Testing & Quality Assurance

Xivig Text Editor maintains enterprise-grade test automation and CI verification:

| Test Category | Test Suites | Status | Focus Areas |
|---|---|---|---|
| **Security & IPC Hardening** | 8 suites | ✅ Passed | Path traversal, symlink containment, sender validation, atomic writes |
| **Git Sanitization** | 4 suites | ✅ Passed | Argument array execution, branch switching, status parsing |
| **Build System Isolation** | 3 suites | ✅ Passed | Process tree termination, working directory validation |
| **LSP Intelligence** | 6 suites | ✅ Passed | JSON-RPC 2.0 protocol, diagnostics, inlay hints, signature help |
| **DAP Debugger** | 4 suites | ✅ Passed | Breakpoints, stepping, stack frames, variable scopes |
| **Editor Core & Motions** | 7 suites | ✅ Passed | CodeMirror 6 transactions, multi-cursor, bookmarks, Vim modal |
| **Markdown & Emmet** | 5 suites | ✅ Passed | GFM parsing, task lists, live preview sync, Emmet AST expansion |
| **UI Stores & State** | 3 suites | ✅ Passed | Zustand state machines, theme customization, settings sync |
| **Total Test Metrics** | **40 Suites** | **349 Tests (100% Passing)** | Execution time: ~4.1s |

Run the full automated test suite locally:
```bash
npm test
```

Verify dependency security:
```bash
npm audit
# 0 vulnerabilities found
```

---

## 📦 Multi-Platform Installation & Binaries

Xivig Text Editor is packaged for **Windows**, **Linux**, and **macOS**.

### Binary Types Produced
- **Windows**:
  - `Xivig.Text.Editor.Setup.1.5.0.exe` (NSIS Installer with desktop/start-menu shortcuts)
  - `Xivig.Text.Editor.1.5.0.exe` (Zero-install standalone portable executable)
  - `win-unpacked/` (Direct portable folder)
- **Linux**:
  - `Xivig-Text-Editor-1.5.0.AppImage` (Universal plug-and-play Linux executable)
  - `xivig-text-editor_1.5.0_amd64.deb` (Debian / Ubuntu amd64 package)
  - `Xivig-Text-Editor-1.5.0-linux-x64.tar.gz` (Standalone Linux x64 binary archive)
  - `Xivig-Text-Editor-1.5.0-linux-x64.zip` (Standalone Linux x64 zip bundle)
- **macOS**:
  - `Xivig-Text-Editor-1.5.0.dmg` (macOS Drag-and-Drop Disk Image: Universal for Apple Silicon & Intel)
  - `Xivig-Text-Editor-1.5.0-mac.zip` (Native macOS .app bundle: Universal binary)

---

## 🚀 Building from Source

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ or v20+ / v22+
- npm v9+

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/xivig/xivig-text-editor.git
cd xivig-text-editor

# 2. Install dependencies
npm install

# 3. Run development mode with hot-module reload
npm run dev

# 4. Typecheck and build production web bundle
npm run build
```

### Packaging Binaries Locally
```bash
# Package Windows installer and portable binary (.exe)
npm run package:win

# Package Linux universal AppImage and Debian package (.deb)
npm run package:linux

# Package macOS DMG and ZIP bundle (.dmg, .zip)
npm run package:mac

# Package all target platforms
npm run package
```
All generated installers and binaries will be output to the `release/` folder.

---

## 🤖 CI / CD Multi-Platform Releases

Automated cross-platform compilation is powered by GitHub Actions in [`.github/workflows/release.yml`](.github/workflows/release.yml):
- Builds native Windows `.exe` installers on `windows-latest`.
- Builds universal Linux `.AppImage` and `.deb` binaries on `ubuntu-latest`.
- Builds signed macOS `.dmg` and `.zip` binaries on `macos-latest`.
- Automatically publishes release assets to GitHub Releases upon tagging a version (e.g. `v1.5.0`).

---

## 📄 Release Information & Attributions

- **App Name**: Xivig Text Editor
- **Release Version**: 1.5 (Build 1.5.0)
- **Release Credits**: **Bandhu**
- **Documentation & Source**: [https://github.com/xivig/xivig-text-editor](https://github.com/xivig/xivig-text-editor)
- **Legal**: Copyright © 2026 Xivig. All rights reserved.

### Third-Party Libraries & Licenses
- **CodeMirror 6**: MIT License (Marijn Haverbeke and contributors)
- **Electron**: MIT License (OpenJS Foundation)
- **React & React-DOM**: MIT License (Meta Platforms, Inc.)
- **Vite**: MIT License (Evan You and Vite contributors)
- **xterm.js**: MIT License (Microsoft Corporation)
- **js-beautify**: MIT License (Einar Lielmanis, Liam Newman, and contributors)
- **Lucide Icons**: ISC License (Lucide Contributors)
- **Zustand**: MIT License (Paul Henschel and contributors)
