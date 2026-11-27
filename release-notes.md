# XIVIG TEXT EDITOR 2.0 — The Ultimate Developer Workspace ⚡

> **A fast, extensible, cross-platform desktop code editor built for professional developers.**

We are thrilled to announce **XIVIG TEXT EDITOR v2.0.1**!

## 🔧 What's Fixed in v2.0.1
- **Terminal IPC Cleanup**: Added the missing `terminal:stop` main-process IPC handler so closed terminal tabs cleanly terminate shell process trees.
- **UI & Modal Wiring**: Connected `FormattingSettingsModal` to the Tools menu and Command Palette, wired the Web Toolkit panel's Flexbox/Grid CSS Studio buttons, fixed `Ctrl+Shift+N` new-window launching in Electron, and updated Help menu branding to **X (formerly Twitter)**.
- **Explorer Context Menu & Signing**: Added Explorer blank-space context menu actions and Windows/macOS code-signing support (`docs/CODE_SIGNING.md`).
- **Documentation & Links**: Fixed broken badge anchors and cross-linked all project guides (`README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/HOW_TO.md`, `docs/AUTO_UPDATER.md`).

---

---

## 🎯 Product Principles

- **Lightweight and Fast**: Sub-second startup, minimal idle RAM, fast file indexing, and 60fps rendering on massive source files.
- **Keyboard-First**: Comprehensive shortcuts for all operations, Sublime & VS Code multi-cursor editing, and universal Command Palette (`Ctrl+Shift+P`).
- **Beautiful and Customizable**: Elite modern UI aesthetics, custom themes, custom font ligatures, and custom accent colors.
- **Intelligent Coding Assistance**: Language Server Protocol (LSP), Debug Adapter Protocol (DAP), code actions, hover docs, and functional offline/multi-provider AI Assistant.
- **Excellent Web Development Experience**: Integrated Web Development Toolkit, Live Server with auto-reload, Live HTML preview, CSS Peek, color pickers, and Emmet abbreviation engine.
- **Secure Extension Ecosystem**: Sandboxed host isolation with 20 categories of curated extensions, manifest-driven activation, and granular permission boundaries.
- **Reliable Across Windows, macOS and Linux**: Cross-platform support with automated compiler auto-discovery (Kotlin, Java JDK, Python, GCC/MinGW).

---

## ✅ Definition of Done
Every feature delivered in 2.0 satisfies:
1. **Functional implementation**: Fully tested logic without mocks or stubs in runtime.
2. **Settings and customization**: Custom preferences where appropriate.
3. **Keyboard shortcuts**: Direct, conflict-free hotkey mappings.
4. **Command palette integration**: Searchable and runnable via `Ctrl+Shift+P`.
5. **Error handling**: Graceful fallback and clear troubleshooting guidance.
6. **Automated tests**: Thorough test coverage across unit, component, store, and IPC layers.
7. **Documentation**: Clear coverage across all manuals, guides, and release notes.

---

## 🚀 What's New in v2.0.0

### 📂 File Menu Workspace Lifecycle
- **Open Workspace from File...**: Opens native file dialog for `.code-workspace` and `.xivig-workspace` multi-root JSON projects. Resolves relative directories, loads primary folder file tree, and stores workspace state.
- **Open Recent > Flyout Submenu**: Instant access to recent `.code-workspace` projects, individual files, `More...` (`Ctrl+R`), and `Clear Recently Opened`.
- **Add Folder to Workspace...**: Dynamically appends project directories into a unified multi-root session.
- **Save Workspace As...**: Saves active workspace configuration to standard VS Code compatible JSON.
- **Duplicate Workspace**: Creates an untitled duplicate workspace session.

### 🎨 Elite Modern & Professional Editor Interface
- Polished, distraction-free interface with glassmorphic dark styling, improved tab bar contrast, and streamlined status bar.
- Re-architected Tools menu housing **Emmet Abbreviation Expander** (`Ctrl+Alt+E`) and **Color Picker / Inspector** (`Ctrl+Alt+C`).
- Updated Help menu featuring modern **X** branding (formerly Twitter).

### 🤖 Fully Functional AI Coding Assistant
- Multi-provider support (Google Gemini, OpenAI, Anthropic Claude, Ollama, LM Studio) and an offline rule/heuristic fallback engine.
- Context-aware code explanations, bug fixing, test suite generation, and inline prompt insertion (`Ctrl+I`).

### 🧩 20-Category Curated Extension Ecosystem
Comprehensive built-in suite covering 20 development disciplines:
- Web Development, JavaScript/TypeScript, React, Laravel/PHP, Database, API Development, Docker & DevOps, Python, Java, C/C++, Rust, Android & Kotlin, Markdown & Documentation, Remote Development, Themes & UI, Testing, Security & Auditing, and Developer Productivity.

### ⚙️ Zero-Config Compiler Auto-Discovery & Execution
- Automatic Windows detection for **Kotlin compiler** (`kotlinc.bat` in Android Studio / IntelliJ IDEA), **Java JDK** (`C:\Program Files\Java\jdk-*` / JBR), MinGW, and Python.
- Seamless one-click compile & run via `Ctrl+Shift+B` or `F7`.

### ⚡ Line Duplication & Multi-Cursor Velocity
- Prioritized `Ctrl+Shift+D` shortcut for line duplication down and inline selection duplication.
- Conflict-free activity bar keymap with `F5` designated for Run & Debug.

---

# Xivig Text Editor v1.0.0 — Official Launch ⚡

> **⚡ Ultra-fast, keyboard-first desktop code editor built for pure velocity — Sublime-grade multi-cursor workflows, instant live web feedback, and pixel-perfect developer tooling.**

We are thrilled to announce the official **Release 1.0** of **Xivig Text Editor**!

---

## 🚀 What's New in v1.0.0

### ⚡ Sublime-Grade Multi-Cursor & Line Editing
- **Multi-Cursor Engine**: `Ctrl+D` (select next occurrence), `Alt+F3` or `Ctrl+Alt+G` (select all occurrences), `Ctrl+Shift+L` (split into lines).
- **Column / Box Selection**: `Shift+Alt+Drag` creates columnar rectangular selections for multi-row edits.
- **Line Editing**: Duplicate line down (`Shift+Alt+Down` or `Ctrl+Shift+D`), move line up/down (`Alt+Up` / `Alt+Down`), delete line (`Ctrl+Shift+K`), and join lines (`Ctrl+J`).
- **Gutter Bookmarks**: Toggle visual bookmarks with `Ctrl+F2`, cycle with `F2` / `Shift+F2`, and clear all with `Ctrl+Shift+F2`.
- **Code Folding**: Fold/unfold blocks with `Ctrl+Shift+[` / `Ctrl+Shift+]` or fold/unfold all with `Ctrl+Alt+[` / `Ctrl+Alt+]`.

### 🔤 Programming Font Ligatures
- **Contextual Coding Ligatures**: Seamless rendering of programming symbols like `=>`, `===`, `!=`, `<=`, `>=`, and `<!--`.
- **Pre-configured Fonts**: Bundled with `Fira Code`, `JetBrains Mono`, `Cascadia Code`, and `Consolas`.
- **Toggle on the Fly**: Toggle ligatures anytime in Settings (`Ctrl+,`), `View -> Toggle Font Ligatures`, or the Command Palette (`Ctrl+Shift+P`).

### 💬 Multi-Language Block & Line Comments
- **Smart Block Comment (`Ctrl+Shift+/` or `Alt+Shift+A`)**:
  - Automatically wraps selected text or inserts empty block comments with centered cursor:
    - **HTML / XML / SVG / Vue**: `<!-- ... -->`
    - **JavaScript / TypeScript / CSS / C / C++ / Rust / Go / SQL**: `/* ... */`
    - **Python**: `""" ... """`
  - Seamlessly unwraps already-commented blocks when toggled again.
- **Smart Line Comment (`Ctrl+/`)**: Toggles single-line comments across all selected lines.

### 🎨 Code Beautifier & Right Context Menu
- **Code Beautifier (`Ctrl+Alt+B`)**: Format full documents or active selections in HTML, CSS, SCSS, JavaScript, TypeScript, and JSON using `js-beautify`.
- **Comprehensive Right Context Menu**: Available in both File Explorer and the Editor pane:
  - *Format Document (`Ctrl+Alt+B`)*
  - *Toggle Line Comment (`Ctrl+/`)*
  - *Toggle Block Comment (`Ctrl+Shift+/`)*
  - *Edit to Right, Open / Run, Open in New Window*
  - *Copy Name, Copy Path, Copy Relative Path, Duplicate, Rename, Delete, Reveal in File Explorer*

### 🚀 Emmet 2.0 & Lorem Ipsum Generator
- **Emmet 2.0 Abbreviation Engine**: Type abbreviations and press `Tab` (`div.container>header+main>ul>li*3>a`, `c#fff`, `m0-auto`).
- **Wrap with Abbreviation (`Ctrl+Alt+W`)**: Wrap any selection inside custom abbreviation structures.
- **Lorem Ipsum Modal & Snippets (`Ctrl+Alt+L`)**: Configurable placeholder text modal (paragraphs, sentences, words, lists) plus direct inline expansions (`lorem`, `lorem10`, `p>lorem25`, `ul>li*3>lorem5`).

### 🌈 CSS Color Picker & Inline Swatches
- **Inline Color Swatches**: Real-time color boxes beside HEX, RGB, RGBA, and HSL values in CSS and HTML with smooth hover magnification.
- **Quick Edit Color Picker (`Ctrl+Alt+C`)**: Interactive 2D color picker modal supporting HEX, RGBA, and HSLA formats.

### 🌐 Live Server & Real-Time Previews
- **Built-in Live Server**: One-click zero-config development server on `http://localhost:5500` with instant live-reload on save.
- **Dual Live Previews**:
  - **Live Web Preview (`Ctrl+K V`)**: Side-by-side interactive web preview for HTML/CSS/JS.
  - **Markdown Live Preview (`Ctrl+Shift+V`)**: GitHub Flavored Markdown with synchronized scrolling and syntax highlighting.

### 💻 Integrated Terminal & Quick Open
- **xterm.js Integrated Terminal (`Ctrl+\``)**: Fast, native terminal running PowerShell/cmd on Windows, or bash/zsh on Linux/macOS.
- **Command Palette (`Ctrl+Shift+P` / `F1`)**: Search and execute every command in Xivig.
- **Quick Open (`Ctrl+P`)**: Fuzzy-find files across your workspace instantly.
- **Symbol Navigator (`Ctrl+R`)**: Jump to functions, classes, and IDs in the active document.

---

## 📦 Binary Assets Included

| Platform | File | Type |
|---|---|---|
| **Windows** | `Xivig Text Editor Setup 1.0.0.exe` | NSIS Full Windows Installer |
| **Windows** | `Xivig Text Editor 1.0.0.exe` | Standalone Portable Executable |
| **macOS** | `Xivig-Text-Editor-1.0.0-mac.zip` | Native macOS `.app` Application Bundle |
| **macOS** | `Xivig-Text-Editor-1.0.0-mac-x64.zip` | macOS x64 Application Archive |
| **Linux** | `Xivig-Text-Editor-1.0.0-linux-x64.tar.gz` | Universal Linux x64 Tarball |
| **Linux** | `Xivig-Text-Editor-1.0.0-linux-x64.zip` | Universal Linux x64 Zip Archive |

### 🍎 macOS Installation Guide:
1. Download `Xivig-Text-Editor-1.0.0-mac.zip` (or `Xivig-Text-Editor-1.0.0-mac-x64.zip`).
2. Double-click to extract the archive to obtain `Xivig Text Editor.app`.
3. Move `Xivig Text Editor.app` into your macOS `/Applications` directory.
4. On first launch, if macOS Gatekeeper displays an unsigned developer alert, Right-Click (or Control-Click) the application and click **Open**, or remove quarantine via Terminal:
   ```bash
   xattr -cr "/Applications/Xivig Text Editor.app"
   ```

---

## 📄 Release Information & Credits
- **Application Name**: Xivig Text Editor
- **Release Version**: 1.0 (Build 1.0.0)
- **Release Credits**: **Bandhu**
- **Documentation & Source**: [https://github.com/xivig/xivig-text-editor](https://github.com/xivig/xivig-text-editor)
- **Copyright**: Copyright © 2026 Xivig. All rights reserved.
