// src/providers/store-provider.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      // ✅ Hydrate manuellement côté client
      useAuthStore.persist.rehydrate();
      initialized.current = true;
    }
  }, []);

  return <>{children}</>;
}