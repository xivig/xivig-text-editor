import type { IconDefinition, IconThemeMapping } from './types';

export const MATERIAL_DEFAULT_FILE: IconDefinition = {
  id: 'file',
  name: 'File',
  color: '#90a4ae',
  glyph: '📄',
  category: 'file',
};

export const MATERIAL_DEFAULT_FOLDER: IconDefinition = {
  id: 'folder',
  name: 'Folder',
  color: '#90a4ae',
  glyph: '📁',
  category: 'folder',
};

export const MATERIAL_DEFAULT_FOLDER_OPEN: IconDefinition = {
  id: 'folder-open',
  name: 'Folder Open',
  color: '#90a4ae',
  glyph: '📂',
  category: 'folder',
};

const MATERIAL_FILE_EXTENSIONS: Record<string, IconDefinition> = {
  ts: { id: 'typescript', name: 'TypeScript', color: '#3178c6', glyph: '📘', category: 'language' },
  tsx: { id: 'react-ts', name: 'React TypeScript', color: '#00d8ff', glyph: '⚛️', category: 'language' },
  js: { id: 'javascript', name: 'JavaScript', color: '#f7df1e', glyph: '📒', category: 'language' },
  jsx: { id: 'react-js', name: 'React JavaScript', color: '#00d8ff', glyph: '⚛️', category: 'language' },
  html: { id: 'html', name: 'HTML', color: '#e34f26', glyph: '🌐', category: 'language' },
  css: { id: 'css', name: 'CSS', color: '#1572b6', glyph: '🎨', category: 'language' },
  scss: { id: 'sass', name: 'Sass', color: '#c69', glyph: '💅', category: 'language' },
  json: { id: 'json', name: 'JSON', color: '#cbcb41', glyph: '📋', category: 'file' },
  md: { id: 'markdown', name: 'Markdown', color: '#083344', glyph: '📑', category: 'file' },
  py: { id: 'python', name: 'Python', color: '#3776ab', glyph: '🐍', category: 'language' },
  rs: { id: 'rust', name: 'Rust', color: '#dea584', glyph: '🦀', category: 'language' },
  go: { id: 'go', name: 'Go', color: '#00add8', glyph: '🐹', category: 'language' },
  java: { id: 'java', name: 'Java', color: '#b07219', glyph: '☕', category: 'language' },
  kt: { id: 'kotlin', name: 'Kotlin', color: '#7f52ff', glyph: '🇰', category: 'language' },
  cpp: { id: 'cpp', name: 'C++', color: '#f34b7d', glyph: '🇨', category: 'language' },
  c: { id: 'c', name: 'C', color: '#555555', glyph: '©️', category: 'language' },
  php: { id: 'php', name: 'PHP', color: '#4f5d95', glyph: '🐘', category: 'language' },
  sql: { id: 'sql', name: 'SQL', color: '#e38c00', glyph: '🗄️', category: 'language' },
  sh: { id: 'bash', name: 'Shell', color: '#4eaa25', glyph: '🐚', category: 'language' },
  yaml: { id: 'yaml', name: 'YAML', color: '#cb171e', glyph: '⚙️', category: 'file' },
  yml: { id: 'yaml', name: 'YAML', color: '#cb171e', glyph: '⚙️', category: 'file' },
  svg: { id: 'svg', name: 'SVG', color: '#ff9900', glyph: '🖼️', category: 'file' },
  png: { id: 'image', name: 'Image', color: '#26a69a', glyph: '🖼️', category: 'file' },
  jpg: { id: 'image', name: 'Image', color: '#26a69a', glyph: '🖼️', category: 'file' },
  dockerfile: { id: 'docker', name: 'Docker', color: '#2496ed', glyph: '🐳', category: 'file' },
};

const MATERIAL_FILE_NAMES: Record<string, IconDefinition> = {
  'package.json': { id: 'npm', name: 'NPM', color: '#cb3837', glyph: '📦', category: 'file' },
  'tsconfig.json': { id: 'tsconfig', name: 'TypeScript Config', color: '#3178c6', glyph: '📘', category: 'file' },
  '.gitignore': { id: 'git', name: 'Git Ignore', color: '#f05032', glyph: '🐙', category: 'file' },
  'dockerfile': { id: 'docker', name: 'Dockerfile', color: '#2496ed', glyph: '🐳', category: 'file' },
  'docker-compose.yml': { id: 'docker', name: 'Docker Compose', color: '#2496ed', glyph: '🐳', category: 'file' },
  '.env': { id: 'env', name: 'Environment', color: '#ecd53f', glyph: '🔒', category: 'file' },
  'readme.md': { id: 'readme', name: 'Readme', color: '#42a5f5', glyph: '📖', category: 'file' },
  'license': { id: 'license', name: 'License', color: '#d4af37', glyph: '⚖️', category: 'file' },
};

const MATERIAL_FOLDER_NAMES: Record<string, IconDefinition> = {
  src: { id: 'folder-src', name: 'Source', color: '#42a5f5', glyph: '📁', category: 'folder' },
  components: { id: 'folder-components', name: 'Components', color: '#00d8ff', glyph: '🧩', category: 'folder' },
  tests: { id: 'folder-test', name: 'Tests', color: '#22c55e', glyph: '🧪', category: 'folder' },
  test: { id: 'folder-test', name: 'Tests', color: '#22c55e', glyph: '🧪', category: 'folder' },
  __tests__: { id: 'folder-test', name: 'Tests', color: '#22c55e', glyph: '🧪', category: 'folder' },
  docs: { id: 'folder-docs', name: 'Documentation', color: '#38bdf8', glyph: '📚', category: 'folder' },
  public: { id: 'folder-public', name: 'Public', color: '#f59e0b', glyph: '🌍', category: 'folder' },
  assets: { id: 'folder-assets', name: 'Assets', color: '#ec4899', glyph: '🎨', category: 'folder' },
  node_modules: { id: 'folder-node', name: 'Node Modules', color: '#84cc16', glyph: '📦', category: 'folder' },
  dist: { id: 'folder-dist', name: 'Dist', color: '#a855f7', glyph: '🚀', category: 'folder' },
  build: { id: 'folder-dist', name: 'Build', color: '#a855f7', glyph: '🚀', category: 'folder' },
  '.git': { id: 'folder-git', name: 'Git', color: '#f05032', glyph: '🐙', category: 'folder' },
};

export const materialIconTheme: IconThemeMapping = {
  name: 'Material Icon Theme',
  fileExtensions: MATERIAL_FILE_EXTENSIONS,
  fileNames: MATERIAL_FILE_NAMES,
  folderNames: MATERIAL_FOLDER_NAMES,
  defaultFile: MATERIAL_DEFAULT_FILE,
  defaultFolder: MATERIAL_DEFAULT_FOLDER,
  defaultFolderOpen: MATERIAL_DEFAULT_FOLDER_OPEN,
};

/**
 * Resolves icon definition using Material Icon Theme rules.
 */
export function resolveMaterialIcon(filename: string): IconDefinition {
  const lower = filename.toLowerCase();

  // 1. Exact filename match
  if (MATERIAL_FILE_NAMES[lower]) {
    return MATERIAL_FILE_NAMES[lower];
  }

  // 2. Extension match
  const parts = lower.split('.');
  if (parts.length > 1) {
    const ext = parts[parts.length - 1];
    if (MATERIAL_FILE_EXTENSIONS[ext]) {
      return MATERIAL_FILE_EXTENSIONS[ext];
    }
  }

  return MATERIAL_DEFAULT_FILE;
}

/**
 * Resolves folder icon definition using Material Icon Theme rules.
 */
export function resolveMaterialFolderIcon(folderName: string, isOpen = false): IconDefinition {
  const lower = folderName.toLowerCase();

  if (MATERIAL_FOLDER_NAMES[lower]) {
    const match = MATERIAL_FOLDER_NAMES[lower];
    if (isOpen) {
      return { ...match, glyph: '📂' };
    }
    return match;
  }

  return isOpen ? MATERIAL_DEFAULT_FOLDER_OPEN : MATERIAL_DEFAULT_FOLDER;
}
