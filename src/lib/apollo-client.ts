// src/lib/apollo-client.ts
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client/core';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = new HttpLink({
  uri: '/graphql',   // proxied through Next.js → same origin → cookie sent automatically
  credentials: 'include',
});

// WebSocket URL — must point directly to the NestJS realtime server.
// Next.js rewrites only proxy HTTP; WebSocket upgrade requests are NOT forwarded.
// In dev:  ws://localhost:3001/graphql
// In prod: wss://realtime.yourdomain.com/graphql  (set NEXT_PUBLIC_GRAPHQL_URL)
const httpUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3001/graphql';
const wsUrl   = httpUrl.replace(/^http/, 'ws');

// WS link is client-side only
const wsLink = typeof window !== 'undefined'
  ? new GraphQLWsLink(
      createClient({
        url: wsUrl,
        // The browser automatically sends HttpOnly cookies on the WS upgrade request.
        // connectionParams is a fallback for non-HttpOnly cookies (not needed here).
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
