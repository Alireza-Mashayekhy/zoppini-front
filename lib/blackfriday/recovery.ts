import type { CategoriesResponse } from '@/services/features/categories/types';
import type { ProductsResponse } from '@/services/features/products/type';

/**
 * Pure rules for the landing collection's client-side recovery.
 *
 * The server render may report the collection as unavailable (backend
 * failure with no last-known-good snapshot yet). Instead of leaving the
 * section at "0 products" until a manual full-page reload, the client asks
 * `/landing/blackfriday/products` again with backoff.
 */

/** Same-origin endpoint served by Next (see app/landing/blackfriday/products). */
export const RECOVERY_ENDPOINT = '/landing/blackfriday/products';

/** Delay before each attempt; the first one runs immediately. */
export const RECOVERY_DELAYS_MS = [0, 2_000, 5_000, 10_000, 20_000] as const;

/** Per-attempt timeout. */
export const RECOVERY_TIMEOUT_MS = 30_000;

export type RecoveryPayload = {
  products: ProductsResponse[];
  categories: CategoriesResponse[];
  unavailable: boolean;
  state?: string;
  fetchedAt?: number | null;
};

/** Validate an untrusted JSON body; anything malformed counts as a failure. */
export function parseRecoveryPayload(body: unknown): RecoveryPayload | null {
  if (!body || typeof body !== 'object') return null;
  const candidate = body as Partial<RecoveryPayload>;
  if (!Array.isArray(candidate.products)) return null;
  return {
    products: candidate.products,
    categories: Array.isArray(candidate.categories) ? candidate.categories : [],
    unavailable: candidate.unavailable === true,
    state: typeof candidate.state === 'string' ? candidate.state : undefined,
    fetchedAt:
      typeof candidate.fetchedAt === 'number' ? candidate.fetchedAt : null,
  };
}

/**
 * Should this response replace what is on screen?
 *
 * - An "unavailable" response never replaces anything.
 * - A non-empty eligible list always wins.
 * - An empty list is only accepted when nothing valid is displayed (an
 *   authoritative "no eligible products"); it never wipes a valid list.
 */
export function shouldAcceptRecovery(
  current: ProductsResponse[],
  payload: RecoveryPayload | null,
): boolean {
  if (!payload || payload.unavailable) return false;
  if (payload.products.length > 0) return true;
  return current.length === 0;
}
