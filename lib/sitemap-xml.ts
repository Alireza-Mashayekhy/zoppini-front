/**
 * ابزارهای تولید XML نقشه‌ی سایت (Sitemap) برای همه‌ی مسیرهای sitemap.
 *
 * چرا این فایل وجود دارد:
 * - خروجی `app/sitemap.ts` در Next.js همیشه `<urlset>` است و هیچ راهی برای
 *   تولید `<sitemapindex>` ندارد (Next.js 16.2.6،
 *   `packages/next/src/build/webpack/loaders/metadata/resolve-route-data.ts`).
 *   برای داشتن نقشه‌ی اصلیِ معتبر (Sitemap Index) باید خودمان XML را بسازیم.
 * - مسیرهای فرعی قبلاً رشته‌سازیِ دستی داشتند و نه escaping داشتند و نه
 *   encode کردنِ درست URL؛ در نتیجه اسلاگ‌هایی که فاصله یا کاراکتر غیرمجاز
 *   دارند (مثل `how to match socks`) در خروجی `<loc>` نامعتبر می‌ساختند.
 *
 * قوانین این ماژول:
 * - هیچ مقداری را به‌عنوان زمانِ تغییر جعل نمی‌کند؛ اگر `lastmod` معتبر نباشد
 *   اصلاً چاپ نمی‌شود.
 * - اسلاگ‌ها را بازنویسی نمی‌کند؛ فقط URL را طبق استاندارد encode می‌کند
 *   (فاصله → `%20`) و در عین حال توالی‌های درصدیِ موجود را دست‌نخورده نگه
 *   می‌دارد (اسلاگ‌های فارسیِ از قبل encode شده).
 */

/** آدرس پایه‌ی canonical سایت — فقط non-www و فقط https. */
export const SITE_URL = 'https://zoppinico.com';

/** Content-Type استاندارد برای پاسخ‌های sitemap. */
export const SITEMAP_XML_CONTENT_TYPE = 'application/xml; charset=utf-8';

const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';

export type SitemapChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export interface SitemapUrlEntry {
  /** آدرس کامل و canonical صفحه. */
  loc: string;
  /** زمان واقعیِ تغییر محتوا؛ اگر معتبر نباشد `<lastmod>` چاپ نمی‌شود. */
  lastModified?: string | Date | number | null;
  changeFrequency?: SitemapChangeFrequency;
  priority?: number;
}

export interface SitemapIndexEntry {
  /** آدرس کاملِ نقشه‌ی فرعی. */
  loc: string;
  /** اختیاری؛ فقط اگر زمان معتبری از داده‌ی واقعی در دسترس باشد. */
  lastModified?: string | Date | number | null;
}

/**
 * Escape کردن پنج کاراکتر خاص XML.
 *
 * ترتیب مهم است: `&` باید اول جایگزین شود تا `&amp;` خودش دوباره escape نشود.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * تبدیل یک مسیر (مثل `/blog/my-post`) به آدرس کاملِ canonical.
 *
 * از `URL` استاندارد استفاده می‌کنیم تا:
 * - فاصله‌ها و کاراکترهای غیرمجاز طبق RFC به‌درستی encode شوند،
 * - توالی‌های درصدیِ موجود (مثل اسلاگ‌های فارسیِ `%d9%be...`) دست‌نخورده
 *   بمانند،
 * - نیازی به چسباندن دستیِ رشته نباشد.
 */
export function toSitemapLoc(pathOrUrl: string, baseUrl: string = SITE_URL): string {
  const url = new URL(pathOrUrl, baseUrl);

  // Fragment بخشی از آدرس منبع نیست و در sitemap معنا ندارد.
  if (url.hash) url.hash = '';

  return url.toString();
}

/**
 * نرمال‌سازی زمان تغییر برای `<lastmod>`.
 *
 * فقط زمان‌های واقعی و قابل‌تجزیه پذیرفته می‌شوند؛ در غیر این صورت `null`
 * برمی‌گردد تا تگ `<lastmod>` کلاً حذف شود (جایگزینی با زمانِ درخواست ممنوع).
 */
export function formatSitemapLastmod(
  value: string | Date | number | null | undefined,
): string | null {
  if (value === null || value === undefined || value === '') return null;

  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();

  if (!Number.isFinite(time)) return null;

  return date.toISOString();
}

function renderOptionalTags(
  lastModified: SitemapUrlEntry['lastModified'],
  changeFrequency?: SitemapChangeFrequency,
  priority?: number,
): string[] {
  const tags: string[] = [];

  const lastmod = formatSitemapLastmod(lastModified);
  if (lastmod) tags.push(`    <lastmod>${lastmod}</lastmod>`);

  if (changeFrequency) {
    tags.push(`    <changefreq>${escapeXml(changeFrequency)}</changefreq>`);
  }

  if (typeof priority === 'number' && Number.isFinite(priority)) {
    tags.push(`    <priority>${priority}</priority>`);
  }

  return tags;
}

/** تولید یک `<urlset>` معتبر از فهرست صفحات. */
export function renderSitemapUrlset(entries: SitemapUrlEntry[]): string {
  const urls = entries.map(entry => {
    const tags = [
      `    <loc>${escapeXml(entry.loc)}</loc>`,
      ...renderOptionalTags(
        entry.lastModified,
        entry.changeFrequency,
        entry.priority,
      ),
    ];

    return `  <url>\n${tags.join('\n')}\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="${SITEMAP_NAMESPACE}">
${urls.join('\n')}
</urlset>
`;
}

/**
 * تولید یک `<sitemapindex>` معتبر که به نقشه‌های فرعی اشاره می‌کند.
 *
 * تفاوت اصلی با `<urlset>` استفاده از تگ `<sitemap>` به‌جای `<url>` است؛
 * بدون آن، گوگل آدرس‌های فرعی را به‌عنوان صفحه می‌بیند و به‌عنوان نقشه‌ی
 * تودرتو دنبال نمی‌کند.
 */
export function renderSitemapIndex(entries: SitemapIndexEntry[]): string {
  const sitemaps = entries.map(entry => {
    const tags = [`    <loc>${escapeXml(entry.loc)}</loc>`];

    const lastmod = formatSitemapLastmod(entry.lastModified);
    if (lastmod) tags.push(`    <lastmod>${lastmod}</lastmod>`);

    return `  <sitemap>\n${tags.join('\n')}\n  </sitemap>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="${SITEMAP_NAMESPACE}">
${sitemaps.join('\n')}
</sitemapindex>
`;
}
