import { NextResponse } from 'next/server';

import {
  renderSitemapUrlset,
  SITEMAP_XML_CONTENT_TYPE,
  toSitemapLoc,
} from '@/lib/sitemap-xml';
import { getAllPageSeo } from '@/services/features/seo/server.api';
import { PageSeoResponse } from '@/services/features/seo/types';

/**
 * مسیرهای ثابت سایت که همیشه در page-sitemap.xml منتشر می‌شوند.
 *
 * چرا این فهرست وجود دارد؟ رکوردهای پنل سئو (`/api/seo/pages`) در حال حاضر
 * ۱۳ مسیرِ ثابت هستند که **همگی** `includeInPageSitemap: false` دارند؛ بنابراین
 * تکیه بر آن فلگ به‌تنهایی باعث می‌شد page-sitemap کاملاً خالی شود و پوششِ
 * فعلیِ سایت (۱۳ صفحه) از دست برود. این فهرست همان ۱۳ مسیرِ فعلی را حفظ
 * می‌کند و مدیر سئو می‌تواند با فعال کردنِ فلگ، مسیرهای تازه‌ای اضافه کند.
 */
const STATIC_PAGES = [
  '/',
  '/about-us',
  '/b2bsale',
  '/blog',
  '/branches',
  '/contact',
  '/digital-catalog',
  '/discounted-products',
  '/events',
  '/frequently-asked-questions',
  '/products',
  '/return-and-exchange-conditions',
  '/shopping_guide',
];

/** فقط مسیرهای داخلیِ امن (نه پروتکل-نسبی و نه بک‌اسلش). */
function isSafeInternalPath(path: string): boolean {
  return (
    path.startsWith('/') && !path.startsWith('//') && !path.includes('\\')
  );
}

/**
 * زمانِ واقعیِ تغییرِ یک صفحه‌ی ثابت.
 *
 * تنها زمانی که برای این صفحات در دسترس است، زمانِ تغییرِ رکوردِ پنل سئوست.
 * اما رکوردهای فعلی همگی در یک زمان (زمانِ seed) ساخته شده‌اند و ویرایش
 * نشده‌اند؛ منتشر کردنِ آن زمان برای همه‌ی صفحات، معادل همان تاریخِ مصنوعی‌ای
 * است که در نسخه‌ی قبلی نقشه سایت بود و باید حذف می‌شد.
 *
 * قاعده: اگر رکورد بعد از ایجاد، واقعاً ویرایش شده باشد (`updatedAt` با
 * `createdAt` فرق داشته باشد) آن زمان منتشر می‌شود؛ در غیر این صورت تگ
 * `<lastmod>` چاپ نمی‌شود (هرگز زمانِ درخواست جایگزین نمی‌شود).
 */
function pageLastModified(entry?: PageSeoResponse): string | null {
  if (!entry?.updatedAt) return null;
  if (entry.createdAt && entry.updatedAt === entry.createdAt) return null;

  return entry.updatedAt;
}

export async function GET() {
  const seoEntries = await getAllPageSeo();
  const seoByPath = new Map(seoEntries.map(entry => [entry.path, entry]));

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

    // مسیرهای noindex یا دارای ریدایرکت نباید در نقشه سایت باشند.
    return seo?.indexable !== false && !seo?.redirectTo;
  });

  const xml = renderSitemapUrlset(
    sitemapPaths.map(path => ({
      loc: toSitemapLoc(path),
      lastModified: pageLastModified(seoByPath.get(path)),
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
