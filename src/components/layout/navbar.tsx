// src/components/layout/navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, BookOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserNav } from './user-nav';

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
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-campus-blue flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline">
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
          </nav>

          {/* User Menu */}
          <UserNav />
        </div>
      </div>

      {/* Navigation Mobile (Bottom) */}
      <MobileNav />
    </header>
  );
}

function MobileNav() {
  const pathname = usePathname();

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
      </div>
    </nav>
  );
}