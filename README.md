# Xivig Text Editor ⚡

<p align="center">
  <img src="public/logo.png" alt="Xivig Text Editor" width="96" height="96" />
</p>

<p align="center">
  <strong>⚡ Ultra-fast, keyboard-first desktop code editor built for pure velocity — Sublime-grade multi-cursor editing, live web feedback, and pixel-perfect developer tooling.</strong>
</p>

<p align="center">
  <a href="#-key-features"><img src="https://img.shields.io/badge/Release-1.1-6c8cff.svg" alt="Release 1.1" /></a>
  <a href="#-tech-stack--architecture"><img src="https://img.shields.io/badge/Electron-45-47848f.svg" alt="Electron 45" /></a>
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
| **Windows** | `.exe` (Installer) | [**Download Setup (v1.0.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.0.0/Xivig.Text.Editor.Setup.1.0.0.exe) | NSIS Installer with desktop and start menu shortcuts |
| **Windows** | `.exe` (Portable) | [**Download Portable (v1.0.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.0.0/Xivig.Text.Editor.1.0.0.exe) | Zero-install standalone executable |
| **macOS** | `.dmg` (Universal) | [**Download DMG (v1.0.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.0.0/Xivig-Text-Editor-1.0.0.dmg) | macOS Disk Image (Apple Silicon & Intel) |
| **macOS** | `.zip` (Universal) | [**Download macOS Bundle (v1.0.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.0.0/Xivig-Text-Editor-1.0.0-mac.zip) | Native macOS `.app` bundle (Universal binary) |
| **macOS** | `.zip` (x64) | [**Download macOS x64 (v1.0.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.0.0/Xivig-Text-Editor-1.0.0-mac-x64.zip) | Native macOS x64 bundle archive |
| **Linux** | `.AppImage` (x64) | [**Download AppImage (v1.0.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.0.0/Xivig-Text-Editor-1.0.0.AppImage) | Standalone Linux x64 AppImage |
| **Linux** | `.deb` (x64) | [**Download DEB (v1.0.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.0.0/xivig-text-editor_1.0.0_amd64.deb) | Debian / Ubuntu amd64 package |
| **Linux** | `.tar.gz` (x64) | [**Download tar.gz (v1.0.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.0.0/Xivig-Text-Editor-1.0.0-linux-x64.tar.gz) | Standalone Linux x64 binary archive |
| **Linux** | `.zip` (x64) | [**Download zip (v1.0.0)**](https://github.com/xivig/xivig-text-editor/releases/download/v1.0.0/Xivig-Text-Editor-1.0.0-linux-x64.zip) | Standalone Linux x64 zip bundle |

> All releases, release notes, and SHA-256 checksums are hosted on the [GitHub Releases Page](https://github.com/xivig/xivig-text-editor/releases).

---

## ✨ Key Features

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
- **Build Systems (`Ctrl+B` / `Ctrl+Shift+B`)**: Execute project builds with streamed logs in the Output panel.
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
| `Ctrl+B` | Toggle Sidebar / Run Build | Global |
| `Ctrl+\`` | Toggle Integrated Terminal | Global |
| `Ctrl+Shift+P` / `F1` | Command Palette | Global |
| `Ctrl+P` | Quick Open File | Global |
| `Ctrl+R` | Go to Symbol in Document | Editor |
| `Ctrl+F` | Find in Document | Editor |
| `Ctrl+H` | Replace in Document | Editor |
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
├── Desktop Shell: Electron 45 (Main Process, Preload IPC Bridge, Window Management)
├── Frontend Application: React 18 + TypeScript + Zustand State Stores
│   ├── Editor Engine: CodeMirror 6 (Transactions, Compartments, Syntax Trees)
│   ├── Emmet Engine: Custom AST expander supporting nesting, multipliers, and lorem
│   ├── Color Engine: CSS swatch decoration extension + 2D HSL/HEX color picker
│   ├── Terminal: xterm.js + WebGL addon + node-pty/child_process shell bridge
│   ├── Live Server: Native Node.js HTTP server + WebSocket live-reload injector
│   └── Formatter: js-beautify (HTML, CSS, JavaScript, JSON)
└── Build & Bundler: Vite 6 + vite-plugin-electron + electron-builder
```

---

## 📦 Multi-Platform Installation & Binaries

Xivig Text Editor is packaged for **Windows**, **Linux**, and **macOS**.

### Binary Types Produced
- **Windows**:
  - `Xivig-Text-Editor-Setup-1.0.0.exe` (NSIS Installer with desktop/start-menu shortcuts)
  - `Xivig-Text-Editor-1.0.0-portable.exe` (Zero-install standalone portable executable)
  - `win-unpacked/` (Direct portable folder)
- **Linux**:
  - `Xivig-Text-Editor-1.0.0.AppImage` (Universal plug-and-play Linux executable)
  - `xivig-text-editor_1.0.0_amd64.deb` (Debian/Ubuntu package)
- **macOS**:
  - `Xivig-Text-Editor-1.0.0.dmg` (macOS Drag-and-Drop Disk Image for Apple Silicon & Intel)
  - `Xivig-Text-Editor-1.0.0-mac.zip` (Portable `.app` bundle)

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
- Automatically publishes release assets to GitHub Releases upon tagging a version (e.g. `v1.0.0`).

---

## 📄 Release Information & Attributions

- **App Name**: Xivig Text Editor
- **Release Version**: 1.0 (Build 1.0.0)
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
