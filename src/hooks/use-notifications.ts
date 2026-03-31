// src/hooks/use-notifications.ts
'use client';

import { useEffect } from 'react';
import { useQuery, useSubscription, useApolloClient } from '@apollo/client/react';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore, NotificationItem } from '@/store/notification.store';
import {
  MY_NOTIFICATIONS,
  NOTIFICATION_ADDED,
  UNREAD_COUNT_UPDATED,
} from '@/lib/graphql/notifications';
import { toast } from 'sonner';

export function useNotifications() {
  const { user, isAuthenticated } = useAuthStore();
  const apolloClient = useApolloClient();

  // Only destructure write actions — never read reactive values here.
  // Reading would cause this component (NotificationInitializer) to re-render
  // on every notification, re-evaluating Apollo hooks at layout level → crash.
  const { setNotifications, prependNotification, setUnreadCount } =
    useNotificationStore();

  const skip = !isAuthenticated || !user;

  // If not authenticated, mark as initialized immediately so bell shows empty state
  useEffect(() => {
    if (skip) setNotifications([], 0);
  }, [skip]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Initial fetch ────────────────────────────────────────────────────────────
  const { data, error } = useQuery(MY_NOTIFICATIONS, {
    variables: { page: 1, unreadOnly: false },
    skip,
  });

  useEffect(() => {
    if (data) {
      setNotifications(
        data.myNotifications.notifications,
        data.myNotifications.unreadCount
      );
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error) {
      // NestJS unreachable — mark as initialized so the bell shows empty state
      setNotifications([], 0);
    }
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live: new notification ───────────────────────────────────────────────────
  useSubscription(NOTIFICATION_ADDED, {
    skip,
    onData: ({ data }) => {
      const notification: NotificationItem = data.data?.notificationAdded;
      if (!notification) return;
      prependNotification(notification);
      toast(notification.data.message, {
        description: notification.data.actorName ?? undefined,
        duration: 5000,
      });
    },
  });

  // ── Live: unread count ───────────────────────────────────────────────────────
  useSubscription(UNREAD_COUNT_UPDATED, {
    skip,
    onData: ({ data }) => {
      const update = data.data?.unreadCountUpdated;
      if (!update) return;
      const prevCount = useNotificationStore.getState().unreadCount;
      setUnreadCount(update.count);
      // Safety net: if count went up and NOTIFICATION_ADDED didn't update the
      // list (e.g. GraphQL resolver failed silently), force-refresh the list.
      if (update.count > prevCount) {
        apolloClient.query({
          query: MY_NOTIFICATIONS,
          variables: { page: 1, unreadOnly: false },
          fetchPolicy: 'network-only',
        }).then(({ data: fresh }) => {
          if (fresh) {
            setNotifications(fresh.myNotifications.notifications, fresh.myNotifications.unreadCount);
          }
        }).catch(() => {/* ignore */});
      }
    },
  });
}
