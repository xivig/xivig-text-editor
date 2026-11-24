export interface EditorDocument {
  id: string;
  path: string | null;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  isPinned?: boolean;
  isReadOnly?: boolean;
  cursor: {
    line: number;
    col: number;
  };
  scroll?: {
    top: number;
    left: number;
  };
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileItem[];
  extension?: string;
  isExpanded?: boolean;
}

export type ActiveSidebarView = 'explorer' | 'search' | 'git' | 'extensions' | 'settings' | 'debug' | 'web' | 'ai' | null;
