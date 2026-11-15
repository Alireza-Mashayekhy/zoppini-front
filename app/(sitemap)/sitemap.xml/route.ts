import { NextResponse } from 'next/server';

import { renderSitemapIndex, SITEMAP_XML_CONTENT_TYPE, toSitemapLoc } from '@/lib/sitemap-xml';

/**
 * نقشه‌ی اصلی سایت به‌صورت **Sitemap Index**.
 *
 * چرا Route Handler و نه `sitemap.ts`:
 * خروجیِ قراردادِ `app/sitemap.ts` در Next.js همیشه `<urlset>` است و امکان
 * تولید `<sitemapindex>` ندارد؛ در نتیجه آدرس نقشه‌های فرعی به‌عنوان «صفحه»
 * دیده می‌شدند و به‌عنوان نقشه‌ی تودرتو دنبال نمی‌شدند. اینجا خودمان
 * XML استاندارد را می‌سازیم.
 *
 * ترتیبِ ثابت است تا خروجی در هر درخواست یکسان باشد (diff-pذیر و قابل کش).
 */
const CHILD_SITEMAPS = [
  'page-sitemap.xml',
  'post-sitemap.xml',
  'product-sitemap.xml',
  'product-category-sitemap.xml',
];

export async function GET() {
  const xml = renderSitemapIndex(
    // `lastmod` برای نقشه‌ی اصلی عمداً ارسال نمی‌شود: زمانِ معتبر باید از
    // داده‌ی واقعی بیاید، نه از زمان درخواست.
    CHILD_SITEMAPS.map(file => ({ loc: toSitemapLoc(`/${file}`) })),
  );

  return new NextResponse(xml, {
    headers: {
      'Content-Type': SITEMAP_XML_CONTENT_TYPE,
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
