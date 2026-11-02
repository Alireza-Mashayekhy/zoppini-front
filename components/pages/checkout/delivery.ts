import { ShippingMethod } from '@/services/features/orders/type';

/**
 * منطق «نحوه دریافت» در تکمیل سفارش.
 *
 * هیچ فیلد جدیدی به فرم/API اضافه نمیشود: همان `shippingMethod` تک منبع
 * حقیقت است (`pickup` یعنی دریافت حضوری، بقیه یعنی ارسال). بنابراین سفارشهای
 * ثبتشده، پنل ادمین و محاسبه هزینه ارسال دستنخورده میمانند و فقط چیدمان
 * فرانت عوض میشود.
 */
export type DeliveryType = 'pickup' | 'delivery';

export const DEFAULT_DELIVERY_METHOD = ShippingMethod.POST;

export function getDeliveryType(method: ShippingMethod): DeliveryType {
  return method === ShippingMethod.PICKUP ? 'pickup' : 'delivery';
}

/**
 * روشهای قابل نمایش در شاخه «ارسال». گزینه حضوری اینجا تکرار نمیشود و پیک
 * فقط برای آدرس تهران در دسترس است (همان قانون قبلی).
 */
export function getDeliveryMethods(cityName?: string): ShippingMethod[] {
  const methods = [ShippingMethod.POST, ShippingMethod.TIBAX];
  if (cityName === 'تهران') methods.push(ShippingMethod.COURIER);
  return methods;
}

/**
 * هنگام برگشت از «دریافت حضوری» آخرین روش ارسال کاربر حفظ میشود. اگر آن روش
 * دیگر برای آدرس فعلی معتبر نباشد (مثلاً پیک برای شهر غیرتهران)، به پست برمیگردد.
 */
export function restoreDeliveryMethod(
  lastMethod: ShippingMethod,
  available: readonly ShippingMethod[],
): ShippingMethod {
  return available.includes(lastMethod)
    ? lastMethod
    : DEFAULT_DELIVERY_METHOD;
}

/**
 * شرط فعال بودن دکمه ثبت سفارش. دریافت حضوری آدرس لازم ندارد، ولی همچنان
 * به انتخاب درگاه (یا پوشش کامل کیف پول) نیاز دارد.
 */
export function isCheckoutSubmittable({
  isPickup,
  hasSelectedAddress,
  hasGateway,
  walletFullyCovers,
}: {
  isPickup: boolean;
  hasSelectedAddress: boolean;
  hasGateway: boolean;
  walletFullyCovers: boolean;
}): boolean {
  const deliveryReady = isPickup || hasSelectedAddress;
  const paymentReady = walletFullyCovers || hasGateway;
  return deliveryReady && paymentReady;
}
