# Xivig Text Editor — Comprehensive How-To Guide 📖

Welcome to the official user manual and how-to guide for **Xivig Text Editor** (Release 1.5 — Build 1.5.0). This document provides detailed, step-by-step instructions on utilizing every feature of Xivig to maximize your coding productivity.

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
12. [Rainbow Brackets & Indentation Guides](#12-rainbow-brackets--indentation-guides)
13. [Themes & Graphical Settings](#13-themes--graphical-settings)
14. [Seamless In-Place Auto-Updater](#14-seamless-in-place-auto-updater)
15. [Language Intelligence (LSP)](#15-language-intelligence-lsp)
16. [Interactive Debugger (DAP)](#16-interactive-debugger-dap)
17. [Vim Mode & Developer Productivity Suite](#17-vim-mode--developer-productivity-suite)
18. [Troubleshooting & FAQs](#18-troubleshooting--faqs)

---

## 1. Getting Started

### Launching the Application
- **Windows**: Run `Xivig Text Editor.exe` or launch from the Start Menu / Desktop shortcut.
- **Linux**: Execute the `.AppImage` (ensure executable permission: `chmod +x Xivig-Text-Editor-*.AppImage`) or install the `.deb` package (`sudo dpkg -i xivig-text-editor_*.deb`).
- **macOS**: Extract `Xivig-Text-Editor-1.3.0-mac.zip` (or `.dmg`) and move `Xivig Text Editor.app` to your `/Applications` folder. On first launch, right-click and select **Open** or run `xattr -cr "/Applications/Xivig Text Editor.app"`.

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

### Build Systems (`Ctrl+Shift+B` / `F7`)
- Press **`Ctrl+Shift+B`** or **`F7`** to execute the active project build (runs `npm run build`, `cargo build`, `make`, or user-defined build script).
- Press `Ctrl+B` anytime to toggle the primary sidebar without interrupting builds.
- Press `Ctrl+J` or `Ctrl+\`` to toggle the bottom drawer panel (Terminal, Output, Problems, Debugger).
- The build output streams in real-time to the **Output** bottom panel with ANSI color rendering.

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

## 12. Rainbow Brackets & Indentation Guides

Xivig 1.3 includes built-in syntax-aware Rainbow Brackets and Indentation Guides:
* **Bracket Depth Matching**: Opening and closing brackets (`()`, `{}`, `[]`) are matched based on the language's Lezer syntax tree. Both matching ends share identical colors from a 6-tier cyclic rainbow palette (Red ➔ Orange ➔ Yellow ➔ Green ➔ Cyan ➔ Purple).
* **Indentation Guides**: Colored vertical guides align with code blocks according to their nesting level, making complex multi-nested structures immediately understandable.
* **Toggling**:
  1. Open Settings (`Ctrl+,`).
  2. Navigate to **Extensions ➔ Rainbow Brackets**.
  3. Toggle **Rainbow Brackets** or **Rainbow Indentation Guides** on/off without restarting the editor.

---

## 13. Themes & Graphical Settings

### Color Themes (10 Official Themes)
* **Opening Theme Selector**: Press `Ctrl+K Ctrl+T` or navigate to Settings (`Ctrl+,`) ➔ **Color Themes**.
* **Available Themes**:
  1. **Xivig Dark (Default)**: Balanced high-contrast dark theme.
  2. **Dracula (Official)**: Official Dracula color palette with refined token contrast and optical ligature alignment.
  3. **Monokai Pro**: Classic Sublime Text high-contrast palette.
  4. **One Dark Pro**: Atom-inspired warm dark theme.
  5. **Solarized Light**: Clean, low-contrast daylight theme.
  6. **Nord Theme**: Arctic blue-tinted cool palette.
  7. **Tokyo Night**: Vibrant neon Japanese evening aesthetic.
  8. **Cyberpunk 2077**: Electric yellow and deep blue high-contrast cyberpunk styling.
  9. **GitHub Dark**: Professional dark grey GitHub interface styling.
  10. **SynthWave '84**: 80s retro neon aesthetic.

### VS Code-Style Settings (`Ctrl+,`)
* **Live Search**: Type into the top search bar to filter settings dynamically.
* **Category Tree**: Navigate between *Text Editor*, *Workbench*, *Window*, *Features*, *Application*, and *Extensions*.
* **Customization**: Configure Font Size, Font Family, Tab Size, Format On Save, Auto Save Delay, Word Wrap, and more.

---

## 14. Seamless In-Place Auto-Updater

Xivig features a VS Code-style auto-update workflow:
* **Background Check & Download**: Xivig checks for updates on startup or when manually invoked. When an update is detected, it downloads silently in the background.
* **Update Notifications**:
  * **Top Banner**: Displays download progress (`0% - 100%`) and transitions to a "Restart Xivig to Update" banner upon completion.
  * **Activity Bar Badge**: A green badge dot appears on the Settings gear button when an update is downloaded and ready.
  * **Status Bar Indicator**: An interactive `[⟳ Restart to Update]` indicator appears in the status bar.
  * **Command Palette**: Run `Help: Restart to Update (Apply Downloaded Update)` anytime.
* **In-Place Application**: Clicking restart silently applies the update (using Windows NSIS `/S --force-run`) and immediately relaunches Xivig into the latest version without showing an installation wizard.

---

## 15. Language Intelligence (LSP)

Xivig includes a full Language Server Protocol (LSP) client over JSON-RPC 2.0:
- **Real-Time Diagnostics**: Inline error/warning squiggles with instant sync to the Problems bottom drawer (`Ctrl+J`). Click any problem entry to jump directly to the faulty line and column.
- **Hover Documentation**: Hover over functions, variables, types, or classes to inspect type signatures and markdown docstrings.
- **Go to Definition (`F12`)**: Instantly jump to the origin definition of any symbol across workspace files.
- **Go to Declaration (`Ctrl+F12`) & Type Definition**: Jump to type signatures or interface declarations.
- **Find References (`Shift+F12`)**: Search and list all references to the symbol under cursor across the workspace.
- **Code Actions & Quick Fixes (`Ctrl+.`)**: Trigger automated refactorings, import resolution, and error fixes provided by the active language server.
- **Parameter Signature Help**: Contextual documentation and parameter highlight while typing arguments inside parentheses.
- **Inlay Hints**: Inline visual hints for parameter names and inferred return types without modifying file content.

---

## 16. Interactive Debugger (DAP)

Xivig provides full Debug Adapter Protocol (DAP) client capabilities:
- **Toggle Breakpoints**: Click in the editor gutter or press `F9` on any line. Supports standard breakpoints, conditional breakpoints (`x > 5`), and logpoints.
- **Execution Controls**:
  - **Start / Continue (`F5`)**: Launch or resume program execution.
  - **Step Over (`F10`)**: Execute next line without entering function bodies.
  - **Step Into (`F11`)**: Step into the called function.
  - **Step Out (`Shift+F11`)**: Run until current function completes.
  - **Restart (`Ctrl+Shift+F5`)**: Relaunch the active debug session.
  - **Stop (`Shift+F5`)**: Terminate the debugging session.
- **Call Stack & Threads**: Inspect all active execution threads, stack frames, and jump across execution scopes.
- **Variables & Scopes**: Inspect Local, Closure, and Global variables with collapsible properties and real-time evaluation.
- **Watch Expressions & REPL**: Add watch expressions to track values on every step, and execute arbitrary code in the Debug Console.

---

## 17. Vim Mode & Developer Productivity Suite

### Vim Modal Editing
Xivig includes native Vim modal editing:
- **Modes**: Toggle seamlessly between **Normal**, **Insert** (`i`, `a`, `o`, `I`, `A`, `O`), **Visual** (`v`), and **Visual Line** (`V`) modes.
- **Motions**: Standard `h`, `j`, `k`, `l`, word jumps `w`, `b`, `e`, line boundaries `0`, `$`, `^`, document boundaries `gg`, `G`, and character find `f`, `F`, `t`, `T`.
- **Text Objects**: `iw` (inner word), `aw` (a word), `i"` (inside quotes), `i(` (inside parentheses), `i{` (inside curly braces).
- **Ex Commands**: Press `:` in Normal mode to access `:w` (save), `:q` (close), `:wq` / `:x` (save and close), and regex find/replace `:s/target/replacement/g`.

### Keystroke Macros
- Press **`Ctrl+Shift+R`** to begin recording keystrokes (red recording indicator in status bar).
- Perform any editing sequence across lines or selections.
- Press **`Ctrl+Shift+R`** again to stop recording.
- Open Command Palette (`Ctrl+Shift+P`) and choose **Replay Macro** or map to a custom shortcut to replay the sequence anytime.

### Universal Developer Toolbox (`Ctrl+Alt+T`)
Press `Ctrl+Alt+T` to open the quick-access developer drawer:
- **JSON Studio**: Beautify, minify, and validate JSON with path inspection.
- **Regex Workbench**: Interactive regular expression tester with flags and match group capture.
- **Base64 & URL Codecs**: Encode and decode text snippets on the fly.
- **Hashes & UUIDs**: Generate SHA-256 hashes, MD5 checksums, and random UUID v4 identifiers.
- **Color & Timestamp Converters**: Convert between HEX/RGB/HSL and Unix/ISO timestamps.
- **Persistent Scratchpad**: Multi-tab temporary buffer that saves across editor sessions.

### AI Coding Companion
Open the AI Assistant sidebar panel:
- Connect to OpenAI API keys or local **Ollama** instances (`http://localhost:11434`).
- Explain code, generate unit tests, suggest refactorings, and insert diffs with a single click.

---

## 18. Troubleshooting & FAQs

### Q: Why are ligatures not showing up?
**A**: Ensure **Font Ligatures** is toggled ON in Settings (`Ctrl+,`). Also make sure your chosen font is set to a ligature-supporting family such as `Fira Code`, `JetBrains Mono`, or `Cascadia Code`.

### Q: How do I change the indentation from 2 spaces to 4 spaces?
**A**: Open Settings (`Ctrl+,`), navigate to the **Editor** tab, and under **Tab Size**, click **4 Spaces**.

### Q: How do I update Xivig to the latest version?
**A**: When an update is ready, simply click **Restart to Update** on the status bar, activity bar gear icon, or notification banner. Xivig will restart into the updated version in-place.

### Q: My Live Server port 5500 is in use. How does it handle conflicts?
**A**: The Xivig Live Server automatically detects occupied ports and seamlessly shifts to the next available port (e.g. 5501, 5502) without interruption.

### Q: How do I reset zoom?
**A**: Press `Ctrl+0` to restore standard 100% zoom. Use `Ctrl+=` to zoom in and `Ctrl+-` to zoom out.

---

*Xivig Text Editor — Fast, Lightweight, and Keyboard-First.*  
*Copyright © 2026 Xivig. All rights reserved.*
