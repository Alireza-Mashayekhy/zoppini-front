import { categorySlugSegment } from '@/lib/category-slug';
import type { CategoriesResponse } from '@/services/features/categories/types';

/**
 * ثابت‌های کمپین بلک فرایدی.
 *
 * این ماژول هیچ وابستگی‌ای به React/Next ندارد تا هم در سرور، هم در کلاینت و
 * هم در تست‌ها قابل استفاده باشد.
 */

/**
 * دستهٔ اصلی «زوپینی بلک فرایدی» در فروشگاه.
 *
 * محصولات همیشه با پارامتر `categoryIds` خوانده می‌شوند؛ بک‌اند این شناسه را
 * به زیردسته‌ها هم گسترش می‌دهد، پس یک شناسه برای کل کمپین کافی است.
 * پارامترهای `category` یا `categorySlug` در این API فیلتر نمی‌کنند.
 */
export const BLACK_FRIDAY_CATEGORY_ID = 137;

/** اندازهٔ صفحهٔ لیست؛ همان ۲۴ محصولِ صفحه‌های دسته‌بندی فروشگاه. */
export const BLACK_FRIDAY_PAGE_SIZE = 24;

/**
 * درصد تخفیف محصولات دستهٔ «زوپینی بلک فرایدی» (گروه ۷۰٪).
 *
 * عضویت در دستهٔ ۱۳۷ و تخفیف مؤثر واقعی هر دو برای واجدیت لازم‌اند.
 */
export const BLACK_FRIDAY_DISCOUNT_PERCENT = 70;

/**
 * درصد تخفیف استاندارد فروشگاه که تمام محصولات با همین درصد فعال،
 * حتی داخل دستهٔ بلک فرایدی، واجد لیست هستند (گروه ۲۰٪).
 *
 * محصولات با درصدهای دیگر (نه ۷۰ در دستهٔ کمپین و نه ۲۰) در این لیست
 * نمی‌آیند، مگر آنکه قواعد کمپین صراحتاً آن‌ها را واجد بداند.
 */
export const STANDARD_DISCOUNT_PERCENT = 20;

/**
 * مرتب‌سازی‌ای که برای صفحه‌بندی به API داده می‌شود.
 *
 * «بیشترین تخفیف» در کلاینت محاسبه می‌شود (API معادلش را ندارد)، ولی برای
 * اینکه صفحه‌بندی/اسکرول بی‌نهایت ترتیبِ پایداری داشته باشد از همان
 * `createdAt:desc` استفاده می‌شود که صفحه‌های دسته‌بندی فروشگاه هم دارند.
 */
export const BLACK_FRIDAY_API_SORT = 'createdAt:desc';

/**
 * مهلت کمپین: یکشنبه ۸ آذر ۱۴۰۵، ساعت ۲۳:۵۹:۵۹ به وقت تهران.
 *
 * مقدار با آفستِ UTC ذخیره می‌شود تا نه منطقهٔ زمانی سرور و نه مرورگر روی
 * شمارش اثر نگذارد. این تاریخ با تاریخ انقضای تخفیفِ محصولات یکی نیست.
 */
export const BLACK_FRIDAY_DEADLINE_UTC_MS = Date.parse(
  '2026-11-29T23:59:59+03:30',
);

export type BlackFridaySubcategory = {
  id: number;
  slug: string;
  name: string;
  /** تصویر ادیتوریال تأییدشدهٔ کاشی؛ در `public/campaign/blackfriday` است */
  image: string;
};

/**
 * زیردسته‌های واقعی کمپین.
 *
 * شناسه‌ها از دیتابیس فروشگاه گرفته شده‌اند؛ نام و اسلاگ در زمان رندر با
 * پاسخ زندهٔ `/categories` هم‌تراز می‌شوند تا تغییر نام یا اسلاگ در پنل،
 * کاشی‌ها و لینک‌ها را نشکند. تصویرها عکس‌های تأییدشدهٔ کمپین هستند.
 */
const SUBCATEGORY_FALLBACKS: BlackFridaySubcategory[] = [
  {
    id: 138,
    slug: 'mens-classic-shirts',
    name: 'پیراهن کلاسیک',
    image: '/campaign/blackfriday/category-classic-shirts.jpg',
  },
  {
    id: 139,
    slug: 'mens-casual-shirts',
    name: 'پیراهن کژوال',
    image: '/campaign/blackfriday/category-casual-shirts.jpg',
  },
  {
    id: 140,
    slug: 'mens-trousers',
    name: 'شلوار',
    image: '/campaign/blackfriday/category-trousers.jpg',
  },
  {
    id: 141,
    slug: 'mens-blazers',
    name: 'کت تک',
    image: '/campaign/blackfriday/category-blazers.jpg',
  },
  {
    id: 142,
    slug: 'mens--coats',
    name: 'پالتو',
    image: '/campaign/blackfriday/category-coats.jpg',
  },
];

const BLACK_FRIDAY_SUBCATEGORY_IDS = new Set(
  SUBCATEGORY_FALLBACKS.map(subcategory => subcategory.id),
);

/** آیا این شناسه یکی از پنج زیردستهٔ کمپین است؟ */
export function isBlackFridaySubcategoryId(id: number): boolean {
  return BLACK_FRIDAY_SUBCATEGORY_IDS.has(id);
}

/**
 * کاشی‌های دسته‌بندی با نام/اسلاگِ زندهٔ فروشگاه.
 *
 * اگر دسته‌بندی در API نبود (مثلاً غیرفعال شده باشد) همان مقدار مرجع استفاده
 * می‌شود تا صفحه به‌خاطر یک کاشی خالی نشود؛ کاشی هم‌چنان به مسیر همان اسلاگ
 * در فروشگاه اشاره می‌کند و صفحهٔ مقصد خودش ۴۰۴/خالی بودن را مدیریت می‌کند.
 */
export function resolveBlackFridaySubcategories(
  liveCategories?: CategoriesResponse[] | null,
): BlackFridaySubcategory[] {
  const byId = new Map(
    (liveCategories ?? []).map(category => [category.id, category]),
  );

  return SUBCATEGORY_FALLBACKS.map(fallback => {
    const live = byId.get(fallback.id);
    const slug = live?.slug?.trim();
    const name = live?.name?.trim();

    return {
      ...fallback,
      slug: slug || fallback.slug,
      name: name || fallback.name,
    };
  });
}

/**
 * فیلتر دسته‌بندی برای درخواست محصولات.
 *
 * «همه» → خودِ دستهٔ کمپین (۱۳۷)؛ بک‌اند این شناسه را به پنج زیردسته‌اش
 * گسترش می‌دهد.
 *
 * زیردستهٔ انتخاب‌شده → فقط همان زیردسته. توجه: بک‌اند `categoryIds` را با
 * همهٔ زیردسته‌های هر شناسه ادغام می‌کند؛ اگر ۱۳۷ کنار زیردسته فرستاده
 * شود، دامنه دوباره به کل کمپین باز می‌شود و فیلتر هیچ کاری نمی‌کند.
 * چون زیردسته خودش فرزند ۱۳۷ است، دامنهٔ کمپین همچنان تضمین می‌شود.
 */
export function blackFridayCategoryFilter(
  subcategoryId?: number | null,
): number[] {
  if (
    subcategoryId === null ||
    subcategoryId === undefined ||
    !isBlackFridaySubcategoryId(subcategoryId)
  ) {
    return [BLACK_FRIDAY_CATEGORY_ID];
  }

  return [subcategoryId];
}

/**
 * مسیر صفحهٔ لیست محصولات یک دسته در فروشگاه.
 *
 * `/product-category/{slug}` آرشیو اصلی و ایندکس‌شوندهٔ دسته است و منوی
 * سایت هم برای زیردسته‌های بدون فرزند همین مسیر را می‌سازد.
 */
export function blackFridayCategoryHref(slug: string): string {
  return `/product-category/${categorySlugSegment(slug)}`;
}

export type StoreTopCategory = {
  id: number;
  name: string;
  slug: string;
  /** مسیر تصویر دسته‌بندی فروشگاه (کاملِ URL با پیش‌وند NEXT_PUBLIC_IMAGE_URL) */
  image: string;
};

/**
 * دستهٔ اصلیِ ناوبری فروشگاه (منبع حقیقت).
 *
 * همان دسته‌های ریسپانسیو منو: ریشه‌های درخت دسته‌بندی (`parentId` خالی)
 * که فعال هستند. دستهٔ کمپین «زوپینی بلک فرایدی» (۱۳۷) و زیردسته‌هایش
 * از این فهرست حذف می‌شوند؛ کمپین صرفاً برای شناسایی محصولات ۷۰٪بقى
 * برنامه است و جزو دسته‌های قابل‌فیلترِ ناوبری نیست.
 *
 * ترتیب از `orderInHome` (تبلیغات/منو) و در نبود آن از شناسه می‌آید تا
 *وقوع‌های پیاپی پایدار و هم‌تراز با ناوبری باشد.
 */
export function resolveStoreTopCategories(
  liveCategories?: CategoriesResponse[] | null,
  imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_URL ?? '',
): StoreTopCategory[] {
  const byId = new Map(
    (liveCategories ?? []).map(category => [category.id, category]),
  );

  const roots = (liveCategories ?? []).filter(category => {
    if (!category?.isActive) return false;
    if (category.id === BLACK_FRIDAY_CATEGORY_ID) return false;

    const parentId =
      category.parentId == null ? null : Number(category.parentId);
    // ریشه یعنی والدخالی باشد یا والد در فهرست وجود نداشته باشد
    const isRoot = parentId === null || !byId.has(parentId);
    return isRoot;
  });

  return roots
    .sort((left, right) => {
      const leftOrder = Number.isFinite(left.orderInHome) ? left.orderInHome : Number.MAX_SAFE_INTEGER;
      const rightOrder = Number.isFinite(right.orderInHome) ? right.orderInHome : Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder || left.id - right.id;
    })
    .map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: `${imageBaseUrl}${category.image ?? ''}`,
    }));
}

export type RemainingTime = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

/**
 * زمان باقی‌مانده تا مهلت کمپین.
 *
 * مثل تایمر کمپین قبلی، ثانیه‌ها به بالا گرد می‌شوند تا در کسرِ آخرِ ثانیه
 * همه‌ی رقم‌ها صفر نشوند و شمارش یک ثانیه زودتر از موعد تمام نشود.
 */
export function remainingUntilDeadline(nowMs: number): RemainingTime {
  const totalMs = Math.max(0, BLACK_FRIDAY_DEADLINE_UTC_MS - nowMs);
  const secondsLeft = Math.ceil(totalMs / 1000);

  return {
    days: Math.floor(secondsLeft / 86400),
    hours: Math.floor((secondsLeft % 86400) / 3600),
    minutes: Math.floor((secondsLeft % 3600) / 60),
    seconds: secondsLeft % 60,
    expired: totalMs === 0,
  };
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** عدد دو رقمی با رقم فارسی؛ برای خانه‌های شمارش معکوس. */
export function formatCountdownUnit(value: number): string {
  return String(value)
    .padStart(2, '0')
    .replace(/\d/g, digit => PERSIAN_DIGITS[Number(digit)]);
}

/** درصد فارسی برای برچسب‌ها و متن‌های ثابت کمپین. */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, digit => PERSIAN_DIGITS[Number(digit)]);
}
