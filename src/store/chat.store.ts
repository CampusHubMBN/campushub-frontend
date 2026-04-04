// src/store/chat.store.ts
import { create } from 'zustand';
import type { ChatMessage } from '@/types/chat';

interface ChatState {
  totalUnread:    number;
  setTotalUnread: (n: number) => void;

  // Last message received via subscription — consumed by the active thread page.
  lastIncoming:    ChatMessage | null;
  setLastIncoming: (msg: ChatMessage) => void;
  clearIncoming:   () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  totalUnread:    0,
  setTotalUnread: (n) => set({ totalUnread: n }),

  lastIncoming:    null,
  setLastIncoming: (msg) => set({ lastIncoming: msg }),
  clearIncoming:   () => set({ lastIncoming: null }),
}));
