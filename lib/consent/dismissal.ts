/**
 * Whether the visitor closed the consent bar without choosing.
 *
 * Dismissal is deliberately *not* a consent decision and is never written to
 * `zp_consent`: closing the bar leaves the site with necessary cookies only.
 * It is remembered for the current browsing session so the bar does not nag on
 * every navigation or reload, and the visitor is asked again in a new session.
 */
export const DISMISS_KEY = 'zoppini-consent-dismissed';

export function consentDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function rememberConsentDismissal() {
  try {
    sessionStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // Private mode without storage: the bar simply shows again on next load.
  }
}

export function forgetConsentDismissal() {
  try {
    sessionStorage.removeItem(DISMISS_KEY);
  } catch {}
}
