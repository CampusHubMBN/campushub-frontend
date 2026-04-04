// src/components/layout/navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase, BookOpen, FileText, CalendarClock,
  Users, LayoutDashboard, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserNav } from './user-nav';
import { NotificationBell } from './notification-bell';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { useMounted } from '@/hooks/use-mounted';
import { FEATURES } from '@/lib/features';

const navItems = [
  { label: 'Offres',     href: '/jobs',     icon: Briefcase     },
  { label: 'Articles',   href: '/articles', icon: FileText      },
  { label: 'Blog',       href: '/blog',     icon: BookOpen      },
  { label: 'Événements', href: '/events',   icon: CalendarClock },
];

// Appended after the per-role filter so every role sees it when enabled.
const chatItem = FEATURES.CHAT
  ? [{ label: 'Messages', href: '/chat', icon: MessageSquare }]
  : [];

export function Navbar() {
  const { user }      = useAuthStore();
  const mounted       = useMounted();
  const pathname      = usePathname();
  const chatUnread    = useChatStore((s) => s.totalUnread);

  const homeItem = !mounted || !user ? { label: 'Dashboard', href: '/jobs' }
    : user.role === 'admin'       ? { label: 'Administration', href: '/admin'       }
    : user.role === 'company'     ? { label: 'Recrutement',    href: '/recruiter'   }
    : user.role === 'pedagogical' ? { label: 'Mon espace',     href: '/pedagogical' }
    : { label: 'Dashboard', href: '/dashboard' };

  // Company sees only Jobs + Events from the base list.
  // Chat is appended separately so it shows for every role.
  const visibleNavItems = [
    ...(mounted && user?.role === 'company'
      ? navItems.filter((i) => i.href === '/jobs' || i.href === '/events')
      : navItems),
    ...chatItem,
  ];

  const allNavItems = [
    ...(mounted && user ? [{ ...homeItem, icon: LayoutDashboard }] : []),
    ...visibleNavItems,
    ...(mounted && user?.role === 'admin'
      ? [{ label: 'Recrutement', href: '/recruiter', icon: Users }]
      : []),
  ];

  return (
    <>
      {/* ── Top bar ──────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-5 bg-white border-gray-200 shadow-sm">
        <Link href={homeItem.href} className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-campus-blue to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
            <span className="text-white font-black text-lg tracking-tight leading-none">C</span>
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-campus-blue to-indigo-600 bg-clip-text text-transparent">
            CampusHub
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {mounted && user && <NotificationBell />}
          <UserNav />
        </div>
      </header>

      {/* ── Desktop Sidebar ───────────────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-56 flex-col bg-campus-blue border-r border-gray-200 z-40">
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {allNavItems.map((item) => {
            const Icon   = item.icon;
            const active = pathname.startsWith(item.href);
            const isChat = item.href === '/chat';
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                  active
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-white hover:bg-accent hover:text-gray-900'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isChat && chatUnread > 0 && (
                  <span className="bg-campus-orange text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center leading-none">
                    {chatUnread > 99 ? '99+' : chatUnread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Mobile Bottom Bar ────────────────────────────────── */}
      <MobileNav chatUnread={chatUnread} />
    </>
  );
}

function MobileNav({ chatUnread }: { chatUnread: number }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const mounted  = useMounted();

  const homeHref = !mounted || !user ? '/jobs'
    : user.role === 'admin'       ? '/admin'
    : user.role === 'company'     ? '/recruiter'
    : user.role === 'pedagogical' ? '/pedagogical'
    : '/dashboard';

  const visibleNavItems = [
    ...(mounted && user?.role === 'company'
      ? navItems.filter((i) => i.href === '/jobs' || i.href === '/events')
      : navItems),
    ...chatItem,
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-campus-blue border-t border-gray-200">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleNavItems.map((item) => {
          const Icon   = item.icon;
          const active = pathname.startsWith(item.href);
          const isChat = item.href === '/chat';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1',
                active ? 'text-accent' : 'text-white'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {isChat && chatUnread > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-campus-orange text-white text-[10px] font-bold min-w-[1rem] h-4 rounded-full flex items-center justify-center px-0.5">
                    {chatUnread > 9 ? '9+' : chatUnread}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        <Link
          href={homeHref}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full gap-1',
            pathname === homeHref ? 'text-accent' : 'text-white'
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-xs font-medium">Accueil</span>
        </Link>

        {mounted && user?.role === 'admin' && (
          <Link
            href="/recruiter"
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full gap-1',
              pathname.startsWith('/recruiter') ? 'text-campus-blue' : 'text-gray-600'
            )}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium">Recrutement</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
