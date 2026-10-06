'use client';

import { ImageOff, Plus } from 'lucide-react';
import Image from 'next/image';

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
import { formatPrice } from '@/lib/utils';
import { ProductsResponse } from '@/services/features/products/type';

import { SortableItemCard, SortableList } from './sortable';
import { BlockForm } from './types';
import { createItem, mediaUrl, moveItem, toSliderProductInfo } from './utils';

/**
 * اسلایدر محصولات ساخته‌شده از محصولات موجود فروشگاه.
 *
 * ادمین محصول را جستجو و انتخاب می‌کند؛ رنگ نمایشی (اختیاری)، برچسب روی
 * کارت و ترتیب اسلایدها هم قابل تغییر است.
 */
export default function SliderBlockEditor({
  block,
  onChange,
}: {
  block: BlockForm;
  onChange: (block: BlockForm) => void;
}) {
  /** افزودن محصول انتخاب‌شده از لیست محصولات فروشگاه */
  const addProduct = (product: ProductsResponse) => {
    const info = toSliderProductInfo(product);

    onChange({
      ...block,
      items: [
        ...block.items,
        {
          ...createItem('slider'),
          productId: product.id,
          product: info,
          colorId: info.colorOptions[0]?.colorId,
        },
      ],
    });
  };

  const updateItem = (
    key: string,
    patch: Partial<BlockForm['items'][number]>,
  ) => {
    onChange({
      ...block,
      items: block.items.map(item =>
        item.key === key ? { ...item, ...patch } : item,
      ),
    });
  };

  /**
   * با تغییر رنگ، تصویر/قیمت/موجودی همان رنگ از colorOptions خوانده
   * می‌شود تا پیش‌نمایش پنل بلافاصله درست شود (بدون ذخیره‌ی مجدد).
   */
  const changeColor = (key: string, colorId?: number) => {
    const item = block.items.find(current => current.key === key);
    if (!item) return;

    const option = item.product?.colorOptions.find(
      current => current.colorId === colorId,
    );

    updateItem(key, {
      colorId,
      ...(item.product && option
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

  const removeItem = (key: string) => {
    onChange({ ...block, items: block.items.filter(item => item.key !== key) });
  };

  const autoplay = block.settings?.autoplay ?? true;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch
          id={`autoplay-${block.key}`}
          checked={autoplay}
          onCheckedChange={checked =>
            onChange({ ...block, settings: { ...block.settings, autoplay: checked } })
          }
        />
        <label
          htmlFor={`autoplay-${block.key}`}
          className="cursor-pointer text-sm text-gray-600"
        >
          پخش خودکار اسلایدر
        </label>
      </div>

      {block.items.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
          هنوز محصولی به اسلایدر اضافه نشده است.
        </p>
      )}

      <SortableList
        ids={block.items.map(item => item.key)}
        onReorder={(from, to) =>
          onChange({ ...block, items: moveItem(block.items, from, to) })
        }
      >
        {block.items.map((item, index) => (
          <SortableItemCard
            key={item.key}
            id={item.key}
            leading={<ProductThumb src={item.product?.image} title={item.product?.title} />}
            onRemove={() => removeItem(item.key)}
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-400">اسلاید {index + 1}</span>
                <span className="text-sm font-medium text-gray-800">
                  {item.product?.title ?? 'محصول حذف‌شده'}
                </span>
                {!!item.product?.price && (
                  <span className="text-xs text-gray-500">
                    از {formatPrice(item.product.price)} تومان
                  </span>
                )}
                {item.product && !item.product.inStock && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">
                    ناموجود
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!!item.product?.colorOptions?.length && (
                  <Select
                    value={item.colorId ? String(item.colorId) : ''}
                    onValueChange={value => changeColor(item.key, Number(value))}
                  >
                    <SelectTrigger className="h-9 w-44 bg-white">
                      <SelectValue placeholder="رنگ نمایشی" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {item.product.colorOptions.map(color => (
                        <SelectItem key={color.colorId} value={String(color.colorId)}>
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
                  onChange={event => updateItem(item.key, { badge: event.target.value })}
                  placeholder="برچسب روی کارت (مثلاً جدید)"
                  className="h-9 w-56 bg-white"
                />
              </div>
            </div>
          </SortableItemCard>
        ))}
      </SortableList>

      <div className="flex items-center gap-2">
        <ProductSearchSelect
          value=""
          onValueChange={addProduct}
          className="max-w-72"
        />
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Plus className="size-3" />
          افزودن از محصولات فروشگاه
        </span>
      </div>
    </div>
  );
}

/** تصویر کوچک محصول با جایگزین وقتی تصویری نیست */
function ProductThumb({ src, title }: { src?: string | null; title?: string }) {
  if (!src) {
    return (
      <div className="mt-1 flex size-14 shrink-0 items-center justify-center rounded-md border bg-gray-50">
        <ImageOff className="size-5 text-gray-300" />
      </div>
    );
  }

  return (
    <div className="relative mt-1 size-14 shrink-0 overflow-hidden rounded-md border">
      <Image src={mediaUrl(src)} alt={title ?? 'محصول'} fill className="object-cover" />
    </div>
  );
}


