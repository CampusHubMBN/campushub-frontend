// src/components/layout/notification-bell.tsx
'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Bell, Check, Briefcase, MessageSquare, UserPlus, Zap, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore, NotificationItem } from '@/store/notification.store';
import { MARK_NOTIFICATIONS_READ } from '@/lib/graphql/notifications';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

function NotifIcon({ type }: { type: string }) {
  const base = 'h-4 w-4';
  if (type.includes('application')) return <Briefcase className={cn(base, 'text-campus-blue')} />;
  if (type.includes('comment') || type.includes('reaction')) return <MessageSquare className={cn(base, 'text-campus-orange')} />;
  if (type.includes('user')) return <UserPlus className={cn(base, 'text-green-500')} />;
  if (type === 'event.cancelled') return <CalendarDays className={cn(base, 'text-red-500')} />;
  if (type.includes('event')) return <CalendarDays className={cn(base, 'text-indigo-500')} />;
  return <Zap className={cn(base, 'text-campus-gray-400')} />;
}

function NotifRow({ notif, onRead }: { notif: NotificationItem; onRead: (id: string) => void }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-campus-gray-50 transition-colors',
        !notif.read && 'bg-campus-blue-50/40'
      )}
      onClick={() => !notif.read && onRead(notif.id)}
    >
      <div className="h-8 w-8 rounded-full bg-white border border-campus-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
        <NotifIcon type={notif.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', notif.read ? 'text-campus-gray-600' : 'text-campus-gray-900 font-medium')}>
          {notif.data.message}
        </p>
        <p className="text-xs text-campus-gray-400 mt-0.5">
          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}
        </p>
      </div>
      {!notif.read && (
        <span className="h-2 w-2 rounded-full bg-campus-blue flex-shrink-0 mt-1.5" />
      )}
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  // Read-only from Zustand — no Apollo hooks here
  const { notifications, unreadCount, initialized, markRead } = useNotificationStore();

  // Only mutation lives here — stable, doesn't cause re-subscription
  const [markReadMutation] = useMutation(MARK_NOTIFICATIONS_READ);

  const markAsRead = async (ids: string[] | null) => {
    try {
      await markReadMutation({ variables: { input: { ids: ids ?? undefined } } });
      markRead(ids);
    } catch {
      // optimistic update already applied via markRead
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 flex items-center justify-center rounded-lg text-campus-gray-500 hover:text-campus-gray-900 hover:bg-campus-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {initialized && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-campus-blue text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-xl border border-campus-gray-200 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-campus-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-campus-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-campus-blue text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAsRead(null)}
                  className="flex items-center gap-1 text-xs text-campus-blue hover:text-campus-blue/80 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Tout lire
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-campus-gray-100">
              {!initialized ? (
                <div className="py-8 text-center flex flex-col items-center gap-2">
                  <div className="h-5 w-5 border-2 border-campus-blue border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-campus-gray-400">Chargement…</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="h-7 w-7 text-campus-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-campus-gray-400">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <NotifRow key={notif.id} notif={notif} onRead={(id) => markAsRead([id])} />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
