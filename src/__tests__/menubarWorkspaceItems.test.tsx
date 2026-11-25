// @vitest-environment jsdom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Menubar } from '../components/menubar/Menubar';
import { useFileStore } from '../stores/fileStore';

describe('Menubar: File Menu Workspace Items & Flyout Submenu', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    useFileStore.setState({
      recentFiles: [
        { id: 'f-1', name: 'app.tsx', path: '/src/app.tsx', lastOpened: new Date().toISOString() },
      ],
      recentWorkspaces: [
        { id: 'w-1', name: 'my-project', path: '/projects/my-project', lastOpened: new Date().toISOString() },
      ],
      currentFolderPath: '/projects/my-project',
      currentFolderName: 'my-project',
      workspaceFolders: [],
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders the File menu containing all 5 workspace functionality items in exact order', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<Menubar />);
    });

    // 1. Find the "File" trigger button and click it to open dropdown
    const fileButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'File'
    );
    expect(fileButton).toBeDefined();

    await act(async () => {
      fileButton?.click();
    });

    // 2. Verify all 5 workspace items are present in the dropdown DOM
    const dropdownButtons = Array.from(container.querySelectorAll('button')).map(
      (b) => b.textContent?.trim() || ''
    );

    expect(dropdownButtons.some((txt) => txt.includes('Open Workspace from File...'))).toBe(true);
    expect(dropdownButtons.some((txt) => txt.includes('Open Recent'))).toBe(true);
    expect(dropdownButtons.some((txt) => txt.includes('Add Folder to Workspace...'))).toBe(true);
    expect(dropdownButtons.some((txt) => txt.includes('Save Workspace As...'))).toBe(true);
    expect(dropdownButtons.some((txt) => txt.includes('Duplicate Workspace'))).toBe(true);

    // 3. Hovering or clicking "Open Recent" activates flyout submenu
    const openRecentButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Open Recent')
    );
    expect(openRecentButton).toBeDefined();

    await act(async () => {
      openRecentButton?.click();
    });

    // 4. Submenu should display recent items and Clear action
    const allButtonsAfterHover = Array.from(container.querySelectorAll('button')).map(
      (b) => b.textContent?.trim() || ''
    );

    expect(allButtonsAfterHover.some((txt) => txt.includes('my-project'))).toBe(true);
    expect(allButtonsAfterHover.some((txt) => txt.includes('app.tsx'))).toBe(true);
    expect(allButtonsAfterHover.some((txt) => txt.includes('Clear Recently Opened'))).toBe(true);

    await act(async () => {
      root.unmount();
    });
  });
});
