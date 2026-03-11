// src/app/(protected)/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/api/auth.api';
import { Navbar } from '@/components/layout/navbar';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, setAuth, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Fetch user si pas déjà chargé
        if (!user) {
          const userData = await authApi.me();
          setAuth(userData);
        }
      } catch (error) {
        // Si erreur 401, redirect login (géré par interceptor)
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
  }, [user, setAuth]);

  // Loading state
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-campus-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pb-16 md:pb-0">{children}</main>
    </div>
  );
}