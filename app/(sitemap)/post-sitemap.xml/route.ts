import { NextResponse } from 'next/server';

import { renderSitemapUrlset, SITEMAP_XML_CONTENT_TYPE, toSitemapLoc } from '@/lib/sitemap-xml';
import { getSitemap } from '@/services/features/sitemap/server.api';

/**
 * نقشه‌ی مقالات وبلاگ.
 *
 * فقط مقالات منتشرشده و ایندکس‌شونده از سرویس sitemap می‌آیند
 * (`isPublished` و `indexable` در بک‌اند فیلتر می‌شوند) و مسیرهایی که در پنل
 * سئو noindex یا ریدایرکت گرفته‌اند هم حذف می‌شوند.
 */
export async function GET() {
  const data = await getSitemap();

  const xml = renderSitemapUrlset(
    (data?.blogPosts ?? []).map(post => ({
      // `toSitemapLoc` فاصله‌ها را encode می‌کند و اسلاگ را تغییر نمی‌دهد.
      loc: toSitemapLoc(`/blog/${post.slug}`),
      lastModified: post.updatedAt ?? null,
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
  );

  return new NextResponse(xml, {
    headers: {
      'Content-Type': SITEMAP_XML_CONTENT_TYPE,
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
