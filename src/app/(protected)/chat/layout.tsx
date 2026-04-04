// src/app/(protected)/chat/layout.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MY_CONVERSATIONS } from '@/lib/graphql/chat';
import { useAuthStore } from '@/store/auth.store';
import { storageUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';
import { usePresenceStore } from '@/store/presence.store';
import type { ChatConversation } from '@/types/chat';

// ── Conversation list (left panel) ─────────────────────────────────────────

function ConversationList() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();

  const { data, loading } = useQuery(MY_CONVERSATIONS, {
    fetchPolicy:  'cache-and-network',
    pollInterval: 3000,
  });
  const isOnline = usePresenceStore((s) => s.isOnline);

  const conversations: ChatConversation[] = (data as any)?.myConversations ?? [];

  // Extract active conversation id from path: /chat/[id]
  const segments   = pathname.split('/');
  const activeId   = segments.length > 2 ? segments[2] : null;

  if (loading && !conversations.length) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full bg-campus-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28 bg-campus-gray-200" />
              <Skeleton className="h-3 w-40 bg-campus-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <MessageSquare className="h-10 w-10 text-campus-gray-300 mb-3" />
        <p className="text-sm font-medium text-campus-gray-600">Aucune conversation</p>
        <p className="text-xs text-campus-gray-400 mt-1 max-w-[180px]">
          Démarrez une conversation depuis un profil ou une candidature
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv) => {
        const initials = conv.otherParticipant.name
          ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
        const isActive = activeId === conv.id;
        const isOwn    = conv.lastMessageSenderId === user?.id;

        return (
          <button
            key={conv.id}
            onClick={() => router.push(`/chat/${conv.id}`)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 transition-colors text-left',
              isActive
                ? 'bg-campus-blue-50 border-r-2 border-campus-blue'
                : 'hover:bg-campus-gray-50'
            )}
          >
            <div className="relative flex-shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={storageUrl(conv.otherParticipant.avatarUrl) ?? undefined} />
                <AvatarFallback className="bg-campus-blue text-white text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isOnline(conv.otherParticipant.id) && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={cn(
                  'text-sm truncate',
                  conv.unreadCount > 0
                    ? 'font-semibold text-campus-gray-900'
                    : 'font-medium text-campus-gray-700'
                )}>
                  {conv.otherParticipant.name}
                </span>
                {conv.lastMessageAt && (
                  <span className="text-[11px] text-campus-gray-400 flex-shrink-0">
                    {formatDistanceToNow(new Date(conv.lastMessageAt), { locale: fr })}
                  </span>
                )}
              </div>
              {conv.lastMessageContent && (
                <p className={cn(
                  'text-xs truncate mt-0.5',
                  conv.unreadCount > 0
                    ? 'text-campus-gray-900 font-medium'
                    : 'text-campus-gray-500'
                )}>
                  {isOwn ? 'Vous : ' : ''}{conv.lastMessageContent}
                </p>
              )}
            </div>

            {conv.unreadCount > 0 && (
              <span className="flex-shrink-0 bg-campus-blue text-white text-[11px] font-bold min-w-[1.25rem] h-5 rounded-full flex items-center justify-center px-1">
                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname       = usePathname();
  const isInThread     = pathname !== '/chat';

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-white">

      {/* ── Conversation list panel ── */}
      <div className={cn(
        'flex flex-col border-r border-campus-gray-200 bg-white',
        'md:w-80 md:flex-shrink-0',
        // Mobile: full width on /chat, hidden when in a thread
        isInThread ? 'hidden md:flex' : 'flex w-full',
      )}>
        <div className="px-4 py-3.5 border-b border-campus-gray-100">
          <h2 className="text-base font-semibold text-campus-gray-900">Messages</h2>
        </div>
        <ConversationList />
      </div>

      {/* ── Thread panel ── */}
      <div className={cn(
        'flex-1 flex flex-col min-w-0',
        // Mobile: hidden on /chat index, shown in thread
        !isInThread && 'hidden md:flex',
      )}>
        {children}
      </div>
    </div>
  );
}
