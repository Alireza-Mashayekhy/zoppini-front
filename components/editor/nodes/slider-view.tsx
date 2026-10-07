'use client';

import type { ReactNodeViewProps } from '@tiptap/react';
import {
  ImageOff,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';

import { ProductSearchSelect } from '@/components/admin/product-search-select';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { mediaUrl } from '@/lib/media';
import { formatPrice } from '@/lib/utils';
import { ProductsResponse } from '@/services/features/products/type';

import { normalizeBlockConfig } from '../lib/block-html';
import { toSliderProductInfo } from '../lib/product';
import { SliderBlockConfig, SliderBlockItem } from '../lib/types';
import { BlockTitleInput, FrameButton } from '../ui/block-frame';
import BlockViewShell from '../ui/block-view-shell';

/**
 * بلوک اسلایدر محصولات — داخل خود متن مقاله.
 *
 * ادمین محصول را از فروشگاه جستجو و انتخاب می‌کند، رنگ نمایشی و برچسب
 * کارت را تعیین می‌کند و با دکمه‌های بالا/پایین (یا درگ از دستگیره‌ی
 * بالای بلوک) جایش را در مقاله عوض می‌کند.
 */
export default function SliderNodeView(view: ReactNodeViewProps) {
  const config = normalizeBlockConfig('slider', view.node.attrs.config);
  const items = config.items;

  const update = (patch: Partial<SliderBlockConfig>) =>
    view.updateAttributes({ config: { ...config, ...patch } });

  const updateItems = (next: SliderBlockItem[]) => update({ items: next });

  const addProduct = (product: ProductsResponse) => {
    if (items.some(item => item.productId === product.id)) return;

    const info = toSliderProductInfo(product);

    updateItems([
      ...items,
      {
        productId: product.id,
        colorId: info.colorOptions[0]?.colorId,
        product: info,
      },
    ]);
  };

  const updateItem = (index: number, patch: Partial<SliderBlockItem>) =>
    updateItems(items.map((item, current) => (current === index ? { ...item, ...patch } : item)));

  const removeItem = (index: number) =>
    updateItems(items.filter((_, current) => current !== index));

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);

    updateItems(next);
  };

  /** با تغییر رنگ، تصویر و قیمت همان رنگ در پیش‌نمایش پنل به‌روز می‌شود */
  const changeColor = (index: number, colorId: number) => {
    const item = items[index];
    const option = item?.product?.colorOptions.find(
      color => color.colorId === colorId,
    );

    updateItem(index, {
      colorId,
      ...(item?.product && option
        ? {
            product: {
              ...item.product,
              image: option.image,
              price: option.price,
              inStock: option.inStock,
            },
          }
        : {}),
    });
  };

  return (
    <BlockViewShell
      kind="slider"
      view={view}
      icon={<SlidersHorizontal className="size-3.5" />}
      header={
        <>
          <BlockTitleInput
            value={config.title ?? ''}
            onChange={title => update({ title })}
            placeholder="عنوان اسلایدر (اختیاری)"
          />

          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-neutral-600">
            <Switch
              checked={config.autoplay !== false}
              onCheckedChange={checked => update({ autoplay: checked })}
            />
            پخش خودکار
          </label>
        </>
      }
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <ProductSearchSelect value="" onValueChange={addProduct} className="max-w-72" />
          <span className="flex items-center gap-1 text-[11px] text-neutral-400">
            <Plus className="size-3" />
            افزودن از محصولات فروشگاه
          </span>
        </div>
      }
    >
      {items.length === 0 ? (
        <p className="rounded border border-dashed border-neutral-300 p-4 text-center text-xs text-neutral-500">
          هنوز محصولی اضافه نشده است؛ از پایین همین بلوک محصول انتخاب کنید.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item.productId}-${index}`}
              className="flex items-start gap-3 rounded border border-neutral-100 bg-neutral-50/60 p-2"
            >
              <ProductThumb src={item.product?.image} title={item.product?.title} />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-neutral-400">
                    اسلاید {index + 1}
                  </span>
                  <span className="truncate text-sm font-medium text-neutral-800">
                    {item.product?.title ?? 'محصول حذف‌شده'}
                  </span>
                  {!!item.product?.price && (
                    <span className="text-[11px] text-neutral-500">
                      از {formatPrice(item.product.price)} تومان
                    </span>
                  )}
                  {item.product && !item.product.inStock && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                      ناموجود
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!!item.product?.colorOptions?.length && (
                    <Select
                      value={item.colorId ? String(item.colorId) : ''}
                      onValueChange={value => changeColor(index, Number(value))}
                    >
                      <SelectTrigger className="h-8 w-40 bg-white text-xs">
                        <SelectValue placeholder="رنگ نمایشی" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {item.product.colorOptions.map(color => (
                          <SelectItem
                            key={color.colorId}
                            value={String(color.colorId)}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="size-3 rounded-full border"
                                style={{ backgroundColor: color.hexCode }}
                              />
                              {color.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Input
                    value={item.badge ?? ''}
                    onChange={event => updateItem(index, { badge: event.target.value })}
                    placeholder="برچسب کارت (مثلاً جدید)"
                    className="h-8 w-48 bg-white text-xs"
                  />

                  <Input
                    value={item.caption ?? ''}
                    onChange={event => updateItem(index, { caption: event.target.value })}
                    placeholder="عنوان نمایشی دلخواه"
                    className="h-8 w-48 bg-white text-xs"
                  />
                </div>
              </div>

              <div className="flex shrink-0 flex-col">
                <FrameButton
                  title="انتقال به بالا"
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                >
                  <span className="text-[10px]">▲</span>
                </FrameButton>
                <FrameButton
                  title="انتقال به پایین"
                  disabled={index === items.length - 1}
                  onClick={() => moveItem(index, 1)}
                >
                  <span className="text-[10px]">▼</span>
                </FrameButton>
                <FrameButton
                  title="حذف محصول"
                  tone="danger"
                  onClick={() => removeItem(index)}
                >
                  <span className="text-[10px]">✕</span>
                </FrameButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </BlockViewShell>
  );
}

/** تصویر کوچک محصول (با جایگزین وقتی تصویری نیست) */
function ProductThumb({ src, title }: { src?: string | null; title?: string }) {
  if (!src) {
    return (
      <span className="flex size-14 shrink-0 items-center justify-center rounded border bg-white">
        <ImageOff className="size-5 text-neutral-300" />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(src)}
      alt={title ?? 'محصول'}
      className="size-14 shrink-0 rounded border object-cover"
    />
  );
}
