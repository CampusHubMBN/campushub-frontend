// src/app/(protected)/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authApi } from '@/services/api/auth.api';
import { Navbar } from '@/components/layout/navbar';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { StoreProvider } from '@/providers/store-provider';

 // Routes publiques (pas besoin d'auth)
const PUBLIC_ROUTES = ['/jobs', '/articles', '/blog'];

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
        // Fetch user si pas déjà chargé
        if (!user) {
          const userData = await authApi.me();
          setAuth(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        logout();

        // Si route protégée et pas auth → redirect login
        if (!isPublic) {
          router.push('/login');
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
    <div className="min-h-screen bg-gray-50">
      <StoreProvider>
        <Navbar />
        <main className="pb-16 md:pb-0">{children}</main>
      </StoreProvider>

    </div>
  );
}
