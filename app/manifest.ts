import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zoppini',
    short_name: 'Zoppini',
    description: 'Zoppini marketplace',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0d8cf4',
    icons: [
      {
        src: '/logo/og-image.jpg',
        sizes: '98x98',
        type: 'image/jpg',
        purpose: 'any',
      },
      {
        src: '/logo/og-image.jpg',
        sizes: '192x192',
        type: 'image/jpg',
        purpose: 'any',
      },
      {
        src: '/logo/og-image.jpg',
        sizes: '512x512',
        type: 'image/jpg',
        purpose: 'any',
      },
    ],
  };
}
