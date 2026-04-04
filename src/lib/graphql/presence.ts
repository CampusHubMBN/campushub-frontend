// src/lib/graphql/presence.ts
import { gql } from '@apollo/client';

export const SET_ONLINE = gql`
  mutation SetOnline {
    setOnline
  }
`;

export const SET_OFFLINE = gql`
  mutation SetOffline {
    setOffline
  }
`;

export const HEARTBEAT = gql`
  mutation Heartbeat {
    heartbeat
  }
`;

export const PRESENCE_UPDATED = gql`
  subscription PresenceUpdated {
    presenceUpdated {
      userId
      status
      lastSeenAt
    }
  }
`;
