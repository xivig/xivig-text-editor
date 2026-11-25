export interface ThemeTokenColors {
  keywords: string;
  functions: string;
  strings: string;
  numbers: string;
  types: string;
  comments: string;
  variables: string;
  constants: string;
}

export interface WorkbenchColors {
  bg: string;
  surface: string;
  sidebar: string;
  activityBar: string;
  editor: string;
  statusbar: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
  selection: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  type: 'dark' | 'light';
  workbench: WorkbenchColors;
  tokens: ThemeTokenColors;
}

export interface IconDefinition {
  id: string;
  name: string;
  color: string;
  glyph: string;
  category: 'file' | 'folder' | 'language';
}

export interface IconThemeMapping {
  name: string;
  fileExtensions: Record<string, IconDefinition>;
  fileNames: Record<string, IconDefinition>;
  folderNames: Record<string, IconDefinition>;
  defaultFile: IconDefinition;
  defaultFolder: IconDefinition;
  defaultFolderOpen: IconDefinition;
}
