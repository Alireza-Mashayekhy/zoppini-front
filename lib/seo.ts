import type { Metadata } from 'next';

import { getPageSeo } from '@/services/features/seo/server.api';

/** متایی که مدیر سئو در پنل برای یک صفحه ثبت کرده است */
interface SeoOverride {
  metaTitle?: string | null;
  metaDescription?: string | null;
  indexable?: boolean | null;
  followable?: boolean | null;
}

/**
 * دستور robots را بر اساس تنظیمات پنل سئو روی متادیتا اعمال می‌کند.
 *
 * - `indexable === false` یعنی `noindex` (صفحه از نتایج جستجو حذف می‌شود)
 * - `followable === false` یعنی `nofollow` (لینک‌های صفحه دنبال نمی‌شوند)
 *
 * اگر رکوردی ثبت نشده باشد یا فیلدها مقدار پیش‌فرض داشته باشند،
 * تغییری در متادیتا داده نمی‌شود (index, follow).
 */
export function applyRobotsDirective(
  metadata: Metadata,
  seo?: { indexable?: boolean | null; followable?: boolean | null } | null,
): Metadata {
  if (!seo) return metadata;

  const index = seo.indexable !== false;
  const follow = seo.followable !== false;

  // اگر هر دو پیش‌فرض باشند، یعنی تغییری لازم نیست
  if (index && follow) return metadata;

  return {
    ...metadata,
    robots: {
      index,
      follow,
    },
  };
}

/**
 * متادیتای پیش‌فرض صفحه را با متای ثبت‌شده در پنل مدیریت ادغام می‌کند.
 *
 * اگر مدیر برای صفحه چیزی ثبت نکرده باشد (یا فیلد را خالی گذاشته باشد)،
 * همان متادیتای پیش‌فرض صفحه استفاده می‌شود؛ پس رفتار سایت بدون تغییر می‌ماند.
 * دستور robots (index/noindex و follow/nofollow) هم از همین‌جا اعمال می‌شود.
 */

export function mergePageSeo(
  fallback: Metadata,
  seo?: SeoOverride | null,
): Metadata {
  const metaTitle = seo?.metaTitle?.trim();
  const metaDescription = seo?.metaDescription?.trim();

  const merged = applyRobotsDirective({ ...fallback }, seo);

  if (!metaTitle && !metaDescription) return merged;

  if (metaTitle) merged.title = metaTitle;
  if (metaDescription) merged.description = metaDescription;

  if (fallback.openGraph) {
    merged.openGraph = {
      ...fallback.openGraph,
      ...(metaTitle ? { title: metaTitle } : {}),
      ...(metaDescription ? { description: metaDescription } : {}),
    } as Metadata['openGraph'];
  }

  if (fallback.twitter) {
    merged.twitter = {
      ...fallback.twitter,
      ...(metaTitle ? { title: metaTitle } : {}),
      ...(metaDescription ? { description: metaDescription } : {}),
    } as Metadata['twitter'];
  }

  return merged;
}

/**
 * متای یک صفحه را از بک‌اند می‌خواند و روی متادیتای پیش‌فرض همان صفحه
 * اعمال می‌کند.
 *
 * استفاده در صفحات:
 * ```ts
 * export async function generateMetadata(): Promise<Metadata> {
 *   return buildPageMetadata('/about-us', pageMetadata);
 * }
 * ```
 */
export async function buildPageMetadata(
  path: string,
  fallback: Metadata,
): Promise<Metadata> {
  const seo = await getPageSeo(path);

  return mergePageSeo(fallback, seo);
}
