import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { PageSeoResponse, SeoRedirectResponse } from './types';

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

/**
 * همه‌ی ریدایرکت‌های 301 ثبت‌شده در پنل سئو.
 *
 * توسط proxy (middleware) فرانت‌اند استفاده می‌شود تا هر مسیرِ دارای
 * ریدایرکت، قبل از رندر صفحه، با 301 به مقصد منتقل شود. پاسخ با همان
 * `revalidate` متای صفحات کش می‌شود تا کاربر برای دیدن صفحه، منتظر
 * پاسخ بک‌اند نماند.
 */
export async function getSeoRedirects(): Promise<SeoRedirectResponse[]> {
  try {
    const res = await fetch(`${BASE_URL}seo/redirects`, {
      next: { revalidate: SEO_REVALIDATE_SECONDS },
    });

    if (!res.ok) return [];

    const body = (await res.json()) as ApiSingleResponse<SeoRedirectResponse[]>;

    return body?.data ?? [];
  } catch {
    // در زمان بیلد یا قطعی بک‌اند، ریدایرکتی اعمال نمی‌شود
    return [];
  }
}

/**
 * ریدایرکت 301 ثبت‌شده برای یک مسیر؛ اگر وجود نداشته باشد `null`.
 */
export async function getSeoRedirect(
  path: string,
): Promise<Pick<SeoRedirectResponse, 'path' | 'redirectTo'> | null> {
  try {
    const res = await fetch(
      `${BASE_URL}seo/redirect?path=${encodeURIComponent(path)}`,
      { next: { revalidate: SEO_REVALIDATE_SECONDS } },
    );

    if (!res.ok) return null;

    const body = (await res.json()) as ApiSingleResponse<{
      path: string;
      redirectTo: string;
    } | null>;

    return body?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * همه‌ی صفحات سئو (اندپوینت عمومی) — برای ساخت نقشه‌ی سایتِ صفحات.
 * صفحاتی که `noindex` یا ریدایرکت دارند از نقشه‌ی سایت حذف می‌شوند.
 */
export async function getAllPageSeo(): Promise<PageSeoResponse[]> {
  try {
    const res = await fetch(`${BASE_URL}seo/pages`, {
      next: { revalidate: SEO_REVALIDATE_SECONDS },
    });

    if (!res.ok) return [];

    const body = (await res.json()) as ApiListResponse<PageSeoResponse>;

    return body?.data ?? [];
  } catch {
    return [];
  }
}
