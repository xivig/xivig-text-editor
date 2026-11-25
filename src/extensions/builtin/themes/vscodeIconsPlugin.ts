import type { IconDefinition, IconThemeMapping } from './types';

export const VSCODE_DEFAULT_FILE: IconDefinition = {
  id: 'vscode-file',
  name: 'Default File',
  color: '#c5c5c5',
  glyph: '📄',
  category: 'file',
};

export const VSCODE_DEFAULT_FOLDER: IconDefinition = {
  id: 'vscode-folder',
  name: 'Default Folder',
  color: '#dcb67a',
  glyph: '📁',
  category: 'folder',
};

export const VSCODE_DEFAULT_FOLDER_OPEN: IconDefinition = {
  id: 'vscode-folder-open',
  name: 'Default Folder Open',
  color: '#dcb67a',
  glyph: '📂',
  category: 'folder',
};

const VSCODE_FILE_EXTENSIONS: Record<string, IconDefinition> = {
  ts: { id: 'vscode-ts', name: 'TypeScript', color: '#007acc', glyph: '📘', category: 'language' },
  tsx: { id: 'vscode-tsx', name: 'React TS', color: '#007acc', glyph: '⚛️', category: 'language' },
  js: { id: 'vscode-js', name: 'JavaScript', color: '#cbcb41', glyph: '📒', category: 'language' },
  jsx: { id: 'vscode-jsx', name: 'React JS', color: '#007acc', glyph: '⚛️', category: 'language' },
  json: { id: 'vscode-json', name: 'JSON', color: '#cbcb41', glyph: '📋', category: 'file' },
  html: { id: 'vscode-html', name: 'HTML', color: '#e44d26', glyph: '🌐', category: 'language' },
  css: { id: 'vscode-css', name: 'CSS', color: '#563d7c', glyph: '🎨', category: 'language' },
  md: { id: 'vscode-md', name: 'Markdown', color: '#083344', glyph: '📑', category: 'file' },
  py: { id: 'vscode-py', name: 'Python', color: '#3572a5', glyph: '🐍', category: 'language' },
  rs: { id: 'vscode-rs', name: 'Rust', color: '#dea584', glyph: '🦀', category: 'language' },
  java: { id: 'vscode-java', name: 'Java', color: '#b07219', glyph: '☕', category: 'language' },
  c: { id: 'vscode-c', name: 'C', color: '#555555', glyph: '©️', category: 'language' },
  cpp: { id: 'vscode-cpp', name: 'C++', color: '#f34b7d', glyph: '🇨', category: 'language' },
};

const VSCODE_FILE_NAMES: Record<string, IconDefinition> = {
  'package.json': { id: 'vscode-npm', name: 'NPM Package', color: '#cb3837', glyph: '📦', category: 'file' },
  '.gitignore': { id: 'vscode-git', name: 'Git Ignore', color: '#f05032', glyph: '🐙', category: 'file' },
  'dockerfile': { id: 'vscode-docker', name: 'Dockerfile', color: '#2496ed', glyph: '🐳', category: 'file' },
};

const VSCODE_FOLDER_NAMES: Record<string, IconDefinition> = {
  src: { id: 'vscode-folder-src', name: 'Src', color: '#dcb67a', glyph: '📁', category: 'folder' },
  node_modules: { id: 'vscode-folder-node', name: 'Modules', color: '#dcb67a', glyph: '📦', category: 'folder' },
  '.git': { id: 'vscode-folder-git', name: 'Git Repo', color: '#f05032', glyph: '🐙', category: 'folder' },
};

export const vscodeIconsTheme: IconThemeMapping = {
  name: 'VSCode Icons',
  fileExtensions: VSCODE_FILE_EXTENSIONS,
  fileNames: VSCODE_FILE_NAMES,
  folderNames: VSCODE_FOLDER_NAMES,
  defaultFile: VSCODE_DEFAULT_FILE,
  defaultFolder: VSCODE_DEFAULT_FOLDER,
  defaultFolderOpen: VSCODE_DEFAULT_FOLDER_OPEN,
};

/**
 * Resolves icon using VSCode Icons theme rules.
 */
export function resolveVsCodeIcon(filename: string): IconDefinition {
  const lower = filename.toLowerCase();

  if (VSCODE_FILE_NAMES[lower]) {
    return VSCODE_FILE_NAMES[lower];
  }

  const parts = lower.split('.');
  if (parts.length > 1) {
    const ext = parts[parts.length - 1];
    if (VSCODE_FILE_EXTENSIONS[ext]) {
      return VSCODE_FILE_EXTENSIONS[ext];
    }
  }

  return VSCODE_DEFAULT_FILE;
}

/**
 * Resolves folder icon using VSCode Icons theme rules.
 */
export function resolveVsCodeFolderIcon(folderName: string, isOpen = false): IconDefinition {
  const lower = folderName.toLowerCase();

  if (VSCODE_FOLDER_NAMES[lower]) {
    const match = VSCODE_FOLDER_NAMES[lower];
    if (isOpen) {
      return { ...match, glyph: '📂' };
    }
    return match;
  }

  return isOpen ? VSCODE_DEFAULT_FOLDER_OPEN : VSCODE_DEFAULT_FOLDER;
}
