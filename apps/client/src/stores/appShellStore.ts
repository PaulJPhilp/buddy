import { create } from 'zustand';

export type MockThreadId = 'thread1' | 'thread2';

interface AppShellState {
    selectedThreadId: MockThreadId | null;
    setSelectedThreadId: (threadId: MockThreadId) => void;
}

export const useAppShellStore = create<AppShellState>((set) => ({
    selectedThreadId: null,
    setSelectedThreadId: (threadId) => set({ selectedThreadId: threadId }),
}));
