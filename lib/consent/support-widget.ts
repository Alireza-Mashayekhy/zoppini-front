import { getConsent } from './client';
import { CATEGORY_VERSION, POLICY } from './policy';

/** Public-layout only. Never pass account, analytics IDs or cookies to the SDK. */
export function loadSupportWidget(): HTMLScriptElement | null {
  const consent = getConsent();
  if (
    !consent?.preferences ||
    consent.policy !== POLICY ||
    consent.categories !== CATEGORY_VERSION
  )
    return null;

  const existing = document.getElementById('ramonai-widget');
  if (existing) return existing as HTMLScriptElement;

  const script = document.createElement('script');
  script.id = 'ramonai-widget';
  script.src = 'https://statics.ramonai.info/js/ramonai-widget.js';
  script.async = true;
  script.setAttribute('data-shop-name', 'زوپینی');
  document.body.appendChild(script);
  // Permit another attempt on a later consent notification if loading failed.
  script.addEventListener('error', () => script.remove(), { once: true });
  return script;
}
