/** Keep the /api prefix and accept environment URLs with or without a trailing slash. */
export function normalizeApiBaseUrl(baseUrl: string): string {
  return `${baseUrl.trim().replace(/\/+$/, '')}/`;
}
