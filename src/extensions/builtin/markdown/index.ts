import { BuiltinExtensionModule } from '../../api/types';
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

export const markdownAllInOneExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.markdown-all-in-one',
    name: 'Markdown All in One',
    publisher: 'Yu Zhang',
    version: '3.6.0',
    description: 'All you need to write Markdown (keyboard shortcuts, table formatter, TOC generator, list continuation).',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
  },
  activate: () => {
    // Registered
  },
  deactivate: () => {},
};

export const markdownPreviewEnhancedExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.markdown-preview-enhanced',
    name: 'Markdown Preview Enhanced',
    publisher: 'Yiyi Wang',
    version: '0.8.0',
    description: 'Enhanced Markdown preview with KaTeX math, Mermaid diagrams, frontmatter extraction, and transclusion.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
  },
  activate: () => {},
  deactivate: () => {},
};

export const markdownLintExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.markdownlint',
    name: 'markdownlint',
    publisher: 'David Anson',
    version: '0.54.0',
    description: 'Markdown linting and style checking with automatic fixing of spacing and header rules.',
    categories: ['Formatters', 'Productivity'],
    engines: { xivig: '^1.0.0' },
  },
  activate: () => {},
  deactivate: () => {},
};

export const plantUmlExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.plantuml',
    name: 'PlantUML',
    publisher: 'jebbs',
    version: '2.18.0',
    description: 'PlantUML language support, diagram type detector, server URL generator, and code snippets.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
  },
  activate: () => {},
  deactivate: () => {},
};

export const drawioExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.drawio-integration',
    name: 'Draw.io Integration',
    publisher: 'Henning Dieterichs',
    version: '1.6.6',
    description: 'Draw.io diagrams editor integration, XML model parser, template generator, and cell inspector.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
  },
  activate: () => {},
  deactivate: () => {},
};
