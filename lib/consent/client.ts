import { privacyUrl } from './endpoints';
import { Consent } from './policy';
let current: Consent | null = null;
export function getConsent() {
  return current;
}
export function setConsent(value: Consent | null) {
  current = value;
  window.dispatchEvent(new Event('privacy-changed'));
}
export function preferencesAllowed() {
  return !!current?.preferences;
}
export async function analyticsContext() {
  if (!current?.analytics) return '';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const r = await fetch(privacyUrl('context'), {
      signal: controller.signal,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    const d = await r.json();
    return r.ok && current?.analytics ? (d.token as string) : '';
  } catch {
    return '';
  } finally {
    clearTimeout(timeout);
  }
}
let pending: Promise<unknown> = Promise.resolve();
export async function track(
  name: string,
  fields: { product?: number; variant?: number; category?: number } = {},
) {
  if (
    !current?.analytics ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/dashboard')
  )
    return;
  const params = new URLSearchParams(location.search);
  const campaign: Record<string, string> = {};
  // Drop IDs, numbers, punctuation and potential contact values; never transmit raw URL.
  for (const [key, target] of [
    ['utm_source', 'source'],
    ['utm_medium', 'medium'],
    ['utm_campaign', 'campaign'],
  ]) {
    const v = params.get(key);
    const allowed =
      target === 'source'
        ? 'google,bing,instagram,telegram,direct,newsletter,torob'
        : target === 'medium'
          ? 'organic,cpc,social,email,referral'
          : process.env.NEXT_PUBLIC_ANALYTICS_CAMPAIGNS || '';
    if (
      v &&
      /^[a-zA-Z][a-zA-Z_-]{0,63}$/.test(v) &&
      allowed.split(',').includes(v)
    )
      campaign[target] = v;
  }
  let referrer: string | undefined;
  try {
    referrer = new URL(document.referrer).hostname;
  } catch {}
  const device =
    window.innerWidth < 768
      ? 'mobile'
      : window.innerWidth < 1024
        ? 'tablet'
        : 'desktop';
  const selection = current.at;
  const body = JSON.stringify({
    id: crypto.randomUUID(),
    name,
    ...fields,
    ...campaign,
    referrer,
    device,
  });
  pending = pending
    .catch(() => {})
    .then(async () => {
      if (!current?.analytics || current.at !== selection) return;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        await fetch(privacyUrl('event'), {
          signal: controller.signal,
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
        });
      } catch {} finally { clearTimeout(timeout); }
    });
  await pending;
}
export function cleanOptionalStorage() {
  try {
    for (const k of Object.keys(sessionStorage))
      if (k.startsWith('visit_tracked_')) sessionStorage.removeItem(k);
    for (const k of ['zoppini-compare-items', 'pwa-dismissed'])
      if (!current?.preferences) localStorage.removeItem(k);
    for (const k of Object.keys(localStorage))
      if (k.startsWith('goftino_')) localStorage.removeItem(k);
  } catch {}
  for (const item of document.cookie.split(';')) {
    const name = item.split('=')[0].trim();
    if (
      (!current?.analytics && /^(_ga|_gid|_gat)/.test(name)) ||
      (!current?.preferences && name === 'sidebar_state')
    ) {
      const domains = [
        '',
        location.hostname,
        ...location.hostname
          .split('.')
          .map((_, i, a) => '.' + a.slice(i).join('.'))
          .filter(d => d.split('.').length > 2),
      ];
      for (const domain of domains)
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`;
    }
  }
}
