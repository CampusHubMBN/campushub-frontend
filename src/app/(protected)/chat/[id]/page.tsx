// src/app/(protected)/chat/[id]/page.tsx
'use client';

import { use, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { usePresenceStore } from '@/store/presence.store';
import { useChatStore } from '@/store/chat.store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GET_MESSAGES, SEND_MESSAGE, MARK_CONVERSATION_READ, MY_CONVERSATIONS,
} from '@/lib/graphql/chat';
import { storageUrl, cn } from '@/lib/utils';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import type { ChatMessage, ChatConversation } from '@/types/chat';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDay(date: Date): string {
  if (isToday(date))     return "Aujourd'hui";
  if (isYesterday(date)) return 'Hier';
  return format(date, 'd MMMM yyyy', { locale: fr });
}

function groupByDay(messages: ChatMessage[]): { day: string; items: ChatMessage[] }[] {
  const groups: { day: string; items: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const day  = formatDay(new Date(msg.createdAt));
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(msg);
    else groups.push({ day, items: [msg] });
  }
  return groups;
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = use(params);
  const router                  = useRouter();
  const { user }                = useAuthStore();

  const client      = useApolloClient();
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');

  // Optimistic messages shown instantly before server confirms / subscription arrives.
  // Once the same id appears in server data, they're automatically filtered out.
  const [pending, setPending] = useState<ChatMessage[]>([]);

  // ── Queries ────────────────────────────────────────────────────

  const { data: messagesData, loading: loadingMessages, refetch: refetchMessages } = useQuery(GET_MESSAGES, {
    variables:    { conversationId, page: 1 },
    fetchPolicy:  'cache-and-network',
    pollInterval: 3000,   // fallback: max 3 s delay if subscription misses an event
    skip:         !conversationId,
  });

  const { data: convsData } = useQuery(MY_CONVERSATIONS, {
    fetchPolicy: 'cache-only',
  });

  const conversation: ChatConversation | undefined = useMemo(
    () => ((convsData as any)?.myConversations ?? [])
      .find((c: ChatConversation) => c.id === conversationId),
    [convsData, conversationId],
  );

  // Combined display list: server messages (chronological) + pending not yet confirmed
  const messages: ChatMessage[] = useMemo(() => {
    const raw: any[] = (messagesData as any)?.messages?.messages ?? [];
    const server = [...raw]
      .reverse()
      .map((m) => ({ ...m, isOwn: m.senderId === user?.id }));
    const serverIds = new Set(server.map((m) => m.id));
    const stillPending = pending.filter((m) => !serverIds.has(m.id));
    return [...server, ...stillPending];
  }, [messagesData, pending, user?.id]);

  // ── Mutations ──────────────────────────────────────────────────

  const [markRead] = useMutation(MARK_CONVERSATION_READ, {
    variables: { conversationId },
  });

  // Zero unread count immediately in the MY_CONVERSATIONS cache so the
  // badge clears as soon as the user opens the conversation — no subscription needed.
  const clearUnreadInCache = useCallback(() => {
    client.cache.updateQuery({ query: MY_CONVERSATIONS }, (existing: any) => {
      if (!existing?.myConversations) return existing;
      return {
        myConversations: existing.myConversations.map((c: any) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c,
        ),
      };
    });
  }, [client, conversationId]);

  const [sendMsg, { loading: sending }] = useMutation(SEND_MESSAGE);

  // ── Effects ────────────────────────────────────────────────────

  useEffect(() => {
    if (conversationId) {
      clearUnreadInCache();
      markRead().catch(() => {});
    }
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ── Incoming messages from layout-level subscription ───────────
  // The subscription lives in use-chat.ts (always mounted), same pattern
  // as notifications. When a message arrives, the store is updated and this
  // effect reacts — no remount gap, no subscription race condition.

  const { lastIncoming, clearIncoming } = useChatStore();

  useEffect(() => {
    if (!lastIncoming || lastIncoming.conversationId !== conversationId) return;

    setPending((prev) => {
      if (prev.some((m) => m.id === lastIncoming.id)) return prev;
      return [...prev, { ...lastIncoming, isOwn: lastIncoming.senderId === user?.id }];
    });
    clearUnreadInCache();
    markRead().catch(() => {});
    clearIncoming();
  }, [lastIncoming]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send ───────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content || sending) return;

    setText('');
    textareaRef.current?.focus();

    const tempId = `temp-${Date.now()}`;
    setPending((prev) => [
      ...prev,
      {
        id:             tempId,
        conversationId,
        senderId:       user!.id,
        content,
        isOwn:          true,
        readAt:         null,
        createdAt:      new Date().toISOString() as any,
      },
    ]);

    try {
      const { data } = await sendMsg({ variables: { input: { conversationId, content } } });
      const sent = (data as any).sendMessage as ChatMessage;

      // Swap the temp entry for the real message (real id, real timestamp).
      // When refetch completes, sent.id will be in serverIds and drop from pending.
      setPending((prev) =>
        prev.map((m) => (m.id === tempId ? { ...sent, isOwn: true } : m)),
      );
      refetchMessages();
    } catch {
      toast.error("Erreur lors de l'envoi");
      setText(content);
      setPending((prev) => prev.filter((m) => m.id !== tempId));
    }
  }, [text, sending, conversationId, sendMsg, user, refetchMessages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Header info ────────────────────────────────────────────────

  const other       = conversation?.otherParticipant;
  const otherOnline = usePresenceStore((s) => other ? s.isOnline(other.id) : false);
  const initials    = other?.name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-campus-gray-50">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-campus-gray-200 flex-shrink-0">
        <button
          onClick={() => router.push('/chat')}
          className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg text-campus-gray-600 hover:bg-campus-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {other ? (
          <>
            <div className="relative flex-shrink-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={storageUrl(other.avatarUrl) ?? undefined} />
                <AvatarFallback className="bg-campus-blue text-white text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {otherOnline && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-campus-gray-900 leading-tight">{other.name}</p>
              {otherOnline && (
                <p className="text-[11px] text-green-600 font-medium leading-tight">En ligne</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full bg-campus-gray-200" />
            <Skeleton className="h-4 w-32 bg-campus-gray-200" />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loadingMessages && !messages.length ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-campus-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-campus-gray-400">Aucun message — dites bonjour !</p>
          </div>
        ) : (
          groupByDay(messages).map(({ day, items }) => (
            <div key={day}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-campus-gray-200" />
                <span className="text-xs text-campus-gray-400 font-medium">{day}</span>
                <div className="flex-1 h-px bg-campus-gray-200" />
              </div>

              <div className="space-y-1">
                {items.map((msg, idx) => {
                  const isOwn    = msg.senderId === user?.id;
                  const prevMsg  = idx > 0 ? items[idx - 1] : null;
                  const nextMsg  = idx < items.length - 1 ? items[idx + 1] : null;
                  const isFirst  = !prevMsg || prevMsg.senderId !== msg.senderId;
                  const isLast   = !nextMsg || nextMsg.senderId !== msg.senderId;
                  const isPending = msg.id.startsWith('temp-');

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex items-end gap-2',
                        isOwn ? 'flex-row-reverse' : 'flex-row',
                        isFirst && idx > 0 && 'mt-3',
                      )}
                    >
                      {!isOwn && (
                        <div className="w-7 flex-shrink-0">
                          {isLast && (
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={storageUrl(other?.avatarUrl) ?? undefined} />
                              <AvatarFallback className="bg-campus-blue text-white text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}

                      <div className={cn(
                        'max-w-[70%] px-3.5 py-2 text-sm leading-relaxed transition-opacity',
                        isOwn
                          ? 'bg-campus-blue text-white rounded-2xl rounded-br-md'
                          : 'bg-white text-campus-gray-800 border border-campus-gray-200 rounded-2xl rounded-bl-md',
                        isOwn  && !isLast && 'rounded-br-2xl',
                        !isOwn && !isLast && 'rounded-bl-2xl',
                        isPending && 'opacity-60',
                      )}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        {isLast && (
                          <p className={cn(
                            'text-[11px] mt-1 text-right',
                            isOwn ? 'text-blue-200' : 'text-campus-gray-400',
                          )}>
                            {isPending ? '···' : format(new Date(msg.createdAt), 'HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-campus-gray-200">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message… (Entrée pour envoyer)"
            rows={1}
            className={cn(
              'flex-1 resize-none rounded-2xl border border-campus-gray-300 bg-campus-gray-50',
              'px-4 py-2.5 text-sm text-campus-gray-800 placeholder:text-campus-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-campus-blue focus:border-transparent',
              'max-h-32 overflow-y-auto',
            )}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 128) + 'px';
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="h-10 w-10 p-0 rounded-full bg-campus-blue hover:bg-campus-blue-600 text-white flex-shrink-0 disabled:opacity-40"
          >
            {sending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
