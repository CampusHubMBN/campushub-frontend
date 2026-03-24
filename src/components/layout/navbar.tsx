// src/components/layout/navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, BookOpen, FileText, CalendarClock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserNav } from './user-nav';
import { NotificationBell } from './notification-bell';
import { useAuthStore } from '@/store/auth.store';
import { useMounted } from '@/hooks/use-mounted';

const navItems = [
  {
    label: 'Offres',
    href: '/jobs',
    icon: Briefcase,
  },
  {
    label: 'Articles',
    href: '/articles',
    icon: FileText,
  },
  {
    label: 'Blog',
    href: '/blog',
    icon: BookOpen,
  },
  {
    label: 'Evênements',
    href: '/events',
    icon: CalendarClock,
  },
];

export function Navbar() {
  const { user } = useAuthStore();
  const mounted = useMounted();
  const pathname = usePathname();

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-blue-100/60 bg-gradient-to-r from-white via-blue-50/40 to-indigo-50/30 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href={user ? '/dashboard': 'jobs'}
            className="flex items-center space-x-2.5"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-campus-blue to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
              <span className="text-white font-black text-lg tracking-tight leading-none">C</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline bg-gradient-to-r from-campus-blue to-indigo-600 bg-clip-text text-transparent">
              CampusHub
            </span>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-campus-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            {mounted && (user?.role === 'company' || user?.role === 'admin') && (
              <Link
                href="/recruiter"
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
                  pathname.startsWith('/recruiter')
                    ? 'bg-campus-blue text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">Recrutement</span>
              </Link>
            )}
          </nav>

          {/* Notifications + User Menu */}
          <div className="flex items-center gap-1">
            {mounted && user && <NotificationBell />}
            <UserNav />
          </div>
        </div>
      </div>

      {/* Navigation Mobile (Bottom) */}
      <MobileNav />
    </header>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const mounted = useMounted();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full space-y-1',
                isActive ? 'text-campus-blue' : 'text-gray-600'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Dashboard sur mobile */}
        <Link
          href="/dashboard"
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full space-y-1',
            pathname === '/dashboard' ? 'text-campus-blue' : 'text-gray-600'
          )}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs font-medium">Accueil</span>
        </Link>
        {mounted && (user?.role === 'company' || user?.role === 'admin') && (
          <Link
            href="/recruiter"
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full space-y-1',
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
