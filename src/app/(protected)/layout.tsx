// src/app/(protected)/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authApi } from '@/services/api/auth.api';
import { Navbar } from '@/components/layout/navbar';
import { NotificationInitializer } from '@/components/layout/notification-initializer';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { StoreProvider } from '@/providers/store-provider';

 // Routes publiques (pas besoin d'auth)
const PUBLIC_ROUTES = ['/jobs', '/articles', '/blog', '/events', '/companies'];

// public route check helper
const isPublicRoute = (pathname: string) => {
// Exact match ou commence par route publique (ex: /jobs/123)
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
};

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, setAuth, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  // Check si route actuelle est publique
  const isPublic = isPublicRoute(pathname);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authApi.me();
        if (!user || user.id !== userData.id) {
          setAuth(userData);
        }
        // Role-based home redirects
        if (userData.role === 'admin' && pathname === '/dashboard') {
          router.replace('/admin');
        }
        if (userData.role === 'company' && pathname === '/dashboard') {
          router.replace('/recruiter');
        }
        if (userData.role === 'pedagogical' && pathname === '/dashboard') {
          router.replace('/pedagogical');
        }
        // Company cannot access articles or blog
        if (
          userData.role === 'company' &&
          (pathname.startsWith('/articles') || pathname.startsWith('/blog'))
        ) {
          router.replace('/recruiter');
        }
      } catch (error: any) {
        console.error('Auth check failed:', error);
        // Only logout + redirect on 401 (unauthenticated).
        // A 500 server error should not wipe the local session —
        // the user is still logged in, the server just had a temporary error.
        const status = error?.response?.status;
        if (status === 401 || status === 419) {
          logout();
          if (!isPublic) {
            router.push('/login');
          }
        }
        // Si erreur 401, redirect login (géré par interceptor)
        // console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Redirect vers login si route protégée et pas de user
  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.push('/login');
    }
  }, [loading, user, isPublic, router]);

  // ⏳ Loading state (seulement pour routes protégées)
  if (loading && !isPublic) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-campus-blue mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Loading state, no user pour route protégée (en cours de redirect)
  if (!user && !isPublic) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-campus-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <StoreProvider>
        <NotificationInitializer />
        <Navbar />
        <main className="pt-14 pb-16 md:pb-0 md:pl-56">{children}</main>
      </StoreProvider>

    </div>
  );
}
