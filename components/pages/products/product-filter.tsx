// components/pages/products/product-filter.tsx
'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ColorResponse, SizeResponse } from '@/services/features/products/type';

interface ProductFilterProps {
  selectedColorIds: number[];
  selectedSizeIds: number[];
  onApplyFilters: (colorIds: number[], sizeIds: number[]) => void;
  onClearFilters: () => void;
  /**
   * گزینه‌های واقعی این دسته‌بندی که گروه‌بندی‌شده‌اند؛ اگر نباشند خالی
   * رندر می‌شود (نه اینکه لیست سراسری قدیمی به‌صورت مؤقتی پر شود).
   */
  colors: ColorResponse[];
  sizes: SizeResponse[];
  /** وقتی false است (در حالت واکنش‌گرای کوچک) پنل به‌صورت inline باز/بسته می‌شود */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** هدر فرمال‌پاسِ فیلترها برای حالت inline در موبایل */
  inline?: boolean;
}

/**
 * سایدبار فیلتر محصولات (دائمی در دسکتاپ، inline در موبایل).
 *
 * نکته‌ی مهم درباره‌ی گزینه‌ها: دیگر مودالِ floating یا body lock در کار نیست؛
 * فیلترها بخشی از layout صفحه هستند.
 */
export default function ProductFilter({
  selectedColorIds,
  selectedSizeIds,
  onApplyFilters,
  onClearFilters,
  colors,
  sizes,
  open,
  onOpenChange,
  inline = false,
}: ProductFilterProps) {
  // State موقت برای انتخاب‌ها (تا زمان کلیک دکمه اعمال)
  const [tempColorIds, setTempColorIds] = useState<number[]>(selectedColorIds);
  const [tempSizeIds, setTempSizeIds] = useState<number[]>(selectedSizeIds);

  // در حالت inline دسکتاپ پنل همیشه باز است و نیازی به همگام‌سازی باز/بسته نیست.
  // state موقت با props از والد همگام می‌شود تا انتخاب‌های فعلی همیشه
  // در آکاردئون‌ها نمایش داده شوند.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTempColorIds(selectedColorIds);
    setTempSizeIds(selectedSizeIds);
  }, [selectedColorIds, selectedSizeIds]);

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

  // پاک کردن همه فیلترهای موقت
  const handleClearAll = () => {
    setTempColorIds([]);
    setTempSizeIds([]);
  };

  // پاک کردن کامل (اعمال به والد و بستن در حالت inline)
  const handleClearAndClose = () => {
    onClearFilters();
    if (inline) onOpenChange(false);
  };

  // اعمال فیلترها
  const handleApply = () => {
    onApplyFilters(tempColorIds, tempSizeIds);
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

  const totalSelected = tempColorIds.length + tempSizeIds.length;

  const content = (
    <>
      {/* نشان‌های انتخاب‌شده */}
      {totalSelected > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tempColorIds.map(id => (
            <Badge
              key={`c-${id}`}
              variant="secondary"
              className="flex items-center gap-1 rounded"
            >
              <span
                className="inline-block size-3 rounded-full border"
                style={{ backgroundColor: getColorHex(id) }}
              />
              {getColorName(id)}
              <button
                type="button"
                onClick={() => removeColor(id)}
                className="text-gray-500 hover:text-gray-800"
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
              className="flex items-center gap-1.5 rounded"
            >
              {getSizeName(id)}
              <button
                type="button"
                onClick={() => removeSize(id)}
                className="text-gray-500 hover:text-gray-800"
                aria-label={`حذف سایز ${getSizeName(id)}`}
              >
                ×
              </button>
            </Badge>
          ))}
          {totalSelected > 1 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-gray-500 underline"
            >
              پاک کردن همه
            </button>
          )}
        </div>
      )}

      <Accordion type="single" collapsible className="w-full">
        {/* فیلتر رنگ */}
        <AccordionItem value="colors">
          <AccordionTrigger className="text-sm font-medium">
            رنگ‌ها ({tempColorIds.length})
          </AccordionTrigger>
          <AccordionContent>
            {colors.length === 0 ? (
              <p className="py-2 text-xs text-gray-500">
                گزینه‌ای برای نمایش نیست.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                {colors.map(color => (
                  <label
                    key={color.id}
                    className={cn(
                      'flex items-center gap-2 border p-1.5 cursor-pointer text-sm hover:bg-gray-50 rounded',
                      tempColorIds.includes(color.id)
                        ? 'bg-primary/10 border-primary'
                        : 'border-gray-200',
                    )}
                  >
                    <Checkbox
                      checked={tempColorIds.includes(color.id)}
                      onCheckedChange={() => toggleColor(color.id)}
                      className="rounded"
                    />
                    <span
                      className="inline-block size-4 rounded-full border border-black/10"
                      style={{ backgroundColor: color.hexCode }}
                    />
                    <span className="truncate">{color.name}</span>
                  </label>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* فیلتر سایز */}
        <AccordionItem value="sizes">
          <AccordionTrigger className="text-sm font-medium">
            سایزها ({tempSizeIds.length})
          </AccordionTrigger>
          <AccordionContent>
            {sizes.length === 0 ? (
              <p className="py-2 text-xs text-gray-500">
                سایزی برای این دسته‌بندی تعریف نشده است.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6">
                {sizes.map(size => (
                  <label
                    key={size.id}
                    className={cn(
                      'flex cursor-pointer items-center justify-center border p-2 text-xs font-medium hover:bg-gray-50 rounded',
                      tempSizeIds.includes(size.id)
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-200',
                    )}
                  >
                    <Checkbox
                      checked={tempSizeIds.includes(size.id)}
                      onCheckedChange={() => toggleSize(size.id)}
                      className="sr-only"
                    />
                    {size.name}
                  </label>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );

  if (inline) {
    // موبایل: نوار جمع‌شونده در بالای گرید — بدون overlay/modal
    return (
      <div className="border-b border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          className="flex w-full items-center justify-between p-4 text-sm font-semibold"
        >
          <span>فیلترها</span>
          <div className="flex items-center gap-2">
            {totalSelected > 0 && (
              <Badge className="rounded-full bg-primary text-background">
                {totalSelected}
              </Badge>
            )}
            <ChevronDown
              className={cn(
                'size-4 text-gray-500 transition-transform',
                open && 'rotate-180',
              )}
            />
          </div>
        </button>
        <div
          className={cn(
            'overflow-hidden px-4 transition-[max-height,opacity]',
            open ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          {open && (
            <>
              {content}
              <div className="flex gap-2 py-4">
                <Button onClick={handleApply} className="flex-1 rounded">
                  اعمال فیلترها
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearAndClose}
                  className="rounded"
                >
                  حذف فیلترها
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // دسکتاپ: سایدبار دائمی سمت راست در RTL؛ چسبنده به ابزاربار موجود
  return (
    <aside
      className="sticky top-[124px] hidden h-[calc(100vh-124px)] w-64 flex-shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-4 lg:block xl:w-72"
      aria-label="فیلتر محصولات"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">فیلترها</h3>
        {totalSelected > 0 && (
          <Badge
            variant="destructive"
            className="rounded-full bg-primary text-background"
          >
            {totalSelected}
          </Badge>
        )}
      </div>

      <div className="space-y-3">{content}</div>

      <div className="mt-6 flex flex-col gap-2">
        <Button onClick={handleApply} className="w-full rounded">
          اعمال فیلترها
        </Button>
        <Button
          variant="outline"
          onClick={handleClearAndClose}
          className="w-full rounded"
          disabled={totalSelected === 0}
        >
          حذف فیلترها
        </Button>
      </div>
    </aside>
  );
}
