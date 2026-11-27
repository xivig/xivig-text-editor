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
- **`src/components/editor/`**: CodeMirror 6 extensions, sublime keybindings ([`sublimeKeymap.ts`](src/components/editor/sublimeKeymap.ts)), bookmarking, auto-rename tags, and CSS color swatch decorations.
- **`src/components/sidebar/`**: Explorer tree, Git source control, search panel, extensions view.
- **`src/components/menubar/`**: Native desktop-style menu actions.
- **`src/components/modals/`**: Command Palette (`Ctrl+Shift+P`), Quick Open (`Ctrl+P`), Color Picker (`Ctrl+Alt+C`), Lorem Ipsum (`Ctrl+Alt+L`), and About modal.
- **`src/stores/`**: Reactive state management with Zustand ([`editorStore.ts`](src/stores/editorStore.ts), [`fileStore.ts`](src/stores/fileStore.ts), [`settingsStore.ts`](src/stores/settingsStore.ts), [`uiStore.ts`](src/stores/uiStore.ts), [`liveServerStore.ts`](src/stores/liveServerStore.ts), [`buildStore.ts`](src/stores/buildStore.ts)).
- **`src/utils/`**: Emmet parser & expansion engine, `js-beautify` code formatter, smart multi-language line & block comment handlers ([`commentUtils.ts`](src/utils/commentUtils.ts)).
- **`electron/`**: Electron main process ([`electron/main/index.ts`](electron/main/index.ts)) handling window lifecycle, native menus, IPC handlers (filesystem, git, shell), and preload bridge ([`electron/preload/index.ts`](electron/preload/index.ts)).

---

## 🧪 Testing Your Changes

Before submitting a Pull Request, ensure:
1. `npm run build` and `npm test` succeed without any TypeScript errors, test failures, or bundling warnings.
2. New features or keybindings do not collide with standard system shortcuts.
3. Code formatting adheres to standard project indentation (2 spaces) and clean modular design.
4. Security-sensitive changes follow the guidelines in [SECURITY.md](SECURITY.md).

---

## 📬 Submitting a Pull Request

1. Create a feature branch: `git checkout -b feat/my-new-feature`
2. Commit your changes: `git commit -m "feat: describe your change"`
3. Push to your fork: `git push origin feat/my-new-feature`
4. Open a Pull Request on GitHub against the `master` branch.
