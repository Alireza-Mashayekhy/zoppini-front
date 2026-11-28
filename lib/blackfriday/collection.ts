import type { CategoriesResponse } from '@/services/features/categories/types';
import type { ProductsResponse } from '@/services/features/products/type';

import { pruneCategoriesForProducts } from './filtering';
import { selectBlackFridayEligibleProducts } from './products';

/**
 * Pure derivation of the landing collection from the two complete listings.
 *
 * Campaign rules are unchanged (see `selectBlackFridayEligibleProducts`):
 * membership comes from the campaign query, product details from the
 * store-wide sale query; in stock AND (exactly 20% OR campaign member at
 * exactly 70%).
 *
 * The only addition is an expiry guard: when a snapshot is served from the
 * last-known-good cache, a product whose discount has already expired is
 * dropped instead of being shown with an outdated price.
 */

export function discountStillValid(
  product: ProductsResponse,
  now: number,
): boolean {
  const expiresAt = product.discount?.expiresAt;
  if (!expiresAt) return true;
  const time = Date.parse(String(expiresAt));
  return !Number.isFinite(time) || time > now;
}

/** The collection's filter tree only needs id/name/slug/parentId. */
function slimCategories(
  categories: CategoriesResponse[],
): CategoriesResponse[] {
  return categories.map(category => ({ ...category, description: '' }));
}

export type DerivedCollection = {
  campaignProducts: ProductsResponse[];
  eligibleProducts: ProductsResponse[];
  collectionCategories: CategoriesResponse[];
  unavailable: boolean;
};

export function deriveBlackFridayCollection({
  campaignProducts,
  discountedProducts,
  categories,
  now,
}: {
  campaignProducts: ProductsResponse[] | null;
  discountedProducts: ProductsResponse[] | null;
  categories: CategoriesResponse[] | null | undefined;
  now: number;
}): DerivedCollection {
  const campaign = (campaignProducts ?? []).filter(product =>
    discountStillValid(product, now),
  );

  if (campaignProducts === null || discountedProducts === null) {
    return {
      campaignProducts: campaign,
      eligibleProducts: [],
      collectionCategories: [],
      unavailable: true,
    };
  }

  const campaignIds = new Set(campaignProducts.map(product => product.id));
  const eligibleProducts = selectBlackFridayEligibleProducts(
    discountedProducts.filter(product => discountStillValid(product, now)),
    campaignIds,
  );

  return {
    campaignProducts: campaign,
    eligibleProducts,
    collectionCategories: slimCategories(
      pruneCategoriesForProducts(eligibleProducts, categories),
    ),
    unavailable: false,
  };
}
