export const AUTH_ROUTES = [
  '/login',
  '/login-with-pass',
  '/sign-up',
  '/forgot-pass',
];

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function sanitizeCallbackUrl(
  callbackUrl: string | null | undefined,
): string | null {
  if (!callbackUrl) return null;
  if (!callbackUrl.startsWith('/')) return null;
  if (callbackUrl.startsWith('//') || callbackUrl.startsWith('/\\'))
    return null;

  const targetPath = callbackUrl.split('?')[0].split('#')[0];
  if (isAuthRoute(targetPath)) return null;

  return callbackUrl;
}

export function withCallbackUrl(
  path: string,
  callbackUrl: string | null | undefined,
): string {
  const safe = sanitizeCallbackUrl(callbackUrl);
  if (!safe) return path;

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}callbackUrl=${encodeURIComponent(safe)}`;
}
