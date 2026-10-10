export interface BlogAuthorResponse {
  id: number;
  fullName: string;
}

/** نوع بخش‌های مقاله */
export type BlogBlockType = 'content' | 'faq' | 'slider' | 'media' | 'toc';

export type BlogMediaType = 'image' | 'video';

/** گزینه‌های رنگ یک محصول در اسلایدر مقاله */
export interface BlogSliderColorOption {
  colorId: number;
  name: string;
  hexCode: string;
  image: string | null;
  price: number;
  inStock: boolean;
}

/** اطلاعات سبک محصول که بک‌اند برای آیتم‌های اسلایدر برمی‌گرداند */
export interface BlogSliderProductInfo {
  id: number;
  title: string;
  slug: string;
  /** تصویر رنگ انتخاب‌شده (یا تصویر اصلی محصول) */
  image: string | null;
  /** کمترین قیمت رنگ انتخاب‌شده */
  price: number;
  inStock: boolean;
  colorOptions: BlogSliderColorOption[];
}

export interface BlogBlockItem {
  /** محتوای HTML یک بخش متن */
  html?: string;

  /** سوالات متداول */
  question?: string;
  answer?: string;

  /** گالری عکس و فیلم */
  mediaType?: BlogMediaType;
  url?: string;
  poster?: string;
  alt?: string;

  /** اسلایدر محصولات */
  productId?: number;
  colorId?: number;
  badge?: string;

  /** مشترک */
  caption?: string;
  linkUrl?: string;
  linkLabel?: string;

  /** اطلاعات محصول برای نمایش کارت در اسلایدر (از بک‌اند یا انتخاب ادمین) */
  product?: BlogSliderProductInfo | null;
}

export interface BlogBlockSettings {
  autoplay?: boolean;
  title?: string;
}

export interface BlogBlock {
  id?: number;
  type: BlogBlockType;
  order?: number;
  title?: string | null;
  settings?: BlogBlockSettings | null;
  items: BlogBlockItem[];
}

export interface BlogPostResponse {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  /** متا تایتل سئو؛ اگر خالی باشد، عنوان مقاله استفاده می‌شود */
  metaTitle?: string | null;
  /** متا دیسکریپشن سئو؛ اگر خالی باشد، خلاصه‌ی مقاله استفاده می‌شود */
  metaDescription?: string | null;
  /** false یعنی صفحه‌ی مقاله با تگ noindex منتشر می‌شود */
  indexable?: boolean;
  /** false یعنی تگ nofollow روی صفحه‌ی مقاله اعمال می‌شود */
  followable?: boolean;
  content: string;
  coverImage: string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  authorId: number | null;
  author: BlogAuthorResponse | null;
  blocks?: BlogBlock[];
}

export interface createBlogPostDto {
  title: string;
  slug: string;
  excerpt: string;
  /** متا تایتل سئو (اختیاری) */
  metaTitle?: string;
  /** متا دیسکریپشن سئو (اختیاری) */
  metaDescription?: string;
  /** ایندکس شدن صفحه‌ی مقاله در گوگل (پیش‌فرض: بله) */
  indexable?: boolean;
  /** دنبال شدن لینک‌های صفحه‌ی مقاله توسط خزنده‌ها (پیش‌فرض: بله) */
  followable?: boolean;
  content: string;
  image?: File;
  isPublished: boolean;
  isFeatured: boolean;
}
