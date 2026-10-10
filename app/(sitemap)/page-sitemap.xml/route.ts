import { NextResponse } from 'next/server';

import { getAllPageSeo } from '@/services/features/seo/server.api';

const BASE_URL = 'https://zoppinico.com';

// مسیرهای ثابت سایت که همیشه در page-sitemap.xml مدیریت می‌شوند.
const STATIC_PAGES = [
  '/',
  '/about-us',
  '/b2bsale',
  '/branches',
  '/contact',
  '/digital-catalog',
  '/discounted-products',
  '/events',
  '/frequently-asked-questions',
  '/blog',
  '/products',
  '/return-and-exchange-conditions',
  '/shopping_guide',
];

function isSafeInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const seoEntries = await getAllPageSeo();
  const seoByPath = new Map(seoEntries.map(entry => [entry.path, entry]));

  // صفحات ثابت قبلی و URLهایی که مدیر سئو برای sitemap به‌صورت دستی انتخاب کرده.
  const sitemapPaths = Array.from(
    new Set([
      ...STATIC_PAGES,
      ...seoEntries
        .filter(entry => entry.includeInPageSitemap)
        .map(entry => entry.path),
    ]),
  ).filter(path => {
    if (!isSafeInternalPath(path)) return false;

    const seo = seoByPath.get(path);
    return seo?.indexable !== false && !seo?.redirectTo;
  });

  const fallbackLastmod = new Date().toISOString();
  const urls = sitemapPaths
    .map(path => {
      const seo = seoByPath.get(path);
      const loc = escapeXml(new URL(path, BASE_URL).toString());
      const lastmod = seo?.updatedAt || fallbackLastmod;

      return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${escapeXml(new Date(lastmod).toISOString())}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=300',
    },
  });
}
