# Changelog

All notable changes to the **Xivig Text Editor** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.4] - 2026-11-28 — *Release 2.0.4: Swift Toolchain & Extension, PHP Runner, C/C++ Runner, Nested Folders & Scratch Files*

### ⚡ Swift Language Support & Toolchain Integration
* **Swift Language Intelligence**: Full Swift language support with Lezer-based syntax highlighting, symbol parsing (struct, class, actor, protocol, enum, func, var/let), and autocomplete suggestions.
* **Non-Conflicting Autocompletion**: Seamless CodeMirror 6 autocompletion integration avoiding facet merge collisions in unified editor instances.
* **Swift Toolchain Auto-Discovery**: Automatic discovery of Swift 6.4.3 toolchain on Windows across `%LOCALAPPDATA%\Programs\Swift\Toolchains\*\usr\bin` and `%ProgramFiles%`.
* **Runtime & SDK Auto-Configuration**: Automatically configures companion runtime DLL paths (`Runtimes\6.4.3\usr\bin`) and sets `SDKROOT` to `Windows.platform\Developer\SDKs\Windows.sdk`.
* **Build & Run Targets**: Added one-click Swift build and run commands (`swift` interpreter and `swiftc -O` release compiler with secondary executable execution).

### 🐘 PHP & C/C++ Runners
* **PHP Executable Auto-Detection**: Auto-detects `php.exe` across XAMPP, Laragon, WampServer, Chocolatey, Scoop, and system PATH.
* **PHP Script Runner**: One-click PHP script execution directly in the integrated terminal/build runner.
* **C/C++ Compiler Auto-Detection**: Auto-detects standard GCC, G++, Clang, and Clang++ installations across Embarcadero Dev-Cpp, TDM-GCC, MSYS2 (`ucrt64`, `mingw64`, `clang64`), MinGW-w64, CodeBlocks, and WinGet packages.
* **C/C++ Build & Run Targets**: Multi-target compilation with `-O2`, `-Wall`, and secondary target binary execution.

### 📁 Nested Folder Creation & Scratch Files
* **Deep Nested Folder Creation**: Added recursive directory creation in file explorer, allowing paths like `src/components/modals/MyModal.tsx` or `nested/deep/folders` to be created seamlessly.
* **New Scratch File**: Added `File` &rarr; `New Scratch File...` (<kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd>) and Command Palette action with interactive language picker and persistent buffer.

---

## [2.0.3] - 2026-11-28 — *Release 2.0.3: Image Viewer Self-Fetch & Drag-Drop, High-Specificity Rainbow Brackets*

### 🖼️ Image Viewer Hardening & Universal File Opening
* **Security Authorization Auto-Approval**: Fixed `file:read` security checking in the main process to auto-authorize file paths requested directly by the verified application window, fixing silent access denials on recent files, workspace files, and standalone opened files.
* **Global Drag and Drop**: Added root window drag-and-drop listener in `App.tsx` enabling instant file opening and image rendering when files are dragged directly into the editor.
* **Self-Fetching Image Content**: Added automatic background content retrieval in `ImageViewer` if document content is initially unpopulated upon tab activation.
* **Inline Vector SVG Rendering**: Implemented sanitized inline vector SVG rendering with exact dimension calculation from width, height, or `viewBox`, eliminating Chromium data URL decoding failures and ensuring razor-sharp rendering at all zoom levels.

### 🌈 Rainbow Brackets High-Specificity & Syntax Precision
* **Syntax-Tree Bracket Token Precision**: Refined `isIgnoredSyntaxNode` to recognize exact Lezer punctuation tokens (`(`, `)`, `[`, `]`, `{`, `}`) and template string interpolations, avoiding false-positive suppression while accurately skipping brackets inside string and comment literals.
* **Full Specificity Styling**: Switched `rainbowBracketsTheme` to an explicit `EditorView.theme` and added `.cm-editor span.xivig-rainbow-bracket-*` selectors with `!important` color and font-weight values to reliably override all dark and light syntax themes.
* **Extension Compartment Deduplication**: Filtered rainbow brackets from the general extension compartment to guarantee single-instance mounting under the dedicated reactive `rainbowCompartmentRef`.

---

## [2.0.2] - 2026-11-28 — *Release 2.0.2: Image Viewer, In-Place Updates, Explorer Integration & Rainbow Brackets*

### 🖼️ Interactive Image Viewer (PNG, JPG, SVG, WebP, GIF, BMP, ICO)
* **Direct Image Rendering**: Added native visual image previewing directly within editor document tabs.
* **Interactive Navigation**: Interactive zoom (`Ctrl` + `+`/`-`, mouse wheel, 100% reset, and Fit-to-Window) and mouse drag panning.
* **Metadata & Transparency**: Real-time natural pixel dimensions (`width × height px`), estimated file size, and background toggles (transparency checkerboard, dark, and light modes).
* **SVG Dual-Mode**: Visual SVG rendering with XSS sanitization, plus seamless 1-click **[ Preview ]** / **[ Code ]** toggling to edit raw SVG XML markup in CodeMirror.
* **Binary Safe File Read**: Implemented `readFileContent` in backend to load binary images as Base64 Data URLs, avoiding UTF-8 decoding corruption.

### 🌈 Rainbow Brackets & Indent Guides
* **Scoped Base Theme**: Added `rainbowBracketsTheme` with high-specificity cyclical depth colors (`red`, `orange`, `yellow`, `green`, `cyan`, `purple`) ensuring colors render reliably over syntax highlighting themes.
* **Dynamic State Compartment**: Integrated dedicated `rainbowCompartmentRef` in CodeMirror responding live to `rainbowBrackets` and `rainbowIndentGuides` settings.
* **Activation Event Lifecycle**: Emitted `onEditorCreated` on editor mount so manifest-declared extensions activate automatically.

### 🔄 In-Place NSIS Updating & Explorer "Open With"
* **In-Place Updater**: Added NSIS configuration (`deleteAppDataOnUninstall: false`, `differentialPackage: true`, and `installer.nsh`) to preserve user settings, extensions, and desktop shortcuts during updates without wiping the installation folder.
* **Windows Explorer Context Menu**: Registered "Open with Xivig Text Editor" for files, folders, and directory backgrounds in Windows Explorer.
* **CLI & Startup Path Routing**: Added single-instance argument extraction (`extractPathFromArgv`) and IPC delivery to open files or folders passed from Explorer or terminal.

---

## [2.0.1] - 2026-11-27 — *Release 2.0.1 Stability, Link & Wiring Patch*

### 🔧 Fixes & Wiring
* **Terminal Process Cleanup**: Registered the missing `terminal:stop` IPC handler in `electron/main/index.ts` so closing terminal tabs cleanly terminates backend shell processes.
* **UI & Modal Links**:
  - Wired `FormattingSettingsModal` into `uiStore`, Tools menu, and Command Palette (`Preferences: Formatting & Code Quality Settings...`).
  - Wired `onOpenCssHelpers` in `Sidebar.tsx` so the Flexbox and Grid Visual Studio buttons render and open from the Web Toolkit panel.
  - Updated `Ctrl+Shift+N` in `App.tsx` to use `window.xivig.openNewWindow()` when running in Electron.
  - Updated Help menu branding from `Twitter` (`https://twitter.com`) to `X (formerly Twitter)` (`https://x.com`).
* **Explorer Blank-Space Context Menu & Code Signing**:
  - Added blank-space Explorer context menu actions (`New File...`, `New Folder...`, `Refresh Explorer`, `Collapse Folders`, `Find in Folder...`, `Open Folder...`, `Close Folder`) with automated tests.
  - Added Windows/macOS code-signing environment wiring and `docs/CODE_SIGNING.md`.
* **Documentation & Release Links**:
  - Fixed broken License badge anchor in `README.md` (`#-release-information--attributions`) and added cross-links across `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/HOW_TO.md`, and `docs/AUTO_UPDATER.md`.
  - Updated version metadata and fallback strings consistently to `2.0.1`.

---

## [2.0.0] - 2026-11-25 — *XIVIG TEXT EDITOR 2.0: The Ultimate Developer Workspace*

> **XIVIG TEXT EDITOR 2.0**  
> **The Ultimate Developer Workspace**  
> *A fast, extensible, cross-platform desktop code editor built for professional developers.*

### 🎯 Product Principles
* **Lightweight and Fast**: Sub-second startup, low idle memory footprint (<85MB heap), instant file indexing, and smooth 60fps scrolling on large files.
* **Keyboard-First**: Comprehensive keyboard shortcuts for every action, full Sublime Text & VS Code multi-cursor editing, and universal Command Palette (`Ctrl+Shift+P`).
* **Beautiful and Customizable**: Modern translucent aesthetics, custom themes (One Dark Pro, Catppuccin, Tokyo Night, Dracula, Material), custom font ligatures, and custom accent colors.
* **Intelligent Coding Assistance**: Language Server Protocol (LSP) language intelligence, DAP interactive debugging, code actions, hover docs, and functional offline/multi-provider AI Assistant.
* **Excellent Web Development Experience**: Integrated Web Development Toolkit, Live Server with auto-reload, Live HTML preview, CSS Peek, color pickers, and Emmet abbreviation engine.
* **Secure Extension Ecosystem**: Sandboxed host isolation with 20 categories of curated extensions, manifest-driven activation, and granular permission boundaries.
* **Reliable Across Windows, macOS and Linux**: First-class support for Windows (with automated compiler detection for Kotlin, JDK, Python, MinGW), macOS (universal binary), and Linux (AppImage, DEB).

### ✅ Definition of Done
Every feature across Xivig 2.0 satisfies:
- Functional implementation with zero mocked regressions.
- Settings and customization where appropriate.
- Keyboard shortcuts for high-velocity workflows.
- Command palette integration (`Ctrl+Shift+P` / `F1`).
- Error handling and graceful fallback guidance.
- Automated tests across unit, store, component, and IPC layers.
- Full documentation across README, HOW_TO, release notes, and changelogs.

### 🌟 Key Highlights in Version 2.0
* **File Menu Workspace Lifecycle**:
  - `Open Workspace from File...`: Open `.code-workspace` and `.xivig-workspace` multi-root JSON projects.
  - `Open Recent >`: Dynamic flyout submenu with recent projects, workspaces, recent files, and `Clear Recently Opened`.
  - `Add Folder to Workspace...`: Dynamically append root directories to active workspace.
  - `Save Workspace As...`: Export active multi-folder session to standardized `.code-workspace` JSON.
  - `Duplicate Workspace`: Clone active project setup into an independent untitled workspace.
* **Elite Modern & Professional Editor Interface**:
  - Refined layout, glassmorphic dark palette, polished activity bar, status bar, and menubar ergonomics.
  - Modernized Help menu with updated **X** branding (formerly Twitter).
  - Tools menu housing **Emmet Abbreviation Expander** (`Ctrl+Alt+E`) and **Color Picker / Inspector** (`Ctrl+Alt+C`).
* **AI Coding Assistant**:
  - Offline local fallback engine with multi-provider connectivity (Google Gemini, OpenAI, Anthropic Claude, Ollama, LM Studio).
  - Inline prompt bar (`Ctrl+I`), code explanation, generation, test generation, and diff application.
* **Full 20-Category Curated Extension Ecosystem**:
  - 20 complete categories spanning Web, React, Python, Java, C/C++, Rust, Kotlin/Android, DevOps, Database, Testing, Security, and Remote Development.
* **Zero-Config Compiler Auto-Discovery**:
  - Windows auto-discovery for Kotlin compiler (`kotlinc.bat`), Java JDK (`C:\Program Files\Java\jdk-*` or Android Studio JBR), MinGW/GCC, and Python.
* **Line Duplication & Editing Enhancements**:
  - Prioritized `Ctrl+Shift+D` shortcut for line duplication down and inline selection duplication.
  - Added dedicated Command Palette entry and Edit menu actions for line duplication and line moves.

---

## [1.4.0] - 2026-11-24 — *Search & Navigation Suite, Advanced Editing Engine & Developer Tooling Release*

### 🔍 Search & Code Navigation Suite
* **Full-Spectrum Workspace Search (`Ctrl+Shift+F`)**:
  - Regular expression, case-sensitive, and whole-word search options.
  - File-grouped match listings with line number preview and match counts.
  - Global search-and-replace with safety confirmation modal.
  - Include and exclude glob pattern filtering.
  - Explicit opt-in toggles for searching hidden files and gitignored directories.
* **Symbol Navigation & Code Intelligence**:
  - **Breadcrumb Navigation**: Path breadcrumbs with dynamic symbol display showing active function, class, or method under cursor.
  - **Quick Open Symbol Extensions**: Document Symbol Outline (`@`) and Workspace Symbol Search (`#`).
  - **Go to Line & Column**: Direct coordinate navigation (`:line:col` or `Ctrl+G`).
  - **Code Intelligence**: Go to Definition (`F12`), Go to Declaration (`Ctrl+F12`), Find References (`Shift+F12`), Go to Implementation, and Type Definition.
  - **Peek Definition (`Alt+F12`)**: Inline definition modal with jump-to-source capability.
  - **Rename Symbol (`F2`)**: Workspace symbol renaming with match preview and confirmation.
  - **Navigation History**: Jump backward (`Alt+Left`) and forward (`Alt+Right`) through cursor and edit history.

### 📑 Tab Management & Core Editor Robustness
* **Tab Drag-and-Drop**: Smooth visual tab reordering across the editor tab bar.
* **Tab Pinning Protection**: Pin critical tabs (`Pin Tab`); pinned tabs are protected against bulk closure.
* **Dirty File Confirmation**: Interactive modal prompting to save or discard unsaved changes when closing modified tabs.
* **Comprehensive Tab Closure Operations**: Close Active, Close to the Right, Close to the Left, Close Others, Close Saved, and Close All across Tab Bar, Tab Context Menu, Menubar, and Command Palette.
* **Read-Only Mode (`Ctrl+Alt+R`)**: Lock files against accidental modifications with status bar badge.
* **File Diff Comparison (`Ctrl+Alt+D`)**: Side-by-side file comparison with visual diff highlighting and change summary.
* **Whitespace & Line Ending Tools**: Trailing whitespace visualization, configurable trim-on-save option, and automatic LF/CRLF detection.

### ⚡ Sublime-Style Editing Transformations & Snippet Extensions
* **Text & Case Transformations**:
  - Transform to UPPERCASE (`Ctrl+K Ctrl+U`), lowercase (`Ctrl+K Ctrl+L`), Title Case, CamelCase, snake_case, and kebab-case.
  - Multi-key chord handling with fallback for word-under-cursor transformations.
  - Sort selected lines alphabetically or in reverse.
  - Remove duplicate / unique lines from selection.
  - Increment / decrement numbers (`Ctrl+Up` / `Ctrl+Down`).
  - Transpose characters (`Ctrl+T`) and transpose words (`Alt+T`).
* **High-Contrast Selection Highlighting**:
  - Semi-transparent active line tint (`--xivig-active-line`) eliminating layer occlusion of selection rectangles.
  - Vivid selection background (`rgba(108, 140, 255, 0.45)`) across focused, unfocused, and context menu states.
  - Multi-occurrence selection match highlight (`.cm-selectionMatch`) with outline border.
* **Bootstrap 5 & Font Awesome Snippets**: Built-in comprehensive snippet pack for Bootstrap 5 components and Font Awesome 6 icons.
* **Laravel All-In-One & PHP Intelligence**: Native Blade comment syntax (`{{-- ... --}}`), Blade formatting preservation on save, and rich PHP completion intelligence.
* **ANSI Color Output Panel**: Colorized terminal and execution output logs with clean timestamp alignment.

---

## [1.3.0] - 2026-11-24 — *Extension System, Theme Suite & Seamless In-Place Auto-Updater Release*

### 🌈 Rainbow Brackets & Indentation Guides Extension
* **Syntax-Tree Driven Matching**:
  - Implemented CodeMirror 6 ViewPlugin using AST parsing (`ensureSyntaxTree`) to match bracket pairs `()`, `{}`, and `[]` across document blocks.
  - Paired matching opening and closing brackets with the exact same depth color across 6 cyclic color tiers (Red, Orange, Yellow, Green, Cyan, Purple).
  - Skips brackets in string literals, comments, and non-code tokens via syntax tree node name inspection.
* **Rainbow Indentation Guides**:
  - Implemented real-time line decoration rendering vertical indent guide lines mirroring indentation depth and whitespace scopes.
  - Zero editor lag and minimal memory footprint on large source files.
* **Live Dynamic Toggle**:
  - Toggle brackets and guides on the fly from Settings or the Extension Manager without restarting the editor or losing undo/redo history.

### 🎨 Official Color Theme Suite & Typographic Polish
* **Dracula (Official) Theme**:
  - Implemented official Dracula color palette (`#282a36`, `#f8f8f2`, `#bd93f9`, `#ff79c6`, `#50fa7b`, `#8be9fd`, `#f1fa8c`, `#ffb86c`, `#6272a4`) matching the official Dracula specification.
  - Applied across editor, sidebar, activity bar, status bar, tabs, modals, and context menus.
* **10 Curated Theme Palettes**:
  - Integrated 10 color themes: Xivig Dark (Default), Dracula (Official), Monokai Pro, One Dark Pro, Solarized Light, Nord Theme, Tokyo Night, Cyberpunk 2077, GitHub Dark, and SynthWave '84.
* **Font Ligature Optical Alignment Fix**:
  - Resolved Fira Code contextual ligature gaps in HTML closing tags (`</`, `</form>`, `</script>`) by isolating angle bracket font features (`fontVariantLigatures: 'none'`, `fontFeatureSettings: '"liga" 0, "calt" 0'`) while retaining normal letter spacing across all tags.

### ⚙️ VS Code-Style Graphical Settings Interface
* **Comprehensive Configuration Hub**:
  - Redesigned the Settings modal into a full-featured, VS Code-modeled preferences view with sidebar category tree (*Text Editor*, *Workbench*, *Window*, *Features*, *Application*, *Extensions*).
  - Added live search filtering across all setting IDs, descriptions, and values.
  - Added visual color theme cards with color chips, selection checks, and instant preview.

### 🔄 Seamless In-Place Auto-Updater (VS Code Experience)
* **Zero-Wizard Background Updates**:
  - Automatically queries release feeds and downloads updates silently in the background.
  - Silently applies updates on application restart without displaying manual installer wizards or requiring manual file replacement.
* **Windows NSIS Silent Execution**:
  - Configured NSIS launcher flags `['/S', '--force-run']` and `quitAndInstall(false, true)` for automatic in-place upgrades.
  - Added graceful relaunch fallbacks for portable executables and development environments.
* **Multi-Surface Status Awareness**:
  - Top notification banner with direct "Restart Xivig to Update" action button and download progress indicator.
  - Green indicator badge dot on the Activity Bar Settings gear icon when an update is downloaded.
  - Interactive `[⟳ Restart to Update]` indicator in the status bar.
  - Command Palette actions: `Help: Check for Updates...` and `Help: Restart to Update (Apply Downloaded Update)`.

---

## [1.2.0] - 2026-11-24 — *Developer Tooling & Security Architecture Release*

### 🛡️ Core Security Architecture & Isolation (P0)
* **Per-Window Authorization Isolation**:
  - Eliminated global process-wide workspace/file authorization sets in `electron/main/security/index.ts`.
  - Introduced granular per-window permission registries (`permissionsByWindow = Map<number, WindowPermissions>`).
  - Enforced that filesystem operations strictly validate against permissions bound to the validated IPC sender window ID, preventing cross-window privilege leakage and unapproved access.
* **Safe Windows Build Process Spawning**:
  - Replaced whitespace token splitting with structured command/argument configurations.
  - Added Windows launcher validation and direct executable spawning to prevent command injection via cmd.exe expansion rules (`%`, `^`, `!`, parentheses).

### ⚡ Live Preview & Markdown Engine (P1)
* **DOMPurify HTML Sanitization**:
  - Integrated production DOMPurify sanitization in `src/utils/markdownSanitizer.ts`, replacing fragile regular expression replacements.
  - Allowed safe attributes (`width`, `height`, `style`, `align`) to preserve markdown image dimensions.
  - Added `resolveMarkdownImagePath()` to automatically resolve local and relative image paths (e.g. `public/logo.png`) to `file:///...` URLs without dev-server warnings or 404s.
* **Synchronized Scrolling Engine**:
  - Eliminated inertial feedback deadlocks between editor and markdown preview with an active interaction source lock (`activeScrollSourceRef`).
  - Replaced virtualized viewport approximations with CodeMirror `targetView.lineBlockAtHeight(editorScroller.scrollTop)` for smooth, continuous 60fps tracking.
  - Added smooth boundary interpolation for document headers, lists, code fences, and tables.
* **Embedded Live Server & CSP Framing Fix**:
  - Added `frame-src` and `img-src` permissions in Electron and HTML CSP for `127.0.0.1:*` and `localhost:*`.
  - Removed `X-Frame-Options: SAMEORIGIN` from Live Server HTTP responses.
  - Isolated user project previews from desktop application CSP injection.
  - Intercepted `window.alert()` in embedded live previews to stream modal dialogs to the Preview Console.

### 🚀 Developer Features & Language Support
* **Multi-Language Expansion**:
  - Added full syntax highlighting, file detection, and comment definitions for **Swift**, **Kotlin**, and **Windows Batch / CMD** (`.bat`, `.cmd`).
  - Added language-specific auto-indent on save according to file extension and active language settings.
* **Compile-and-Run Pipeline**:
  - Integrated execution runners for Python, C/C++, Java, and Node.js.
  - Added a direct "Run File" button beside the preview eye in the tab bar for one-click file execution.
* **Build System Event Contract**:
  - Unified build completion event contract (`build:done` with `exitCode` and `durationMs`) across main, preload bridge, and renderer Zustand stores.
  - Guarded build process cleanup to prevent premature deletion on process replacement races.
* **UI & Performance Enhancements**:
  - Refined startup welcome screen, About modal, and update check workflows with dynamic application version metadata.

---

## [1.1.0] - 2026-11-23 — *Security and Stability Release*

### 🛡️ Security Hardening (P0 Remediations)
* **Canonical Path Authorization & Symlink Defense**:
  - Replaced lexical `path.relative()` checks with canonical realpath resolution (`fs.realpathSync`) for both the workspace root and target files, preventing symlink directory traversal attacks.
  - Added parent directory canonical resolution for newly created non-existent target files.
  - Implemented `assertImmediateDestructiveAuthorization()` immediately before write, delete, and rename operations to mitigate Time-of-Check to Time-of-Use (TOCTOU) symlink swaps.
* **Strict Workspace & Session Trust**:
  - Eliminated automatic filesystem authorizations during `session:restore` and `workspace:watch`.
  - Enforced that workspace directories can only be approved following explicit user selection through native operating system dialogs (`dialog:openFolder`).
  - Separated `watchWorkspace()` from `addApprovedWorkspace()`.
* **Renderer Frame Origin & IPC Validation**:
  - Hardened `validateIpcSender()` to strictly reject calls originating from child frames, iframes, or untrusted web contexts (`senderFrame === sender.mainFrame`).
  - In development, verified exact matching protocol, hostname, and port from `VITE_DEV_SERVER_URL`.
  - In production, restricted valid IPC frame sources to the canonical packaged `file:` URL within `RENDERER_DIST`.
* **Content Security Policy Hardening**:
  - Stripped `'unsafe-inline'` from production CSP headers and `index.html` meta tags to prevent script injection.
  - Locked production window navigation (`will-navigate`) strictly to `pathToFileURL(indexHtml).href`, routing external links through `shell.openExternal()`.
  - Explicitly denied child window creation via `setWindowOpenHandler`.
* **Cross-Platform Process Spawning**:
  - Removed `cmd.exe /c` shell concatenation and `windowsVerbatimArguments: true` in build process spawning.
  - Enforced discrete binary/argument arrays with `shell: false` across all process executions.
  - Added `validateCommandTokens()` rejecting dangerous shell metacharacters (`|`, `&`, `;`, `` ` ``, `$`, `<`, `>`).
  - Enforced workspace boundary checks (`assertPathAuthorized`) on all working directories prior to build execution.
* **Preview Sandboxing & Sanitization**:
  - Removed `allow-same-origin` from the Live Web Preview iframe sandbox.
  - Added sanitization to Markdown Live Preview stripping `<script>`, `<iframe>`, `<object>`, `<embed>`, inline event handlers, and `javascript:` URIs.

### ⚡ Reliability & Multi-Window Isolation (P1 Remediations)
* **Per-Window Service Architecture**:
  - Converted the global file watcher, terminal processes, live reload server, and build tasks into window-keyed registries (`watchersByWindow`, `terminalsByWindow`, `serversByWindow`, `activeProcessesByWindow`).
  - Automatically cleaned up all background child processes upon `win.on('closed')`.
* **Live Server Hardening**:
  - Added session token verification (`/__xivig_live_reload?token=...`) on the SSE endpoint, returning `401 Unauthorized` on token mismatch.
  - Denylisted sensitive files and secrets (`.env*`, `.git*`, `id_rsa*`, `*.pem`, `*.key`, `*.sql`, `node_modules`).
  - Implemented safe URI decoding and canonical path resolution to prevent directory traversal escapes.
* **Selective Git Staging**:
  - Implemented granular Git staging APIs: `stageFile`, `unstageFile`, `stageAll`, `unstageAll`, `discardChanges`, and `getGitDiff`.
  - Updated the Git sidebar view with dedicated **Staged Changes** and **Changes** sections.
  - Enforced that commits require staged changes (`git diff --cached --quiet`), rejecting blind `git add -A` commits.
* **Atomic Versioned Storage**:
  - Replaced synchronous storage writes with atomic write-then-rename operations using temporary files (`.tmp`).
  - Added automatic backup recovery checkpoints (`xivig-store.backup.json`).
  - Introduced schema versioning (`CURRENT_STORE_SCHEMA_VERSION = 2`) with automatic migration logic (`migrateStore`).

### 📦 Runtime & Dependency Upgrades
* **Electron Upgrade**:
  - Upgraded runtime to **Electron 45.4.1**, eliminating all 46+ CVE advisories present in Electron 34.
* **Node.js Baseline**:
  - Upgraded CI/CD and release workflow baselines to **Node.js 24 LTS**.
* **Zero Vulnerability Audit**:
  - Configured package overrides for `glob` (`^14.0.6`) and `minimatch` (`^11.0.9`), achieving **0 vulnerabilities in `npm audit`**.

### ✨ Features & Product Improvements (P2)
* **Live Update Notification System**:
  - Implemented automated GitHub Release checking via `electron/main/updater/index.ts`.
  - Added non-intrusive alert banner (`UpdateNotificationBanner.tsx`) that automatically notifies installed editors when a new version is published.
  - Upgraded `UpdateCheckModal.tsx` to provide live version checks, changelog links, and direct download buttons.
  - Added `"Help: Check for Updates..."` command to the Command Palette (`Ctrl+Shift+P`).
* **Multi-File Project Search Engine**:
  - Built `ProjectSearchView.tsx` and integrated it into the Sidebar Search view (`Ctrl+Shift+F`).
  - Features real-time match counting, case-sensitive toggle (`Alt+C`), whole-word toggle (`Alt+W`), regular expressions (`Alt+R`), file include patterns, jump-to-match on click, and cross-file replacement.
* **External File Modification & Conflict Resolution**:
  - Automatically synchronizes clean editor buffers when files are edited externally on disk.
  - Displays an inline conflict warning banner on dirty buffers with **"Reload from Disk"** and **"Keep Local Edits"** options to prevent accidental data loss.
* **Large File Velocity Mode**:
  - Automatically detects files larger than $1.5\text{MB}$ and disables expensive AST linters and color regex engines to maintain smooth 60fps scrolling and editing velocity.
* **Interactive Status Bar Controls**:
  - Added clickable `LF` / `CRLF` conversion, switching buffer line endings while preserving CodeMirror undo history.
  - Added interactive indentation popover selector (`Spaces: 2`, `Spaces: 4`, `Spaces: 8`).
  - Added file encoding selector (`UTF-8`, `UTF-8 with BOM`, `UTF-16 LE`, `Windows 1252`).
* **Accessibility Enhancements**:
  - Added `role="status"`, `role="alert"`, and descriptive `aria-label` attributes across TitleBar, StatusBar, Search inputs, and modal dialogs.

### 🏗️ CI/CD, Build & Packaging Quality Gates
* **Automated Unit Testing**:
  - Integrated `vitest` with a dedicated test configuration (`vitest.config.ts`) and unit test suite covering color utilities, comment syntax detection, lorem ipsum generator, line ending conversions, large file thresholds, and semver comparison.
* **Dual TypeScript Enforcement**:
  - Bound both renderer typechecking (`tsc --noEmit`) and Node/Electron main typechecking (`tsc --project tsconfig.node.json --noEmit`) into the `"build"` quality gate.
* **Pinned CI/CD Actions**:
  - Pinned all third-party GitHub Actions to immutable 40-character commit SHAs in `.github/workflows/ci.yml` and `.github/workflows/release.yml`.
* **Multi-Platform Release Packaging**:
  - Aligned packaging targets with `README.md`:
    - **Windows**: NSIS Installer & Portable standalone executables.
    - **Linux**: AppImage, DEB, `tar.gz`, and `zip` archives.
    - **macOS**: DMG, ZIP, Universal binary with `hardenedRuntime`, entitlements (`build/entitlements.mac.plist`), and notarization secrets.

---

## [1.0.0] - 2026-11-20 — *Initial Release*

* Initial release of Xivig Text Editor.
* Sublime-grade multi-cursor editing, bracket matching, Emmet 2.0 expansion, and visual bookmarks.
* Integrated xterm.js terminal and build task execution.
* Built-in zero-config live web server with real-time reload.
* Markdown side-by-side live preview.
