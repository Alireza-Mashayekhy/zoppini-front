import { decodeJwt } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

export default function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const pathname = request.nextUrl.pathname;

  // (Optional) redundant because matcher already restricts, but keep for safety
  const isCheckoutRoute =
    pathname === '/checkout' || pathname.startsWith('/checkout/');
  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');

  if (!isAdminRoute && !isDashboardRoute && !isCheckoutRoute) {
    return NextResponse.next();
  }

  if (!token && !refreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    let roleArray: string[] = [];
    if (token) {
      const payload = decodeJwt(token);
      const roles = payload?.roles as string[] | string | undefined;

      if (Array.isArray(roles)) {
        roleArray = roles;
      } else if (typeof roles === 'string') {
        roleArray = [roles];
      }
    }

    if (roleArray.length === 0 && !refreshToken) {
      return NextResponse.redirect(new URL('/login', request.url));
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
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/checkout',
    '/checkout/:path*',
  ],
};
