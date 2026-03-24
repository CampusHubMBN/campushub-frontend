// src/components/layout/notification-initializer.tsx
// Initializes Apollo subscriptions ONCE at layout level.
// NotificationBell reads from the Zustand store instead.
'use client';

import { useNotifications } from '@/hooks/use-notifications';

export function NotificationInitializer() {
  useNotifications();
  return null;
}
