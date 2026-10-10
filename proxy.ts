import { decodeJwt } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

import { isAuthRoute, sanitizeCallbackUrl } from './lib/callback-url';
import {
  getSeoRedirects,
  SEO_REVALIDATE_SECONDS,
} from './services/features/seo/server.api';

function readCookie(request: NextRequest, name: string): string | undefined {
  const value = request.cookies.get(name)?.value;
  if (value !== undefined) return value;

  const header = request.headers.get('cookie');
  if (!header) return undefined;

  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;

    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  return undefined;
}

function decodeToken(token: string | undefined) {
  if (!token) return null;
  try {
    return decodeJwt(token);
  } catch {
    return null;
  }
}

/**
 * توکن «فعال» یعنی قابل پارس باشد و منقضی نشده باشد.
 * چون عمر کوکی‌ها با exp توکن یکی نیست، ممکن است کوکی هنوز موجود باشد
 * ولی توکن داخل آن منقضی شده باشد — در آن حالت نباید جلوی /login را گرفت.
 */
function isTokenActive(token: string | undefined): boolean {
  const payload = decodeToken(token);
  if (!payload) return false;
  if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
    return false;
  }
  return true;
}

function getRoles(token: string | undefined): string[] {
  const payload = decodeToken(token);
  if (!payload) return [];

  const roles = payload.roles as string[] | string | undefined;
  if (Array.isArray(roles)) return roles;
  if (typeof roles === 'string') return [roles];
  return [];
}

/**
 * مقصد هدایت کاربرِ دارای توکن از صفحات Auth:
 * اگر callbackUrl سالم بود به همان برمی‌گردد، وگرنه به صفحه داشبورد.
 * sanitizeCallbackUrl خودش callbackهای خارج از دامنه و callbackهایی که
 * خودشان صفحه Auth باشند (لوپ) را رد می‌کند.
 */
function resolveAuthRedirectTarget(request: NextRequest): string {
  return (
    sanitizeCallbackUrl(request.nextUrl.searchParams.get('callbackUrl')) ??
    '/dashboard'
  );
}

// ────────────────────────── ریدایرکت‌های 301 پنل سئو ──────────────────────────

/**
 * مدت cache شدن نقشه‌ی ریدایرکت‌ها در proxy.
 * از کش کوتاه ۵ثانیه‌ای استفاده می‌کنیم تا با کش اشتراکی fetch جمع نشود
 * و تغییرات پنل در بازه‌ی کوتاهی روی سایت اعمال شوند.
 */
const REDIRECT_CACHE_TTL_MS = Math.min(SEO_REVALIDATE_SECONDS * 1000, 5000);

interface RedirectCacheEntry {
  expiresAt: number;
  map: Map<string, string>;
}

let redirectCache: RedirectCacheEntry | null = null;

/**
 * مسیر را برای مقایسه‌ی ریدایرکت یکدست می‌کند:
 * percent-encoding آن decode می‌شود و اسلش‌های انتهایی (به‌جز صفحه‌ی
 * اصلی) حذف می‌شوند.
 */
function normalizeRedirectPath(pathname: string): string {
  let decoded = pathname;

  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // اگر decode نشد، همان مسیر خام مقایسه می‌شود
  }

  if (decoded.length > 1) decoded = decoded.replace(/\/+$/, '');

  return decoded;
}

/**
 * مسیرهایی که نباید ریدایرکت 301 شوند:
 * پنل‌های مدیریت، checkout، API و فایل‌های استاتیک.
 */
function isPathOrChild(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function shouldCheckRedirect(pathname: string): boolean {
  if (
    isPathOrChild(pathname, '/admin') ||
    isPathOrChild(pathname, '/dashboard') ||
    isPathOrChild(pathname, '/checkout') ||
    isPathOrChild(pathname, '/api') ||
    isPathOrChild(pathname, '/_next')
  ) {
    return false;
  }

  // فایل‌های استاتیک را از بررسی رد می‌کنیم؛ اما مسیرهای قدیمی با پسوند
  //هایی مثل .html همچنان امکان ریدایرکت دارند.
  const lastSegment = pathname.split('/').pop() ?? '';
  if (
    /\\.(?:avif|bmp|css|eot|gif|ico|jpe?g|js|json|map|mp3|mp4|ogg|pdf|png|svg|txt|ttf|webm|webp|woff2?|xml|zip)$/i.test(
      lastSegment,
    )
  ) {
    return false;
  }

  return true;
}

/**
 * نقشه‌ی «مسیر → مقصد» ریدایرکت‌های 301 ثبت‌شده در پنل سئو را می‌سازد.
 * نتیجه در حافظه‌ی ماژول کش می‌شود تا هر درخواست، بک‌اند را درگیر نکند.
 */
async function getRedirectMap(): Promise<Map<string, string>> {
  const now = Date.now();

  if (redirectCache && now < redirectCache.expiresAt) {
    return redirectCache.map;
  }

  try {
    const redirects = await getSeoRedirects();

    const map = new Map<string, string>();

    for (const item of redirects) {
      if (item?.path && item?.redirectTo) {
        map.set(normalizeRedirectPath(item.path), item.redirectTo);
      }
    }

    redirectCache = { expiresAt: now + REDIRECT_CACHE_TTL_MS, map };

    return map;
  } catch {
    // اگر بک‌اند در دسترس نبود، از نقشه‌ی قبلی (در صورت وجود) استفاده می‌شود
    return redirectCache?.map ?? new Map<string, string>();
  }
}

/**
 * اگر برای مسیر درخواست، ریدایرکت 301 ثبت شده باشد، پاسخ ریدایرکت
 * (status 301) برمی‌گرداند؛ وگرنه `null`.
 *
 * ریدایرکت در همین لایه (proxy) و قبل از رندر صفحه انجام می‌شود؛
 * پس کاربر بدون هیچ صفحه‌ی واسط، مستقیماً به مقصد منتقل می‌شود.
 * پارامترهای query درخواست هم حفظ می‌شوند.
 */
async function resolveSeoRedirect(
  request: NextRequest,
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  if (!shouldCheckRedirect(pathname)) return null;

  const map = await getRedirectMap();

  const target = map.get(normalizeRedirectPath(pathname));

  if (!target || target.startsWith('//') || target.includes('\\')) return null;

  let targetUrl: URL;
  try {
    targetUrl = new URL(target, request.url);
  } catch {
    return null;
  }

  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
    return null;
  }

  // query درخواست حفظ می‌شود، مگر این که مقصد خودش query داشته باشد
  if (!targetUrl.search && request.nextUrl.search) {
    targetUrl.search = request.nextUrl.search;
  }

  // جلوی حلقه‌ی ریدایرکت (مقصد = همین مسیر) را می‌گیریم
  const sameDestination =
    targetUrl.origin === request.nextUrl.origin &&
    normalizeRedirectPath(targetUrl.pathname) ===
      normalizeRedirectPath(pathname);

  if (sameDestination) return null;

  // 301 = ریدایرکت دائمی؛ یعنی به موتورهای جستجو اعلام می‌شود که آدرس
  // برای همیشه عوض شده و اعتبار (PageRank) به مقصد منتقل می‌شود.
  return NextResponse.redirect(targetUrl, 301);
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── ریدایرکت‌های 301 ثبت‌شده در پنل سئو (قبل از هر منطق دیگر) ──
  const seoRedirect = await resolveSeoRedirect(request);
  if (seoRedirect) return seoRedirect;

  const accessToken = readCookie(request, 'access_token');
  const refreshToken = readCookie(request, 'refresh_token');
  const hasActiveSession =
    isTokenActive(accessToken) || isTokenActive(refreshToken);

  // ── صفحات Auth: کاربرِ دارای توکن فعال نباید وارد شود ──
  if (isAuthRoute(pathname)) {
    if (!hasActiveSession) {
      return NextResponse.next();
    }

    const target = resolveAuthRedirectTarget(request);
    return NextResponse.redirect(new URL(target, request.url));
  }

  // (Optional) redundant because matcher already restricts, but keep for safety
  const isCheckoutRoute = isPathOrChild(pathname, '/checkout');
  const isAdminRoute = isPathOrChild(pathname, '/admin');
  const isDashboardRoute = isPathOrChild(pathname, '/dashboard');

  if (!isAdminRoute && !isDashboardRoute && !isCheckoutRoute) {
    return NextResponse.next();
  }

  const redirectToLogin = () => {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  };

  if (!hasActiveSession) {
    return redirectToLogin();
  }

  const roleArray = getRoles(accessToken);

  if (roleArray.length === 0 && !isTokenActive(refreshToken)) {
    return redirectToLogin();
  }

  if (isCheckoutRoute) {
    return NextResponse.next();
  }

  if (isAdminRoute) {
    const allowedRoles = ['admin', 'seo'];
    const hasAccess = roleArray.some(role => allowedRoles.includes(role));
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * همه‌ی مسیرها به‌جز:
     * - api (روت‌های API)
     * - _next/static (فایل‌های استاتیک)
     * - _next/image (بهینه‌سازی تصویر)
     * - API و مسیرهای داخلی Next.js
     *
     * این catch-all جای matcherهای قبلی (admin/dashboard/checkout/auth) را
     * هم می‌گیرد؛ منطق محدودیت دسترسی داخل خود proxy همان است. فایل‌های
     * استاتیک در تابع shouldCheckRedirect فیلتر می‌شوند تا مسیرهای قدیمی
     * مثل /old-page.html هم قابلیت ریدایرکت داشته باشند.
     */
    '/((?!api|_next).*)',
  ],
};
