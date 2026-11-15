import { NextResponse } from 'next/server';

import { renderSitemapUrlset, SITEMAP_XML_CONTENT_TYPE, toSitemapLoc } from '@/lib/sitemap-xml';
import { getSitemap } from '@/services/features/sitemap/server.api';

/**
 * نقشه‌ی دسته‌بندی‌های محصولات.
 *
 * بک‌اند فقط دسته‌های فعال را برمی‌گرداند و مسیرهای noindex/redirect پنل سئو
 * را حذف می‌کند.
 */
export async function GET() {
  const data = await getSitemap();

  const xml = renderSitemapUrlset(
    (data?.categories ?? []).map(category => ({
      // اسلاگ‌هایی که فاصله دارند (مثل `Casual Pants`) اینجا درست encode
      // می‌شوند؛ خودِ اسلاگ تغییر نمی‌کند.
      loc: toSitemapLoc(`/product-category/${category.slug}`),
      lastModified: category.updatedAt ?? null,
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
