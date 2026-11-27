// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
  isImageFile,
  isSvgFile,
  isRasterImageFile,
  getImageMimeType,
  formatFileSize,
  estimateBase64SizeBytes,
  sanitizeSvg,
} from '../utils/imageUtils';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
  rainbowBracketsPlugin,
  rainbowBracketsTheme,
  createRainbowDecorations,
} from '../extensions/builtin/rainbow-brackets/rainbowBrackets';
import { rainbowBracketsExtension } from '../extensions/builtin/rainbow-brackets/index';
import { extensionManager } from '../extensions/runtime/extensionManager';

describe('Image Viewer & Detection Utilities', () => {
  it('correctly identifies raster and SVG images by extension', () => {
    expect(isImageFile('photo.png')).toBe(true);
    expect(isImageFile('avatar.JPG')).toBe(true);
    expect(isImageFile('/path/to/icon.ico')).toBe(true);
    expect(isImageFile('diagram.svg')).toBe(true);
    expect(isImageFile('graphic.webp')).toBe(true);
    expect(isImageFile('animation.gif')).toBe(true);
    expect(isImageFile('bitmap.bmp')).toBe(true);

    expect(isImageFile('script.js')).toBe(false);
    expect(isImageFile('styles.css')).toBe(false);
    expect(isImageFile('README.md')).toBe(false);
    expect(isImageFile(null)).toBe(false);
    expect(isImageFile('')).toBe(false);
  });

  it('distinguishes between SVG vectors and raster images', () => {
    expect(isSvgFile('logo.svg')).toBe(true);
    expect(isSvgFile('image.png')).toBe(false);
    expect(isRasterImageFile('photo.png')).toBe(true);
    expect(isRasterImageFile('logo.svg')).toBe(false);
  });

  it('resolves correct MIME types', () => {
    expect(getImageMimeType('test.png')).toBe('image/png');
    expect(getImageMimeType('test.jpg')).toBe('image/jpeg');
    expect(getImageMimeType('test.jpeg')).toBe('image/jpeg');
    expect(getImageMimeType('test.gif')).toBe('image/gif');
    expect(getImageMimeType('test.webp')).toBe('image/webp');
    expect(getImageMimeType('test.svg')).toBe('image/svg+xml');
    expect(getImageMimeType('test.bmp')).toBe('image/bmp');
    expect(getImageMimeType('test.ico')).toBe('image/x-icon');
  });

  it('formats byte sizes cleanly', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(1048576)).toBe('1.00 MB');
  });

  it('estimates byte size from Data URLs', () => {
    // 4 base64 chars = 3 bytes
    const sampleDataUrl = 'data:image/png;base64,QUJD'; // 'ABC'
    expect(estimateBase64SizeBytes(sampleDataUrl)).toBe(3);
  });

  it('sanitizes malicious scripts from SVG files while preserving visual tags', () => {
    const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <circle cx="50" cy="50" r="40" fill="red" />
      <script>alert("xss")</script>
      <rect onclick="evil()" width="20" height="20" />
    </svg>`;

    const { cleanSvg, isClean, removedElements } = sanitizeSvg(maliciousSvg);
    expect(cleanSvg).toContain('<circle');
    expect(cleanSvg).not.toContain('<script>');
    expect(cleanSvg).not.toContain('alert(');
    expect(cleanSvg).not.toContain('onclick');
    expect(isClean).toBe(false);
    expect(removedElements.length).toBeGreaterThan(0);
  });
});

describe('Rainbow Brackets Integration', () => {
  it('provides baseTheme with high specificity color definitions', () => {
    expect(rainbowBracketsTheme).toBeDefined();
    expect(rainbowBracketsPlugin).toBeDefined();
  });

  it('includes rainbowBracketsTheme and plugin in extension getCodeMirrorExtensions', () => {
    const exts = rainbowBracketsExtension.getCodeMirrorExtensions();
    expect(exts.length).toBeGreaterThanOrEqual(2);
  });

  it('can be mounted directly into an EditorState without errors', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    const state = EditorState.create({
      doc: 'function hello() { return [1, (2 + 3)]; }',
      extensions: [rainbowBracketsPlugin, rainbowBracketsTheme],
    });

    const view = new EditorView({ state, parent });
    expect(view.dom).toBeDefined();

    const decos = createRainbowDecorations(view);
    expect(decos).toBeDefined();

    view.destroy();
    parent.remove();
  });

  it('responds to onEditorCreated activation event', async () => {
    await extensionManager.triggerActivationEvent('onEditorCreated');
    const states = extensionManager.getAllExtensionStates();
    const rainbowState = states.find((s) => s.id === 'xivig-tool-rainbow');
    expect(rainbowState?.status).toBe('enabled');
  });
});
