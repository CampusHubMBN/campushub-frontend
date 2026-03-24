// src/lib/apollo-client.ts
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client/core';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3001/graphql',
  credentials: 'include',
});

// WS link is client-side only
const wsLink = typeof window !== 'undefined'
  ? new GraphQLWsLink(
      createClient({
        url: process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001/graphql',
        connectionParams: () => ({ cookie: document.cookie }),
        // Reconnect automatically
        shouldRetry: () => true,
        retryAttempts: 10,
      })
    )
  : null;

// Subscriptions → WebSocket, everything else → HTTP
const splitLink = wsLink
  ? split(
      ({ query }) => {
        const def = getMainDefinition(query);
        return def.kind === 'OperationDefinition' && def.operation === 'subscription';
      },
      wsLink,
      httpLink
    )
  : httpLink;

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
