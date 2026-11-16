// components/products/product-filter.tsx
'use client';

import { X } from 'lucide-react';
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
import { useColorsList, useSizeList } from '@/services/features/products/hooks';

interface ProductFilterProps {
  selectedColorIds: number[];
  selectedSizeIds: number[];
  onApplyFilters: (colorIds: number[], sizeIds: number[]) => void;
  onClearFilters: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductFilter({
  selectedColorIds,
  selectedSizeIds,
  onApplyFilters,
  onClearFilters,
  open,
  onOpenChange,
}: ProductFilterProps) {
  // State موقت برای انتخاب‌ها (تا زمان کلیک دکمه اعمال)
  const [tempColorIds, setTempColorIds] = useState<number[]>(selectedColorIds);
  const [tempSizeIds, setTempSizeIds] = useState<number[]>(selectedSizeIds);

  const { data: colorsData } = useColorsList();
  const { data: sizeData } = useSizeList();

  // هر بار که مودال باز می‌شود، state موقت را با مقادیر فعلی همگام کن
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTempColorIds(selectedColorIds);
      setTempSizeIds(selectedSizeIds);
    }
  }, [open, selectedColorIds, selectedSizeIds]);

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

  // پاک کردن کامل (اعمال به والد و بستن مودال)
  const handleClearAndClose = () => {
    onClearFilters();
    onOpenChange(false);
  };

  // اعمال فیلترها
  const handleApply = () => {
    onApplyFilters(tempColorIds, tempSizeIds);
    onOpenChange(false);
  };

  // لغو و بستن (بدون اعمال)
  const handleCancel = () => {
    onOpenChange(false);
  };

  // دریافت اطلاعات رنگ و سایز برای نمایش در Badge
  const getColorName = (id: number) => {
    return colorsData?.data.find(c => c.id === id)?.name || '';
  };

  const getColorHex = (id: number) => {
    return colorsData?.data.find(c => c.id === id)?.hexCode || '#000000';
  };

  const getSizeName = (id: number) => {
    return sizeData?.data.find(s => s.id === id)?.name || '';
  };

  const totalSelected = tempColorIds.length + tempSizeIds.length;

  return (
    <>
      {/* اوورلی */}
      <div
        onClick={handleCancel}
        className={`fixed inset-0 z-40 bg-black/40 ${
          open ? 'block' : 'hidden'
        }`}
      />

      {/* پنل فیلتر */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-[500px] bg-white shadow-lg border-l border-gray-200 transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* هدر - ارتفاع ثابت */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h3 className="font-semibold text-lg">فیلترها</h3>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="size-5" />
          </Button>
        </div>

        {/* محتوای فیلترها با آکاردئون - این بخش کل فضای خالی را پر می‌کند */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <Accordion type="single" collapsible className="w-full">
            {/* فیلتر رنگ */}
            <AccordionItem value="colors">
              <AccordionTrigger className="text-sm font-medium">
                رنگ‌ها ({tempColorIds.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-3 gap-1 mt-2">
                  {colorsData?.data.map(color => (
                    <label
                      key={color.id}
                      className={`flex items-center border gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded ${
                        tempColorIds.includes(color.id)
                          ? 'bg-primary/10 border-primary'
                          : ''
                      }`}
                    >
                      <Checkbox
                        checked={tempColorIds.includes(color.id)}
                        onCheckedChange={() => toggleColor(color.id)}
                        className="rounded"
                      />
                      <span
                        className="inline-block w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hexCode }}
                      />
                      <span className="truncate">{color.name}</span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* فیلتر سایز */}
            <AccordionItem value="sizes">
              <AccordionTrigger className="text-sm font-medium">
                سایزها ({tempSizeIds.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-3 gap-1 mt-2">
                  {sizeData?.data.map(size => (
                    <label
                      key={size.id}
                      className={`flex items-center border gap-3 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded ${
                        tempSizeIds.includes(size.id)
                          ? 'bg-primary/10 border-primary'
                          : ''
                      }`}
                    >
                      <Checkbox
                        checked={tempSizeIds.includes(size.id)}
                        onCheckedChange={() => toggleSize(size.id)}
                        className="rounded"
                      />
                      {size.name}
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* نمایش Badge فیلترهای انتخاب‌شده - ارتفاع خودکار */}
        {totalSelected > 0 && (
          <div className="px-4 py-2 border-t border-b bg-gray-50 flex-shrink-0">
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-gray-500 ml-1">انتخاب‌ها:</span>
              {tempColorIds.map(id => (
                <Badge
                  key={`color-${id}`}
                  variant="secondary"
                  className="gap-1 cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                  onClick={() => removeColor(id)}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: getColorHex(id) }}
                  />
                  {getColorName(id)}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              {tempSizeIds.map(id => (
                <Badge
                  key={`size-${id}`}
                  variant="secondary"
                  className="gap-1 cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                  onClick={() => removeSize(id)}
                >
                  {getSizeName(id)}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleClearAll}
              >
                پاک کردن همه
              </Button>
            </div>
          </div>
        )}

        {/* دکمه‌های اقدام - ارتفاع ثابت در پایین */}
        <div className="p-4 border-t bg-white flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClearAndClose}
          >
            پاک کردن فیلترها
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            اعمال فیلترها ({totalSelected})
          </Button>
        </div>
      </div>
    </>
  );
}
