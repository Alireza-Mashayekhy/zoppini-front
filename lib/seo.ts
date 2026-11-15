import type { Metadata } from 'next';

import { getPageSeo } from '@/services/features/seo/server.api';

/**
 * عنوان و توضیحِ پیش‌فرضِ کلِ سایت (همان مقادیری که در `app/layout.tsx` به‌عنوان
 * متادیتای ریشه ثبت شده‌اند).
 *
 * چرا اینجا (و نه فقط در لِی‌اوت) تعریف شده‌اند: `mergePageSeo` باید بتواند
 * مقداری را که مدیر در پنل ثبت کرده با «مقدارِ پیش‌فرضِ سایت» مقایسه کند
 * (پایین را ببینید). منبعِ حقیقت یکی است: لِی‌اوت هم همین ثابت‌ها را استفاده
 * می‌کند.
 */
export const SITE_DEFAULT_TITLE = 'فروشگاه پوشاک مردانه - زوپینی';
export const SITE_DEFAULT_DESCRIPTION =
  'فروشگاه آنلاین پوشاک مردانه زوپینی | خرید انواع کت شلوار مردانه، کت تک، پالتو، پیراهن و شلوار- خرید حضوری و اینترنتی | پرداخت در محل✓ امکان بازگشت کالا✓';

/**
 * آیا مقدارِ ثبت‌شده در پنل، همان متنِ پیش‌فرضِ سایت است؟
 *
 * منظور این است که مدیر برای این صفحه چیزی وارد نکرده و مقدارِ پیش‌فرضِ
 * سایت (که صفحه بدونِ پنل هم به آن ارث می‌برد) ذخیره شده است. در این حالت
 * مقدارِ اختصاصیِ خودِ صفحه ارجح است، چون نگه داشتنِ مقدارِ پنل یعنی چند
 * صفحه‌ی مختلف عنوانِ یکسانِ صفحه‌ی اصلی را منتشر کنند
 * (مثل رکوردِ `/digital-catalog` که متنِ صفحه‌ی اصلی را دارد).
 */
function isSiteDefault(value: string | null | undefined, fallback?: string | null): boolean {
  if (!value) return true;
  if (!fallback) return false;

  const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

  return normalize(value) === normalize(fallback);
}

/** متایی که مدیر سئو در پنل برای یک صفحه ثبت کرده است */
interface SeoOverride {
  metaTitle?: string | null;
  metaDescription?: string | null;
  indexable?: boolean | null;
  followable?: boolean | null;
}

/**
 * حداقل تعداد حروف/اعدادِ لازم برای اینکه یک متن «توضیحات واقعی» حساب شود.
 *
 * بعضی رکوردهای دسته‌بندی به‌جای توضیحات فقط یک نقطه یا فاصله دارند (مثل
 * `"."`)؛ بدون این حد، همان نقطه به‌عنوان متا دیسکریپشن منتشر می‌شد.
 */
const MIN_MEANINGFUL_DESCRIPTION_CHARS = 15;

/**
 * تبدیل توضیحاتِ HTML به متن ساده برای متا دیسکریپشن.
 *
 * - تگ‌های HTML حذف و فاصله‌ها یکدست می‌شوند؛
 * - متن‌های بی‌محتوا (فقط نقطه/فاصله/نماد) نادیده گرفته می‌شوند و مقدار
 *   جایگزین برگردانده می‌شود؛
 * - اگر نه متنی باشد و نه مقدار جایگزین، `undefined` برمی‌گردد تا صفحه به
 *   توضیحاتِ پیش‌فرضِ لایه ارث ببرد (نه رشته‌ی خالی).
 */
export function meaningfulDescription(
  text?: string | null,
  fallback?: string,
  maxLength = 160,
): string | undefined {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();

  const alphanumeric = clean.replace(/[^\p{L}\p{N}]/gu, '');

  if (alphanumeric.length < MIN_MEANINGFUL_DESCRIPTION_CHARS) {
    return fallback?.trim() ? fallback.trim().slice(0, maxLength) : undefined;
  }

  return clean.slice(0, maxLength);
}

export function metaDescriptionFromHtml(
  html?: string | null,
  fallback?: string,
  maxLength = 160,
): string | undefined {
  const text = (html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return meaningfulDescription(text, fallback, maxLength);
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
  // مقدارِ پنل فقط وقتی به کار می‌رود که واقعاً چیزی وارد شده باشد؛ متنی که
  // دقیقاً همان مقدارِ پیش‌فرضِ سایت است یعنی «چیزی وارد نشده» و در آن صورت
  // متادیتای اختصاصیِ صفحه حفظ می‌شود.
  const metaTitle = isSiteDefault(seo?.metaTitle, SITE_DEFAULT_TITLE)
    ? undefined
    : seo?.metaTitle?.trim();

  const metaDescription = isSiteDefault(
    seo?.metaDescription,
    SITE_DEFAULT_DESCRIPTION,
  )
    ? undefined
    : seo?.metaDescription?.trim();

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
