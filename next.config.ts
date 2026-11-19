import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
    optimizePackageImports: ['@phosphor-icons/react'],
  },
};

export default nextConfig;
