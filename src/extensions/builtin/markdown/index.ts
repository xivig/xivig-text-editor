import type { ExtensionModule } from '../../types';
import {
  generateTableOfContentsMarkdown,
  formatMarkdownTable,
  getNextListPrefix,
  toggleFormatMarker,
  createMarkdownCompletionSource,
  extractMarkdownHeadings,
  slugifyHeader,
} from './markdownAllInOnePlugin';
import {
  extractFrontmatter,
  parseEnhancedMarkdown,
} from './markdownPreviewEnhancedPlugin';
import {
  lintMarkdownDocument,
  autoFixMarkdownLint,
} from './markdownLintPlugin';
import {
  parsePlantUmlBlocks,
  detectDiagramType,
  buildPlantUmlServerUrl,
  createPlantUmlCompletionSource,
} from './plantUmlPlugin';
import {
  parseDrawioXml,
  validateDrawioXml,
  createDrawioXmlTemplate,
} from './drawioPlugin';

export * from './types';
export * from './markdownAllInOnePlugin';
export * from './markdownPreviewEnhancedPlugin';
export * from './markdownLintPlugin';
export * from './plantUmlPlugin';
export * from './drawioPlugin';

export const markdownAllInOneExtensionModule: ExtensionModule = {
  manifest: {
    id: 'markdown-all-in-one',
    name: 'Markdown All in One',
    version: '3.6.0',
    description: 'All you need to write Markdown (keyboard shortcuts, table formatter, TOC generator, list continuation).',
    category: 'markdown',
  },
  activate: () => {
    // Registered
  },
  deactivate: () => {},
};

export const markdownPreviewEnhancedExtensionModule: ExtensionModule = {
  manifest: {
    id: 'markdown-preview-enhanced',
    name: 'Markdown Preview Enhanced',
    version: '0.8.0',
    description: 'Enhanced Markdown preview with KaTeX math, Mermaid diagrams, frontmatter extraction, and transclusion.',
    category: 'markdown',
  },
  activate: () => {},
  deactivate: () => {},
};

export const markdownLintExtensionModule: ExtensionModule = {
  manifest: {
    id: 'markdownlint',
    name: 'markdownlint',
    version: '0.54.0',
    description: 'Markdown linting and style checking with automatic fixing of spacing and header rules.',
    category: 'markdown',
  },
  activate: () => {},
  deactivate: () => {},
};

export const plantUmlExtensionModule: ExtensionModule = {
  manifest: {
    id: 'plantuml',
    name: 'PlantUML',
    version: '2.18.0',
    description: 'PlantUML language support, diagram type detector, server URL generator, and code snippets.',
    category: 'markdown',
  },
  activate: () => {},
  deactivate: () => {},
};

export const drawioExtensionModule: ExtensionModule = {
  manifest: {
    id: 'drawio-integration',
    name: 'Draw.io Integration',
    version: '1.6.6',
    description: 'Draw.io diagrams editor integration, XML model parser, template generator, and cell inspector.',
    category: 'markdown',
  },
  activate: () => {},
  deactivate: () => {},
};
