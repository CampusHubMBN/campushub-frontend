// src/types/chat.ts
export interface ChatParticipant {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt?: string | null;
  isOwn: boolean;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  otherParticipant: ChatParticipant;
  lastMessageContent?: string | null;
  lastMessageSenderId?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface MessagesPage {
  messages: ChatMessage[];
  total: number;
  hasMore: boolean;
}
