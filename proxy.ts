import { decodeJwt } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const pathname = request.nextUrl.pathname;

  // (Optional) redundant because matcher already restricts, but keep for safety
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  if (!token && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
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

    if (
      pathname === '/login' ||
      pathname === '/login-with-pass' ||
      pathname === '/sign-up' ||
      pathname === '/forgot-pass'
    ) {
      return NextResponse.redirect(new URL('/home', request.url));
    }

    if (pathname.startsWith('/admin')) {
      const allowedRoles = ['admin'];
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
  matcher: ['/admin/:path*', '/dashboard/:path*'], // add '/dashboard' if needed
};
