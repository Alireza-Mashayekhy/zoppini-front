import { NextResponse } from 'next/server';

import { renderSitemapUrlset, SITEMAP_XML_CONTENT_TYPE, toSitemapLoc } from '@/lib/sitemap-xml';
import { getSitemap } from '@/services/features/sitemap/server.api';

/**
 * نقشه‌ی محصولات.
 *
 * بک‌اند محصولاتِ ایندکس‌شونده را برمی‌گرداند و مسیرهای noindex/redirect پنل
 * سئو را حذف می‌کند. **موجودی (stock) معیارِ حذف نیست**: صفحه‌ی محصولِ
 * ناموجود همچنان با ۲۰۰ و canonicalِ معتبر منتشر می‌شود، پس باید در نقشه
 * بماند (خروج و ورودِ شبانه‌روزی به نقشه به‌خاطر همگام‌سازیِ موجودی، پوششِ
 * Search Console را بی‌دلیل نوسانی می‌کرد).
 */
export async function GET() {
  const data = await getSitemap();

  const xml = renderSitemapUrlset(
    (data?.products ?? []).map(product => ({
      loc: toSitemapLoc(`/product/${product.slug}`),
      lastModified: product.updatedAt ?? null,
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
