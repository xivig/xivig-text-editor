# Security Policy — Xivig Text Editor 🛡️

The Xivig development team takes the security of our application and users seriously.

---

## Supported Versions

Only the latest stable release receives active security patches:

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :x:                |
| 1.0.x   | :x:                |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

If you discover a security vulnerability in Xivig Text Editor, please report it responsibly:

1. **Do not disclose the vulnerability publicly** on GitHub Issues, Twitter, or public channels.
2. Report via **GitHub Private Vulnerability Reporting** at [https://github.com/xivig/xivig-text-editor/security/advisories/new](https://github.com/xivig/xivig-text-editor/security/advisories/new).
3. Alternatively, contact the maintainers with a clear description, reproduction steps, and potential impact.

### What to Expect
- You will receive an acknowledgment within **48 hours**.
- A patch will be prioritized and verified.
- Once patched and released, public credit will be awarded in the release notes (unless anonymity is requested).

---

## Defensive Architecture

Xivig enforces multiple defense-in-depth layers:
- **Strict Context Isolation**: Renderer and Node.js execution spaces are strictly separated.
- **Node Integration Disabled**: `nodeIntegration: false` and `sandbox: true` on all web preferences.
- **Locked Navigation**: WebContents navigation is strictly constrained; external links open exclusively via system browser (`shell.openExternal`).
- **Path Traversal Defenses**: Built-in HTTP Live Server rigorously validates path boundaries against the workspace root.
