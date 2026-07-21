'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ProductMultiSelect } from '@/components/admin/product-multi-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useAdminProducsList,
  useUpdateSameColorProducts,
} from '@/services/features/products/hooks';
import { ProductsResponse } from '@/services/features/products/type';

interface SameColorProductsModalProps {
  selectedData: ProductsResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SameColorProductsModal({
  selectedData,
  open,
  onOpenChange,
}: SameColorProductsModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const updateMutation = useUpdateSameColorProducts();

  // دریافت لیست کامل محصولات برای نگاشت id => title
  const { data: allProductsData } = useAdminProducsList({
    all: true,
    limit: 9999, // تعداد کافی برای دریافت تمام محصولات
  });

  // ایجاد نگاشت شناسه به عنوان
  const productNameMap = new Map<string, string>();
  allProductsData?.data?.forEach(product => {
    productNameMap.set(String(product.id), product.title);
  });

  // بارگذاری هم‌رنگ‌های فعلی هنگام باز شدن مودال
  useEffect(() => {
    if (selectedData && open) {
      const currentIds =
        selectedData.sameColorProducts?.map(p => String(p.id)) || [];
      setSelectedIds(currentIds);
    } else {
      setSelectedIds([]);
    }
  }, [selectedData, open]);

  const handleSave = async () => {
    if (!selectedData) return;
    try {
      await updateMutation.mutateAsync({
        productId: selectedData.id,
        productIds: selectedIds.map(Number),
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>مدیریت محصولات هم‌رنگ</DialogTitle>
          <p className="text-sm text-gray-500">
            محصولاتی را که با این محصول هم‌رنگ هستند انتخاب کنید.
          </p>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <ProductMultiSelect
            value={selectedIds}
            onValueChange={setSelectedIds}
            placeholder="جستجو و انتخاب محصول..."
          />
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedIds.map(id => {
                const title = productNameMap.get(id) || id; // اگر نام پیدا نشد، همان id نمایش داده شود
                return (
                  <span
                    key={id}
                    className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {title}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIds(prev => prev.filter(i => i !== id))
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={14} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button onClick={handleSave} loading={updateMutation.isPending}>
            ذخیره
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
