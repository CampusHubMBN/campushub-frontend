// src/store/authStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { User, UserInfo } from '@/types/api';
import { useEffect, useState } from 'react';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  // _hasHydrated: boolean;
  
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
      // _hasHydrated: false, // Flag hydration

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
      //   setHasHydrated: (hasHydrated: boolean) => {
      //   set({ _hasHydrated: hasHydrated });
      // },
    }),
    
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
       // Skip hydration sur server
      skipHydration: true,
      // partialize: (state) => ({
      //   user: state.user,
      //   isAuthenticated: state.isAuthenticated,
      // }),
    }
  )
);

// Hook pour attendre l'hydration
// export const useHydration = () => {
//   const [hydrated, setHydrated] = useState(false);

//   useEffect(() => {
//     // Zustand persist a fini de charger
//     const unsubFinishHydration = useAuthStore.persist.onFinishHydration(() => {
//       setHydrated(true);
//     });

//     // Si déjà hydraté (navigation client-side)
//     setHydrated(useAuthStore.persist.hasHydrated());

//     return unsubFinishHydration;
//   }, []);

//   return hydrated;
// };