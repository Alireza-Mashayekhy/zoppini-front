import { SiteImageRecord } from '@/lib/home-images';
import { ApiListResponse } from '@/services/api/types';

const BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000/api/';

/**
 * ثانیه‌هایی که تصاویر صفحه اصلی کش می‌شوند.
 *
 * عمداً کم است تا تغییر پنل سریع دیده شود و صفر نیست تا صفحه اصلی
 * استاتیک بماند و با هر بازدید درخواستی به بک‌اند نخورد.
 */
export const SITE_IMAGES_REVALIDATE_SECONDS = 60;

/**
 * تصاویر صفحه اصلی که مدیر از پنل آپلود کرده است.
 *
 * عمداً از `fetch` ساده (نه `serverFetch` که کوکی می‌خواند) استفاده می‌شود
 * تا صفحه اصلی استاتیک بماند. اگر درخواست شکست بخورد، لیست خالی
 * برمی‌گردد و سایت همان تصاویر پیش‌فرض را نشان می‌دهد.
 */
export async function getSiteImages(): Promise<SiteImageRecord[]> {
  try {
    const res = await fetch(`${BASE_URL}site-images`, {
      next: {
        revalidate: SITE_IMAGES_REVALIDATE_SECONDS,
        tags: ['site-images'],
      },
    });

    if (!res.ok) return [];

    const body = (await res.json()) as ApiListResponse<SiteImageRecord>;

    return body?.data ?? [];
  } catch {
    return [];
  }
}
