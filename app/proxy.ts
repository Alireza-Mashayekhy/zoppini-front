import { decodeJwt } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;

  const pathname = request.nextUrl.pathname;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = decodeJwt(token);

    const role = payload.role as string;

    if (
      pathname.startsWith('/admin') &&
      role !== 'admin' &&
      role !== 'editor'
    ) {
      return NextResponse.redirect(new URL('/panel', request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
