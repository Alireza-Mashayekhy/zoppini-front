// components/pages/products/product-filter.tsx
'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { sortSizeOptions } from '@/lib/product-size-order';
import { cn } from '@/lib/utils';
import { ColorResponse, SizeResponse } from '@/services/features/products/type';

interface ProductFilterProps {
  selectedColorIds: number[];
  selectedSizeIds: number[];
  /** بازهٔ قیمتِ اعمال‌شده؛ undefined یعنی محدودیتی از سمت کاربر نیست */
  selectedPriceMin?: number;
  selectedPriceMax?: number;
  /** کمترین/بیشترین قیمت واقعی همین دامنه (دسته یا همهٔ محصولات) */
  minPrice?: number;
  maxPrice?: number;
  onApplyFilters: (
    colorIds: number[],
    sizeIds: number[],
    price?: { min: number; max: number },
  ) => void;
  onClearFilters: () => void;
  /**
   * گزینه‌های واقعی این دسته‌بندی/لیست که گروه‌بندی‌شده‌اند؛ اگر نباشند خالی
   * رندر می‌شود (نه اینکه لیست سراسری ثابت به‌صورت موقتی پر شود).
   */
  colors: ColorResponse[];
  sizes: SizeResponse[];
  /** وقتی false است (در حالت واکنش‌گرای کوچک) پنل به‌صورت inline باز/بسته می‌شود */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** هدر فرمال‌پاسِ فیلترها برای حالت inline در موبایل */
  inline?: boolean;
}

const formatToman = (value: number) =>
  Math.max(0, Math.round(value)).toLocaleString('fa-IR');

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * سایدبار فیلتر محصولات (دائمی در دسکتاپ، inline در موبایل).
 *
 * گزینه‌های رنگ/سایز از داده‌ی واقعی سرور می‌آیند و بازهٔ قیمت هم با
 * کمترین/بیشترین قیمت همان دامنه مقید می‌شود. دکمهٔ «پاک کردن فیلترها» در
 * انتهای لیست است و رنگ، سایز و قیمت را با هم پاک می‌کند.
 */
export default function ProductFilter({
  selectedColorIds,
  selectedSizeIds,
  selectedPriceMin,
  selectedPriceMax,
  minPrice,
  maxPrice,
  onApplyFilters,
  onClearFilters,
  colors,
  sizes,
  open,
  onOpenChange,
  inline = false,
}: ProductFilterProps) {
  const boundMin = Math.max(0, Math.floor(minPrice ?? 0));
  const boundMax = Math.max(boundMin, Math.floor(maxPrice ?? 0));
  const hasPriceBounds = boundMax > boundMin;
  // گام ۱ تومان است تا هر دو سر بازه (که ممکن است مضرب ۱۰۰۰ نباشند)
  // دقیقاً قابل انتخاب بمانند.
  const priceStep = 1;

  const initialMin = clamp(selectedPriceMin ?? boundMin, boundMin, boundMax);
  const initialMax = clamp(
    selectedPriceMax ?? boundMax,
    initialMin,
    boundMax,
  );

  // State موقت برای انتخاب‌ها (تا زمان کلیک دکمه اعمال)
  const [tempColorIds, setTempColorIds] = useState<number[]>(selectedColorIds);
  const [tempSizeIds, setTempSizeIds] = useState<number[]>(selectedSizeIds);
  const [tempMinPrice, setTempMinPrice] = useState<number>(initialMin);
  const [tempMaxPrice, setTempMaxPrice] = useState<number>(initialMax);

  // state موقت با props از والد همگام می‌شود تا انتخاب‌های فعلی همیشه
  // در آکاردئون‌ها نمایش داده شوند (از جمله پس از پاک کردن فیلترها).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTempColorIds(selectedColorIds);
    setTempSizeIds(selectedSizeIds);
    setTempMinPrice(
      clamp(selectedPriceMin ?? boundMin, boundMin, boundMax),
    );
    setTempMaxPrice(
      clamp(
        selectedPriceMax ?? boundMax,
        clamp(selectedPriceMin ?? boundMin, boundMin, boundMax),
        boundMax,
      ),
    );
  }, [
    selectedColorIds,
    selectedSizeIds,
    selectedPriceMin,
    selectedPriceMax,
    boundMin,
    boundMax,
  ]);

  // سایزهای حروفی/عددی با ترتیب متعارف، مستقل از id دیتابیس
  const orderedSizes = useMemo(() => sortSizeOptions(sizes), [sizes]);

  const priceIsFiltered =
    hasPriceBounds &&
    (tempMinPrice > boundMin || tempMaxPrice < boundMax);

  const totalSelected =
    tempColorIds.length +
    tempSizeIds.length +
    (priceIsFiltered ? 1 : 0);

  const handlePriceMinChange = (value: number) => {
    setTempMinPrice(
      clamp(Math.min(Math.floor(value), tempMaxPrice), boundMin, boundMax),
    );
  };

  const handlePriceMaxChange = (value: number) => {
    setTempMaxPrice(
      clamp(Math.max(Math.floor(value), tempMinPrice), boundMin, boundMax),
    );
  };

  // تغییر رنگ
  const toggleColor = (id: number) => {
    setTempColorIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id],
    );
  };

  // تغییر سایز
  const toggleSize = (id: number) => {
    setTempSizeIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );
  };

  // حذف یک رنگ از Badge
  const removeColor = (id: number) => {
    setTempColorIds(prev => prev.filter(c => c !== id));
  };

  // حذف یک سایز از Badge
  const removeSize = (id: number) => {
    setTempSizeIds(prev => prev.filter(s => s !== id));
  };

  // پاک کردن کامل (اعمال به والد و بستن در حالت inline)
  const handleClearAndClose = () => {
    setTempColorIds([]);
    setTempSizeIds([]);
    setTempMinPrice(boundMin);
    setTempMaxPrice(boundMax);
    onClearFilters();
    if (inline) onOpenChange(false);
  };

  // اعمال فیلترها
  const handleApply = () => {
    const price = priceIsFiltered
      ? { min: tempMinPrice, max: tempMaxPrice }
      : undefined;

    onApplyFilters(tempColorIds, tempSizeIds, price);
    if (inline) onOpenChange(false);
  };

  // دریافت اطلاعات رنگ و سایز برای نمایش در Badge
  const getColorName = (id: number) => {
    return colors.find(c => c.id === id)?.name || '';
  };

  const getColorHex = (id: number) => {
    return colors.find(c => c.id === id)?.hexCode || '#000000';
  };

  const getSizeName = (id: number) => {
    return sizes.find(s => s.id === id)?.name || '';
  };

  const content = (
    <>
      {/* نشان‌های انتخاب‌شده */}
      {totalSelected > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tempColorIds.map(id => (
            <Badge
              key={`c-${id}`}
              variant="secondary"
              className="flex h-auto min-h-5 max-w-full items-center gap-1 whitespace-normal rounded py-1"
            >
              <span
                aria-hidden="true"
                className="inline-block size-3 shrink-0 rounded-full border"
                style={{ backgroundColor: getColorHex(id) }}
              />
              <span className="min-w-0 break-words">{getColorName(id)}</span>
              <button
                type="button"
                onClick={() => removeColor(id)}
                className="flex size-6 shrink-0 items-center justify-center text-gray-500 hover:text-gray-800"
                aria-label={`حذف رنگ ${getColorName(id)}`}
              >
                ×
              </button>
            </Badge>
          ))}
          {tempSizeIds.map(id => (
            <Badge
              key={`s-${id}`}
              variant="secondary"
              className="flex h-auto min-h-5 max-w-full items-center gap-1.5 whitespace-normal rounded py-1"
            >
              <span className="min-w-0 break-words">{getSizeName(id)}</span>
              <button
                type="button"
                onClick={() => removeSize(id)}
                className="flex size-6 shrink-0 items-center justify-center text-gray-500 hover:text-gray-800"
                aria-label={`حذف سایز ${getSizeName(id)}`}
              >
                ×
              </button>
            </Badge>
          ))}
          {priceIsFiltered && (
            <Badge
              variant="secondary"
              className="flex h-auto min-h-5 max-w-full items-center gap-1 whitespace-normal rounded py-1"
            >
              <span className="min-w-0 break-words">
                {formatToman(tempMinPrice)} تا {formatToman(tempMaxPrice)} تومان
              </span>
            </Badge>
          )}
        </div>
      )}

      <Accordion type="single" collapsible className="w-full">
        {/* فیلتر رنگ */}
        <AccordionItem value="colors">
          <AccordionTrigger className="text-sm font-medium">
            رنگ‌ها ({tempColorIds.length.toLocaleString('fa-IR')})
          </AccordionTrigger>
          <AccordionContent>
            {colors.length === 0 ? (
              <p className="py-2 text-xs text-gray-500">
                گزینه‌ای برای نمایش نیست.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-1">
                {colors.map(color => {
                  const checked = tempColorIds.includes(color.id);

                  return (
                    <label
                      key={color.id}
                      className={cn(
                        'flex min-w-0 cursor-pointer items-center gap-2 rounded border p-2 text-sm hover:bg-gray-50',
                        checked
                          ? 'border-primary bg-primary/10 font-medium'
                          : 'border-gray-200',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleColor(color.id)}
                        aria-label={`رنگ ${color.name}`}
                        className="shrink-0 rounded"
                      />
                      <span
                        aria-hidden="true"
                        className="inline-block size-5 shrink-0 rounded-full border border-black/10"
                        style={{ backgroundColor: color.hexCode }}
                      />
                      <span className="min-w-0 break-words text-right leading-5">
                        {color.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* فیلتر سایز */}
        <AccordionItem value="sizes">
          <AccordionTrigger className="text-sm font-medium">
            سایزها ({tempSizeIds.length.toLocaleString('fa-IR')})
          </AccordionTrigger>
          <AccordionContent>
            {orderedSizes.length === 0 ? (
              <p className="py-2 text-xs text-gray-500">
                سایزی برای این دسته‌بندی تعریف نشده است.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6">
                {orderedSizes.map(size => (
                  <label
                    key={size.id}
                    className={cn(
                      'flex min-h-10 min-w-0 cursor-pointer items-center justify-center rounded border p-2 text-center text-xs font-medium hover:bg-gray-50',
                      tempSizeIds.includes(size.id)
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-200',
                    )}
                  >
                    <Checkbox
                      checked={tempSizeIds.includes(size.id)}
                      onCheckedChange={() => toggleSize(size.id)}
                      aria-label={`سایز ${size.name}`}
                      className="sr-only"
                    />
                    <span className="min-w-0 break-words">{size.name}</span>
                  </label>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* فیلتر قیمت — بازه از داده‌ی واقعی همین لیست/دسته */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium">
            محدوده قیمت
            {priceIsFiltered && (
              <Badge
                variant="secondary"
                className="mr-1 rounded-full px-1.5 py-0 text-[10px]"
              >
                ۱
              </Badge>
            )}
          </AccordionTrigger>
          <AccordionContent>
            {!hasPriceBounds ? (
              <p className="py-2 text-xs text-gray-500">
                بازه‌ی قیمتی برای این لیست در دسترس نیست.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-gray-700">
                  <span className="whitespace-nowrap">
                    از {formatToman(tempMinPrice)} تومان
                  </span>
                  <span className="whitespace-nowrap">
                    تا {formatToman(tempMaxPrice)} تومان
                  </span>
                </div>

                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-xs text-gray-500">
                      حداقل قیمت
                    </span>
                    <input
                      type="range"
                      min={boundMin}
                      max={boundMax}
                      step={priceStep}
                      value={tempMinPrice}
                      onChange={event =>
                        handlePriceMinChange(Number(event.target.value))
                      }
                      aria-label="حداقل قیمت"
                      className="w-full accent-primary"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs text-gray-500">
                      حداکثر قیمت
                    </span>
                    <input
                      type="range"
                      min={boundMin}
                      max={boundMax}
                      step={priceStep}
                      value={tempMaxPrice}
                      onChange={event =>
                        handlePriceMaxChange(Number(event.target.value))
                      }
                      aria-label="حداکثر قیمت"
                      className="w-full accent-primary"
                    />
                  </label>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );

  const actions = (extraClassName?: string) => (
    <div
      className={cn(
        'flex flex-col gap-2 border-t border-gray-100 bg-white pt-3',
        extraClassName,
      )}
    >
      <Button onClick={handleApply} className="w-full rounded">
        اعمال فیلترها
      </Button>
      <Button
        variant="outline"
        onClick={handleClearAndClose}
        className="w-full rounded"
      >
        پاک کردن فیلترها
      </Button>
    </div>
  );

  if (inline) {
    // موبایل: نوار جمع‌شونده در بالای گرید — بدون overlay/modal
    return (
      <div className="border-b border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
          className="flex w-full items-center justify-between p-4 text-sm font-semibold"
        >
          <span>فیلترها</span>
          <div className="flex items-center gap-2">
            {totalSelected > 0 && (
              <Badge className="rounded-full bg-primary text-background">
                {totalSelected.toLocaleString('fa-IR')}
              </Badge>
            )}
            <ChevronDown
              className={cn(
                'size-4 text-gray-500 transition-transform',
                open && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </div>
        </button>
        <div
          className={cn(
            'px-4 transition-[max-height,opacity]',
            open
              ? 'max-h-[70dvh] overflow-y-auto opacity-100'
              : 'max-h-0 overflow-hidden opacity-0',
          )}
        >
          {open && (
            <>
              {content}
              {actions('sticky bottom-0 mt-3 pb-4')}
            </>
          )}
        </div>
      </div>
    );
  }

  // دسکتاپ: سایدبار دائمی سمت راست در RTL؛ چسبنده به ابزاربار موجود
  return (
    <aside
      className="sticky top-[124px] hidden h-[calc(100vh-124px)] w-64 flex-shrink-0 overflow-hidden border-l border-gray-200 bg-white lg:block xl:w-72"
      aria-label="فیلتر محصولات"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between p-4 pb-0">
          <h3 className="text-base font-semibold">فیلترها</h3>
          {totalSelected > 0 && (
            <Badge
              variant="destructive"
              className="rounded-full bg-primary text-background"
            >
              {totalSelected.toLocaleString('fa-IR')}
            </Badge>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 pt-3">
          <div className="space-y-3">{content}</div>
        </div>

        {/*
          اکشن‌ها بیرون از ناحیهٔ اسکرول‌اند تا حتی وقتی لیست فیلترها
          بلندتر از ارتفاع سایدبار است، «اعمال» و «پاک کردن فیلترها»
          همیشه در دسترس بمانند.
        */}
        <div className="shrink-0 border-t border-gray-100 p-4">
          {actions('border-t-0 pt-0')}
        </div>
      </div>
    </aside>
  );
}
