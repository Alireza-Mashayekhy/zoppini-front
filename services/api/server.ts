import { cookies } from 'next/headers';

import { normalizeApiBaseUrl } from '@/services/api/base-url';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ServerRequestOptions {
  method?: Method;
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  /** اختیاری؛ برای timeout/لغو درخواست (مثلاً `AbortSignal.timeout`). */
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE_URL = normalizeApiBaseUrl(
  process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3000/api/',
);

async function refreshToken() {
  const cookieStore = await cookies();

  const response = await fetch(`${BASE_URL}auth/refresh`, {
    method: 'POST',
    headers: {
      Cookie: cookieStore.toString(),
    },
  });
  return response.ok;
}

/**
 * Fetch سمت سرور برای اندپوینت‌های **عمومی** (بدون نیاز به احراز هویت).
 *
 * تفاوت با `serverFetch`:
 * - کوکی کاربر را نمی‌خواند و نمی‌فرستد؛
 * - تلاش برای refresh توکن (منطق ۴۰۱) ندارد، چون اندپوینت عمومی ۴۰۱ نمی‌دهد.
 *
 * ⚠️ درباره‌ی رندر — این تابع مسیر را **ایستا نمی‌کند**:
 * پیش‌فرضِ کشِ آن `cache: 'no-store'` است و همین مقدار باعث می‌شود مسیر در هر
 * درخواست دوباره رندر شود (dynamic rendering). بنابراین سودِ این تابع در
 * ایستا کردنِ HTML نیست، بلکه در این است که:
 *   ۱. هیچ کوکیِ کاربری به بک‌اند فرستاده نمی‌شود (پاسخِ API به کاربر وابسته
 *      نمی‌ماند و چیزی از نشست به بیرون درز نمی‌کند)؛
 *   ۲. `cookies()` فراخوانی نمی‌شود، پس مسیر **به‌خاطرِ کوکی** هم داینامیک
 *      نمی‌شود و اگر روزی سیاستِ کش تغییر کند، مسیر قابلیتِ ایستا شدن را
 *      از دست نمی‌دهد.
 * برای کش کردنِ واقعی باید صراحتاً `next: { revalidate }` داده شود؛ این کار
 * همان ISR است و چون روی تازگیِ قیمت/موجودی اثر دارد، نیازمند تصمیمِ جداگانه
 * است (در `sitemap/server.api.ts` برای داده‌ی نقشه‌ی سایت انجام شده است).
 *
 * رفتار کش دقیقاً مثل `serverFetch` است: اگر `next` داده شود همان استفاده
 * می‌شود وگرنه پیش‌فرض `no-store` است؛ یعنی جایگزین کردنِ فراخوانی‌هایی که
 * `next` ندارند، **تغییری در سیاستِ کش ایجاد نمی‌کند**.
 */
export async function publicFetch<T>(
  url: string,
  options: ServerRequestOptions = {},
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const preparedBody =
    options.body == null
      ? undefined
      : isFormData
        ? options.body
        : JSON.stringify(options.body);

  const fetchInit: RequestInit & { next?: NextFetchRequestConfig } = {
    method: options.method ?? 'GET',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
    body: preparedBody as BodyInit,
    ...(options.next
      ? { next: options.next }
      : { cache: options.cache ?? 'no-store' }),
    ...(options.cache && options.next ? { cache: options.cache } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  };

  const res = await fetch(`${BASE_URL}${url}`, fetchInit);

  if (!res.ok) {
    const error = await res.json().catch(() => null);

    throw new ApiError(
      error?.message ?? `Request failed: ${res.status}`,
      res.status,
    );
  }

  return res.json();
}

export async function serverFetch<T>(
  url: string,
  options: ServerRequestOptions = {},
): Promise<T> {
  const cookieStore = await cookies();

  const isFormData = options.body instanceof FormData;

  const preparedBody =
    options.body == null
      ? undefined
      : isFormData
        ? options.body
        : JSON.stringify(options.body);

  const fetchInit: RequestInit & { next?: NextFetchRequestConfig } = {
    method: options.method ?? 'GET',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Cookie: cookieStore.toString(),
      ...options.headers,
    },
    body: preparedBody as BodyInit,
    ...(options.next
      ? { next: options.next }
      : { cache: options.cache ?? 'no-store' }),
    ...(options.cache && options.next ? { cache: options.cache } : {}),
  };

  let res = await fetch(`${BASE_URL}${url}`, fetchInit);

  if (res.status === 401) {
    const refreshed = await refreshToken();

    if (refreshed) {
      res = await fetch(`${BASE_URL}${url}`, fetchInit);
    } else {
      throw new Error('UNAUTHORIZED');
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => null);

    throw new ApiError(
      error?.message ?? `Request failed: ${res.status}`,
      res.status,
    );
  }

  return res.json();
}
