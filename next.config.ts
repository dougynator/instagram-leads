import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow long-running API routes for scan execution
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
