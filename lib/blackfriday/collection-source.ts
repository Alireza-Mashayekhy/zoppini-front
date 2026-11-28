import 'server-only';

import { getAllCategories } from '@/services/features/categories/server.api';
import type { CategoriesResponse } from '@/services/features/categories/types';
import type { ProductsResponse } from '@/services/features/products/type';

import { resolveStoreTopCategories } from './campaign';
import {
  type CatalogScanResult,
  loadBlackFridayCatalog,
  loadDiscountedProducts,
} from './catalog';
import { deriveBlackFridayCollection } from './collection';
import {
  createSnapshotStore,
  type SnapshotState,
  type SnapshotStore,
} from './snapshot-store';

/**
 * Single source of Black Friday product data for the landing page and its
 * client-side recovery endpoint.
 *
 * Both listings come from the website's own product database through the
 * same public endpoints the storefront uses (`/products` — the category
 * archive's endpoint — and `/products/discounted`). Nothing here talks to
 * Rahkaran; Rahkaran only feeds stock into that database (daily sync, admin
 * per-product sync) and orders decrement stock locally.
 *
 * Freshness: a snapshot is reused for up to 60 s, then served stale while a
 * single background refresh runs; if refreshes keep failing the last good
 * snapshot is served for up to 15 minutes. Prices/stock are re-validated by
 * the cart and checkout as everywhere else in the store.
 */

const FRESH_MS = 60_000;
const MAX_STALE_MS = 15 * 60_000;

const sizeOf = (result: CatalogScanResult) => result.products.length;

type BlackFridayStores = {
  campaign: SnapshotStore<CatalogScanResult>;
  discounted: SnapshotStore<CatalogScanResult>;
};

/**
 * Process-wide singletons. Kept on `globalThis` on purpose: Next bundles the
 * page and the recovery route handler separately, and plain module-level
 * state would give each its own store (separate snapshots, duplicate scans,
 * and a page that cannot see data the route already loaded).
 */
const STORES_KEY = Symbol.for('zoppini.blackfriday.collectionStores');

function stores(): BlackFridayStores {
  const registry = globalThis as typeof globalThis & {
    [STORES_KEY]?: BlackFridayStores;
  };
  registry[STORES_KEY] ??= {
    campaign: createSnapshotStore<CatalogScanResult>({
      name: 'campaign catalog (category 137)',
      load: () => loadBlackFridayCatalog(),
      size: sizeOf,
      freshMs: FRESH_MS,
      maxStaleMs: MAX_STALE_MS,
    }),
    discounted: createSnapshotStore<CatalogScanResult>({
      name: 'discounted catalog',
      load: () => loadDiscountedProducts(),
      size: sizeOf,
      freshMs: FRESH_MS,
      maxStaleMs: MAX_STALE_MS,
    }),
  };
  return registry[STORES_KEY];
}

export type BlackFridayCollectionData = {
  /** whole campaign category, for "biggest discounts" */
  campaignProducts: ProductsResponse[];
  /** eligible products for the collection (70% members + 20% store-wide) */
  eligibleProducts: ProductsResponse[];
  /** pruned category tree for the collection's filters */
  collectionCategories: CategoriesResponse[];
  /** full category list (nav tiles, top categories) */
  categories: CategoriesResponse[] | undefined;
  topCategories: ReturnType<typeof resolveStoreTopCategories>;
  /** true when the eligible set could not be computed at all */
  unavailable: boolean;
  state: SnapshotState;
  fetchedAt: number | null;
};

function combinedState(states: SnapshotState[]): SnapshotState {
  if (states.includes('unavailable')) return 'unavailable';
  if (states.includes('stale')) return 'stale';
  return 'fresh';
}

/**
 * How long a render may wait for a cold (no snapshot) load. The page uses a
 * short budget so HTML is never held hostage by a slow backend — the
 * collection then shows its loading state and recovers client-side from the
 * same in-flight load. The recovery endpoint can wait longer.
 */
export const PAGE_COLD_WAIT_MS = 12_000;
export const RECOVERY_COLD_WAIT_MS = 25_000;

export async function getBlackFridayCollectionData({
  maxWaitMs = PAGE_COLD_WAIT_MS,
}: { maxWaitMs?: number } = {}): Promise<BlackFridayCollectionData> {
  const [campaign, discounted, categoriesResponse] = await Promise.all([
    stores().campaign.read({ maxWaitMs }),
    stores().discounted.read({ maxWaitMs }),
    getAllCategories().catch(error => {
      console.error('[blackfriday:collection] categories request failed', error);
      return null;
    }),
  ]);

  const categories = categoriesResponse?.data;
  const derived = deriveBlackFridayCollection({
    campaignProducts: campaign.value?.products ?? null,
    discountedProducts: discounted.value?.products ?? null,
    categories,
    now: Date.now(),
  });

  if (derived.unavailable) {
    console.error(
      `[blackfriday:collection] eligible products unavailable (campaign: ${campaign.state}${
        campaign.error ? ` – ${campaign.error}` : ''
      }, discounted: ${discounted.state}${
        discounted.error ? ` – ${discounted.error}` : ''
      })`,
    );
  } else if (
    derived.eligibleProducts.length === 0 &&
    (campaign.value?.products.length ?? 0) > 0
  ) {
    console.warn(
      `[blackfriday:collection] 0 eligible products although the campaign category has ${campaign.value?.products.length} in-stock products and the sale scope has ${discounted.value?.products.length}`,
    );
  }

  const timestamps = [campaign.fetchedAt, discounted.fetchedAt].filter(
    (value): value is number => value !== null,
  );

  return {
    campaignProducts: derived.campaignProducts,
    eligibleProducts: derived.eligibleProducts,
    collectionCategories: derived.collectionCategories,
    categories,
    topCategories: resolveStoreTopCategories(categories),
    unavailable: derived.unavailable,
    state: combinedState([campaign.state, discounted.state]),
    fetchedAt: timestamps.length ? Math.min(...timestamps) : null,
  };
}
