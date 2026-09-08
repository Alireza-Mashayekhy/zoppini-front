import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zoppinico.com',
      },
      {
        protocol: 'https',
        hostname: 'www.zoppinico.com',
      },
      // فقط برای محیط لوکال - دسترسی مستقیم به بک‌اند با IP
      ...(isDev
        ? [
            {
              protocol: 'http' as const,
              hostname: '93.118.104.184',
              port: '3000',
            },
          ]
        : []),
    ],
    formats: ['image/webp'],
    minimumCacheTTL: 31536000,
  },
  trailingSlash: false,
  distDir: '.next',
};

export default nextConfig;
