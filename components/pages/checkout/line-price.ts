/**
 * قیمت نمایشی هر ردیف در خلاصهٔ سفارش.
 *
 * قاعدهٔ طراحی (تصمیم محصول): ردیف محصول در چک‌اوت باید «قیمت سطح محصول»
 * را نشان دهد؛ یعنی قیمت پس از فروش ویژه/تخفیف محصول، ولی **پیش از**
 * تخفیف‌های سبد. تخفیف پروموشن سبد جداگانه در جمع‌های خلاصه می‌آید و
 * هرگز داخل قیمت ردیف کم نمی‌شود (وگرنه تخفیف دو مفهوم در هم می‌آمیزد).
 *
 * منبع عدد، به ترتیب اولویت:
 * ۱. ردیف پیش‌نمایش سرور (`salePrice`) — همان عددی که لحظهٔ ثبت سفارش
 *    استفاده می‌شود؛
 * ۲. `saleTotal` ردیف سبد (جمع سطح محصول، از سرور)؛
 * ۳. `variant.salePrice` (قیمت واحد سطح محصول، از سرور)؛
 * ۴. بازسازی از قیمت قابل پرداخت: `payableTotal + promotionDiscount` —
 *    چون پرداختی ردیف پس از کسر سهم پروموشن سبد ساخته شده است؛
 * ۵. قیمت فهرست (وقتی هیچ تخفیفی وجود ندارد).
 *
 * هیچ‌کدام از این‌ها محاسبهٔ تخفیف تازه‌ای انجام نمی‌دهد؛ فقط انتخاب
 * منبع درست برای نمایش است.
 */

export interface CheckoutLinePreviewLike {
  originalPrice: number;
  salePrice: number;
}

export interface CheckoutLinePriceInput {
  quantity: number;
  /** قیمت فهرست هر واحد (variant.originalPrice یا variant.price) */
  listUnitPrice: number;
  /** ردیف متناظر در پیش‌نمایش سرور (اگر رسیده باشد) */
  previewLine?: CheckoutLinePreviewLike | null;
  /** جمع ردیف بر پایهٔ قیمت سطح محصول (فیلد سروری) */
  saleTotal?: number | null;
  /** قیمت واحد سطح محصول (فیلد سروری روی variant) */
  variantSaleUnitPrice?: number | null;
  /** جمع ردیف پس از همهٔ تخفیف‌ها (همان چیزی که کارت سبد نشان می‌دهد) */
  payableTotal?: number | null;
  /** سهم تخفیف پروموشن سبد روی این ردیف (تومان) */
  cartPromotionDiscount?: number | null;
  /** ردیف هدیهٔ رایگان */
  isFreeReward?: boolean;
}

export interface CheckoutLinePrice {
  quantity: number;
  /** قیمت فهرست هر واحد */
  listUnitPrice: number;
  /** قیمت هر واحد پس از تخفیف سطح محصول (پیش از پروموشن سبد) */
  unitProductPrice: number;
  /** جمع قیمت فهرست ردیف */
  listTotal: number;
  /** جمع ردیف بر پایهٔ قیمت سطح محصول */
  productTotal: number;
  /** آیا تخفیف سطح محصول واقعاً وجود دارد */
  hasProductDiscount: boolean;
  /** درصد تخفیف سطح محصول (گردشده) یا null */
  productDiscountPercent: number | null;
}

function positive(value: unknown): number | null {
  const numeric = Number(value);

  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
}

export function resolveCheckoutLinePrice({
  quantity,
  listUnitPrice,
  previewLine,
  saleTotal,
  variantSaleUnitPrice,
  payableTotal,
  cartPromotionDiscount,
  isFreeReward = false,
}: CheckoutLinePriceInput): CheckoutLinePrice {
  const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  const listUnit = positive(listUnitPrice) ?? 0;
  const listTotal = listUnit * qty;

  const previewSale = positive(previewLine?.salePrice);
  const serverSaleTotal = positive(saleTotal);
  const variantSale = positive(variantSaleUnitPrice);
  const payable = positive(payableTotal);
  const cartDiscount = positive(cartPromotionDiscount) ?? 0;

  let unitProductPrice: number;

  if (isFreeReward) {
    unitProductPrice = 0;
  } else if (previewSale !== null) {
    unitProductPrice = previewSale;
  } else if (serverSaleTotal !== null) {
    unitProductPrice = serverSaleTotal / qty;
  } else if (variantSale !== null) {
    unitProductPrice = variantSale;
  } else if (payable !== null) {
    /*
     * پرداختی ردیف + سهم پروموشن سبد = قیمت سطح محصول.
     * وقتی پروموشن سبدی در کار نیست، همین جمع با پرداختی برابر است.
     */
    unitProductPrice = (payable + cartDiscount) / qty;
  } else {
    unitProductPrice = listUnit;
  }

  const productTotal = unitProductPrice * qty;
  const hasProductDiscount = listTotal > 0 && productTotal < listTotal;

  return {
    quantity: qty,
    listUnitPrice: listUnit,
    unitProductPrice,
    listTotal,
    productTotal,
    hasProductDiscount,
    productDiscountPercent: hasProductDiscount
      ? Math.round((1 - productTotal / listTotal) * 100)
      : null,
  };
}
