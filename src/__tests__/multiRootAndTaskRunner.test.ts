// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { useFileStore } from '../stores/fileStore';
import { useTaskStore } from '../stores/taskStore';

describe('Multi-Root Workspace & Task Runner', () => {
  beforeEach(() => {
    useFileStore.setState({
      workspaceFolders: [],
      trustedWorkspaces: {},
      fileTree: [
        {
          id: '/root/src',
          name: 'src',
          path: '/root/src',
          isDirectory: true,
          isExpanded: true,
          children: [
            {
              id: '/root/src/index.ts',
              name: 'index.ts',
              path: '/root/src/index.ts',
              isDirectory: false,
            },
            {
              id: '/root/src/utils',
              name: 'utils',
              path: '/root/src/utils',
              isDirectory: true,
              isExpanded: true,
              children: [],
            },
          ],
        },
      ],
      fileFilterQuery: '',
    });

    useTaskStore.setState({
      tasks: [
        { label: 'build', command: 'npm run build', group: { kind: 'build', isDefault: true } },
        { label: 'test', command: 'npm test', group: { kind: 'test' } },
      ],
      activeTaskIds: [],
    });
  });

  it('manages multi-root workspace folders without duplicates', async () => {
    const store = useFileStore.getState();
    await store.addWorkspaceFolder('/workspaces/frontend');
    await store.addWorkspaceFolder('/workspaces/backend');
    await store.addWorkspaceFolder('/workspaces/frontend'); // duplicate

    const roots = useFileStore.getState().workspaceFolders;
    expect(roots).toHaveLength(2);
    expect(roots[0].name).toBe('frontend');
    expect(roots[1].name).toBe('backend');

    store.removeWorkspaceFolder('/workspaces/frontend');
    expect(useFileStore.getState().workspaceFolders).toHaveLength(1);
    expect(useFileStore.getState().workspaceFolders[0].path).toBe('/workspaces/backend');
  });

  it('manages workspace trust status', () => {
    const store = useFileStore.getState();
    expect(store.isWorkspaceTrusted('/workspaces/safe')).toBe(true); // default true

    store.setWorkspaceTrust('/workspaces/untrusted', false);
    expect(useFileStore.getState().isWorkspaceTrusted('/workspaces/untrusted')).toBe(false);

    store.setWorkspaceTrust('/workspaces/untrusted', true);
    expect(useFileStore.getState().isWorkspaceTrusted('/workspaces/untrusted')).toBe(true);
  });

  it('recursively collapses all folders in the file tree', () => {
    const store = useFileStore.getState();
    expect(store.fileTree[0].isExpanded).toBe(true);
    expect(store.fileTree[0].children![1].isExpanded).toBe(true);

    store.collapseAllFolders();

    const collapsed = useFileStore.getState().fileTree;
    expect(collapsed[0].isExpanded).toBe(false);
    expect(collapsed[0].children![1].isExpanded).toBe(false);
  });

  it('filters file search query in file store', () => {
    const store = useFileStore.getState();
    store.setFileFilterQuery('*.ts');
    expect(useFileStore.getState().fileFilterQuery).toBe('*.ts');
  });

  it('loads and manages workspace tasks in task store', () => {
    const store = useTaskStore.getState();
    expect(store.tasks).toHaveLength(2);
    expect(store.tasks[0].label).toBe('build');
    expect(store.tasks[1].label).toBe('test');
  });
});
