import 'server-only';

import { randomUUID } from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';

import { CATEGORY_VERSION, Consent, POLICY } from '@/lib/consent/policy';
import { allowRequest, readLimitedBody } from '@/lib/consent/rate-limit';
import { sign, upstream, verify } from '@/lib/consent/server';

const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
const age = 180 * 86400;
type Context = {
  visitor: string;
  session: string;
  exp: number;
  policy: string;
  categories: string;
};
function consent(req: NextRequest) {
  const c = verify<Consent>(req.cookies.get('zp_consent')?.value);
  return c?.policy === POLICY &&
    c.categories === CATEGORY_VERSION &&
    Date.now() - Date.parse(c.at) < age * 1000
    ? c
    : null;
}
function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
/**
 * Explicit same-origin CSRF boundary. Behind the production reverse proxy
 * `req.nextUrl.origin` can be an internal `http://host`, while the browser
 * sends the public `https://host` origin. Derive the public origin from the
 * forwarded headers (set by our own proxy) and from PRIVACY_SITE_ORIGIN;
 * never accept an unrelated third-party origin.
 */
function allowedOrigins(req: NextRequest) {
  const origins = new Set<string>([req.nextUrl.origin]);
  const configured = process.env.PRIVACY_SITE_ORIGIN?.replace(/\/$/, '');
  if (configured) origins.add(configured);
  const host =
    req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    req.headers.get('host');
  const protocol =
    req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    req.nextUrl.protocol.replace(':', '');
  if (host && /^[a-z][a-z0-9+.-]*$/i.test(protocol))
    origins.add(`${protocol}://${host}`);
  return origins;
}
export async function handlePrivacyGet(req: NextRequest, action: string) {
  if (action !== 'state') return json({}, 404);
  return json({ consent: consent(req) });
}
export async function handlePrivacyPost(req: NextRequest, action: string) {
  // No cookies/auth are forwarded to the analytics backend.
  const origin = req.headers.get('origin')?.replace(/\/$/, '');
  if (!origin || !allowedOrigins(req).has(origin)) return json({}, 403);
  if (Number(req.headers.get('content-length') || 0) > 4096)
    return json({}, 413);
  if (
    !allowRequest(
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
      action,
    )
  )
    return json({}, 429);
  try {
    const text = await readLimitedBody(req);
    if (Buffer.byteLength(text) > 4096) return json({}, 413);
    const d = JSON.parse(text);
    const c = consent(req);
    const old = verify<Context>(req.cookies.get('zp_analytics')?.value);
    const previousVisitor = verify<{ visitor: string }>(
      req.cookies.get('zp_visitor')?.value,
    );
    if (action === 'consent') {
      if (
        Object.keys(d).some(
          k => !['preferences', 'analytics', 'marketing', 'choice'].includes(k),
        ) ||
        !['all', 'reject', 'custom'].includes(d.choice) ||
        ['preferences', 'analytics', 'marketing'].some(
          k => typeof d[k] !== 'boolean',
        )
      )
        return json({}, 400);
      const next: Consent = {
        preferences: d.preferences,
        analytics: d.analytics,
        marketing: d.marketing,
        policy: POLICY,
        categories: CATEGORY_VERSION,
        at: new Date().toISOString(),
      };
      const visitor = d.analytics ? randomUUID() : undefined;
      // Ledger must succeed even for rejection; no behavior IDs are stored in ledger.
      await upstream('consent', {
        id: randomUUID(),
        policy: POLICY,
        preferences: d.preferences,
        analytics: d.analytics,
        marketing: d.marketing,
        choice: d.choice,
        changed: !!c,
        withdrawn:
          !!c &&
          ((c.analytics && !d.analytics) ||
            (c.preferences && !d.preferences) ||
            (c.marketing && !d.marketing)),
        oldVisitor: previousVisitor?.visitor,
        visitor,
      });
      const res = json({ consent: next });
      res.cookies.set('zp_consent', sign(next), { ...options, maxAge: age });
      res.cookies.set('zp_visitor', visitor ? sign({ visitor }) : '', {
        ...options,
        maxAge: visitor ? age : 0,
      });
      res.cookies.set('zp_analytics', '', { ...options, maxAge: 0 });
      return res;
    }
    if (!c?.analytics) return json({}, 403);
    const v = verify<{ visitor: string }>(req.cookies.get('zp_visitor')?.value);
    if (!v) return json({}, 403);
    const current: Context =
      old &&
      old.visitor === v.visitor &&
      old.exp > Date.now() &&
      old.policy === POLICY &&
      old.categories === CATEGORY_VERSION
        ? old
        : {
            visitor: v.visitor,
            session: randomUUID(),
            exp: Date.now() + 1800000,
            policy: POLICY,
            categories: CATEGORY_VERSION,
          };
    const token = sign(current);
    if (action === 'context') {
      const res = json({ token });
      res.cookies.set('zp_analytics', token, { ...options, maxAge: 1800 });
      return res;
    }
    if (action !== 'event') return json({}, 404);
    await upstream('event', d, token);
    const res = json({ saved: true });
    res.cookies.set('zp_analytics', token, {
      ...options,
      maxAge: Math.max(1, Math.floor((current.exp - Date.now()) / 1000)),
    });
    return res;
  } catch (error) {
    // Keep a generic message for visitors, but make a missing server-side
    // configuration distinguishable from an upstream/network failure.
    const misconfigured =
      error instanceof Error &&
      error.message === 'Privacy configuration unavailable';
    const res = json(
      {
        message: misconfigured
          ? 'سرویس رضایت پیکربندی نشده است.'
          : 'ثبت انتخاب یا رویداد ممکن نشد؛ دوباره تلاش کنید.',
        code: misconfigured ? 'privacy_not_configured' : 'privacy_unavailable',
      },
      503,
    );
    // Failure must not silently restore a previous opt-in on the next visit.
    if (action === 'consent')
      for (const name of ['zp_consent', 'zp_visitor', 'zp_analytics'])
        res.cookies.set(name, '', { ...options, maxAge: 0 });
    return res;
  }
}
