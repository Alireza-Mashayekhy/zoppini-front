import { NextResponse } from 'next/server';

const BASE_URL = 'https://zoppinico.com';

const pagesList = [
  `${BASE_URL}/`,

  `${BASE_URL}/b2bsale`,

  `${BASE_URL}/events`,

  `${BASE_URL}/contact`,

  `${BASE_URL}/shopping_guide`,

  `${BASE_URL}/frequently-asked-questions`,

  `${BASE_URL}/branches`,

  `${BASE_URL}/return-and-exchange-conditions`,

  `${BASE_URL}/blog`,

  `${BASE_URL}/products`,
];

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pagesList
    .map(
      page => `
  <url>
    <loc>${BASE_URL}/${page}</loc>
    <lastmod>${new Date('2026-07-15T14:13:00+00:00')}</lastmod>
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
