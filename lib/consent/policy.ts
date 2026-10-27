export const POLICY = '2026-10-27.2';
export const CATEGORY_VERSION = 'necessary,preferences,analytics,marketing';
export type Selection = {
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
};
export type Consent = Selection & {
  policy: string;
  categories: string;
  at: string;
};
export const denied: Selection = {
  preferences: false,
  analytics: false,
  marketing: false,
};
/** Strip server metadata before sending a selection back to the privacy BFF. */
export function toSelection(value: Selection | null | undefined): Selection {
  return value
    ? {
        preferences: value.preferences,
        analytics: value.analytics,
        marketing: value.marketing,
      }
    : denied;
}
