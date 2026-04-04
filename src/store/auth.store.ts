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

  // Actions
  setAuth: (user: User, token?: string) => void; // TOKEN AUTH (token optional for me() refreshes)
  // setAuth: (user: User) => void; // SESSION AUTH (SPA same-domain only)
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

      // --- TOKEN AUTH ---
      setAuth: (user, token?) => {
        set({ user, isAuthenticated: true, ...(token ? { token } : {}) });
      },
      // --- SESSION AUTH (SPA same-domain only) ---
      // setAuth: (user) => {
      //   set({ user, isAuthenticated: true });
      // },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
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
        token: state.token, // TOKEN AUTH: persist token
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