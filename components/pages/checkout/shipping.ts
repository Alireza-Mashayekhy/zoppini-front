import { ShippingMethod } from '@/services/features/orders/type';

// Fallback while the authoritative checkout preview is loading (toman).
export const POST_SHIPPING_COST_TOMAN = 250_000;

export function calculateCheckoutShipping(
  items: ReadonlyArray<{
    quantity: number;
    variant: { price: number; discountedPrice?: number };
  }>,
  shippingMethod: ShippingMethod,
  hasSelectedAddress: boolean,
) {
  const shippingCost =
    items.length > 0 &&
    hasSelectedAddress &&
    shippingMethod === ShippingMethod.POST
      ? POST_SHIPPING_COST_TOMAN
      : 0;
  return { shippingCost };
}
