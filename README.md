# Xivig Editor ⚡

A fast, lightweight, keyboard-first desktop text and code editor inspired by Sublime Text.

## 🚀 Built With
- **Shell**: [Electron 34](https://www.electronjs.org/) + Node.js
- **Frontend**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Editor Core**: [CodeMirror 6](https://codemirror.net/) (Modular, transaction-based, multi-cursor)
- **Bundler & Tooling**: [Vite 6](https://vitejs.dev/) + `vite-plugin-electron`
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🎨 Design System
- **Theme**: Xivig Dark (`#17191F`)
- **Accent**: Modern Electric Indigo (`#6C8CFF`)
- **UI Surfaces**: Deep slate (`#1D2028` / `#191B22`)
- **Typography**: Clean system UI font + Monospace (`Cascadia Code`, `Fira Code`, `JetBrains Mono`, `Consolas`)

---

## ⌨️ Shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl + N` | New Document |
| `Ctrl + O` | Open File |
| `Ctrl + K Ctrl + O` | Open Folder |
| `Ctrl + S` | Save File |
| `Ctrl + Shift + S` | Save As |
| `Ctrl + W` | Close Active Tab |
| `Ctrl + B` | Toggle Sidebar |

---

## 💻 Development Commands
```bash
# Run application in development mode
npm run dev

# Typecheck and build production distribution
npm run build
```
