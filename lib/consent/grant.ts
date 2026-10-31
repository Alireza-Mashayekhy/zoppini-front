import { CATEGORY_VERSION, Consent, POLICY } from './policy';

/** Lifetime of a saved choice; must match the signed `zp_consent` cookie. */
export const CONSENT_MAX_AGE_SECONDS = 180 * 86400;

/**
 * Readable (non-HttpOnly) mirror of the marketing decision inside the signed
 * `zp_consent` cookie.
 *
 * The signed cookie is HttpOnly, so page scripts cannot read it while the
 * document is still parsing. The Yektanet gate runs first thing in `<head>`,
 * before the app bundle and before the consent manager has fetched
 * `/privacy/state`, so it needs a decision it can read synchronously.
 *
 * The value is only `1` or absent: it carries no visitor, session or account
 * data, and it is never trusted on its own — the signed cookie stays the source
 * of truth and the route handler rewrites this mirror on every save.
 */
export const MARKETING_FLAG_COOKIE = 'zp_marketing';

/** A stored choice that still matches the current policy and has not expired. */
export function currentConsent(
  value: Consent | null | undefined,
): Consent | null {
  if (!value) return null;
  if (value.policy !== POLICY || value.categories !== CATEGORY_VERSION)
    return null;
  const at = Date.parse(String(value.at));
  return Number.isFinite(at) && Date.now() - at < CONSENT_MAX_AGE_SECONDS * 1000
    ? value
    : null;
}

export function marketingGranted(value: Consent | null | undefined): boolean {
  return currentConsent(value)?.marketing === true;
}

/** Browser-side mirror update; the consent route handler writes the same cookie. */
export function writeMarketingFlag(granted: boolean) {
  if (typeof document === 'undefined') return;
  try {
    const secure =
      typeof location !== 'undefined' && location.protocol === 'https:'
        ? '; Secure'
        : '';
    document.cookie = `${MARKETING_FLAG_COOKIE}=${granted ? '1' : ''}; Path=/; Max-Age=${
      granted ? CONSENT_MAX_AGE_SECONDS : 0
    }; SameSite=Lax${secure}`;
  } catch {
    // Blocked cookies leave the gate closed: Yektanet simply does not load.
  }
}
