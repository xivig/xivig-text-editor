// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEditorStore } from '../stores/editorStore';
import { useFileStore } from '../stores/fileStore';
import { useUIStore } from '../stores/uiStore';

describe('Nested Folder Creation and Scratch File Functionality', () => {
  beforeEach(() => {
    // Reset stores
    useEditorStore.setState({
      documents: [],
      activeDocumentId: null,
      untitledCount: 1,
      scratchCount: 1,
    });
    useFileStore.setState({
      currentFolderPath: '/mock/workspace',
      currentFolderName: 'workspace',
      fileTree: [],
    });
    useUIStore.setState({
      isScratchModalOpen: false,
    });
  });

  describe('Scratch File System', () => {
    it('creates scratch file with default javascript language and js extension', () => {
      const editorStore = useEditorStore.getState();
      editorStore.createScratchDocument();

      const state = useEditorStore.getState();
      expect(state.documents.length).toBe(1);
      const scratch = state.documents[0];
      expect(scratch.id).toBe('scratch-1');
      expect(scratch.name).toBe('scratch-1.js');
      expect(scratch.language).toBe('javascript');
      expect(scratch.path).toBeNull();
      expect(scratch.isDirty).toBe(false);
      expect(state.scratchCount).toBe(2);
      expect(state.activeDocumentId).toBe('scratch-1');
    });

    it('creates successive scratch files with specific languages and extensions', () => {
      const editorStore = useEditorStore.getState();
      editorStore.createScratchDocument('python', 'py');
      editorStore.createScratchDocument('json', 'json');
      editorStore.createScratchDocument('markdown', 'md');

      const docs = useEditorStore.getState().documents;
      expect(docs.length).toBe(3);
      expect(docs[0].name).toBe('scratch-1.py');
      expect(docs[0].language).toBe('python');
      expect(docs[1].name).toBe('scratch-2.json');
      expect(docs[1].language).toBe('json');
      expect(docs[2].name).toBe('scratch-3.md');
      expect(docs[2].language).toBe('markdown');
      expect(useEditorStore.getState().scratchCount).toBe(4);
      expect(useEditorStore.getState().activeDocumentId).toBe('scratch-3');
    });

    it('handles extensions with leading dots cleanly', () => {
      const editorStore = useEditorStore.getState();
      editorStore.createScratchDocument('rust', '.rs');

      const doc = useEditorStore.getState().documents[0];
      expect(doc.name).toBe('scratch-1.rs');
      expect(doc.language).toBe('rust');
    });

    it('toggles scratch file modal state in UIStore', () => {
      const uiStore = useUIStore.getState();
      expect(uiStore.isScratchModalOpen).toBe(false);

      uiStore.openScratchModal();
      expect(useUIStore.getState().isScratchModalOpen).toBe(true);

      uiStore.closeScratchModal();
      expect(useUIStore.getState().isScratchModalOpen).toBe(false);
    });
  });

  describe('Nested Directory Tree & Path Expansion in FileStore', () => {
    it('preserves existing expanded folders and recursively loads expanded children', async () => {
      // Mock window.xivig.readDir
      const mockReadDir = vi.fn().mockImplementation(async (dirPath: string) => {
        const norm = dirPath.replace(/\\/g, '/');
        if (norm === '/mock/workspace') {
          return {
            success: true,
            items: [
              { path: '/mock/workspace/src', name: 'src', isDirectory: true },
              { path: '/mock/workspace/package.json', name: 'package.json', isDirectory: false },
            ],
          };
        }
        if (norm === '/mock/workspace/src') {
          return {
            success: true,
            items: [
              { path: '/mock/workspace/src/components', name: 'components', isDirectory: true },
              { path: '/mock/workspace/src/index.ts', name: 'index.ts', isDirectory: false },
            ],
          };
        }
        if (norm === '/mock/workspace/src/components') {
          return {
            success: true,
            items: [
              { path: '/mock/workspace/src/components/Button.tsx', name: 'Button.tsx', isDirectory: false },
            ],
          };
        }
        return { success: true, items: [] };
      });

      window.xivig = {
        ...(window.xivig || {}),
        readDir: mockReadDir,
        getGitStatus: vi.fn().mockResolvedValue({ isRepo: false, changes: [] }),
      } as any;

      // 1. Initial tree setup where 'src' is expanded
      useFileStore.setState({
        currentFolderPath: '/mock/workspace',
        fileTree: [
          {
            id: '/mock/workspace/src',
            name: 'src',
            path: '/mock/workspace/src',
            isDirectory: true,
            isExpanded: true,
            children: [
              {
                id: '/mock/workspace/src/components',
                name: 'components',
                path: '/mock/workspace/src/components',
                isDirectory: true,
                isExpanded: false,
                children: [],
              },
            ],
          },
        ],
      });

      // 2. Call refreshCurrentFolder with a targetPathToExpand targeting nested components/button
      await useFileStore.getState().refreshCurrentFolder('/mock/workspace/src/components');

      const tree = useFileStore.getState().fileTree;
      expect(tree.length).toBe(2);

      const srcFolder = tree.find((i) => i.name === 'src');
      expect(srcFolder).toBeDefined();
      expect(srcFolder?.isExpanded).toBe(true);
      expect(srcFolder?.children?.length).toBe(2);

      const componentsFolder = srcFolder?.children?.find((i) => i.name === 'components');
      expect(componentsFolder).toBeDefined();
      expect(componentsFolder?.isExpanded).toBe(true);
      expect(componentsFolder?.children?.length).toBe(1);
      expect(componentsFolder?.children?.[0].name).toBe('Button.tsx');
    });

    it('correctly constructs nested paths with trailing and leading slashes', () => {
      const baseDir = 'E:/projects/my-app/src';
      const promptInput = 'components/ui/button';

      const cleanBase = baseDir.replace(/[/\\]+$/, '');
      const cleanInput = promptInput.trim().replace(/^[/\\]+/, '');
      const targetPath = `${cleanBase}/${cleanInput}`;

      expect(targetPath).toBe('E:/projects/my-app/src/components/ui/button');
    });
  });
});
