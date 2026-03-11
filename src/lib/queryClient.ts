// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1, // réessayer une fois en cas d'échec
      refetchOnWindowFocus: false, // Ne pas refetch quand on revient sur l'onglet
      refetchOnReconnect: true, // Refetch quand on reconnecte internet
    },
    mutations: {
      retry: 0, // Ne pas retry les mutations
    },
  },
});