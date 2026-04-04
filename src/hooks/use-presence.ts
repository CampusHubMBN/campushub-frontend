// src/hooks/use-presence.ts
// Manages the current user's online presence:
//   - calls setOnline on mount, setOffline on unmount
//   - sends a heartbeat every 2 minutes to keep the Redis TTL alive
//   - subscribes to presenceUpdated to keep the Zustand store current
import { useEffect } from 'react';
import { useMutation, useSubscription } from '@apollo/client/react';
import { useAuthStore } from '@/store/auth.store';
import { usePresenceStore } from '@/store/presence.store';
import { SET_ONLINE, SET_OFFLINE, HEARTBEAT, PRESENCE_UPDATED } from '@/lib/graphql/presence';

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

export function usePresence() {
  const { user } = useAuthStore();
  const { setOnline, setOffline } = usePresenceStore();

  const [markOnline]  = useMutation(SET_ONLINE);
  const [markOffline] = useMutation(SET_OFFLINE);
  const [sendHeartbeat] = useMutation(HEARTBEAT);

  // Announce online / offline
  useEffect(() => {
    if (!user) return;

    markOnline().catch(() => {/* ignore — non-critical */});

    const interval = setInterval(() => {
      sendHeartbeat().catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      markOffline().catch(() => {});
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the presence store in sync with real-time updates
  useSubscription(PRESENCE_UPDATED, {
    skip: !user,
    onData: ({ data }) => {
      const update = (data.data as any)?.presenceUpdated;
      if (!update) return;
      if (update.status === 'online') {
        setOnline(update.userId);
      } else {
        setOffline(update.userId);
      }
    },
  });
}
