// src/lib/apollo-client.ts
import { ApolloClient, InMemoryCache, HttpLink, split, ApolloLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// Helper: read Bearer token from Zustand persisted storage
function getBearerToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

// --- TOKEN AUTH ---
const authLink = setContext((_, { headers }) => {
  const token = getBearerToken();
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const httpLink = new HttpLink({
  uri: '/graphql', // proxied through Next.js rewrite → NestJS realtime
  // credentials: 'include', // SESSION AUTH: cookie sent automatically (same-domain only)
});

// WebSocket URL — must point directly to the NestJS realtime server.
// Next.js rewrites only proxy HTTP; WebSocket upgrade requests are NOT forwarded.
// In dev:  ws://localhost:3001/graphql
// In prod: wss://<railway-realtime-url>/graphql  (set NEXT_PUBLIC_WS_URL)
const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001/graphql';

// WS link is client-side only
const wsLink = typeof window !== 'undefined'
  ? new GraphQLWsLink(
      createClient({
        url: wsUrl,
        // --- TOKEN AUTH: pass Bearer token via connectionParams ---
        connectionParams: () => {
          const token = getBearerToken();
          return token ? { authorization: `Bearer ${token}` } : {};
        },
        // --- SESSION AUTH: browser sends cookies automatically on WS upgrade ---
        shouldRetry: () => true,
        retryAttempts: 10,
      })
    )
  : null;

// Subscriptions → WebSocket, queries/mutations → HTTP + auth header
const splitLink = wsLink
  ? split(
      ({ query }) => {
        const def = getMainDefinition(query);
        return def.kind === 'OperationDefinition' && def.operation === 'subscription';
      },
      wsLink,
      authLink.concat(httpLink),
    )
  : authLink.concat(httpLink);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
