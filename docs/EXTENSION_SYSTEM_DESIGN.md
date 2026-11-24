# Xivig Extension System Architecture & Security Design

This document details the architectural specification, sandboxing model, manifest schema, and security boundaries for the Xivig Text Editor Extension System.

---

## 1. Design Principles & Threat Model

### The Primary Security Invariant
> **Third-party extension code MUST NEVER execute directly within the privileged Electron renderer process or main process.**

In a desktop code editor, executing untrusted third-party extension code in the Electron renderer grants attackers instant access to DOM credentials, IPC channels, and node integration bridges.

### Core Architecture: Out-of-Process Extension Host
```
┌────────────────────────────────────────────────────────┐
│  Electron Main Process (Privileged Node.js Runtime)    │
│  - Window Management & Security Gates                  │
│  - Capability Enforcement & IPC Multiplexer            │
└───────────────▲──────────────────────────▲─────────────┘
                │ IPC                      │ IPC
┌───────────────▼───────────┐  ┌───────────▼─────────────┐
│  Electron Renderer        │  │  Isolated Extension Host │
│  (Privileged UI / React)  │  │  (Unprivileged Worker)   │
│  - CodeMirror Editor DOM  │  │  - Third-party code run │
│  - UI Renderers / Themes  │  │  - JSON-RPC over IPC    │
│  - No 3rd-party scripts   │  │  - Sandboxed FS & Net   │
└───────────────────────────┘  └─────────────────────────┘
```

1. **Host Isolation**: Extensions execute in an isolated Node.js child process or Worker Thread (`xivig-extension-host`).
2. **Capability-Based Security**: Extensions must declare explicit permissions in their manifest. Any undeclared API invocation is denied at the IPC boundary.
3. **Deterministic Lifecycle**: Extensions register activations, contributions, and disposables. Unhandled exceptions in the extension host cannot crash the main editor.

---

## 2. Extension Manifest Format (`xivig-extension.json` / `package.json`)

Extensions are packaged with a standardized manifest defining metadata, engine compatibility, capabilities, activation triggers, and contribution points.

### Schema Definition
```json
{
  "$schema": "https://xivig.dev/schemas/extension-v1.json",
  "name": "xivig-rust-tools",
  "displayName": "Rust Language & Formatting Tools",
  "version": "1.0.0",
  "publisher": "community-devs",
  "description": "Rich language intelligence, snippets, and rustfmt formatting for Rust in Xivig.",
  "engines": {
    "xivig": "^1.3.0"
  },
  "categories": ["Languages", "Formatters"],
  "main": "./dist/extension.js",
  "activationEvents": [
    "onLanguage:rust",
    "onCommand:rust.format"
  ],
  "permissions": [
    "workspace:read",
    "terminal:exec",
    "commands:register"
  ],
  "contributes": {
    "commands": [
      {
        "command": "rust.format",
        "title": "Rust: Format File with rustfmt",
        "category": "Rust"
      }
    ],
    "languages": [
      {
        "id": "rust",
        "extensions": [".rs"],
        "aliases": ["Rust", "rust"]
      }
    ],
    "keybindings": [
      {
        "command": "rust.format",
        "key": "Alt+Shift+F",
        "when": "editorTextFocus && editorLangId == 'rust'"
      }
    ]
  }
}
```

---

## 3. Package Verification, Download, and Integrity

Third-party extension archives (`.xvpkg` / `.tar.gz`) follow a multi-stage validation pipeline before extraction:

```
Download Package (.xvpkg)
        │
        ▼
Verify TLS Certificate & Domain Signature
        │
        ▼
Validate SHA-256 Checksum against Registry
        │
        ▼
Verify Ed25519 Publisher Cryptographic Signature
        │
        ▼
Extract to Isolated Temporary Directory
        │
        ▼
Validate Manifest Schema, Engines & Capabilities
        │
        ▼
Atomic Directory Move into ~/.xivig/extensions/<id>-<version>
```

1. **Package Format**: Gzip-compressed tar archive containing `xivig-extension.json`, extension bundle, and assets.
2. **Cryptographic Signatures**: The registry signs all published hashes using Ed25519. The editor verifies package signatures against the Xivig Public Root Key.
3. **Symlink and Path Traversal Defense**: The tarball unpacker strictly rejects absolute paths or parent path segments (`../`) to prevent extraction directory escapes.

---

## 4. Permission Declarations & Least-Privilege Model

Extensions must request granular permissions in the `permissions` array:

| Permission | Description | Scope |
|---|---|---|
| `workspace:read` | Read files inside user-approved workspace roots | Restricted to active workspace canonical path |
| `workspace:write` | Write and modify files in active workspace | Requires workspace authorization |
| `terminal:exec` | Spawn build runners or shell processes | Validated against shell metacharacter filters |
| `network:http` | Make external network requests | Requires declared domain whitelist |
| `commands:register` | Register editor commands in Command Palette | Controlled namespace |
| `ui:statusbar` | Display status messages in Status Bar | Status bar slot |
| `ui:webview` | Display isolated sandboxed iframe webviews | `sandbox="allow-scripts"` (no IPC access) |

---

## 5. Extension Lifecycle Management

Extensions adhere to a strict state machine:

```
[Uninstalled] ──Install──> [Installed] ──Enable──> [Activated]
      ▲                         │                       │
      │                     Uninstall              Deactivate
      │                         │                       │
   Cleanup <────────────────────┴───────────────────────┘
```

1. **Install**: Unpack package, write metadata to settings store, index contributions (without executing code).
2. **Activate**: Extension code is loaded into `xivig-extension-host` only when matching an `activationEvents` trigger (e.g. `onLanguage:rust`).
3. **Deactivate**: When disabled or editor quits, extension host calls `deactivate()` on the extension export and disposes registered listeners.
4. **Uninstall**: Deactivate running instances, remove files atomically, clean up persisted configurations.

---

## 6. Public Extension API Surface (`xivig.*`)

Extensions interact with the editor via a typed, asynchronous JSON-RPC protocol exposed as the `xivig` global inside the extension host:

```typescript
import * as xivig from 'xivig';

export function activate(context: xivig.ExtensionContext) {
  // 1. Register a command
  const disposable = xivig.commands.registerCommand('rust.format', async () => {
    const editor = xivig.window.activeTextEditor;
    if (!editor) return;

    const formatted = await runRustfmt(editor.document.getText());
    await editor.edit((editBuilder) => {
      editBuilder.replace(editor.selection, formatted);
    });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {
  // Clean up background timers or tasks
}
```

### Core API Namespaces
- `xivig.commands`: Register and invoke actions.
- `xivig.workspace`: Document events, file search, configuration.
- `xivig.window`: Active editor access, status bar, notifications.
- `xivig.languages`: Diagnostic providers, completion, syntax highlighting.

---

## 7. Extension Update Management

1. **Version Checking**: The editor periodically queries `https://marketplace.xivig.dev/api/v1/extensions/updates` with installed extension IDs and versions.
2. **SemVer Validation**: Updates must satisfy the local editor version engine constraint (`engines.xivig`).
3. **Atomic Updates**: New versions are unpacked into a temporary folder. Upon application restart (or extension reload), directory pointers are swapped atomically.
4. **Downgrade & Rollback Protection**: If an updated extension crashes the extension host within 5 seconds of activation, the editor flags the package, terminates the host, and restores the previous stable version.
