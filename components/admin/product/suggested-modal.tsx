// components/admin/product/suggested-products-modal.tsx
'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Check, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { useProducsList } from '@/services/features/products/hooks';
import { useUpdateSuggestedProducts } from '@/services/features/products/hooks';
import { ProductsResponse } from '@/services/features/products/type';

interface SuggestedProductsModalProps {
  selectedData: ProductsResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SuggestedProductsModal({
  selectedData,
  open,
  onOpenChange,
}: SuggestedProductsModalProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // دریافت لیست محصولات (همه محصولات به جز خود محصول فعلی)
  const { data: productsData, isLoading } = useProducsList({
    search: debouncedSearch,
    all: true,
  });

  const updateSuggestedMutation = useUpdateSuggestedProducts();

  // وقتی مودال باز می‌شود، انتخاب‌های قبلی را از selectedData بارگذاری کن
  useEffect(() => {
    console.log(selectedData);
    if (selectedData && open) {
      const currentSuggested =
        selectedData.suggestedProducts?.map(p => p?.id) || [];
      // فقط در صورتی که لیست جدید با لیست قبلی متفاوت باشد، به‌روزرسانی کن
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIds(prev => {
        const newIds = currentSuggested;
        // اگر برابر بودند، همان state قبلی را برگردان تا رندر اضافی رخ ندهد
        if (
          prev.length === newIds.length &&
          prev.every(id => newIds.includes(id))
        ) {
          return prev;
        }
        return newIds;
      });
    }
  }, [selectedData, open]);

  // وقتی جستجو تغییر می‌کند، صفحه را ریست نمی‌کنیم (همه محصولات یکجا)

  // تابع تغییر انتخاب یک محصول
  const toggleProduct = (productId: number) => {
    setSelectedIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId],
    );
  };

  // ارسال تغییرات
  const handleSubmit = async () => {
    if (!selectedData) return;

    try {
      await updateSuggestedMutation.mutateAsync({
        productId: selectedData.id,
        suggestedProductsIds: selectedIds,
      });
      toast.success('محصولات پیشنهادی با موفقیت به‌روز شدند');
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error(error);
      toast.error('خطا در به‌روزرسانی محصولات پیشنهادی');
    }
  };

  // فیلتر کردن محصول جاری از لیست (اختیاری)
  const products = (productsData?.data || []).filter(
    p => p.id !== selectedData?.id,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl! h-[80vh]! flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>مدیریت محصولات پیشنهادی</DialogTitle>
        </DialogHeader>

        {/* جستجو */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="جستجوی محصول..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* لیست محصولات */}
        <ScrollArea className="flex-1 border rounded-md p-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {debouncedSearch
                ? 'محصولی یافت نشد'
                : 'محصولی برای نمایش وجود ندارد'}
            </div>
          ) : (
            <div className="space-y-1">
              {products.map(product => {
                const isSelected = selectedIds.includes(product.id);
                return (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                    onClick={() => toggleProduct(product.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="h-4 w-4" />}
                      </div>
                      <span className="font-medium">{product.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {product.productCode}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {product.categories?.map(c => c.name).join(', ')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* انتخاب‌های فعلی */}
        <div className="flex flex-wrap gap-1 border-t pt-2">
          <span className="text-sm text-gray-500 ml-2">انتخاب‌شده:</span>
          {selectedIds.length === 0 ? (
            <span className="text-sm text-gray-400">هیچ</span>
          ) : (
            selectedIds.map(id => {
              const product = products.find(p => p.id === id);
              return product ? (
                <Badge key={id} variant="secondary" className="gap-1">
                  {product.title}
                </Badge>
              ) : null;
            })
          )}
        </div>

        {/* دکمه‌های اقدام */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            onClick={handleSubmit}
            loading={updateSuggestedMutation.isPending}
          >
            ذخیره تغییرات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
