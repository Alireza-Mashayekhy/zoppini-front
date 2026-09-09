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
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    // Match actual breakpoints: mobile 390px, tablet 768px, desktop 1920px.
    // Prevents overserving 4269px sale banner / 1080p video posters.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  trailingSlash: false,
  distDir: '.next',
  // Long-lived immutable cache for versioned HLS segments + homepage webp.
  // .m3u8 playlists stay short-lived (VOD playlists list immutable .ts).
  async headers() {
    return [
      {
        source: '/home/:path*.ts',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/home/:path*.webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/home/:path*.m3u8',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/logo/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/footer/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
