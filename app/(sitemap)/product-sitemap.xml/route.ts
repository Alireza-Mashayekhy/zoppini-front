// app/product-sitemap1.xml/route.ts
import { NextResponse } from 'next/server';

import { getSitemap } from '@/services/features/sitemap/server.api';

const BASE_URL = 'https://zoppinico.com';

export async function GET() {
  const sitemapData = await getSitemap();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemapData?.data?.products
    .map(
      product => `
  <url>
    <loc>${BASE_URL}/product/${product.slug}</loc>
    <lastmod>${product.updatedAt || new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  `,
    )
    .join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
