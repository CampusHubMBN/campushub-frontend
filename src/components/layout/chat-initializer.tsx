// src/components/layout/chat-initializer.tsx
// Initializes chat subscriptions once at layout level — mirrors notification-initializer.
// The chat badge in Navbar reads from useChatStore, not from Apollo directly.
'use client';

import { useChat } from '@/hooks/use-chat';

export function ChatInitializer() {
  useChat();
  return null;
}
