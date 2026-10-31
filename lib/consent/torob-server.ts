import 'server-only';

import { createHmac } from 'node:crypto';

const sevenDays = 7 * 24 * 60 * 60 * 1000;
const clidPattern = /^[A-Za-z0-9_-]{1,255}$/;

function secret() {
  const value = process.env.TOROB_ATTRIBUTION_SECRET;
  if (!value || value.length < 32)
    throw new Error('Torob attribution is not configured');
  return value;
}

// Stable for a signed consent choice, even when multiple tabs capture at once.
export function grantForConsent(consentCookie: string) {
  const bytes = createHmac('sha256', secret())
    .update(`grant:${consentCookie}`)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function validClid(clid: unknown): clid is string {
  return typeof clid === 'string' && clidPattern.test(clid);
}
export function signTorobClick(
  grantId: string,
  clid: string,
  clickedAt: number,
) {
  const body = Buffer.from(
    JSON.stringify({ purpose: 'torob-click', grantId, clid, clickedAt }),
  ).toString('base64url');
  return `${body}.${createHmac('sha256', secret()).update(body).digest('base64url')}`;
}
export function validClickTime(clickedAt: unknown) {
  return (
    typeof clickedAt === 'number' &&
    Number.isSafeInteger(clickedAt) &&
    clickedAt <= Date.now() &&
    Date.now() - clickedAt < sevenDays
  );
}
export async function torobGrant(
  action: 'register' | 'revoke',
  grantId: string,
) {
  const base = process.env.PRIVACY_API_URL;
  if (!base) throw new Error('Torob attribution is not configured');
  const response = await fetch(
    `${base.replace(/\/$/, '')}/torob/internal/attribution`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-torob-internal-secret': secret(),
      },
      body: JSON.stringify({ action, grantId }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    },
  );
  if (!response.ok) throw new Error('Torob attribution service unavailable');
}
