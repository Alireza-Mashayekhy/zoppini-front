import { publicFetch } from '@/services/api/server';
import { ApiSingleResponse } from '@/services/api/types';

/** یک رکوردِ نقشه‌ی سایت (محصول، دسته‌بندی یا مقاله). */
export interface SitemapItem {
  name: string;
  slug: string;
  /**
   * زمان واقعیِ آخرین تغییر رکورد (ISO) یا `null`.
   *
   * `null` یعنی زمان معتبری نداریم و در خروجی تگ `<lastmod>` چاپ نمی‌شود؛
   * هرگز با زمان درخواست جایگزین نمی‌شود.
   */
  updatedAt?: string | null;
}

export interface SitemapData {
  products: SitemapItem[];
  categories: SitemapItem[];
  blogPosts: SitemapItem[];
}

/**
 * ثانیه‌های کش شدن داده‌ی نقشه‌ی سایت.
 *
 * داده عمومی است و به کاربر وابسته نیست، پس با `publicFetch` و `revalidate`
 * خوانده می‌شود (برخلاف `serverFetch` که کوکی می‌فرستد و مسیر را کاملاً
 * داینامیک می‌کند).
 */
export const SITEMAP_REVALIDATE_SECONDS = 3600;

const EMPTY_SITEMAP: SitemapData = {
  products: [],
  categories: [],
  blogPosts: [],
};

/**
 * داده‌ی نقشه‌ی سایت از بک‌اند.
 *
 * نکته‌ی مهم: اندپوینت `/api/sitemap` عمومی است (بدون Guard) و هیچ داده‌ی
 * وابسته به کاربر برنمی‌گرداند؛ بنابراین فرستادن کوکی ضرورتی ندارد و کش
 * کردن پاسخ امن است.
 *
 * در صورت خطا یا قطعی بک‌اند، نقشه‌ی خالی برمی‌گردد تا مسیرها با خطای ۵xx
 * مواجه نشوند (تعداد URLها صفر می‌شود، نه تاریخِ جعلی).
 */
export async function getSitemap(): Promise<SitemapData> {
  try {
    const body = await publicFetch<
      ApiSingleResponse<Partial<SitemapData> | null>
    >('sitemap', { next: { revalidate: SITEMAP_REVALIDATE_SECONDS } });

    const data = body?.data;

    if (!data) return EMPTY_SITEMAP;

    return {
      products: data.products ?? [],
      categories: data.categories ?? [],
      blogPosts: data.blogPosts ?? [],
    };
  } catch {
    // زمان بیلد یا قطعی بک‌اند: نقشه‌ی خالی (بدون جعل زمان یا URL).
    return EMPTY_SITEMAP;
  }
}
