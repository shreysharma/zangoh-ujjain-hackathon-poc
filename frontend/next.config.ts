import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Optimize for production
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
