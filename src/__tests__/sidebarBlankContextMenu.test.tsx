// @vitest-environment jsdom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Sidebar } from '../components/sidebar/Sidebar';
import { useFileStore } from '../stores/fileStore';
import { useEditorStore } from '../stores/editorStore';

describe('Sidebar: Left Sidepane Blank Space Context Menu', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    useFileStore.setState({
      isSidebarOpen: true,
      activeSidebarView: 'explorer',
      currentFolderPath: '/workspace/demo',
      currentFolderName: 'demo',
      fileTree: [
        {
          id: '/workspace/demo/src',
          name: 'src',
          path: '/workspace/demo/src',
          isDirectory: true,
          isExpanded: true,
          children: [
            {
              id: '/workspace/demo/src/index.ts',
              name: 'index.ts',
              path: '/workspace/demo/src/index.ts',
              isDirectory: false,
            },
          ],
        },
      ],
      fileClipboard: null,
      fileFilterQuery: '',
      recentFiles: [],
      recentWorkspaces: [],
    });

    useEditorStore.setState({
      documents: [],
      activeDocumentId: null,
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('opens blank-space context menu with workspace actions when a folder is open', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<Sidebar />);
    });

    const sidebarContent = container.querySelector('[data-testid="sidebar-content"]') as HTMLElement;
    expect(sidebarContent).not.toBeNull();

    await act(async () => {
      sidebarContent.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 60, clientY: 220 })
      );
    });

    const text = container.textContent || '';
    expect(text).toContain('New File...');
    expect(text).toContain('New Folder...');
    expect(text).toContain('Refresh Explorer');
    expect(text).toContain('Collapse Folders in Explorer');
    expect(text).toContain('Find in Folder...');
    expect(text).toContain('Paste');
    expect(text).toContain('Copy Path');
    expect(text).toContain('Reveal in File Explorer');
    expect(text).toContain('Open Folder...');
    expect(text).toContain('Close Folder');
    expect(text).not.toContain('Delete');
    expect(text).not.toContain('Rename...');

    await act(async () => {
      root.unmount();
    });
  });

  it('triggers Collapse Folders and Close Folder from the blank-space menu', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<Sidebar />);
    });

    const sidebarContent = container.querySelector('[data-testid="sidebar-content"]') as HTMLElement;
    await act(async () => {
      sidebarContent.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 60, clientY: 220 })
      );
    });

    const collapseBtn = Array.from(container.querySelectorAll('div')).find(
      (el) => el.textContent?.trim() === 'Collapse Folders in Explorer'
    );
    expect(collapseBtn).toBeDefined();

    await act(async () => {
      collapseBtn?.click();
    });

    expect(useFileStore.getState().fileTree[0].isExpanded).toBe(false);

    // Re-open menu and test Close Folder
    await act(async () => {
      sidebarContent.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 60, clientY: 220 })
      );
    });

    const closeFolderBtn = Array.from(container.querySelectorAll('div')).find(
      (el) => el.textContent?.trim() === 'Close Folder'
    );
    expect(closeFolderBtn).toBeDefined();

    await act(async () => {
      closeFolderBtn?.click();
    });

    expect(useFileStore.getState().currentFolderPath).toBeNull();

    await act(async () => {
      root.unmount();
    });
  });

  it('shows no-folder context menu items when no workspace folder is open', async () => {
    useFileStore.setState({
      currentFolderPath: null,
      currentFolderName: null,
      fileTree: [],
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(<Sidebar />);
    });

    const sidebarContent = container.querySelector('[data-testid="sidebar-content"]') as HTMLElement;
    await act(async () => {
      sidebarContent.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 50, clientY: 180 })
      );
    });

    const text = container.textContent || '';
    expect(text).toContain('New File');
    expect(text).toContain('Open File...');
    expect(text).toContain('Open Folder...');
    expect(text).toContain('Open In New Window');
    expect(text).not.toContain('Close Folder');

    const newFileBtn = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent === 'New File'
    )?.parentElement;
    expect(newFileBtn).toBeDefined();
    await act(async () => {
      newFileBtn?.click();
    });
    expect(useEditorStore.getState().documents.length).toBe(1);

    await act(async () => {
      root.unmount();
    });
  });

  it('keeps file/folder item context menu separate when right-clicking a tree item', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<Sidebar />);
    });

    const fileLabel = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent === 'index.ts'
    );
    expect(fileLabel).toBeDefined();

    await act(async () => {
      fileLabel?.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 100 })
      );
    });

    const text = container.textContent || '';
    expect(text).toContain('Rename...');
    expect(text).toContain('Delete');
    expect(text).not.toContain('Close Folder');

    await act(async () => {
      root.unmount();
    });
  });
});
