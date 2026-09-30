import { decodeJwt } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

import { isAuthRoute, sanitizeCallbackUrl } from './lib/callback-url';

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

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

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
  const isCheckoutRoute =
    pathname === '/checkout' || pathname.startsWith('/checkout/');
  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');

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
    '/admin/:path*',
    '/dashboard/:path*',
    '/checkout',
    '/checkout/:path*',

    '/login',
    '/login-with-pass',
    '/sign-up',
    '/forgot-pass',
  ],
};
