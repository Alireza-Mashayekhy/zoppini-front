import type { ProductsResponse } from '@/services/features/products/type';

/**
 * Drop long SEO/editorial text the landing never reads.
 *
 * Every product returned by the listing endpoints embeds its full category
 * objects, including the category SEO article (the Black Friday category's
 * description alone is ~8 KB and repeats on every campaign product). The
 * landing used to keep all of it in memory and serialize it into the page
 * payload for every eligible product.
 *
 * Kept: everything the product card, filters, sorting, eligibility and
 * category tree use (id, title, slug, image, createdAt, categories' id/name/
 * slug/parentId, variants with color/size/price/stock, colorImages, discount,
 * promotion badges). Nothing the shared product card renders is removed.
 */
export function slimProductForListing(
  product: ProductsResponse,
): ProductsResponse {
  if (!product || typeof product !== 'object') return product;

  const {
    description: _description,
    careInstructionsHtml: _careInstructionsHtml,
    suggestedProducts: _suggestedProducts,
    sameColorProducts: _sameColorProducts,
    ...rest
  } = product as ProductsResponse & {
    careInstructionsHtml?: unknown;
    suggestedProducts?: unknown;
    sameColorProducts?: unknown;
  };

  return {
    ...rest,
    description: '',
    categories: (product.categories ?? []).map(category => {
      if (!category || typeof category !== 'object') return category;
      const {
        description: _categoryDescription,
        secondImages: _secondImages,
        ...categoryRest
      } = category as typeof category & { secondImages?: unknown };
      return { ...categoryRest, description: '' } as typeof category;
    }),
  } as ProductsResponse;
}
