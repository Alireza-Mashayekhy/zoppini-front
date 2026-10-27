import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
export function sign(value: object) {
  const secret = process.env.PRIVACY_SIGNING_SECRET;
  if (!secret || secret.length < 32)
    throw new Error('Privacy configuration unavailable');
  const body = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}
export function verify<T>(token?: string): T | null {
  try {
    if (!token || token.length > 2000) return null;
    if (token.split('.').length !== 2) return null;
    const [body, sig] = token.split('.');
    const expected = sign(
      JSON.parse(Buffer.from(body, 'base64url').toString()),
    ).split('.')[1];
    if (
      sig.length !== expected.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    )
      return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch {
    return null;
  }
}
export async function upstream(action: string, data: unknown, token = '') {
  const base = process.env.PRIVACY_API_URL;
  const secret = process.env.PRIVACY_PROXY_SECRET;
  if (!base || !secret || secret.length < 32)
    throw new Error('Privacy configuration unavailable');
  const response = await fetch(`${base.replace(/\/$/, '')}/privacy/${action}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-privacy-proxy': secret,
      'x-analytics-context': token,
    },
    body: JSON.stringify(data),
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('Privacy service unavailable');
}
