# Changelog

All notable changes to the **Xivig Text Editor** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
