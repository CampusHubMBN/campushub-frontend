// src/providers/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/services/api/auth.api';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ isLoading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, setAuth, logout } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await authApi.me();
        setAuth(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
        logout();
        // ✅ Redirect dans useEffect
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ Redirect si pas de user APRÈS loading
  useEffect(() => {
    if (!isLoading && (!user || !user.name)) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-campus-blue mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // ✅ Ne plus rediriger ici, c'est géré dans useEffect
  if (!user || !user.name) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-campus-blue" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);