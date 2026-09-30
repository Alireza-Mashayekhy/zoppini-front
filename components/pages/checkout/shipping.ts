import { ShippingMethod } from '@/services/features/orders/type';

export const FREE_SHIPPING_THRESHOLD = 10_000_000; // تومان

/** The order API uses variant.price × quantity before coupon discounts. */
export function calculateCheckoutShipping(
  items: ReadonlyArray<{ quantity: number; variant: { price: number } }>,
  shippingMethod: ShippingMethod,
  hasSelectedAddress: boolean,
) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.variant.price) * item.quantity,
    0,
  );
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCost =
    hasSelectedAddress &&
    shippingMethod === ShippingMethod.POST &&
    !isFreeShipping
      ? 170000
      : 0;

  return { isFreeShipping, shippingCost };
}
