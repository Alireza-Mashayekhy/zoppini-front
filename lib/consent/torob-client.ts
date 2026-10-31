import { getConsent } from './client';
import { privacyUrl } from './endpoints';

let pending: Promise<void> | null = null;
/** A click is captured only after the marketing choice is available and granted. */
export async function captureTorobClick() {
  if (!getConsent()?.marketing) return;
  const clid = new URLSearchParams(location.search).get('torob_clid');
  if (!clid || !/^[A-Za-z0-9_-]{1,255}$/.test(clid)) return;
  // The entry navigation time remains in memory, even if the consent choice
  // is delayed. For client-side navigation this may be earlier (conservative).
  const clickedAt = Math.floor(performance.timeOrigin);
  if (!Number.isSafeInteger(clickedAt) || clickedAt <= 0) return;
  if (!pending) {
    pending = fetch(privacyUrl('torob-click'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clid, clickedAt }),
    })
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        pending = null;
      });
  }
  await pending;
}
export async function torobAttributionContext(): Promise<string> {
  if (!getConsent()?.marketing) return '';
  await captureTorobClick();
  if (!getConsent()?.marketing) return '';
  try {
    const response = await fetch(privacyUrl('torob-context'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    const data = await response.json();
    return response.ok &&
      getConsent()?.marketing &&
      typeof data.token === 'string'
      ? data.token
      : '';
  } catch {
    return '';
  }
}
