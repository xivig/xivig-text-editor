# Contributing to Xivig Text Editor

Thank you for your interest in contributing to **Xivig Text Editor**! We welcome contributions from developers of all skill levels.

---

## 🛠️ Development Setup

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/xivig/xivig-text-editor.git
   cd xivig-text-editor
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start in Development Mode**:
   ```bash
   npm run dev
   ```
   This launches Vite with hot module replacement for React and starts Electron concurrently.

4. **Verify TypeScript & Production Build**:
   ```bash
   npm run build
   ```

---

## 🏗️ Architecture Overview

- **`src/app/`**: Root application shell, state hydration, and layout coordination.
- **`src/components/editor/`**: CodeMirror 6 extensions, sublime keybindings (`sublimeKeymap.ts`), bookmarking, auto-rename tags, and CSS color swatch decorations.
- **`src/components/sidebar/`**: Explorer tree, Git source control, search panel, extensions view.
- **`src/components/menubar/`**: Native desktop-style menu actions.
- **`src/components/modals/`**: Command Palette (`Ctrl+Shift+P`), Quick Open (`Ctrl+P`), Color Picker (`Ctrl+Alt+C`), Lorem Ipsum (`Ctrl+Alt+L`), and About modal.
- **`src/stores/`**: Reactive state management with Zustand (`editorStore.ts`, `fileStore.ts`, `settingsStore.ts`, `uiStore.ts`, `liveServerStore.ts`, `buildStore.ts`).
- **`src/utils/`**: Emmet parser & expansion engine, `js-beautify` code formatter, smart multi-language line & block comment handlers (`commentUtils.ts`).
- **`electron/`**: Electron main process (`main/index.ts`) handling window lifecycle, native menus, IPC handlers (filesystem, git, shell), and preload bridge (`preload/index.ts`).

---

## 🧪 Testing Your Changes

Before submitting a Pull Request, ensure:
1. `npm run build` succeeds without any TypeScript errors or bundling warnings.
2. New features or keybindings do not collide with standard system shortcuts.
3. Code formatting adheres to standard project indentation (2 spaces) and clean modular design.

---

## 📬 Submitting a Pull Request

1. Create a feature branch: `git checkout -b feat/my-new-feature`
2. Commit your changes: `git commit -m "feat: describe your change"`
3. Push to your fork: `git push origin feat/my-new-feature`
4. Open a Pull Request on GitHub against the `master` branch.
