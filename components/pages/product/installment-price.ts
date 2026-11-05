import type { VariantResponse } from '@/services/features/products/type';

/** Price of one selected variant, after its product discount (in toman). */
export function selectedProductPrice(
  variants: VariantResponse[] | undefined,
  colorId: number | undefined,
  sizeId: number | undefined,
): number | null {
  const variant = variants?.find(
    item => item.color?.id === colorId && item.size?.id === sizeId,
  );
  if (!variant) return null;
  const price = Number(variant.discountedPrice ?? variant.price);
  return Number.isFinite(price) && price > 0 ? price : null;
}

/** The actual payment schedule is determined by the provider at checkout. */
export function formatInstallment(price: number): string {
  return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 4 }).format(
    price / 4,
  );
}
