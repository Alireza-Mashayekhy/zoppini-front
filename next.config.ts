// next.config.js
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP:
      process.env.NODE_ENV === 'development' ? true : false,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  trailingSlash: false,
  distDir: '.next',
};

export default nextConfig;
