// src/hooks/use-chat.ts
// Layout-level hook: keeps MY_CONVERSATIONS cache fresh and the unread badge in sync.
// Does NOT subscribe to individual messages — that happens inside the thread page.
'use client';

import { useEffect } from 'react';
import { useQuery, useSubscription } from '@apollo/client/react';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { MY_CONVERSATIONS, CHAT_CONVERSATION_UPDATED, CHAT_MESSAGE_ADDED } from '@/lib/graphql/chat';
import type { ChatConversation, ChatMessage } from '@/types/chat';

export function useChat() {
  const { isAuthenticated, user } = useAuthStore();
  const { setTotalUnread, setLastIncoming } = useChatStore();

  const skip = !isAuthenticated || !user;

  // ── Initial fetch ─────────────────────────────────────────────────
  const { data, error } = useQuery(MY_CONVERSATIONS, {
    skip,
    fetchPolicy:  'cache-and-network',
    pollInterval: 3000,
  });

  useEffect(() => {
    if (data) {
      const convs: ChatConversation[] = (data as any).myConversations ?? [];
      const total = convs.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
      setTotalUnread(total);
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error) setTotalUnread(0);
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live: new message (layout-level — always active, never remounted) ──
  // Mirrors the notification pattern: subscription lives here so it isn't
  // torn down when the thread page navigates. The active thread page reads
  // lastIncoming from the store and adds it to its local pending list.
  useSubscription(CHAT_MESSAGE_ADDED, {
    skip,
    onData: ({ data: subData }) => {
      const msg = (subData.data as any)?.chatMessageAdded as ChatMessage | undefined;
      if (msg) setLastIncoming(msg);
    },
  });

  // ── Live: conversation updated (new message, read receipt) ────────
  useSubscription(CHAT_CONVERSATION_UPDATED, {
    skip,
    onData: ({ client, data: subData }) => {
      const updated: ChatConversation | undefined =
        (subData.data as any)?.chatConversationUpdated;
      if (!updated) return;

      // Update the Apollo cache so every component using MY_CONVERSATIONS
      // re-renders automatically.
      client.cache.updateQuery({ query: MY_CONVERSATIONS }, (existing: any) => {
        if (!existing?.myConversations) return existing;

        const convs: ChatConversation[] = existing.myConversations;
        const exists = convs.some((c) => c.id === updated.id);

        const next = exists
          ? convs.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
          : [updated, ...convs];

        // Keep sorted by most recent message
        const sorted = [...next].sort((a, b) => {
          const aT = a.lastMessageAt
            ? new Date(a.lastMessageAt).getTime()
            : new Date(a.createdAt).getTime();
          const bT = b.lastMessageAt
            ? new Date(b.lastMessageAt).getTime()
            : new Date(b.createdAt).getTime();
          return bT - aT;
        });

        const total = sorted.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
        setTotalUnread(total);

        return { myConversations: sorted };
      });
    },
  });
}
