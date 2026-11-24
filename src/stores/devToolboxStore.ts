import { create } from 'zustand';

export interface ClipboardHistoryItem {
  id: string;
  text: string;
  timestamp: string;
}

interface DevToolboxState {
  scratchText: string;
  clipboardHistory: ClipboardHistoryItem[];
  isClipboardHistoryEnabled: boolean;

  setScratchText: (text: string) => void;
  addClipboardHistoryItem: (text: string) => void;
  removeClipboardHistoryItem: (id: string) => void;
  clearClipboardHistory: () => void;
  setIsClipboardHistoryEnabled: (enabled: boolean) => void;
}

export const useDevToolboxStore = create<DevToolboxState>((set, get) => ({
  scratchText: '// Xivig Scratch Buffer\n// Use this for temporary snippets, quick notes, and scratchpad calculations.\n',
  clipboardHistory: [],
  isClipboardHistoryEnabled: true,

  setScratchText: (text) => set({ scratchText: text }),

  addClipboardHistoryItem: (text) => {
    if (!get().isClipboardHistoryEnabled || !text || !text.trim()) return;
    const cleanText = text.trim();
    const existing = get().clipboardHistory.filter((item) => item.text !== cleanText);
    const newItem: ClipboardHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: cleanText,
      timestamp: new Date().toLocaleTimeString(),
    };
    set({
      clipboardHistory: [newItem, ...existing.slice(0, 49)], // Keep up to 50 items
    });
  },

  removeClipboardHistoryItem: (id) => {
    set((state) => ({
      clipboardHistory: state.clipboardHistory.filter((item) => item.id !== id),
    }));
  },

  clearClipboardHistory: () => set({ clipboardHistory: [] }),

  setIsClipboardHistoryEnabled: (enabled) => set({ isClipboardHistoryEnabled: enabled }),
}));
