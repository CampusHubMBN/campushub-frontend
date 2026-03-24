// src/store/notification.store.ts
import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  type: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  userId: string;
  data: {
    message: string;
    actorName?: string | null;
    actorId?: string | null;
    resourceId?: string | null;
    resourceTitle?: string | null;
    resourceType?: string | null;
  };
}

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  initialized: boolean;

  setNotifications: (notifications: NotificationItem[], unreadCount: number) => void;
  prependNotification: (notification: NotificationItem) => void;
  setUnreadCount: (count: number) => void;
  markRead: (ids: string[] | null) => void; // null = mark all
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  initialized: false,

  setNotifications: (notifications, unreadCount) =>
    set({ notifications, unreadCount, initialized: true }),

  prependNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  markRead: (ids) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        ids === null || ids.includes(n.id)
          ? { ...n, read: true, readAt: new Date().toISOString() }
          : n
      ),
      unreadCount: ids === null ? 0 : Math.max(0, state.unreadCount - ids.length),
    })),
}));
