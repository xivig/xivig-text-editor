// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFileStore } from '../stores/fileStore';
import { useUIStore } from '../stores/uiStore';

describe('File Menu: Workspace Functionality & Lifecycle', () => {
  beforeEach(() => {
    useFileStore.setState({
      currentFolderPath: null,
      currentFolderName: null,
      currentWorkspaceFile: null,
      isWorkspaceUntitled: false,
      fileTree: [],
      workspaceFolders: [],
      recentFiles: [
        { id: 'f-1', name: 'app.tsx', path: '/projects/src/app.tsx', lastOpened: new Date().toISOString() },
        { id: 'f-2', name: 'package.json', path: '/projects/package.json', lastOpened: new Date().toISOString() },
      ],
      recentWorkspaces: [
        { id: 'w-1', name: 'xivig-editor', path: '/projects/xivig-editor', lastOpened: new Date().toISOString() },
        { id: 'w-2', name: 'api-service', path: '/projects/api-service', lastOpened: new Date().toISOString() },
      ],
    });

    // Mock window.xivig APIs
    (window as any).xivig = {
      readFile: vi.fn(async (filePath: string) => {
        if (filePath.endsWith('invalid.json')) {
          return { success: true, content: '{ invalid json ' };
        }
        if (filePath.endsWith('empty.code-workspace')) {
          return { success: true, content: JSON.stringify({ folders: [] }) };
        }
        return {
          success: true,
          content: JSON.stringify({
            folders: [
              { path: 'src', name: 'Frontend Client' },
              { path: '../api', name: 'Backend API' },
              { path: '/absolute/shared', name: 'Shared Libs' },
            ],
            settings: {
              'editor.tabSize': 2,
            },
          }),
        };
      }),
      readDir: vi.fn(async (dirPath: string) => ({
        success: true,
        items: [
          { path: `${dirPath}/index.ts`, name: 'index.ts', isDirectory: false },
          { path: `${dirPath}/utils`, name: 'utils', isDirectory: true },
        ],
      })),
      saveFile: vi.fn(async (_path: string, _content: string) => ({ success: true })),
      clearRecentHistory: vi.fn(async () => true),
      openNewWindow: vi.fn(async () => ({ success: true })),
    };
  });

  describe('1. Open Workspace from File...', () => {
    it('parses .code-workspace JSON and resolves relative paths against workspace directory', async () => {
      const store = useFileStore.getState();
      const res = await store.openWorkspaceFromFile('/projects/workspace/my-app.code-workspace');

      expect(res.success).toBe(true);
      expect(res.workspaceName).toBe('my-app');

      const state = useFileStore.getState();
      expect(state.currentWorkspaceFile).toBe('/projects/workspace/my-app.code-workspace');
      expect(state.isWorkspaceUntitled).toBe(false);

      // Verify resolved folder paths
      expect(state.workspaceFolders).toHaveLength(3);
      expect(state.workspaceFolders[0].path).toBe('/projects/workspace/src');
      expect(state.workspaceFolders[0].name).toBe('Frontend Client');
      expect(state.workspaceFolders[1].path).toBe('/projects/api');
      expect(state.workspaceFolders[1].name).toBe('Backend API');
      expect(state.workspaceFolders[2].path).toBe('/absolute/shared');
      expect(state.workspaceFolders[2].name).toBe('Shared Libs');

      // Primary folder should be set
      expect(state.currentFolderPath).toBe('/projects/workspace/src');
      expect(state.fileTree.length).toBeGreaterThan(0);

      // Workspace should be added to recent workspaces with (Workspace) label
      expect(state.recentWorkspaces[0].name).toContain('my-app (Workspace)');
      expect(state.recentWorkspaces[0].path).toBe('/projects/workspace/my-app.code-workspace');
    });

    it('handles empty folder lists and invalid JSON gracefully', async () => {
      const store = useFileStore.getState();

      const resEmpty = await store.openWorkspaceFromFile('/projects/empty.code-workspace');
      expect(resEmpty.success).toBe(false);
      expect(resEmpty.error).toContain('No folders found');

      const resInvalid = await store.openWorkspaceFromFile('/projects/invalid.json');
      expect(resInvalid.success).toBe(false);
      expect(resInvalid.error).toBeDefined();
    });
  });

  describe('2. Add Folder to Workspace...', () => {
    it('opens as primary folder when no folder is currently open', async () => {
      const store = useFileStore.getState();
      const res = await store.addWorkspaceFolder('/projects/new-project');

      expect(res.success).toBe(true);
      const state = useFileStore.getState();
      expect(state.currentFolderPath).toBe('/projects/new-project');
      expect(state.workspaceFolders).toHaveLength(1);
      expect(state.workspaceFolders[0].name).toBe('new-project');
    });

    it('transitions existing folder into multi-root workspace without duplicates', async () => {
      const store = useFileStore.getState();
      // Setup active single folder
      useFileStore.setState({
        currentFolderPath: '/projects/repo-one',
        currentFolderName: 'repo-one',
        workspaceFolders: [],
      });

      // Add second folder
      await store.addWorkspaceFolder('/projects/repo-two');

      const state = useFileStore.getState();
      expect(state.workspaceFolders).toHaveLength(2);
      expect(state.workspaceFolders[0].path).toBe('/projects/repo-one');
      expect(state.workspaceFolders[1].path).toBe('/projects/repo-two');
      expect(state.isWorkspaceUntitled).toBe(true);

      // Adding duplicate should not increase length
      await store.addWorkspaceFolder('/projects/repo-two');
      expect(useFileStore.getState().workspaceFolders).toHaveLength(2);
    });
  });

  describe('3. Save Workspace As...', () => {
    it('serializes all workspace folders into valid workspace JSON and updates state', async () => {
      const store = useFileStore.getState();
      useFileStore.setState({
        workspaceFolders: [
          { path: '/projects/core', name: 'Core Engine' },
          { path: '/projects/ui', name: 'UI Library' },
        ],
        currentWorkspaceFile: null,
        isWorkspaceUntitled: true,
      });

      let savedContent = '';
      (window as any).xivig.saveFile = vi.fn(async (path: string, content: string) => {
        savedContent = content;
        return { success: true };
      });

      const res = await store.saveWorkspaceAs('/projects/full-suite.code-workspace');
      expect(res.success).toBe(true);

      // Verify saved JSON
      const parsed = JSON.parse(savedContent);
      expect(parsed.folders).toHaveLength(2);
      expect(parsed.folders[0].path).toBe('/projects/core');
      expect(parsed.folders[1].name).toBe('UI Library');

      // Verify updated state
      const state = useFileStore.getState();
      expect(state.currentWorkspaceFile).toBe('/projects/full-suite.code-workspace');
      expect(state.isWorkspaceUntitled).toBe(false);
      expect(state.recentWorkspaces[0].name).toBe('full-suite (Workspace)');
    });
  });

  describe('4. Duplicate Workspace', () => {
    it('clones folders and resets workspace file path to untitled copy', () => {
      const store = useFileStore.getState();
      useFileStore.setState({
        workspaceFolders: [
          { path: '/projects/app-1', name: 'app-1' },
          { path: '/projects/app-2', name: 'app-2' },
        ],
        currentWorkspaceFile: '/projects/original.code-workspace',
        isWorkspaceUntitled: false,
      });

      const res = store.duplicateWorkspace();
      expect(res.success).toBe(true);
      expect(res.message).toContain('Untitled');

      const state = useFileStore.getState();
      expect(state.workspaceFolders).toHaveLength(2);
      expect(state.currentWorkspaceFile).toBeNull();
      expect(state.isWorkspaceUntitled).toBe(true);
    });
  });

  describe('5. Open Recent Submenu & History Clear', () => {
    it('clears recent files and workspaces both in store and via backend IPC', async () => {
      const store = useFileStore.getState();
      expect(store.recentFiles.length).toBeGreaterThan(0);
      expect(store.recentWorkspaces.length).toBeGreaterThan(0);

      await store.clearRecentHistory();

      const state = useFileStore.getState();
      expect(state.recentFiles).toHaveLength(0);
      expect(state.recentWorkspaces).toHaveLength(0);
      expect((window as any).xivig.clearRecentHistory).toHaveBeenCalled();
    });

    it('toggles Project Switcher modal from UI store for More... action', () => {
      expect(useUIStore.getState().isProjectSwitcherOpen).toBe(false);
      useUIStore.getState().openProjectSwitcherModal();
      expect(useUIStore.getState().isProjectSwitcherOpen).toBe(true);
      useUIStore.getState().closeProjectSwitcherModal();
      expect(useUIStore.getState().isProjectSwitcherOpen).toBe(false);
    });
  });
});
