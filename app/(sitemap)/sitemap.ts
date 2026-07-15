// app/sitemap.ts
import { MetadataRoute } from 'next';

const BASE_URL = 'https://zoppinico.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/post-sitemap.xml`,
      lastModified: new Date('2026-07-15T04:37:00+00:00'),
    },
    {
      url: `${BASE_URL}/page-sitemap.xml`,
      lastModified: new Date('2026-07-09T06:35:00+00:00'),
    },
    {
      url: `${BASE_URL}/product-sitemap.xml`,
      lastModified: new Date('2026-07-15T14:13:00+00:00'),
    },
    {
      url: `${BASE_URL}/product_cat-sitemap.xml`,
      lastModified: new Date('2026-07-15T14:13:00+00:00'),
    },
  ];
}
