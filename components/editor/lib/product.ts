import { BlogSliderColorOption,BlogSliderProductInfo } from '@/services/features/blog/types';
import { ProductsResponse } from '@/services/features/products/type';

/**
 * ساخت اطلاعات سبک محصول برای اسلایدر مقاله.
 *
 * این داده فقط برای پیش‌نمایش پنل ادمین است (تصویر، نام، کمترین قیمت و
 * رنگ‌های موجود). در سایت، بک‌اند همان اطلاعات را تازه از دیتابیس
 * می‌سازد؛ پس تغییر قیمت یا موجودی محصول همیشه درست نمایش داده می‌شود.
 */

function minPrice(variants: { price: number | string }[]): number {
  const prices = variants
    .map(variant => Number(variant.price))
    .filter(price => Number.isFinite(price) && price > 0);

  return prices.length > 0 ? Math.min(...prices) : 0;
}

export function toSliderProductInfo(
  product: ProductsResponse,
  colorId?: number,
): BlogSliderProductInfo {
  const variants = product.variants ?? [];
  const colorImages = product.colorImages ?? [];

  const optionByColor = new Map<number, BlogSliderColorOption>();

  const ensureOption = (color: {
    id: number;
    name: string;
    hexCode: string;
  }) => {
    const existing = optionByColor.get(color.id);
    if (existing) return existing;

    const created: BlogSliderColorOption = {
      colorId: color.id,
      name: color.name,
      hexCode: color.hexCode,
      image: null,
      price: 0,
      inStock: false,
    };

    optionByColor.set(color.id, created);

    return created;
  };

  variants.forEach(variant => {
    if (variant.color) ensureOption(variant.color);
  });

  colorImages.forEach(image => {
    if (!image.color) return;
    const option = ensureOption(image.color);
    if (!option.image) option.image = image.url;
  });

  const colorOptions = [...optionByColor.values()].map(option => {
    const colorVariants = variants.filter(
      variant => variant.color?.id === option.colorId,
    );

    return {
      ...option,
      image: option.image ?? product.image ?? null,
      price: minPrice(colorVariants),
      inStock: colorVariants.some(variant => (variant.stock ?? 0) > 0),
    };
  });

  const selected = colorId
    ? colorOptions.find(option => option.colorId === colorId)
    : undefined;

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    image: selected?.image ?? colorImages[0]?.url ?? product.image ?? null,
    price: selected ? selected.price : minPrice(variants),
    inStock: selected
      ? selected.inStock
      : variants.some(variant => (variant.stock ?? 0) > 0),
    colorOptions,
  };
}
