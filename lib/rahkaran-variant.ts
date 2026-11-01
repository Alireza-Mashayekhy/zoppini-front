import { normalizeSku } from './sku';

/** واریانت قابل ویرایش در مودال محصول */
export type EditableVariant = {
  id?: number;
  colorId: string;
  sizeId: string;
  price: number;
  stock: number;
  sku?: string;
};

/** واریانتی که از راهکاران آمده و هنوز ذخیره نشده */
export type PendingVariant = {
  sizeId: string;
  price: number;
  stock: number;
  sku: string;
};

export type IncomingVariant = {
  /** بارکد کالا در راهکاران — همان SKU واریانت */
  productNumber: string;
  /** قیمت به تومان */
  price: number;
  /** موجودی مجموع انبارها */
  stock: number;
};

export type IncomingVariantResolution = {
  /** واریانت‌های محصول بعد از اعمال کالای راهکاران */
  variants: EditableVariant[];
  /** واریانت‌های جدیدی که باید بعد از انتخاب سایز ذخیره شوند */
  pendingVariants: PendingVariant[];
  /** اگر کالا از قبل روی همین محصول بود، سایز و شناسه همان واریانت */
  linked: { sizeId: string; variantId?: number } | null;
};

/**
 * تصمیم می‌گیرد کالای انتخاب‌شده از راهکاران چه بلایی سر محصول بیاورد:
 *
 * 1. اگر همین SKU از قبل روی یکی از واریانت‌های این محصول نشسته باشد،
 *    واریانت جدید ساخته نمی‌شود؛ فقط قیمت و موجودی همان واریانت
 *    با مقادیر راهکاران به‌روزرسانی می‌شود (ادمین بعد از بازبینی ذخیره می‌کند).
 *
 * 2. اگر SKU جدید باشد، یک واریانت در انتظار ساخته می‌شود که بعد از
 *    انتخاب سایز و ذخیره، به واریانت‌های محصول اضافه می‌شود.
 */
export function resolveIncomingVariant(
  existingVariants: EditableVariant[],
  incoming: IncomingVariant | null | undefined,
): IncomingVariantResolution {
  if (!incoming) {
    return {
      variants: existingVariants,
      pendingVariants: [],
      linked: null,
    };
  }

  const incomingSku = normalizeSku(incoming.productNumber);

  const matchedVariant = incomingSku
    ? existingVariants.find(
        variant => normalizeSku(variant.sku) === incomingSku,
      )
    : undefined;

  if (matchedVariant) {
    return {
      variants: existingVariants.map(variant =>
        variant === matchedVariant
          ? {
              ...variant,
              price: incoming.price,
              stock: incoming.stock,
              sku: incoming.productNumber,
            }
          : variant,
      ),
      pendingVariants: [],
      linked: {
        sizeId: matchedVariant.sizeId,
        variantId: matchedVariant.id,
      },
    };
  }

  return {
    variants: existingVariants,
    pendingVariants: [
      {
        sizeId: '',
        price: incoming.price,
        stock: incoming.stock,
        sku: incoming.productNumber,
      },
    ],
    linked: null,
  };
}
