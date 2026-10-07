import { BlogSliderProductInfo } from '@/services/features/blog/types';

/**
 * تایپ‌های بلوک‌های ویژه‌ی ادیتور.
 *
 * این بلوک‌ها (اسلایدر محصولات، گالری عکس/فیلم، سوالات متداول و فهرست
 * مطالب) مثل وردپرس/گوتنبرگ داخل خود متن مقاله قرار می‌گیرند و به‌جای
 * فرم‌های جداگانه، با همان ادیتور ساخته و جابه‌جا می‌شوند.
 */

/** نوع بلوک‌های ویژه‌ی داخل متن */
export type EditorBlockKind = 'slider' | 'media' | 'faq' | 'toc';

/** اسلاید محصول در اسلایدر مقاله */
export interface SliderBlockItem {
  productId: number;
  /** رنگ نمایشی کارت (اختیاری) */
  colorId?: number | null;
  /** برچسب روی کارت (مثلاً «جدید») */
  badge?: string;
  /** عنوان نمایشی دلخواه به‌جای نام محصول */
  caption?: string;
  /**
   * تصویر سبک محصول فقط برای پیش‌نمایش پنل ادمین.
   *
   * در سایت از دیتابیس تازه خوانده می‌شود؛ پس این مقدار هیچ‌وقت مبنای
   * نمایش عمومی نیست و بک‌اند موقع ساخت بلوک‌ها حذفش می‌کند.
   */
  product?: BlogSliderProductInfo | null;
}

export interface MediaBlockItem {
  mediaType: 'image' | 'video';
  /** مسیر نسبی فایل در uploads (یا URL کامل) */
  url: string;
  poster?: string | null;
  alt?: string;
  caption?: string;
  linkUrl?: string;
  linkLabel?: string;
}

export interface FaqBlockItem {
  question: string;
  answer: string;
}

export interface SliderBlockConfig {
  title?: string | null;
  autoplay?: boolean;
  items: SliderBlockItem[];
}

export interface MediaBlockConfig {
  title?: string | null;
  /** چیدمان گالری؛ «auto» برای یک فایل، تک‌ستونی و برای چند فایل شبکه‌ای */
  layout?: 'auto' | 'grid';
  items: MediaBlockItem[];
}

export interface FaqBlockConfig {
  title?: string | null;
  items: FaqBlockItem[];
}

export interface TocBlockConfig {
  title?: string | null;
}

export type BlockConfig =
  | SliderBlockConfig
  | MediaBlockConfig
  | FaqBlockConfig
  | TocBlockConfig;

/** تنظیم پیش‌فرض هر نوع بلوک */
export const DEFAULT_BLOCK_CONFIG: Record<
  EditorBlockKind,
  () => BlockConfig
> = {
  slider: () => ({ title: 'محصولات مرتبط', autoplay: true, items: [] }),
  media: () => ({ title: '', layout: 'auto', items: [] }),
  faq: () => ({ title: 'سوالات متداول', items: [] }),
  toc: () => ({ title: 'فهرست مطالب' }),
};

/** عنوان پیش‌فرض هر بلوک (وقتی ادمین عنوانی ننوشته باشد) */
export const BLOCK_FALLBACK_TITLES: Record<EditorBlockKind, string> = {
  slider: 'محصولات مرتبط',
  media: 'گالری تصاویر و ویدیو',
  faq: 'سوالات متداول',
  toc: 'فهرست مطالب',
};

/** نام فارسی بلوک‌ها برای منوها و برچسب‌ها */
export const BLOCK_LABELS: Record<EditorBlockKind, string> = {
  slider: 'اسلایدر محصولات',
  media: 'عکس و فیلم',
  faq: 'سوالات متداول',
  toc: 'فهرست مطالب',
};

/** توضیح کوتاه هر بلوک برای راهنمای منوی درج */
export const BLOCK_HINTS: Record<EditorBlockKind, string> = {
  slider: 'نمایش محصولات فروشگاه به‌صورت اسلایدر میان متن.',
  media: 'گالری عکس و فیلم با امکان توضیح و لینک برای هر فایل.',
  faq: 'سوال و پاسخ‌ها به‌شکل آکاردئون نمایش داده می‌شوند.',
  toc: 'به‌صورت خودکار از تیترهای مقاله ساخته می‌شود.',
};
