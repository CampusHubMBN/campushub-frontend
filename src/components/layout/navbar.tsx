// src/components/layout/navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, BookOpen, FileText, CalendarClock, Users, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserNav } from './user-nav';
import { NotificationBell } from './notification-bell';
import { useAuthStore } from '@/store/auth.store';
import { useMounted } from '@/hooks/use-mounted';

const navItems = [
  { label: 'Offres',     href: '/jobs',     icon: Briefcase     },
  { label: 'Articles',   href: '/articles', icon: FileText      },
  { label: 'Blog',       href: '/blog',     icon: BookOpen      },
  { label: 'Événements', href: '/events',   icon: CalendarClock },
];

export function Navbar() {
  const { user } = useAuthStore();
  const mounted = useMounted();
  const pathname = usePathname();

  const allNavItems = [
    ...(mounted && user
      ? [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }]
      : []),
    ...navItems,
    ...(mounted && (user?.role === 'company' || user?.role === 'admin')
      ? [{ label: 'Recrutement', href: '/recruiter', icon: Users }]
      : []),
  ];

  return (
    <>
      {/* ── Top bar: logo + bell + UserNav ──────────────────── */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-5 bg-white border-b border-gray-200 shadow-sm">
        <Link href={user ? '/dashboard' : '/jobs'} className="flex items-center gap-2.5">
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

      {/* ── Desktop Sidebar: nav items only ─────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-56 flex-col bg-white border-r border-gray-200 z-40">
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                  active
                    ? 'bg-campus-blue text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Mobile Bottom Bar ───────────────────────────────── */}
      <MobileNav />
    </>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const mounted = useMounted();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1',
                active ? 'text-campus-blue' : 'text-gray-600'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/dashboard"
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full gap-1',
            pathname === '/dashboard' ? 'text-campus-blue' : 'text-gray-600'
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-xs font-medium">Accueil</span>
        </Link>
        {mounted && (user?.role === 'company' || user?.role === 'admin') && (
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
