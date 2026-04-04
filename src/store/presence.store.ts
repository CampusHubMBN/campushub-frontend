// src/store/presence.store.ts
import { create } from 'zustand';

interface PresenceState {
  onlineIds: Set<string>;
  setOnline:  (userId: string) => void;
  setOffline: (userId: string) => void;
  isOnline:   (userId: string) => boolean;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineIds: new Set(),

  setOnline: (userId) =>
    set((s) => ({ onlineIds: new Set([...s.onlineIds, userId]) })),

  setOffline: (userId) =>
    set((s) => {
      const next = new Set(s.onlineIds);
      next.delete(userId);
      return { onlineIds: next };
    }),

  isOnline: (userId) => get().onlineIds.has(userId),
}));
