// src/lib/graphql/notifications.ts
import { gql } from '@apollo/client/core';

const NOTIFICATION_FIELDS = gql`
  fragment NotificationFields on Notification {
    id
    type
    read
    readAt
    createdAt
    userId
    data {
      message
      actorName
      actorId
      resourceId
      resourceTitle
      resourceType
    }
  }
`;

export const MY_NOTIFICATIONS = gql`
  ${NOTIFICATION_FIELDS}
  query MyNotifications($page: Int!, $unreadOnly: Boolean!) {
    myNotifications(page: $page, unreadOnly: $unreadOnly) {
      notifications { ...NotificationFields }
      total
      unreadCount
    }
  }
`;

export const UNREAD_COUNT = gql`
  query UnreadCount {
    unreadCount
  }
`;

export const MARK_NOTIFICATIONS_READ = gql`
  mutation MarkNotificationsRead($input: MarkReadInput!) {
    markNotificationsRead(input: $input)
  }
`;

export const NOTIFICATION_ADDED = gql`
  ${NOTIFICATION_FIELDS}
  subscription NotificationAdded {
    notificationAdded { ...NotificationFields }
  }
`;

export const UNREAD_COUNT_UPDATED = gql`
  subscription UnreadCountUpdated {
    unreadCountUpdated {
      count
      userId
    }
  }
`;
