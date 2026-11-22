import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useBuildStore } from '../../stores/buildStore';
import { useLiveServerStore } from '../../stores/liveServerStore';
import { getActiveEditorView } from '../editor/editorViewRegistry';
import { expandEmmetCommand, detectEmmetSyntax } from '../editor/emmet';
import { beautifyActiveEditor } from '../../utils/beautify';

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
}

export const Menubar: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menubarRef = useRef<HTMLDivElement>(null);

  const createNewDocument = useEditorStore((state) => state.createNewDocument);
  const openDocument = useEditorStore((state) => state.openDocument);
  const activeDoc = useEditorStore((state) => state.getActiveDocument());
  const closeDocument = useEditorStore((state) => state.closeDocument);
  const markDocumentSaved = useEditorStore((state) => state.markDocumentSaved);

  const setCurrentFolder = useFileStore((state) => state.setCurrentFolder);
  const toggleSidebar = useFileStore((state) => state.toggleSidebar);
  const setActiveSidebarView = useFileStore((state) => state.setActiveSidebarView);
  const recentFiles = useFileStore((state) => state.recentFiles);
  const recentWorkspaces = useFileStore((state) => state.recentWorkspaces);
  const setSplitLayout = useEditorStore((state) => state.setSplitLayout);

  const openSearchPanel = useUIStore((state) => state.openSearchPanel);
  const openCommandPalette = useUIStore((state) => state.openCommandPalette);
  const openQuickOpen = useUIStore((state) => state.openQuickOpen);
  const toggleMinimap = useUIStore((state) => state.toggleMinimap);
  const toggleBottomPanel = useUIStore((state) => state.toggleBottomPanel);
  const openKeymapModal = useUIStore((state) => state.openKeymapModal);
  const openBuildSystemModal = useUIStore((state) => state.openBuildSystemModal);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menubarRef.current && !menubarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleOpenFile = async () => {
    if (window.xivig?.openFileDialog) {
      const res = await window.xivig.openFileDialog();
      if (!res.canceled && res.filePath && res.content !== undefined) {
        openDocument({
          path: res.filePath,
          name: res.name || 'File',
          content: res.content,
          language: res.name || 'text',
        });
      }
    }
  };

  const handleOpenFolder = async () => {
    if (window.xivig?.openFolderDialog) {
      const res = await window.xivig.openFolderDialog();
      if (!res.canceled && res.folderPath && res.files) {
        setCurrentFolder(res.folderPath, res.files);
      }
    }
  };

  const handleSaveFile = async () => {
    if (!activeDoc) return;

    if (activeDoc.path && window.xivig?.saveFile) {
      const res = await window.xivig.saveFile(activeDoc.path, activeDoc.content);
      if (res.success) {
        markDocumentSaved(activeDoc.id, activeDoc.path);
      }
    } else if (window.xivig?.saveFileDialog) {
      const res = await window.xivig.saveFileDialog(activeDoc.name, activeDoc.content);
      if (!res.canceled && res.filePath) {
        markDocumentSaved(activeDoc.id, res.filePath);
      }
    }
  };

  const handleSaveAs = async () => {
    if (!activeDoc || !window.xivig?.saveFileDialog) return;
    const res = await window.xivig.saveFileDialog(activeDoc.name, activeDoc.content);
    if (!res.canceled && res.filePath) {
      markDocumentSaved(activeDoc.id, res.filePath);
    }
  };

  const handleOpenRecentFile = async (filePath: string, name: string) => {
    if (window.xivig?.readFile) {
      const res = await window.xivig.readFile(filePath);
      if (res.success && res.content !== undefined) {
        openDocument({
          path: filePath,
          name,
          content: res.content,
          language: name,
        });
      }
    }
  };

  const handleOpenRecentWorkspace = async (folderPath: string) => {
    if (window.xivig?.readDir) {
      const res = await window.xivig.readDir(folderPath);
      if (res.success && res.items) {
        setCurrentFolder(folderPath, res.items);
      }
    }
  };

  const recentMenuItems: MenuItem[] = [
    ...recentFiles.slice(0, 5).map((f) => ({
      label: `📄 ${f.name}`,
      action: () => handleOpenRecentFile(f.path, f.name),
    })),
    ...recentWorkspaces.slice(0, 3).map((w) => ({
      label: `📁 ${w.name}`,
      action: () => handleOpenRecentWorkspace(w.path),
    })),
  ];

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'New File', shortcut: 'Ctrl+N', action: () => createNewDocument() },
      { label: 'Open File...', shortcut: 'Ctrl+O', action: handleOpenFile },
      { label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O', action: handleOpenFolder },
      ...(recentMenuItems.length > 0 ? [{ divider: true, label: '' }, ...recentMenuItems] : []),
      { divider: true, label: '' },
      { label: 'Save', shortcut: 'Ctrl+S', action: handleSaveFile },
      { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: handleSaveAs },
      { divider: true, label: '' },
      {
        label: 'Close Tab',
        shortcut: 'Ctrl+W',
        action: () => activeDoc && closeDocument(activeDoc.id),
      },
      { divider: true, label: '' },
      {
        label: 'Preferences: Settings',
        shortcut: 'Ctrl+,',
        action: () =>
          openDocument({
            id: 'settings',
            name: 'Settings',
            content: '',
            language: 'settings',
            path: null,
          }),
      },
      { divider: true, label: '' },
      { label: 'Exit', action: () => window.xivig?.closeWindow?.() },
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z' },
      { label: 'Redo', shortcut: 'Ctrl+Y' },
      { divider: true, label: '' },
      { label: 'Cut', shortcut: 'Ctrl+X' },
      { label: 'Copy', shortcut: 'Ctrl+C' },
      { label: 'Paste', shortcut: 'Ctrl+V' },
      { divider: true, label: '' },
      { label: 'Find', shortcut: 'Ctrl+F', action: () => openSearchPanel('find') },
      { label: 'Replace', shortcut: 'Ctrl+H', action: () => openSearchPanel('replace') },
      { divider: true, label: '' },
      {
        label: 'Emmet: Expand Abbreviation',
        shortcut: 'Tab / Ctrl+E',
        action: () => {
          const view = getActiveEditorView();
          if (view && activeDoc) {
            expandEmmetCommand(view, detectEmmetSyntax(activeDoc.name || activeDoc.language));
          }
        },
      },
      {
        label: 'Emmet: Wrap with Abbreviation...',
        shortcut: 'Ctrl+Alt+W',
        action: () => useUIStore.getState().openWrapWithAbbreviation(),
      },
      { divider: true, label: '' },
      {
        label: 'Beautify Code',
        shortcut: 'Ctrl+Alt+B',
        action: () => {
          const view = getActiveEditorView();
          if (view) beautifyActiveEditor(view);
        },
      },
      {
        label: 'Color Picker',
        shortcut: 'Ctrl+Alt+C',
        action: () => {
          const view = getActiveEditorView();
          let colorStr = '#6c8cff';
          let range: { from: number; to: number } | null = null;
          if (view) {
            const sel = view.state.selection.main;
            if (!sel.empty) {
              colorStr = view.state.sliceDoc(sel.from, sel.to).trim();
              range = { from: sel.from, to: sel.to };
            }
          }
          useUIStore.getState().openColorPicker(colorStr, range || undefined);
        },
      },
      {
        label: 'Insert Lorem Ipsum...',
        shortcut: 'Ctrl+Alt+L',
        action: () => useUIStore.getState().openLoremIpsumModal(),
      },
    ],
    Selection: [
      { label: 'Select All', shortcut: 'Ctrl+A' },
      { label: 'Select Next Occurrence', shortcut: 'Ctrl+D' },
      { label: 'Select Line', shortcut: 'Ctrl+L' },
      { divider: true, label: '' },
      { label: 'Duplicate Line Down', shortcut: 'Shift+Alt+Down' },
      { label: 'Move Line Down', shortcut: 'Alt+Down' },
      { label: 'Move Line Up', shortcut: 'Alt+Up' },
      { divider: true, label: '' },
      { label: 'Toggle Line Comment', shortcut: 'Ctrl+/' },
      { label: 'Delete Line', shortcut: 'Ctrl+Shift+K' },
    ],
    View: [
      { label: 'Command Palette...', shortcut: 'Ctrl+Shift+P', action: openCommandPalette },
      { label: 'Go to File...', shortcut: 'Ctrl+P', action: openQuickOpen },
      { label: 'Go to Symbol...', shortcut: 'Ctrl+R', action: () => useUIStore.getState().openQuickOpenWithMode('@') },
      { divider: true, label: '' },
      { label: 'Toggle Live Web Preview', shortcut: 'Ctrl+K V', action: () => useEditorStore.getState().togglePreview('live-web') },
      { label: 'Toggle Markdown Live Preview', shortcut: 'Ctrl+Shift+V', action: () => useEditorStore.getState().togglePreview('markdown') },
      { label: 'Live Server: Toggle (Go Live)', action: () => useLiveServerStore.getState().toggleServer() },
      { label: 'Live Server: Open in Browser', action: () => useLiveServerStore.getState().openInBrowser() },
      { divider: true, label: '' },
      { label: 'Toggle Sidebar', shortcut: 'Ctrl+B', action: toggleSidebar },
      { label: 'Toggle Terminal', shortcut: 'Ctrl+`', action: () => toggleBottomPanel('terminal') },
      { label: 'Toggle Problems Panel', action: () => toggleBottomPanel('problems') },
      { label: 'Toggle Output Panel', action: () => toggleBottomPanel('output') },
      { label: 'Toggle Minimap', action: toggleMinimap },
      { label: 'Extensions', shortcut: 'Ctrl+Shift+X', action: () => setActiveSidebarView('extensions') },
      { divider: true, label: '' },
      { label: 'Layout: Single', shortcut: 'Alt+Shift+1', action: () => setSplitLayout('single') },
      { label: 'Layout: 2 Columns', shortcut: 'Alt+Shift+2', action: () => setSplitLayout('two-columns') },
      { label: 'Layout: 2 Rows', shortcut: 'Alt+Shift+3', action: () => setSplitLayout('two-rows') },
      { divider: true, label: '' },
      { label: 'Zoom In', shortcut: 'Ctrl+=', action: () => useSettingsStore.getState().zoomIn() },
      { label: 'Zoom Out', shortcut: 'Ctrl+-', action: () => useSettingsStore.getState().zoomOut() },
      { label: 'Reset Zoom', shortcut: 'Ctrl+0', action: () => useSettingsStore.getState().resetZoom() },
      { divider: true, label: '' },
      { label: 'Toggle Full Screen', shortcut: 'F11' },
    ],
    Tools: [
      {
        label: 'Build',
        shortcut: 'Ctrl+B',
        action: () => useBuildStore.getState().executeBuild(),
      },
      {
        label: 'Build With...',
        shortcut: 'Ctrl+Shift+B',
        action: openBuildSystemModal,
      },
      {
        label: 'Cancel Build',
        action: () => useBuildStore.getState().stopBuild(),
      },
      { divider: true, label: '' },
      {
        label: 'Package Control: Browse Packages',
        shortcut: 'Ctrl+Shift+X',
        action: () => setActiveSidebarView('extensions'),
      },
    ],
    Help: [
      {
        label: 'Keyboard Shortcuts',
        shortcut: 'Ctrl+K Ctrl+S',
        action: openKeymapModal,
      },
      { divider: true, label: '' },
      {
        label: 'About Xivig Editor',
        action: () => alert('Xivig Editor v0.1.0\nSublime Text inspired fast desktop code editor.'),
      },
    ],
  };

  return (
    <nav ref={menubarRef} style={menubarContainerStyle}>
      {Object.entries(menus).map(([menuName, items]) => {
        const isOpen = openMenu === menuName;
        return (
          <div key={menuName} style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenMenu(isOpen ? null : menuName)}
              onMouseEnter={() => {
                if (openMenu !== null) setOpenMenu(menuName);
              }}
              style={{
                ...menuTriggerStyle,
                backgroundColor: isOpen ? 'var(--xivig-surface)' : 'transparent',
                color: isOpen ? 'var(--xivig-text)' : 'var(--xivig-text-muted)',
              }}
            >
              {menuName}
            </button>

            {isOpen && (
              <div style={dropdownStyle}>
                {items.map((item, idx) => {
                  if (item.divider) {
                    return <div key={idx} style={dividerStyle} />;
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setOpenMenu(null);
                        item.action?.();
                      }}
                      style={dropdownItemStyle}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--xivig-accent-active)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--xivig-text)';
                      }}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span style={shortcutStyle}>{item.shortcut}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

const menubarContainerStyle: React.CSSProperties = {
  height: 'var(--xivig-menubar-height)',
  backgroundColor: 'var(--xivig-activity-bar)',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '8px',
  borderBottom: '1px solid var(--xivig-border-subtle)',
  position: 'relative',
  zIndex: 100,
};

const menuTriggerStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '3px',
  fontSize: '12px',
  fontWeight: 400,
  transition: 'background-color 0.1s ease',
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  minWidth: '200px',
  backgroundColor: 'var(--xivig-surface)',
  border: '1px solid var(--xivig-border)',
  borderRadius: '4px',
  padding: '4px 0',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
  zIndex: 1000,
};

const dropdownItemStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 12px',
  fontSize: '12px',
  textAlign: 'left',
};

const shortcutStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--xivig-text-dim)',
  marginLeft: '16px',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'var(--xivig-border-subtle)',
  margin: '4px 0',
};
