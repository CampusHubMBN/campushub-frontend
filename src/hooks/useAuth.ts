// src/hooks/useAuth.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/api/auth.api';
import { LoginRequest, RegisterRequest } from '@/types/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth, logout: logoutStore, user, isAuthenticated } = useAuthStore();

  // Query: Get current user
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: isAuthenticated, // Seulement si déjà authentifié
    retry: false,
  });

  // Mutation: Register
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user);
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });

  // Mutation: Login
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Vider tout le cache React Query avant de setter le nouvel user
      queryClient.clear();
      // Reset le store Zustand
      logoutStore();
      // Setter le nouvel user
      setAuth(data.user);
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });

  // Mutation: Logout
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
      router.push('/login');
    },
  });

  return {
    // State
    user: currentUser || user,
    isAuthenticated,
    isLoadingUser,

    // Actions
    register: registerMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,

    // Loading states
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,

    // Errors
    registerError: registerMutation.error,
    loginError: loginMutation.error,
  };
}
