import { BuiltinExtensionModule } from '../../api/types';
import { DEFAULT_LIVE_SERVER_SETTINGS } from './liveServerPlugin';
import { DEFAULT_LIVE_PREVIEW_SETTINGS } from './livePreviewPlugin';
import {
  DEFAULT_HTML_CSS_SUPPORT_SETTINGS,
  createHtmlCssCompletionSource,
  sharedCssCatalog,
} from './htmlCssSupportPlugin';
import { DEFAULT_CSS_PEEK_SETTINGS } from './cssPeekPlugin';
import { DEFAULT_CSS_CLASS_INTELLISENSE_SETTINGS } from './cssClassIntellisensePlugin';
import {
  DEFAULT_TAILWIND_SETTINGS,
  createTailwindCompletionSource,
} from './tailwindIntellisensePlugin';
import {
  DEFAULT_BOOTSTRAP_SETTINGS,
  createBootstrapCompletionSource,
  BOOTSTRAP_SNIPPETS,
} from './bootstrapIntellisensePlugin';
import { DEFAULT_SVG_VIEWER_SETTINGS } from './svgViewerPlugin';

export * from './types';
export * from './liveServerPlugin';
export * from './livePreviewPlugin';
export * from './htmlCssSupportPlugin';
export * from './cssPeekPlugin';
export * from './cssClassIntellisensePlugin';
export * from './tailwindIntellisensePlugin';
export * from './bootstrapIntellisensePlugin';
export * from './svgViewerPlugin';

// 1. Live Server
export const liveServerExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.live-server',
    name: 'Live Server',
    publisher: 'Ritwick Dey',
    version: '5.7.9',
    description: 'Launch a local development server with live reload feature for static and dynamic pages.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#9353d3',
    iconSymbol: '📡',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. Live Preview
export const livePreviewExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.live-preview',
    name: 'Live Preview',
    publisher: 'Microsoft',
    version: '0.4.14',
    description: 'Split-pane in-editor live preview with device emulation presets, console capture, and inspector.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#0e70c0',
    iconSymbol: '📱',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. HTML CSS Support
export const htmlCssSupportExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.html-css-support',
    name: 'HTML CSS Support',
    publisher: 'ecmel',
    version: '2.0.12',
    description: 'CSS class and id attribute completion scraped across workspace CSS and HTML files.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#e44d26',
    iconSymbol: '🌐',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. CSS Peek
export const cssPeekExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.css-peek',
    name: 'CSS Peek',
    publisher: 'Pranay Prakash',
    version: '2.2.4',
    description: 'Jump to CSS selector definition from HTML class and id attributes (F12 / Ctrl+Click).',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#264de4',
    iconSymbol: '👁️',
  },
  activate: () => {},
  deactivate: () => {},
};

// 5. IntelliSense for CSS Class Names
export const cssClassIntellisenseExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.css-class-intellisense',
    name: 'IntelliSense for CSS class names',
    publisher: 'Zignd',
    version: '1.20.0',
    description: 'CSS class completions with specificity scoring (a, b, c) and conflict resolution.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#42a5f5',
    iconSymbol: '🎯',
  },
  activate: () => {},
  deactivate: () => {},
};

// 6. Tailwind CSS IntelliSense
export const tailwindIntellisenseExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.tailwindcss-intellisense',
    name: 'Tailwind CSS IntelliSense',
    publisher: 'Tailwind Labs',
    version: '0.12.7',
    description: 'Intelligent Tailwind CSS utility completions with visual color preview and CSS rule hover expansion.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#06b6d4',
    iconSymbol: '🎨',
  },
  activate: () => {},
  deactivate: () => {},
};

// 7. Bootstrap IntelliSense
export const bootstrapIntellisenseExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.bootstrap-intellisense',
    name: 'Bootstrap IntelliSense',
    publisher: 'bootstrap5',
    version: '5.3.0',
    description: 'Bootstrap 5.3 components, grid utilities, color modifiers, and HTML5 templates.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#7952b3',
    iconSymbol: '🅱️',
  },
  activate: () => {},
  deactivate: () => {},
  getSnippets: (language?: string) => {
    const lang = (language || '').toLowerCase();
    if (lang.includes('html') || lang.includes('blade') || lang.includes('php') || lang.includes('vue')) {
      return BOOTSTRAP_SNIPPETS.map((s) => ({
        label: s.label,
        detail: s.detail,
        template: s.template,
      }));
    }
    return [];
  },
};

// 8. SVG Viewer
export const svgViewerExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.svg-viewer',
    name: 'SVG Viewer & Sanitizer',
    publisher: 'cssho',
    version: '2.8.6',
    description: 'Visual SVG preview, metadata inspector (viewBox, path count, color palette), and XSS sanitizer.',
    categories: ['Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#ffb300',
    iconSymbol: '📐',
  },
  activate: () => {},
  deactivate: () => {},
};
