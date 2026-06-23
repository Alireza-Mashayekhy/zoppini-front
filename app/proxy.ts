import { decodeJwt } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const pathname = request.nextUrl.pathname;

  // چون matcher فقط روی /admin و /panel اجرا می‌شود،
  // دیگر نیازی به بررسی مجدد نیست، اما برای اطمینان می‌گذاریم
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/panel')) {
    return NextResponse.next();
  }

  // بدون توکن → لاگین
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = decodeJwt(token);
    const role = payload?.role as string | undefined;

    if (!role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // دسترسی به /admin فقط برای نقش‌های admin و editor
    if (pathname.startsWith('/admin') && !['admin', 'editor'].includes(role)) {
      return NextResponse.redirect(new URL('/panel', request.url));
    }

    // /panel برای هر کاربر لاگین‌شده‌ای مجاز است
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// فقط مسیرهای admin و panel تحت تأثیر middleware قرار می‌گیرند
export const config = {
  matcher: ['/admin/:path*', '/panel/:path*'],
};
