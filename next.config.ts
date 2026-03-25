import type { NextConfig } from "next";

const REALTIME_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL?.replace('/graphql', '') ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/graphql',
        destination: `${REALTIME_URL}/graphql`,
      },
    ];
  },
};

export default nextConfig;
