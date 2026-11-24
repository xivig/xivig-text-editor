# Markdown live-scroll synchronization fix

This patch replaces the previous scroll-height/percentage-based Markdown preview
synchronization with bidirectional source-line anchors.

## Changes

- Editor-to-preview and preview-to-editor synchronization now use rendered
  `data-line` anchors and CodeMirror's `EditorView.scrollIntoView` API.
- Scroll work is coalesced to one animation-frame update.
- Programmatic scroll events are guarded to prevent feedback loops.
- The last user-controlled scroll side is preserved when Markdown HTML is
  re-rendered or images/fonts cause the preview layout to resize.
- Fenced code blocks now expose an anchor for each source line.
- Multiline paragraphs and table rows expose additional source-line anchors.
- The existing Sync On/Off control and preview UI are retained.
- Added unit tests for line/preview-position interpolation and additional
  Markdown line-anchor coverage.

## Verify locally

Run from the project root:

```bash
npm ci
npm test
npm run build
npm run dev
```

Then open a long `.md` file, use `Ctrl+Shift+V`, and test scrolling in both
directions. Include documents with long fenced code blocks, tables, images,
wrapped paragraphs, and blank lines.

The uploaded archive did not contain `node_modules`; dependency installation
was attempted during this patch session but did not complete within the
available execution window. The modified files passed TypeScript syntax
transpilation, and the scroll interpolation helper passed its standalone
checks. A full project typecheck, Vitest run, Electron build, and interactive
runtime test remain to be run on the developer machine.
