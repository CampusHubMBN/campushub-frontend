'use client';
// src/components/layout/presence-initializer.tsx
import { usePresence } from '@/hooks/use-presence';

export function PresenceInitializer() {
  usePresence();
  return null;
}
