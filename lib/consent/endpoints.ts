/**
 * Browser-facing consent endpoints (served by the Next.js BFF).
 *
 * IMPORTANT: these must NOT live under `/api`. In production the reverse proxy
 * forwards `/api/*` to the Nest backend, which owns `/api/privacy/*` for the
 * service-to-service ingestion and expects a completely different payload
 * (`id`, `policy`, `changed`, `withdrawn`, plus the proxy secret). A browser
 * request to `/api/privacy/consent` never reaches this app's route handler and
 * is rejected by the backend DTO with HTTP 400.
 */
export const PRIVACY_BASE_PATH = '/privacy';

export type PrivacyAction = 'state' | 'consent' | 'context' | 'event';

export const privacyUrl = (action: PrivacyAction): string =>
  `${PRIVACY_BASE_PATH}/${action}`;
