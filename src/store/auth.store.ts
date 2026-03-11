// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserInfo } from '@/types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User) => void; // plus de token usage session
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  updateUserInfo: (info: Partial<UserInfo>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user) => {
        // localStorage.setItem('token', token);
        // le token est dans le http cookie pas besoin de sauver
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        // localStorage.removeItem('token');
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      // Update user info (profil)
      updateUserInfo: (infoUpdates) =>
        set((state) => {
          if (!state.user) return state;
          
          return {
            user: {
              ...state.user,
              info: state.user.info
                ? { ...state.user.info, ...infoUpdates }
                : undefined,
            },
          };
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);