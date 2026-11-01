import { mediaUrl } from './media';

/**
 * هم‌زمان‌سازی تصاویر قابل‌مدیریت صفحه اصلی.
 *
 * هر تصویر صفحه اصلی یک «جایگاه» با کلید ثابت دارد. مدیر از پنل می‌تواند
 * برای هر جایگاه تصویر دسکتاپ و موبایل + متن جایگزین (alt) آپلود کند؛
 * اگر جایگاهی در پنل ثبت نشده باشد یا خاموش شده باشد، همان تصویر پیش‌فرض
 * قبلی سایت نمایش داده می‌شود.
 *
 * تصویر موبایل اختیاری است: اگر آپلود نشود، همان تصویر دسکتاپ روی موبایل
 * نمایش داده می‌شود.
 */
export type HomeImageSlotKey =
  | 'home.hero-1-poster'
  | 'home.hero-2-poster'
  | 'home.sale-banner'
  | 'home.category-1'
  | 'home.category-2'
  | 'home.end-video-poster';

export interface HomeImageSlot {
  key: HomeImageSlotKey;
  /** نام نمایشی در پنل مدیریت */
  label: string;
  /** توضیح محل نمایش، برای پنل مدیریت */
  description: string;
  /** اندازه‌ی پیشنهادی تصویر دسکتاپ */
  desktopSize: string;
  /** اندازه‌ی پیشنهادی تصویر موبایل */
  mobileSize: string;
  /** آیا این جایگاه لینک کلیک دارد؟ */
  supportsLink: boolean;
  /** لینک پیش‌فرض (اگر مدیر لینکی ثبت نکرده باشد) */
  defaultLink?: string;
  /** متن جایگزین پیش‌فرض */
  defaultAlt: string;
  /** تصویر پیش‌فرض دسکتاپ (فایل استاتیک سایت) */
  defaultDesktop: string;
  /** تصویر پیش‌فرض موبایل (فایل استاتیک سایت) */
  defaultMobile?: string;
  /** آیا این جایگاه در موبایل نمایش داده می‌شود؟ */
  visibleOnMobile: boolean;
}

/**
 * فهرست جایگاه‌های تصویر صفحه اصلی.
 *
 * ترتیب همین آرایه، ترتیب نمایش در پنل مدیریت است.
 */
export const HOME_IMAGE_SLOTS: HomeImageSlot[] = [
  {
    key: 'home.hero-1-poster',
    label: 'پوستر ویدیوی هدر — چپ',
    description: 'تصویری که تا آماده‌شدن ویدیوی اول هدر صفحه اصلی دیده می‌شود.',
    desktopSize: '۱۹۲۰×۱۰۸۰ (۱۶:۹)',
    mobileSize: '۱۰۸۰×۱۹۲۰ (۹:۱۶)',
    supportsLink: false,
    defaultAlt: 'فروشگاه پوشاک مردانه زوپینی',
    defaultDesktop: '/home/hero_section_1/poster.webp',
    visibleOnMobile: true,
  },
  {
    key: 'home.hero-2-poster',
    label: 'پوستر ویدیوی هدر — راست',
    description: 'تصویری که تا آماده‌شدن ویدیوی دوم هدر صفحه اصلی دیده می‌شود.',
    desktopSize: '۱۹۲۰×۱۰۸۰ (۱۶:۹)',
    mobileSize: '۱۰۸۰×۱۹۲۰ (۹:۱۶)',
    supportsLink: false,
    defaultAlt: 'کالکشن جدید پوشاک مردانه زوپینی',
    defaultDesktop: '/home/hero_section_2/poster.webp',
    visibleOnMobile: true,
  },
  {
    key: 'home.sale-banner',
    label: 'بنر فروش ویژه',
    description:
      'بنر تمام‌عرض زیر هدر صفحه اصلی. اگر تصویر موبایل آپلود نشود، نسخه‌ی دسکتاپ روی موبایل نمایش داده می‌شود.',
    desktopSize: '۱۹۲۰×۱۰۸۰ (۱۶:۹)',
    mobileSize: '۱۰۸۰×۱۹۲۰ (۹:۱۶)',
    supportsLink: true,
    defaultLink: '/products',
    defaultAlt: 'محصولات تخفیف‌دار زوپینی',
    defaultDesktop: '/home/sale_3.webp',
    defaultMobile: '/home/mobile_sale_3.webp',
    visibleOnMobile: true,
  },
  {
    key: 'home.category-1',
    label: 'تصویر دسته‌بندی‌ها — اول',
    description:
      'تصویر بزرگ بخش دسته‌بندی‌های صفحه اصلی. در موبایل این جایگاه نمایش داده نمی‌شود.',
    desktopSize: '۱۰۸۰×۱۰۸۰ (۱:۱)',
    mobileSize: '—',
    supportsLink: false,
    defaultAlt: 'دسته‌بندی محصولات زوپینی',
    defaultDesktop: '/home/category_1_2.webp',
    visibleOnMobile: false,
  },
  {
    key: 'home.category-2',
    label: 'تصویر دسته‌بندی‌ها — دوم',
    description:
      'تصویر مربعی بخش دسته‌بندی‌های صفحه اصلی؛ هم در موبایل و هم در دسکتاپ دیده می‌شود.',
    desktopSize: '۱۰۸۰×۱۰۸۰ (۱:۱)',
    mobileSize: '۱۰۸۰×۱۰۸۰ (۱:۱)',
    supportsLink: false,
    defaultAlt: 'دسته‌بندی محصولات زوپینی',
    defaultDesktop: '/home/category_2_2.webp',
    visibleOnMobile: true,
  },
  {
    key: 'home.end-video-poster',
    label: 'پوستر ویدیوی پایانی',
    description: 'تصویری که تا آماده‌شدن ویدیوی پایانی صفحه اصلی دیده می‌شود.',
    desktopSize: '۱۹۲۰×۱۰۸۰ (۱۶:۹)',
    mobileSize: '۱۰۸۰×۱۹۲۰ (۹:۱۶)',
    supportsLink: false,
    defaultAlt: 'زوپینی — پوشاک مردانه',
    defaultDesktop: '/home/end/poster.webp',
    defaultMobile: '/home/mobile_end/poster.webp',
    visibleOnMobile: true,
  },
];

/** یک تصویر آماده‌ی رندر */
export interface HomeImage {
  /** آدرس کامل تصویر دسکتاپ */
  desktop: string;
  /** آدرس تصویر موبایل؛ `null` یعنی همان تصویر دسکتاپ استفاده شود */
  mobile: string | null;
  /** متن جایگزین */
  alt: string;
  /** لینک کلیک؛ `null` یعنی بدون لینک */
  linkUrl: string | null;
  /** آیا این تصویر از پنل آپلود شده است؟ */
  isCustom: boolean;
}

export type HomeImages = Record<HomeImageSlotKey, HomeImage>;

/** رکوردی که از `GET /site-images` می‌آید */
export interface SiteImageRecord {
  slot: string;
  desktop: string | null;
  mobile: string | null;
  alt: string | null;
  linkUrl: string | null;
}

function defaultHomeImage(slot: HomeImageSlot): HomeImage {
  return {
    desktop: slot.defaultDesktop,
    mobile: slot.defaultMobile ?? null,
    alt: slot.defaultAlt,
    linkUrl: slot.defaultLink ?? null,
    isCustom: false,
  };
}

/**
 * ادغام جایگاه‌های ثابت سایت با تصاویری که مدیر آپلود کرده است.
 *
 * جایگاه بدون رکورد (یا رکورد بدون تصویر) → تصویر پیش‌فرض سایت.
 * رکورد با تصویر موبایل خالی → روی موبایل همان تصویر دسکتاپ.
 */
export function resolveHomeImages(
  records: SiteImageRecord[] | null | undefined,
): HomeImages {
  const bySlot = new Map(
    (records ?? [])
      .filter(record => Boolean(record?.slot))
      .map(record => [record.slot, record]),
  );

  const entries = HOME_IMAGE_SLOTS.map(slot => {
    const record = bySlot.get(slot.key);

    if (!record?.desktop) {
      return [slot.key, defaultHomeImage(slot)] as const;
    }

    return [
      slot.key,
      {
        desktop: mediaUrl(record.desktop),
        mobile: record.mobile ? mediaUrl(record.mobile) : null,
        alt: record.alt?.trim() || slot.defaultAlt,
        linkUrl: record.linkUrl?.trim() || slot.defaultLink || null,
        isCustom: true,
      },
    ] as const;
  });

  return Object.fromEntries(entries) as HomeImages;
}

/** جایگاه بر اساس کلید (برای پنل مدیریت) */
export function findHomeImageSlot(key: string): HomeImageSlot | undefined {
  return HOME_IMAGE_SLOTS.find(slot => slot.key === key);
}
