import { cookies } from 'next/headers';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ServerRequestOptions {
  method?: Method;
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
}

const BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000/api/';

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

  let res = await fetch(`${BASE_URL}${url}`, {
    method: options.method ?? 'GET',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Cookie: cookieStore.toString(),
      ...options.headers,
    },
    body: preparedBody as BodyInit,
    cache: options.cache ?? 'no-store',
    next: options.next,
  });

  if (res.status === 401) {
    const refreshed = await refreshToken();

    if (refreshed) {
      res = await fetch(`${BASE_URL}${url}`, {
        method: options.method ?? 'GET',
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          Cookie: cookieStore.toString(),
          ...options.headers,
        },
        body: preparedBody as BodyInit,
        cache: options.cache ?? 'no-store',
        next: options.next,
      });
      console.log(res, options.method);
    } else {
      throw new Error('UNAUTHORIZED');
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => null);

    throw new Error(error?.message ?? `Request failed: ${res.status}`);
  }

  return res.json();
}
