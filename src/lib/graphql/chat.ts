// src/lib/graphql/chat.ts
import { gql } from '@apollo/client/core';

const CONVERSATION_FIELDS = gql`
  fragment ConversationFields on ChatConversation {
    id
    otherParticipant { id name avatarUrl }
    lastMessageContent
    lastMessageSenderId
    lastMessageAt
    unreadCount
    createdAt
  }
`;

const MESSAGE_FIELDS = gql`
  fragment ChatMessageFields on ChatMessage {
    id
    conversationId
    senderId
    content
    readAt
    isOwn
    createdAt
  }
`;

export const MY_CONVERSATIONS = gql`
  ${CONVERSATION_FIELDS}
  query MyConversations {
    myConversations { ...ConversationFields }
  }
`;

export const GET_MESSAGES = gql`
  ${MESSAGE_FIELDS}
  query GetMessages($conversationId: String!, $page: Int) {
    messages(conversationId: $conversationId, page: $page) {
      messages { ...ChatMessageFields }
      total
      hasMore
    }
  }
`;

export const START_CONVERSATION = gql`
  ${CONVERSATION_FIELDS}
  mutation StartConversation($otherUserId: String!) {
    startConversation(otherUserId: $otherUserId) { ...ConversationFields }
  }
`;

export const SEND_MESSAGE = gql`
  ${MESSAGE_FIELDS}
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) { ...ChatMessageFields }
  }
`;

export const MARK_CONVERSATION_READ = gql`
  mutation MarkConversationRead($conversationId: String!) {
    markConversationRead(conversationId: $conversationId)
  }
`;

export const CHAT_MESSAGE_ADDED = gql`
  ${MESSAGE_FIELDS}
  subscription ChatMessageAdded {
    chatMessageAdded { ...ChatMessageFields }
  }
`;

export const CHAT_CONVERSATION_UPDATED = gql`
  ${CONVERSATION_FIELDS}
  subscription ChatConversationUpdated {
    chatConversationUpdated { ...ConversationFields }
  }
`;
