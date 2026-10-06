import {
  BlogBlock,
  BlogBlockItem,
  BlogBlockType,
  BlogSliderColorOption,
  BlogSliderProductInfo,
} from '@/services/features/blog/types';
import { ProductsResponse } from '@/services/features/products/type';

import { BlockForm, BlockItemForm, nextKey } from './types';

/** عنوان پیش‌فرض هر نوع بخش (هم‌راستا با بک‌اند) */
export const BLOCK_DEFAULT_TITLES: Record<BlogBlockType, string> = {
  content: '',
  faq: 'سوالات متداول',
  slider: 'محصولات مرتبط',
  media: 'گالری تصاویر و ویدیو',
  toc: 'فهرست مطالب',
};

export const BLOCK_LABELS: Record<BlogBlockType, string> = {
  content: 'متن مقاله',
  faq: 'سوالات متداول',
  slider: 'اسلایدر محصولات',
  media: 'عکس و فیلم',
  toc: 'فهرست مطالب',
};

export const BLOCK_ADDABLE_TYPES: BlogBlockType[] = ['faq', 'slider', 'media', 'toc'];

export { mediaUrl } from '@/lib/media';

export function createItem(type: BlogBlockType): BlockItemForm {
  const base = { key: nextKey() };

  switch (type) {
    case 'faq':
      return { ...base, question: '', answer: '' };
    case 'slider':
      return { ...base };
    case 'media':
      return { ...base, mediaType: 'image', url: '', caption: '' };
    default:
      return base;
  }
}

export function createBlock(type: BlogBlockType): BlockForm {
  return {
    key: nextKey(),
    type,
    title: BLOCK_DEFAULT_TITLES[type],
    settings: null,
    items: [],
  };
}

/** تبدیل بلوک‌های دریافتی از سرور به فرم قابل ویرایش */
export function toFormBlocks(blocks: BlogBlock[] = []): BlockForm[] {
  const formBlocks = blocks.map(block => ({
    ...block,
    key: nextKey(),
    items: (block.items ?? []).map(item => ({ ...item, key: nextKey() })),
  }));

  // مقالات بدون بلوک (قدیمی) همیشه دست‌کم بخش متن اصلی را دارند
  return ensureContentBlock(formBlocks);
}

/** فرم پیش‌فرض یک مقاله‌ی تازه */
export function defaultFormBlocks(): BlockForm[] {
  return [createBlock('content')];
}

/**
 * تضمین وجود بخش متن اصلی (فقط یک عدد، همیشه در لیست می‌ماند).
 */
export function ensureContentBlock(blocks: BlockForm[]): BlockForm[] {
  if (blocks.some(block => block.type === 'content')) return blocks;

  return [createBlock('content'), ...blocks];
}

/** آیتم‌های ناقص که ادمین شروع کرده ولی کامل نکرده حذف می‌شوند */
function hasMeaningfulItem(item: BlogBlockItem): boolean {
  return Boolean(
    item.question?.trim() ||
      item.answer?.trim() ||
      item.url?.trim() ||
      item.poster?.trim() ||
      item.caption?.trim() ||
      item.productId,
  );
}

/**
 * پاک‌سازی نهایی قبل از ارسال: حذف keyها، آیتم‌های خالی و
 * فیلد اطلاعات محصول (که بک‌اند خودش می‌سازد).
 */
export function toPayloadBlocks(blocks: BlockForm[]): BlogBlock[] {
  return ensureContentBlock(blocks).map((block, index) => ({
    // id بلوک‌ها در سرور هر بار از نو ساخته می‌شود؛ ترتیب با order می‌رود
    type: block.type,
    order: index,
    title: block.title?.trim() || null,
    settings: block.settings ?? null,
    items: block.items.filter(hasMeaningfulItem).map(item => {
      const { key, product, ...rest } = item;

      void key;
      void product;

      return rest as BlogBlockItem;
    }),
  }));
}

function minPrice(variants: { price: number | string }[]): number {
  const prices = variants
    .map(variant => Number(variant.price))
    .filter(price => Number.isFinite(price) && price > 0);

  return prices.length > 0 ? Math.min(...prices) : 0;
}

/**
 * تبدیل محصول انتخاب‌شده در پنل به شکل سبک اسلایدر.
 *
 * همین ساختار بک‌اند هم برمی‌گرداند؛ پس انتخاب رنگ در پنل بدون ذخیره‌ی
 * مجدد، تصویر و قیمت همان رنگ را نشان می‌دهد.
 */
export function toSliderProductInfo(
  product: ProductsResponse,
  colorId?: number,
): BlogSliderProductInfo {
  const variants = product.variants ?? [];
  const colorImages = product.colorImages ?? [];

  const optionByColor = new Map<number, BlogSliderColorOption>();

  const ensureOption = (color: { id: number; name: string; hexCode: string }) => {
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

/** جابه‌جایی یک آیتم در آرایه */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [removed] = next.splice(from, 1);
  next.splice(to, 0, removed);

  return next;
}
