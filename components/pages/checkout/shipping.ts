import { ShippingMethod } from '@/services/features/orders/type';

// Fallback while the authoritative checkout preview is loading (toman).
// Must mirror `back/src/order/shipping.ts`.
export const POST_SHIPPING_COST_TOMAN = 250_000;
export const TIPAX_SHIPPING_COST_TOMAN = 250_000;

/**
 * هزینهٔ ثابت و پیش‌پرداختِ هر روش ارسال (تومان).
 * روش‌هایی که اینجا نیستند رایگان (حضوری) یا پس‌کرایه (پیک) هستند.
 */
export const FIXED_SHIPPING_COST_TOMAN: Readonly<
  Partial<Record<ShippingMethod, number>>
> = Object.freeze({
  [ShippingMethod.POST]: POST_SHIPPING_COST_TOMAN,
  [ShippingMethod.TIBAX]: TIPAX_SHIPPING_COST_TOMAN,
});

/** هزینهٔ ثابت روش ارسال؛ برای حضوری/پس‌کرایه صفر. */
export function getFixedShippingCost(shippingMethod?: ShippingMethod): number {
  if (!shippingMethod) return 0;
  return FIXED_SHIPPING_COST_TOMAN[shippingMethod] ?? 0;
}

/** روشی که هزینهٔ ثابت دارد (و پروموشن ارسال رایگان روی آن اثر دارد). */
export function isFixedShippingMethod(shippingMethod?: ShippingMethod): boolean {
  return getFixedShippingCost(shippingMethod) > 0;
}

export function calculateCheckoutShipping(
  items: ReadonlyArray<{
    quantity: number;
    variant: { price: number; discountedPrice?: number };
  }>,
  shippingMethod: ShippingMethod,
  hasSelectedAddress: boolean,
) {
  const shippingCost =
    items.length > 0 && hasSelectedAddress
      ? getFixedShippingCost(shippingMethod)
      : 0;
  return { shippingCost };
}
