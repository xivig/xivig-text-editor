# Xivig Text Editor — Comprehensive How-To Guide 📖

Welcome to the official user manual and how-to guide for **Xivig Text Editor** (Release 1.0). This document provides detailed, step-by-step instructions on utilizing every feature of Xivig to maximize your coding productivity.

---

## Table of Contents
1. [Getting Started](#1-getting-started)
2. [Project & Workspace Navigation](#2-project--workspace-navigation)
3. [Multi-Cursor & Advanced Editing](#3-multi-cursor--advanced-editing)
4. [Code Formatting & Block Comments](#4-code-formatting--block-comments)
5. [Emmet & Lorem Ipsum Generation](#5-emmet--lorem-ipsum-generation)
6. [Color Picker & Design Tools](#6-color-picker--design-tools)
7. [Live Server & Real-Time Preview](#7-live-server--real-time-preview)
8. [Integrated Terminal & Build Systems](#8-integrated-terminal--build-systems)
9. [Font Ligatures & Appearance Settings](#9-font-ligatures--appearance-settings)
10. [Git Version Control](#10-git-version-control)
11. [Command Palette & Quick Open](#11-command-palette--quick-open)
12. [Troubleshooting & FAQs](#12-troubleshooting--faqs)

---

## 1. Getting Started

### Launching the Application
- **Windows**: Run `Xivig Text Editor.exe` or launch from the Start Menu / Desktop shortcut.
- **Linux**: Execute the `.AppImage` (ensure executable permission: `chmod +x Xivig-Text-Editor-*.AppImage`) or install the `.deb` package (`sudo dpkg -i xivig-text-editor_*.deb`).
- **macOS**: Extract `Xivig-Text-Editor-1.0.0-mac.zip` (or `.dmg`) and move `Xivig Text Editor.app` to your `/Applications` folder. On first launch, right-click and select **Open** or run `xattr -cr "/Applications/Xivig Text Editor.app"`.

### First-Run Overview
When you open Xivig Text Editor for the first time, you will be greeted by the **Welcome** screen.
- **Left Activity Bar**: Quick access to Explorer, Search & Replace, Git, Extensions, and Settings.
- **Top Menubar**: Standard desktop menus (File, Edit, Selection, View, Tools, Help).
- **Editor Area**: Tab bar supporting multiple tabs, split panes, and minimap.
- **Status Bar**: Live line/column counter, file encoding (UTF-8), indentation format (Spaces: 2), active language syntax, and Live Server toggle.

---

## 2. Project & Workspace Navigation

### Opening Files and Folders
- **Open File**: Press `Ctrl+O` or select `File -> Open File...`.
- **Open Folder / Workspace**: Press `Ctrl+K Ctrl+O` or select `File -> Open Folder...`. Xivig immediately indexes the directory tree in the **Explorer** sidebar.
- **Quick Open (`Ctrl+P`)**: Search files across the entire workspace by typing any part of the path or filename.

### Context Menu Operations
Right-click on any file or folder in the Explorer sidebar or directly inside the text editor to reveal the context menu:
- **New File...**: Create a new document in the selected folder.
- **New Folder...**: Create a subfolder.
- **Edit to Right**: Open the file in a split editor column on the right side.
- **Open / Run**: Open the document or launch Live Web Preview for `.html` files.
- **Open in New Window**: Launch a standalone secondary window.
- **Format Document (`Ctrl+Alt+B`)**: Instantly beautify the file or selected code.
- **Toggle Line Comment (`Ctrl+/`)**: Add/remove single-line comment tokens.
- **Toggle Block Comment (`Ctrl+Shift+/`)**: Wrap/unwrap selection in multi-line block comments.
- **Find & Replace...**: Open workspace search.
- **Copy Name / Copy Path / Copy Relative Path**: Fast clipboard actions.
- **Duplicate...**: Clone the file with an automatic duplicate name.
- **Rename...**: Inline or modal file renaming.
- **Reveal in File Explorer**: Open the folder in the native OS file manager (Windows Explorer, Finder, or file manager).
- **Delete**: Safely delete the file or folder.

---

## 3. Multi-Cursor & Advanced Editing

Xivig Text Editor incorporates Sublime Text's multi-cursor editing model.

### Multi-Cursor Selection Shortcuts
| Shortcut | Action | Description |
|---|---|---|
| `Ctrl+D` | **Select Next Occurrence** | Add next matching word to the multi-selection. |
| `Alt+F3` / `Ctrl+Alt+G` | **Select All Occurrences** | Select every occurrence of the current word across the file. |
| `Ctrl+Shift+L` | **Split Selection into Lines** | Place a cursor on every line within the selected range. |
| `Ctrl+Alt+Up` / `Ctrl+Alt+Down` | **Add Cursor Above / Below** | Vertically extend the cursor column. |
| `Alt + Mouse Click` | **Add Arbitrary Cursor** | Place cursor at custom coordinates. |
| `Shift + Alt + Mouse Drag` | **Box / Column Selection** | Rectangular marquee selection. |
| `Ctrl+U` / `Ctrl+Shift+U` | **Undo / Redo Selection** | Step backward/forward through cursor selections without changing code. |

### Line Operations
- **Duplicate Line Down (`Shift+Alt+Down` or `Ctrl+Shift+D`)**: Clones the active line or selected text block immediately below.
- **Move Line Up/Down (`Alt+Up` / `Alt+Down`)**: Swaps lines smoothly with syntax re-indentation.
- **Delete Line (`Ctrl+Shift+K`)**: Cuts the current line instantly.
- **Join Lines (`Ctrl+J`)**: Collapses subsequent lines onto the current line.
- **Sort Lines (`F9` / `Ctrl+F9`)**: Alphabetically sort lines in ascending or descending order.

### Bookmarks Navigation
- **Toggle Bookmark (`Ctrl+F2`)**: Places a visual blue ribbon bookmark in the gutter.
- **Next / Previous Bookmark (`F2` / `Shift+F2`)**: Jumps between bookmarked locations.
- **Clear All Bookmarks (`Ctrl+Shift+F2`)**: Clears all markers in the file.

---

## 4. Code Formatting & Block Comments

### Formatting Code (`Ctrl+Alt+B`)
Xivig includes an integrated code beautifier powered by `js-beautify`:
- **Format Whole File**: Press `Ctrl+Alt+B` with no selection, or right-click and choose **Format Document**.
- **Format Selected Code**: Highlight any code snippet and press `Ctrl+Alt+B` to reformat only the highlighted region.
- Supported languages: **HTML, CSS, SCSS, LESS, JavaScript, TypeScript, JSX, TSX, JSON, Vue, PHP**.

### Smart Line & Block Comments
- **Line Comment (`Ctrl+/`)**:
  - Automatically identifies language syntax (e.g., `//` for JS/TS/CSS, `#` for Python/Shell, `--` for SQL).
  - Toggles comment state across all selected lines.
- **Block Comment (`Ctrl+Shift+/` or `Alt+Shift+A`)**:
  - **HTML/XML/SVG**: Wraps in `<!-- ... -->`.
  - **JavaScript/CSS/Rust/C/C++**: Wraps in `/* ... */`.
  - **Python**: Wraps in `""" ... """`.
  - Seamlessly unwraps already-commented selections.
  - When no text is selected, inserts empty block comment tokens and places the cursor right in the middle for instant typing.

---

## 5. Emmet & Lorem Ipsum Generation

### Emmet 2.0 Abbreviation Expansion
Type any Emmet abbreviation and press **`Tab`** to expand it:
- `html:5` or `!` -> Complete HTML5 boilerplate.
- `div.container>header+main.content>ul.nav>li*3>a{Item $}` -> Deep nested DOM structure.
- `link:css` -> `<link rel="stylesheet" href="style.css">`
- `script:src` -> `<script src=""></script>`
- `c#ff0` in CSS -> `color: #ff0;`
- `m10-20` in CSS -> `margin: 10px 20px;`

### Wrap with Abbreviation (`Ctrl+Alt+W`)
1. Select any block of HTML or text.
2. Press `Ctrl+Alt+W` or choose **Edit -> Emmet: Wrap with Abbreviation...**.
3. Type an abbreviation (e.g. `ul.list>li*` or `div.card`).
4. Press Enter; the selected content is automatically wrapped inside each leaf node.

### Lorem Ipsum Generator (`Ctrl+Alt+L`)
- **Interactive Modal**: Press `Ctrl+Alt+L` to open the generator dialog. Choose:
  - Paragraphs, sentences, words, or lists.
  - Custom count.
  - Optional HTML `<p>` tag wrapping.
- **Inline Tab Expansion**:
  - Type `lorem` and press `Tab` -> Generates 30 words of standard placeholder text.
  - Type `lorem10` and press `Tab` -> Generates 10 words.
  - Type `p>lorem20` and press `Tab` -> `<p>Lorem ipsum dolor sit amet...</p>`.
  - Type `ul>li*3>lorem5` and press `Tab` -> An unordered list with 3 items of 5 words each.

---

## 6. Color Picker & Design Tools

### Interactive Color Swatches
In any CSS, SCSS, LESS, or HTML file, Xivig renders inline color preview swatches next to hex, rgb, rgba, hsl, and named CSS colors.
- **Hover Zoom**: Hovering over a swatch scales it smoothly for close inspection.
- **Quick Edit Color Picker (`Ctrl+Alt+C`)**:
  1. Position your cursor on or select any color code (e.g., `#6c8cff`).
  2. Press `Ctrl+Alt+C` or click the color swatch.
  3. The color picker modal appears with 2D saturation/value canvas, hue slider, opacity slider, and format toggles (HEX, RGBA, HSLA).
  4. Select your desired color and click **Apply**; the editor updates the text in place.

---

## 7. Live Server & Real-Time Preview

### Built-in Live Server
Xivig features a zero-dependency local HTTP development server with live reload:
- Click **Go Live** on the bottom status bar or press `View -> Live Server: Toggle (Go Live)`.
- The server binds to `http://localhost:5500` (or the next available port).
- Any saved file triggers automatic browser hot-reload.
- Click **Live Server: Open in Browser** (`View -> Live Server: Open in Browser`) to launch the workspace root in your default system browser.

### Split Previews Inside Editor
- **Live Web Preview (`Ctrl+K V`)**: Renders HTML/CSS/JS files directly side-by-side inside an embedded web view.
- **Markdown Live Preview (`Ctrl+Shift+V`)**: Renders GitHub-flavored Markdown with synchronized scrolling, code syntax highlighting, and table support.

---

## 8. Integrated Terminal & Build Systems

### Integrated Terminal (`Ctrl+\``)
- Toggle the bottom drawer terminal with **`Ctrl+\``** (backtick).
- Powers on with your native system shell:
  - Windows: **PowerShell** / **Command Prompt**
  - Linux/macOS: **bash** / **zsh**
- Supports full ANSI color codes, xterm.js acceleration, shell resizing, and process killing.

### Build Systems (`Ctrl+B` / `Ctrl+Shift+B`)
- Press `Ctrl+B` to execute the active project build (runs `npm run build`, `cargo build`, `make`, or user-defined build script).
- Press `Ctrl+Shift+B` to select build targets.
- The build output streams in real-time to the **Output** bottom panel.

---

## 9. Font Ligatures & Appearance Settings

### Enabling / Disabling Font Ligatures
1. Open Settings (`Ctrl+,` or click the Gear icon in the Activity Bar).
2. Under the **Editor** tab, locate **Font Ligatures**.
3. Toggle the switch ON or OFF.
   - When **Enabled**: Coding symbols such as `=>`, `===`, `!=`, `<=`, `>=`, `<!--` combine into elegant typographic ligatures.
   - When **Disabled**: Characters render as standard separate monospace glyphs.
4. You can also toggle ligatures anytime via **View -> Toggle Font Ligatures** or from the **Command Palette (`Ctrl+Shift+P`)**.

### Choosing Programming Fonts
Select from pre-configured ligature-optimized fonts:
- **Fira Code (Ligatures)**
- **JetBrains Mono (Ligatures)**
- **Cascadia Code (Ligatures)**
- **Consolas**
- **System Monospace**

---

## 10. Git Version Control

The Git panel in the left sidebar (`Activity Bar -> Source Control`) provides built-in Git tools:
- **Status Overview**: Track Modified (`M`), Untracked (`U`), and Deleted (`D`) files.
- **Diff View**: Click any modified file to view side-by-side or inline diffs against `HEAD`.
- **Branch Indicator**: See current checked-out branch in the status bar and sidebar.
- **Commit**: Type a commit message in the summary box and press `Ctrl+Enter` or click **Commit**.

---

## 11. Command Palette & Quick Open

### Command Palette (`Ctrl+Shift+P` / `F1`)
Access every single feature, command, modal, and setting without touching the mouse:
- Type keywords to fuzzy-filter commands.
- Use `Up` and `Down` arrow keys to navigate.
- Press `Enter` to execute.

### Quick Open (`Ctrl+P`)
- Type filename or path to jump straight to any file.
- Type `@` followed by symbol name (`Ctrl+R`) to search functions, classes, and IDs in the active document.
- Type `:` followed by line number to jump to a specific line (e.g. `:42`).

---

## 12. Troubleshooting & FAQs

### Q: Why are ligatures not showing up?
**A**: Ensure **Font Ligatures** is toggled ON in Settings (`Ctrl+,`). Also make sure your chosen font is set to a ligature-supporting family such as `Fira Code`, `JetBrains Mono`, or `Cascadia Code`.

### Q: How do I change the indentation from 2 spaces to 4 spaces?
**A**: Open Settings (`Ctrl+,`), navigate to the **Editor** tab, and under **Tab Size**, click **4 Spaces**.

### Q: My Live Server port 5500 is in use. How does it handle conflicts?
**A**: The Xivig Live Server automatically detects occupied ports and seamlessly shifts to the next available port (e.g. 5501, 5502) without interruption.

### Q: How do I reset zoom?
**A**: Press `Ctrl+0` to restore standard 100% zoom. Use `Ctrl+=` to zoom in and `Ctrl+-` to zoom out.

---

*Xivig Text Editor — Fast, Lightweight, and Keyboard-First.*  
*Copyright © 2026 Xivig. All rights reserved.*
