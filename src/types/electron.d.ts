export interface XivigAPI {
  // File operations
  openFileDialog: () => Promise<{ canceled: boolean; filePath?: string; content?: string; name?: string }>;
  openFolderDialog: () => Promise<{ canceled: boolean; folderPath?: string; files?: Array<{ path: string; name: string; isDirectory: boolean }> }>;
  saveFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  saveFileDialog: (defaultName?: string, content?: string) => Promise<{ canceled: boolean; filePath?: string }>;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  readDir: (dirPath: string) => Promise<{ success: boolean; items?: Array<{ path: string; name: string; isDirectory: boolean }>; error?: string }>;

  // Window controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isMaximized: () => Promise<boolean>;

  // System info
  platform: string;
}

declare global {
  interface Window {
    xivig?: XivigAPI;
  }
}
