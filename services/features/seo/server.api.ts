import { ApiSingleResponse } from '@/services/api/types';

import { PageSeoResponse } from './types';

const BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000/api/';

/**
 * ثانیه‌هایی که متای صفحات کش می‌شود؛ بعد از آن تغییرات پنل روی سایت می‌آید.
 *
 * عمداً کم است تا تغییرات پنل سریع دیده شوند و عمداً صفر نیست تا صفحات
 * ثابت (استاتیک) بمانند و با هر بازدید، درخواستی به بک‌اند نخورد.
 */
export const SEO_REVALIDATE_SECONDS = 30;

/**
 * متای ثبت‌شده در پنل برای یک صفحه از سایت.
 *
 * این تابع عمداً به‌جای `serverFetch` (که کوکی می‌خواند و صفحه را داینامیک
 * می‌کند) از `fetch` ساده با `revalidate` استفاده می‌کند تا صفحات استاتیک
 * بمانند و متا حداکثر تا چند ده ثانیه بعد از تغییر در پنل به‌روز شود.
 */
export async function getPageSeo(
  path: string,
): Promise<PageSeoResponse | null> {
  try {
    const res = await fetch(
      `${BASE_URL}seo/page?path=${encodeURIComponent(path)}`,
      { next: { revalidate: SEO_REVALIDATE_SECONDS } },
    );

    if (!res.ok) return null;

    const body =
      (await res.json()) as ApiSingleResponse<PageSeoResponse | null>;

    return body?.data ?? null;
  } catch {
    // در زمان بیلد یا قطعی بک‌اند، متادیتای پیش‌فرض خود صفحه استفاده می‌شود
    return null;
  }
}
