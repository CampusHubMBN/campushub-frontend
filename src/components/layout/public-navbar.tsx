// src/components/layout/public-navbar.tsx
'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useMounted } from '@/hooks/use-mounted';
import { Button } from '@/components/ui/button';
import { UserNav } from './user-nav';
import { Briefcase, FileText, BookOpen, Sparkles } from 'lucide-react';

export function PublicNavbar() {
  const { user } = useAuthStore();
  const mounted = useMounted();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-campus-blue flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CampusHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/jobs"
              className="flex items-center gap-2 text-gray-700 hover:text-campus-blue transition-colors"
            >
              <Briefcase className="h-4 w-4" />
              Offres
            </Link>
            <Link
              href="/articles"
              className="flex items-center gap-2 text-gray-700 hover:text-campus-blue transition-colors"
            >
              <FileText className="h-4 w-4" />
              Articles
            </Link>
            <Link
              href="/blog"
              className="flex items-center gap-2 text-gray-700 hover:text-campus-blue transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Blog
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {mounted ? (
              user ? (
                // ✅ User connecté → UserNav
                <UserNav />
              ) : (
                // ❌ User pas connecté → Login/Signup
                <>
                  <Link href="/login">
                    <Button variant="ghost">Connexion</Button>
                  </Link>
                  <Link href="/register">
                    <Button>S'inscrire</Button>
                  </Link>
                </>
              )
            ) : (
              // ⏳ Pendant hydration → Skeleton
              <div className="flex items-center gap-4">
                <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
