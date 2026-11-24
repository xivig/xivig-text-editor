import { create } from 'zustand';
import { useFileStore } from './fileStore';

export interface TaskDefinition {
  label: string;
  type?: 'shell' | 'process';
  command: string;
  args?: string[];
  cwd?: string;
  isBackground?: boolean;
  problemMatcher?: string | string[];
  dependsOn?: string[];
  group?: { kind: string; isDefault?: boolean };
}

interface TaskState {
  tasks: TaskDefinition[];
  activeTaskIds: string[];
  taskLogs: Record<string, string[]>;
  isModalOpen: boolean;
  isLoading: boolean;
  initialized: boolean;

  // Actions
  initialize: () => void;
  loadTasks: () => Promise<void>;
  runTask: (task: TaskDefinition) => Promise<boolean>;
  stopTask: (taskId: string) => Promise<boolean>;
  openModal: () => void;
  closeModal: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  activeTaskIds: [],
  taskLogs: {},
  isModalOpen: false,
  isLoading: false,
  initialized: false,

  initialize: () => {
    if (get().initialized) return;
    set({ initialized: true });

    if (typeof window !== 'undefined' && window.xivig?.tasks) {
      window.xivig.tasks.onOutput((data) => {
        set((state) => ({
          taskLogs: {
            ...state.taskLogs,
            [data.taskId]: [...(state.taskLogs[data.taskId] || []), data.output],
          },
        }));
      });

      window.xivig.tasks.onCompleted((data) => {
        set((state) => ({
          activeTaskIds: state.activeTaskIds.filter((id) => id !== data.taskId),
        }));
      });
    }
  },

  loadTasks: async () => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.tasks?.loadTasks) return;

    set({ isLoading: true });
    try {
      const list = await window.xivig.tasks.loadTasks(cwd);
      set({ tasks: list || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  runTask: async (task) => {
    const cwd = useFileStore.getState().currentFolderPath;
    if (!cwd || !window.xivig?.tasks?.runTask) return false;

    try {
      const res = await window.xivig.tasks.runTask(cwd, task);
      if (res.success && res.taskId) {
        set((state) => ({
          activeTaskIds: [...state.activeTaskIds, res.taskId],
        }));
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  },

  stopTask: async (taskId) => {
    if (!window.xivig?.tasks?.stopTask) return false;
    const ok = await window.xivig.tasks.stopTask(taskId);
    if (ok) {
      set((state) => ({
        activeTaskIds: state.activeTaskIds.filter((id) => id !== taskId),
      }));
    }
    return ok;
  },

  openModal: () => {
    set({ isModalOpen: true });
    get().loadTasks();
  },

  closeModal: () => set({ isModalOpen: false }),
}));
