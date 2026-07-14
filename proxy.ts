import { decodeJwt } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const pathname = request.nextUrl.pathname;

  // (Optional) redundant because matcher already restricts, but keep for safety
  if (
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/panel')
  ) {
    return NextResponse.next();
  }

  if (!token && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    let role;
    if (token) {
      const payload = decodeJwt(token);
      role = payload?.role as string | undefined;
    }

    if (!role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (pathname.startsWith('/admin') && !['admin', 'editor'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/panel/:path*'], // add '/dashboard' if needed
};
