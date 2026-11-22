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
